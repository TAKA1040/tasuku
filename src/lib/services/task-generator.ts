// Task Generation Service - manarieDB (PostgreSQL) 対応版
// PostgresTasksServiceを使用してデータベース操作を行う
//
// 【重要】生成期間ルール:
// - DAILY: 過去3日〜今日（アクセス頻度: 毎日想定）
// - WEEKLY: 過去14日〜今日（アクセス頻度: 週1回想定、2週間分をカバー）
// - MONTHLY: 過去60日〜今日（アクセス頻度: 月1回想定、2ヶ月分をカバー）
// - YEARLY: 過去730日〜今日（アクセス頻度: 年1回想定、2年分をカバー）
// - 未来タスク: 明日以降のタスクは毎回削除（事前生成しない）
// - 重複防止: createTaskFromTemplate内で実装済み（template_id + due_dateで判定）

import { PostgresTasksService } from '@/lib/db/postgres-tasks'
import type { RecurringTemplate } from '@/lib/types/recurring-template'
import type { UnifiedTask } from '@/lib/types/unified-task'
import { getTodayJST, addDays, subtractDays, getStartOfWeek, getStartOfMonth } from '@/lib/utils/date-jst'
import { logger } from '@/lib/utils/logger'

export class TaskGeneratorService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // メイン処理: 不足分のタスクを生成
  async generateMissingTasks(forceToday: boolean = false): Promise<void> {
    const today = getTodayJST()

    // 既存データから最終処理日を取得
    const lastProcessed = await this.getLastGenerationDate()
    logger.production(`🚀 タスク生成開始: 今日=${today}, 前回=${lastProcessed}`)
    logger.production('👤 ユーザーID:', this.userId)

    // 🔒 グローバルロック機構: 複数タブ/ページからの同時実行を防止
    const lockAcquired = await this.acquireGenerationLock()
    if (!lockAcquired) {
      logger.production('⏭️  他のプロセスが日次処理実行中のためスキップ')
      return
    }

    try {
      logger.production('🔍 生成判定:', `lastProcessed (${lastProcessed}) < today (${today})`, '=', lastProcessed < today)

      // 繰り返しタスク生成: 手動の場合は強制実行、自動の場合は日付チェック
      if (lastProcessed < today || forceToday) {
        logger.production('🎯 繰り返しタスク生成を実行します (forceToday:', forceToday, ')')

        if (forceToday) {
          // 手動生成: 自動生成と同じセキュリティルール適用
          logger.production('🎯 手動生成: セキュリティルール適用')

          // 日次: 今日を含めた3日分を生成（過去2日 + 今日）
          const startDate = subtractDays(today, 2)
          await this.generateDailyTasks(startDate, today)

          // 週次: 週が変わった場合のみ今週分
          if (this.isNewWeek(lastProcessed, today)) {
            const thisMonday = getStartOfWeek(today)
            await this.generateWeeklyTasks(thisMonday, today)
            logger.production('🎯 手動週次生成: 今週分生成')
          }

          // 月次: 月が変わった場合のみ今月分
          if (this.isNewMonth(lastProcessed, today)) {
            const thisFirstDay = getStartOfMonth(today)
            await this.generateMonthlyTasks(thisFirstDay, today)
            logger.production('🎯 手動月次生成: 今月分生成')
          }
        } else {
          // 自動生成: パターン別の適切な生成期間

          // 日次: 過去3日〜今日（毎日アクセス想定）
          const dailyStart = subtractDays(today, 2)
          await this.generateDailyTasks(dailyStart, today)

          // 週次: 過去14日〜今日（週1回アクセス想定、2週間分カバー）
          const weeklyStart = subtractDays(today, 14)
          await this.generateWeeklyTasks(weeklyStart, today)

          // 月次: 過去60日〜今日（月1回アクセス想定、2ヶ月分カバー）
          const monthlyStart = subtractDays(today, 60)
          await this.generateMonthlyTasks(monthlyStart, today)

          // 年次: 過去730日〜今日（年1回アクセス想定、2年分カバー）
          const yearlyStart = subtractDays(today, 730)
          await this.generateYearlyTasks(yearlyStart, today)

          // 最終更新日を更新
          await this.updateLastGenerationDate(today)
        }
      }

      // 期限切れ繰り返しタスクの自動削除: 日付に関わらず毎回実行（同日の2回目アクセスでも処理）
      await this.deleteExpiredRecurringTasks(today)

      // 未来の繰り返しタスクの削除: 日付に関わらず毎回実行（同日の2回目アクセスでも処理）
      await this.deleteFutureRecurringTasks(today)

      // 買い物タスク処理: 日付に関わらず毎回実行（同日の2回目アクセスでも処理）
      await this.processCompletedShoppingTasks(lastProcessed, today)

      logger.production('✅ タスク生成完了')
    } catch (error) {
      logger.error('❌ タスク生成エラー:', error)
      throw error
    } finally {
      // 🔓 ロック解放（必ず実行）
      await this.releaseGenerationLock()
    }
  }

  // lastProcessed翌日から今日までに完了した買い物タスクの未完了子タスク処理
  private async processCompletedShoppingTasks(lastProcessed: string, today: string): Promise<void> {
    try {
      // 買い物処理専用のlast_processedを取得（繰り返しタスク生成とは独立管理）
      const lastShoppingProcessed = await this.getLastShoppingProcessedDate()
      const startDate = addDays(lastShoppingProcessed, 1)

      logger.production(`🛒 買い物タスク処理: ${startDate}〜${today}に完了したタスクをチェック (last_shopping: ${lastShoppingProcessed})`)

      // 完了した買い物タスクを取得
      const completedShoppingTasks = await PostgresTasksService.getCompletedShoppingTasks(
        this.userId, startDate, today
      )

      if (!completedShoppingTasks || completedShoppingTasks.length === 0) {
        logger.production('✅ 期間内に完了した買い物タスクなし')
        return
      }

      logger.production(`📋 ${completedShoppingTasks.length}件の買い物タスクを処理`)

      let processedCount = 0
      let skippedCount = 0
      let errorCount = 0

      // 各タスクの未完了子タスクを処理
      for (const task of completedShoppingTasks) {
        try {
          logger.production(`\n📝 処理中: "${task.title}" (ID: ${task.id})`)

          // 処理済みチェック: memoに処理済みマーカーがあるかチェック
          if (task.memo && task.memo.includes('[繰り越し処理済み]')) {
            logger.production(`⏭️  スキップ: 既に処理済み`)
            skippedCount++
            continue
          }

          // 未完了サブタスクの存在チェック
          const subtasks = await PostgresTasksService.getSubtasks(this.userId, task.id)
          const uncompletedSubtasks = subtasks?.filter(st => !st.completed) || []

          if (uncompletedSubtasks.length === 0) {
            logger.production(`⏭️  スキップ: 未完了サブタスクなし`)
            // 処理済みマーカーを追加（空処理でも記録）
            await PostgresTasksService.updateUnifiedTask(this.userId, task.id, {
              memo: (task.memo || '') + '\n[繰り越し処理済み]'
            })
            skippedCount++
            continue
          }

          logger.production(`🛒 ${uncompletedSubtasks.length}個の未完了アイテムを繰り越します`)

          // 新しい買い物タスクを作成（期日なし）
          const displayNumber = await PostgresTasksService.generateDisplayNumber(this.userId)
          const newTask = await PostgresTasksService.createUnifiedTask(this.userId, {
            title: task.title,
            memo: task.memo || '',
            due_date: '2999-12-31',
            category: '買い物',
            importance: task.importance || 1,
            task_type: 'NORMAL',
            display_number: displayNumber,
            completed: false
          })

          // 未完了サブタスクを新タスクにコピー
          for (const subtask of uncompletedSubtasks) {
            await PostgresTasksService.createSubtask(this.userId, newTask.id, subtask.title)
          }

          // 処理済みマーカーを追加
          await PostgresTasksService.updateUnifiedTask(this.userId, task.id, {
            memo: (task.memo || '') + '\n[繰り越し処理済み]'
          })

          logger.production(`✅ 繰り越し完了`)
          processedCount++
        } catch (taskError) {
          logger.error(`❌ タスク処理エラー (${task.title}):`, taskError)
          errorCount++
        }
      }

      logger.production(`\n📊 買い物タスク処理結果: 処理=${processedCount}件, スキップ=${skippedCount}件, エラー=${errorCount}件`)

      // 買い物処理の最終処理日を更新
      await this.updateLastShoppingProcessedDate(today)
      logger.production(`✅ 買い物タスク処理完了 (last_shopping_processed: ${today})`)
    } catch (error) {
      logger.error('❌ 買い物タスク処理エラー:', error)
    }
  }

  // 買い物処理の最終処理日取得
  private async getLastShoppingProcessedDate(): Promise<string> {
    const value = await PostgresTasksService.getMetadata(this.userId, 'last_shopping_processed')
    if (!value) {
      logger.production('初回買い物処理（メタデータなし）')
      return '1970-01-01'
    }
    logger.production(`📅 last_shopping_processed: ${value}`)
    return value
  }

  // 買い物処理の最終処理日を更新
  private async updateLastShoppingProcessedDate(date: string): Promise<void> {
    await PostgresTasksService.setMetadata(this.userId, 'last_shopping_processed', date)
  }

  // 最終処理日取得
  private async getLastGenerationDate(): Promise<string> {
    const value = await PostgresTasksService.getMetadata(this.userId, 'last_task_generation')
    if (!value) {
      logger.production('初回タスク生成（メタデータなし）')
      return '1970-01-01'
    }
    logger.production(`user_metadataから取得: last_task_generation = ${value}`)
    return value
  }

  // 最終更新日を更新
  private async updateLastGenerationDate(date: string): Promise<void> {
    await PostgresTasksService.setMetadata(this.userId, 'last_task_generation', date)
    logger.production(`✅ last_task_generation更新: ${date}`)
  }

  // 🔒 ロック取得
  private async acquireGenerationLock(): Promise<boolean> {
    try {
      const lockKey = 'generation_lock'
      const lockTimeout = 5 * 60 * 1000 // 5分
      const now = new Date().toISOString()

      // 既存のロックを確認
      const existingLock = await PostgresTasksService.getMetadataWithTimestamp(this.userId, lockKey)

      if (existingLock) {
        const lockTime = new Date(existingLock.updated_at).getTime()
        const currentTime = new Date().getTime()

        if (currentTime - lockTime < lockTimeout) {
          logger.production('⏳ ロック取得失敗: 他のプロセスが実行中')
          return false
        }
        logger.production('⚠️  古いロックを検出、上書きします')
      }

      await PostgresTasksService.setMetadata(this.userId, lockKey, now)
      logger.production('🔒 ロック取得成功')
      return true
    } catch (error) {
      logger.error('❌ ロック取得エラー:', error)
      return false
    }
  }

  // 🔓 ロック解放
  private async releaseGenerationLock(): Promise<void> {
    try {
      await PostgresTasksService.deleteMetadata(this.userId, 'generation_lock')
      logger.production('🔓 ロック解放完了')
    } catch (error) {
      logger.error('❌ ロック解放エラー:', error)
    }
  }

  // 日次タスク生成
  async generateDailyTasks(startDate: string, endDate: string): Promise<void> {
    const templates = await PostgresTasksService.getTemplatesByPattern(this.userId, 'DAILY')
    logger.production(`🔄 日次タスク生成: ${startDate} - ${endDate}, テンプレート数: ${templates.length}`)

    for (const template of templates) {
      let currentDate = startDate
      while (currentDate <= endDate) {
        await this.createTaskFromTemplate(template, currentDate)
        currentDate = addDays(currentDate, 1)
      }
    }
  }

  // 週次タスク生成
  async generateWeeklyTasks(startDate: string, endDate: string): Promise<void> {
    const templates = await PostgresTasksService.getTemplatesByPattern(this.userId, 'WEEKLY')
    logger.production(`週次タスク生成: ${startDate} - ${endDate}, テンプレート数: ${templates.length}`)

    for (const template of templates) {
      let currentDate = startDate
      while (currentDate <= endDate) {
        const weekday = new Date(currentDate).getDay()
        const isoWeekday = weekday === 0 ? 7 : weekday

        if (template.weekdays?.includes(isoWeekday)) {
          await this.createTaskFromTemplate(template, currentDate)
        }

        currentDate = addDays(currentDate, 1)
      }
    }
  }

  // 月次タスク生成
  async generateMonthlyTasks(startDate: string, endDate: string): Promise<void> {
    const templates = await PostgresTasksService.getTemplatesByPattern(this.userId, 'MONTHLY')
    logger.production(`月次タスク生成: ${startDate} - ${endDate}, テンプレート数: ${templates.length}`)

    for (const template of templates) {
      let currentDate = startDate
      while (currentDate <= endDate) {
        const day = new Date(currentDate).getDate()

        if (template.day_of_month === day) {
          await this.createTaskFromTemplate(template, currentDate)
        }

        currentDate = addDays(currentDate, 1)
      }
    }
  }

  // 年次タスク生成
  async generateYearlyTasks(startDate: string, endDate: string): Promise<void> {
    const templates = await PostgresTasksService.getTemplatesByPattern(this.userId, 'YEARLY')
    logger.production(`年次タスク生成: ${startDate} - ${endDate}, テンプレート数: ${templates.length}`)

    for (const template of templates) {
      let currentDate = startDate
      while (currentDate <= endDate) {
        const date = new Date(currentDate)
        const month = date.getMonth() + 1
        const day = date.getDate()

        if (template.month_of_year === month && template.day_of_year === day) {
          await this.createTaskFromTemplate(template, currentDate)
        }

        currentDate = addDays(currentDate, 1)
      }
    }
  }

  // テンプレートからタスクを作成
  private async createTaskFromTemplate(template: RecurringTemplate, dueDate: string): Promise<void> {
    // テンプレート作成日より前の期限のタスクは生成しない
    const templateCreatedDate = template.created_at.split('T')[0]
    if (dueDate < templateCreatedDate) {
      logger.production(`⏭️ スキップ: テンプレート作成日(${templateCreatedDate})より前の期限(${dueDate}) - ${template.title}`)
      return
    }

    // テンプレート最終アクティブ化日チェック
    const lastActivatedDate = template.last_activated_at?.split('T')[0]
    if (lastActivatedDate && dueDate < lastActivatedDate) {
      logger.production(`⏭️ スキップ: アクティブ化日(${lastActivatedDate})より前の期限(${dueDate}) - ${template.title}`)
      return
    }

    // 既存タスクチェック
    const existing = await PostgresTasksService.getTaskByTemplateAndDate(this.userId, template.id, dueDate)

    if (existing) {
      if (existing.completed) {
        logger.production(`⏭️  スキップ: 既に完了済み - ${template.title}`)
        return
      }

      // 未完了タスクの同期更新
      const needsUpdate =
        JSON.stringify(existing.urls) !== JSON.stringify(template.urls) ||
        existing.start_time !== template.start_time ||
        existing.end_time !== template.end_time

      if (needsUpdate) {
        logger.production(`🔄 既存タスクを同期更新: ${template.title} (${dueDate})`)
        await PostgresTasksService.updateUnifiedTask(this.userId, existing.id, {
          urls: template.urls,
          start_time: template.start_time,
          end_time: template.end_time
        })
      }
      return
    }

    // 新規タスク作成
    const displayNumber = await PostgresTasksService.generateDisplayNumber(this.userId)

    logger.production('📝 テンプレートからタスク生成:', {
      templateId: template.id,
      title: template.title,
      dueDate: dueDate
    })

    const newTask = await PostgresTasksService.createUnifiedTask(this.userId, {
      title: template.title,
      memo: template.memo,
      due_date: dueDate,
      category: template.category,
      importance: template.importance,
      urls: template.urls || [],
      start_time: template.start_time,
      end_time: template.end_time,
      task_type: 'RECURRING',
      recurring_pattern: template.pattern,
      recurring_weekdays: template.weekdays,
      recurring_template_id: template.id,
      display_number: displayNumber,
      completed: false
    })

    logger.production(`✅ タスク作成成功: ${template.title} (${dueDate})`)

    // 買い物タスクのサブタスクコピー
    if (template.category === '買い物') {
      const templateSubtasks = await PostgresTasksService.getSubtasks(this.userId, template.id)
      if (templateSubtasks && templateSubtasks.length > 0) {
        for (const sub of templateSubtasks) {
          await PostgresTasksService.createSubtask(this.userId, newTask.id, sub.title)
        }
        logger.production(`✅ 買い物リストコピー完了: ${templateSubtasks.length}件`)
      }
    }
  }

  // 週が変わったかチェック
  private isNewWeek(lastDate: string, currentDate: string): boolean {
    const lastMonday = getStartOfWeek(lastDate)
    const currentMonday = getStartOfWeek(currentDate)
    return lastMonday !== currentMonday
  }

  // 月が変わったかチェック
  private isNewMonth(lastDate: string, currentDate: string): boolean {
    const lastMonth = getStartOfMonth(lastDate)
    const currentMonth = getStartOfMonth(currentDate)
    return lastMonth !== currentMonth
  }

  // 未来の繰り返しタスクの削除
  private async deleteFutureRecurringTasks(today: string): Promise<void> {
    try {
      let totalDeleted = 0

      // DAILY: 明日以降を削除
      const dailyDeleted = await PostgresTasksService.deleteRecurringTasksByCondition(
        this.userId, 'DAILY', 'gt', today
      )
      if (dailyDeleted > 0) {
        logger.production(`🗑️  DAILY 未来タスク削除: ${dailyDeleted}件`)
        totalDeleted += dailyDeleted
      }

      // WEEKLY: 15日以降を削除
      const weeklyThreshold = addDays(today, 14)
      const weeklyDeleted = await PostgresTasksService.deleteRecurringTasksByCondition(
        this.userId, 'WEEKLY', 'gt', weeklyThreshold
      )
      if (weeklyDeleted > 0) {
        logger.production(`🗑️  WEEKLY 未来タスク削除: ${weeklyDeleted}件`)
        totalDeleted += weeklyDeleted
      }

      // MONTHLY: 61日以降を削除
      const monthlyThreshold = addDays(today, 60)
      const monthlyDeleted = await PostgresTasksService.deleteRecurringTasksByCondition(
        this.userId, 'MONTHLY', 'gt', monthlyThreshold
      )
      if (monthlyDeleted > 0) {
        logger.production(`🗑️  MONTHLY 未来タスク削除: ${monthlyDeleted}件`)
        totalDeleted += monthlyDeleted
      }

      // YEARLY: 731日以降を削除
      const yearlyThreshold = addDays(today, 730)
      const yearlyDeleted = await PostgresTasksService.deleteRecurringTasksByCondition(
        this.userId, 'YEARLY', 'gt', yearlyThreshold
      )
      if (yearlyDeleted > 0) {
        logger.production(`🗑️  YEARLY 未来タスク削除: ${yearlyDeleted}件`)
        totalDeleted += yearlyDeleted
      }

      if (totalDeleted > 0) {
        logger.production(`✅ 未来タスク削除完了: 合計${totalDeleted}件`)
      }
    } catch (error) {
      logger.error('❌ 未来タスク削除処理エラー:', error)
    }
  }

  // 期限切れ繰り返しタスクの自動削除
  private async deleteExpiredRecurringTasks(today: string): Promise<void> {
    try {
      // 日次: 3日経過で削除
      const dailyThreshold = subtractDays(today, 3)
      const dailyDeleted = await PostgresTasksService.deleteRecurringTasksByCondition(
        this.userId, 'DAILY', 'lte', dailyThreshold
      )
      if (dailyDeleted > 0) {
        logger.production(`🗑️  期限切れ日次タスク削除: ${dailyDeleted}件`)
      }

      // 週次: 7日経過で削除
      const weeklyThreshold = subtractDays(today, 7)
      const weeklyDeleted = await PostgresTasksService.deleteRecurringTasksByCondition(
        this.userId, 'WEEKLY', 'lte', weeklyThreshold
      )
      if (weeklyDeleted > 0) {
        logger.production(`🗑️  期限切れ週次タスク削除: ${weeklyDeleted}件`)
      }

      // 月次: 365日経過で削除
      const monthlyThreshold = subtractDays(today, 365)
      const monthlyDeleted = await PostgresTasksService.deleteRecurringTasksByCondition(
        this.userId, 'MONTHLY', 'lte', monthlyThreshold
      )
      if (monthlyDeleted > 0) {
        logger.production(`🗑️  期限切れ月次タスク削除: ${monthlyDeleted}件`)
      }

      const totalDeleted = dailyDeleted + weeklyDeleted + monthlyDeleted
      if (totalDeleted > 0) {
        logger.production(`✅ 期限切れタスク削除完了: 合計${totalDeleted}件`)
      }
    } catch (error) {
      logger.error('❌ 期限切れタスク削除処理エラー:', error)
    }
  }
}
