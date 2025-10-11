// Task Generation Service - Phase 3: Background Generation System
// Based on RECURRING_REDESIGN_LOG.md specification
//
// 【重要】生成期間ルール:
// - DAILY: 過去3日〜今日（アクセス頻度: 毎日想定）
// - WEEKLY: 過去14日〜今日（アクセス頻度: 週1回想定、2週間分をカバー）
// - MONTHLY: 過去60日〜今日（アクセス頻度: 月1回想定、2ヶ月分をカバー）
// - YEARLY: 過去730日〜今日（アクセス頻度: 年1回想定、2年分をカバー）
// - 未来タスク: 明日以降のタスクは毎回削除（事前生成しない）
// - 重複防止: createTaskFromTemplate内で実装済み（template_id + due_dateで判定）

import { createClient } from '@/lib/supabase/client'
import { RecurringTemplatesService } from '@/lib/db/recurring-templates'
import { UnifiedTasksService } from '@/lib/db/unified-tasks'
import type { RecurringTemplate } from '@/lib/types/recurring-template'
import type { UnifiedTask } from '@/lib/types/unified-task'
import { getTodayJST, addDays, subtractDays, getStartOfWeek, getStartOfMonth } from '@/lib/utils/date-jst'
import { logger } from '@/lib/utils/logger'

export class TaskGeneratorService {
  private supabase = createClient()
  private templatesService = new RecurringTemplatesService()

  async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user?.id) {
      throw new Error('User not authenticated')
    }
    return user.id
  }

  // メイン処理: 不足分のタスクを生成
  async generateMissingTasks(forceToday: boolean = false): Promise<void> {
    const today = getTodayJST()

    // 既存データから最終処理日を取得
    const lastProcessed = await this.getLastGenerationDate()
    logger.production(`🚀 タスク生成開始: 今日=${today}, 前回=${lastProcessed}`)

    let userId: string
    try {
      userId = await this.getCurrentUserId()
      logger.production('👤 ユーザーID:', userId)
    } catch (error) {
      logger.error('❌ ユーザー認証エラー:', error)
      return
    }

    // 🔒 グローバルロック機構: 複数タブ/ページからの同時実行を防止
    const lockAcquired = await this.acquireGenerationLock(userId)
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
      await this.releaseGenerationLock(userId)
    }
  }

  // lastProcessed翌日から今日までに完了した買い物タスクの未完了子タスク処理
  private async processCompletedShoppingTasks(lastProcessed: string, today: string): Promise<void> {
    try {
      // 買い物処理専用のlast_processedを取得（繰り返しタスク生成とは独立管理）
      const lastShoppingProcessed = await this.getLastShoppingProcessedDate()
      const startDate = addDays(lastShoppingProcessed, 1)

      logger.production(`🛒 買い物タスク処理: ${startDate}〜${today}に完了したタスクをチェック (last_shopping: ${lastShoppingProcessed})`)

      // startDate翌日から今日までに完了した買い物タスクを取得
      // completed_atは日付のみ or 日時の可能性があるため、両方に対応
      const { data: completedShoppingTasks, error } = await this.supabase
        .from('unified_tasks')
        .select('*')
        .eq('category', '買い物')
        .eq('completed', true)
        .gte('completed_at', startDate)
        .lte('completed_at', today)

      if (error) {
        logger.error('❌ 完了買い物タスク取得エラー:', error)
        return
      }

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
          const { data: subtasks, error: subtasksError } = await this.supabase
            .from('subtasks')
            .select('*')
            .eq('parent_task_id', task.id)

          if (subtasksError) {
            logger.error(`❌ サブタスク取得エラー (${task.title}):`, subtasksError)
            errorCount++
            continue
          }

          const uncompletedSubtasks = subtasks?.filter(st => !st.completed) || []

          if (uncompletedSubtasks.length === 0) {
            logger.production(`⏭️  スキップ: 未完了サブタスクなし`)
            // 処理済みマーカーを追加（空処理でも記録）
            const { error: updateError } = await this.supabase
              .from('unified_tasks')
              .update({
                memo: (task.memo || '') + '\n[繰り越し処理済み]'
              })
              .eq('id', task.id)

            if (updateError) {
              logger.error(`❌ 処理済みマーカー追加エラー (${task.title}):`, updateError)
              errorCount++
            } else {
              skippedCount++
            }
            continue
          }

          logger.production(`🛒 ${uncompletedSubtasks.length}個の未完了アイテムを繰り越します`)

          // 繰り越し処理実行
          await UnifiedTasksService.handleShoppingTaskCompletion(task as UnifiedTask)

          // 処理済みマーカーを追加
          const { error: markError } = await this.supabase
            .from('unified_tasks')
            .update({
              memo: (task.memo || '') + '\n[繰り越し処理済み]'
            })
            .eq('id', task.id)

          if (markError) {
            logger.error(`❌ 処理済みマーカー追加エラー (${task.title}):`, markError)
            errorCount++
          } else {
            logger.production(`✅ 繰り越し完了`)
            processedCount++
          }
        } catch (taskError) {
          logger.error(`❌ タスク処理エラー (${task.title}):`, taskError)
          errorCount++
          // エラーが起きても次のタスクに進む
        }
      }

      logger.production(`\n📊 買い物タスク処理結果: 処理=${processedCount}件, スキップ=${skippedCount}件, エラー=${errorCount}件`)

      // 買い物処理の最終処理日を更新
      await this.updateLastShoppingProcessedDate(today)
      logger.production(`✅ 買い物タスク処理完了 (last_shopping_processed: ${today})`)
    } catch (error) {
      logger.error('❌ 買い物タスク処理エラー:', error)
      // エラーでも throw しない（他の処理を継続）
    }
  }

  // 買い物処理の最終処理日取得
  private async getLastShoppingProcessedDate(): Promise<string> {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await this.supabase
        .from('user_metadata')
        .select('value')
        .eq('user_id', userId)
        .eq('key', 'last_shopping_processed')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          logger.production('初回買い物処理（user_metadataにレコードなし）')
          return '1970-01-01'
        }
        logger.warn('買い物処理日取得エラー:', error)
        return '1970-01-01'
      }

      if (!data || !data.value) {
        return '1970-01-01'
      }

      logger.production(`📅 last_shopping_processed: ${data.value}`)
      return data.value
    } catch (error) {
      logger.error('買い物処理日取得エラー:', error)
      return '1970-01-01'
    }
  }

  // 買い物処理の最終処理日を更新
  private async updateLastShoppingProcessedDate(date: string): Promise<void> {
    const userId = await this.getCurrentUserId()

    const { error } = await this.supabase
      .from('user_metadata')
      .upsert({
        user_id: userId,
        key: 'last_shopping_processed',
        value: date
      }, {
        onConflict: 'user_id,key'
      })

    if (error) {
      logger.error('❌ last_shopping_processed更新エラー:', error)
      throw error
    }
  }

  // 最終処理日取得（user_metadataから取得）
  private async getLastGenerationDate(): Promise<string> {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await this.supabase
        .from('user_metadata')
        .select('value')
        .eq('user_id', userId)
        .eq('key', 'last_task_generation')
        .single()

      if (error) {
        // レコードが存在しない場合は初回実行
        if (error.code === 'PGRST116') {
          logger.production('初回タスク生成（user_metadataにレコードなし）')
          return '1970-01-01'
        }
        logger.warn('最終処理日取得エラー:', error)
        return '1970-01-01'
      }

      if (!data || !data.value) {
        logger.production('user_metadataに値なし、初期値を返す')
        return '1970-01-01'
      }

      logger.production(`user_metadataから取得: last_task_generation = ${data.value}`)
      return data.value
    } catch (error) {
      logger.error('最終処理日取得エラー:', error)
      return '1970-01-01'
    }
  }

  // 最終更新日を更新（メタデータテーブルに記録）
  private async updateLastGenerationDate(date: string): Promise<void> {
    const userId = await this.getCurrentUserId()

    // user_metadataテーブルに記録（upsert）
    const { error } = await this.supabase
      .from('user_metadata')
      .upsert({
        user_id: userId,
        key: 'last_task_generation',
        value: date
      }, {
        onConflict: 'user_id,key'
      })

    if (error) {
      logger.error('❌ last_task_generation更新エラー:', error)
      throw error
    }
    logger.production(`✅ last_task_generation更新: ${date}`)
  }

  // 🔒 ロック取得: 複数プロセスからの同時実行を防止
  private async acquireGenerationLock(userId: string): Promise<boolean> {
    try {
      const lockKey = 'generation_lock'
      const lockTimeout = 5 * 60 * 1000 // 5分（ミリ秒）
      const now = new Date().toISOString()

      // 既存のロックを確認
      const { data: existingLock } = await this.supabase
        .from('user_metadata')
        .select('value, updated_at')
        .eq('user_id', userId)
        .eq('key', lockKey)
        .maybeSingle()

      if (existingLock) {
        // ロックのタイムスタンプをチェック
        const lockTime = new Date(existingLock.updated_at).getTime()
        const currentTime = new Date().getTime()

        // ロックが5分以上古い場合は無効とみなす（デッドロック防止）
        if (currentTime - lockTime < lockTimeout) {
          logger.production('⏳ ロック取得失敗: 他のプロセスが実行中')
          return false
        }
        logger.production('⚠️  古いロックを検出、上書きします')
      }

      // ロックを取得（upsert）
      const { error } = await this.supabase
        .from('user_metadata')
        .upsert({
          user_id: userId,
          key: lockKey,
          value: now
        }, {
          onConflict: 'user_id,key'
        })

      if (error) {
        logger.error('❌ ロック取得エラー:', error)
        return false
      }

      logger.production('🔒 ロック取得成功')
      return true
    } catch (error) {
      logger.error('❌ ロック取得処理エラー:', error)
      return false
    }
  }

  // 🔓 ロック解放
  private async releaseGenerationLock(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_metadata')
        .delete()
        .eq('user_id', userId)
        .eq('key', 'generation_lock')

      if (error) {
        logger.error('❌ ロック解放エラー:', error)
      } else {
        logger.production('🔓 ロック解放完了')
      }
    } catch (error) {
      logger.error('❌ ロック解放処理エラー:', error)
    }
  }

  // 日次タスク生成
  async generateDailyTasks(startDate: string, endDate: string): Promise<void> {
    const templates = await this.templatesService.getTemplatesByPattern('DAILY')
    logger.production(`🔄 日次タスク生成: ${startDate} - ${endDate}, テンプレート数: ${templates.length}`)
    logger.production('🔄 日次テンプレート一覧:', templates.map(t => ({ id: t.id, title: t.title, active: t.active })))

    for (const template of templates) {
      let currentDate = startDate
      while (currentDate <= endDate) {
        await this.createTaskFromTemplate(template, currentDate)
        currentDate = addDays(currentDate, 1)
      }
    }
  }

  // 週次タスク生成（今日のみ・安全版）
  async generateWeeklyTasksForToday(today: string): Promise<void> {
    const templates = await this.templatesService.getTemplatesByPattern('WEEKLY')
    logger.production(`週次タスク生成（今日のみ）: ${today}, テンプレート数: ${templates.length}`)

    const todayWeekday = new Date(today).getDay()
    const todayIsoWeekday = todayWeekday === 0 ? 7 : todayWeekday // 日曜=7に変換

    for (const template of templates) {
      // 今日が指定された曜日かチェック
      if (template.weekdays?.includes(todayIsoWeekday)) {
        logger.production(`今日用タスク作成: ${template.title} (${today})`)
        await this.createTaskFromTemplate(template, today)
      }
    }
  }

  // 週次タスク生成（範囲指定版）
  async generateWeeklyTasks(startDate: string, endDate: string): Promise<void> {
    const templates = await this.templatesService.getTemplatesByPattern('WEEKLY')
    logger.production(`週次タスク生成: ${startDate} - ${endDate}, テンプレート数: ${templates.length}`)

    for (const template of templates) {
      let currentDate = startDate
      while (currentDate <= endDate) {
        // 指定された曜日かチェック
        const weekday = new Date(currentDate).getDay()
        const isoWeekday = weekday === 0 ? 7 : weekday // 日曜=7に変換

        if (template.weekdays?.includes(isoWeekday)) {
          await this.createTaskFromTemplate(template, currentDate)
        }

        currentDate = addDays(currentDate, 1)
      }
    }
  }

  // 月次タスク生成
  async generateMonthlyTasks(startDate: string, endDate: string): Promise<void> {
    const templates = await this.templatesService.getTemplatesByPattern('MONTHLY')
    logger.production(`月次タスク生成: ${startDate} - ${endDate}, テンプレート数: ${templates.length}`)

    for (const template of templates) {
      let currentDate = startDate
      while (currentDate <= endDate) {
        // 指定された日かチェック
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
    const templates = await this.templatesService.getTemplatesByPattern('YEARLY')
    logger.production(`年次タスク生成: ${startDate} - ${endDate}, テンプレート数: ${templates.length}`)

    for (const template of templates) {
      let currentDate = startDate
      while (currentDate <= endDate) {
        const date = new Date(currentDate)
        const month = date.getMonth() + 1 // 0-11 → 1-12
        const day = date.getDate()

        // 指定された月日かチェック
        if (template.month_of_year === month && template.day_of_year === day) {
          await this.createTaskFromTemplate(template, currentDate)
        }

        currentDate = addDays(currentDate, 1)
      }
    }
  }

  // テンプレートからタスクを作成
  private async createTaskFromTemplate(template: RecurringTemplate, dueDate: string): Promise<void> {
    const userId = await this.getCurrentUserId()

    // テンプレート作成日より前の期限のタスクは生成しない
    const templateCreatedDate = template.created_at.split('T')[0]
    if (dueDate < templateCreatedDate) {
      logger.production(`⏭️ スキップ: テンプレート作成日(${templateCreatedDate})より前の期限(${dueDate}) - ${template.title}`)
      return
    }

    // 既に同じテンプレート&日付のタスクが存在するかチェック
    // 注意: completed の条件は付けない（完了済みタスクも重複防止の対象）
    const { data: existing } = await this.supabase
      .from('unified_tasks')
      .select('id, urls, start_time, end_time, completed')
      .eq('user_id', userId)
      .eq('recurring_template_id', template.id)
      .eq('due_date', dueDate)
      .limit(1)

    if (existing && existing.length > 0) {
      // 既存タスクが存在する場合
      const existingTask = existing[0]

      logger.production(`🔍 既存タスクチェック: ${template.title} (${dueDate})`)
      logger.production(`   既存タスクID: ${existingTask.id}, 完了: ${existingTask.completed}`)

      // 完了済みタスクの場合は、更新せずに重複生成を防止
      if (existingTask.completed) {
        logger.production(`⏭️  スキップ: 既に完了済み - 重複生成を防止`)
        return
      }

      // 未完了タスクの場合、テンプレートから最新のURLsと時刻を同期
      logger.production(`   既存タスク urls:`, existingTask.urls, `(${typeof existingTask.urls})`)
      logger.production(`   テンプレート urls:`, template.urls, `(${typeof template.urls})`)
      logger.production(`   既存 JSON:`, JSON.stringify(existingTask.urls))
      logger.production(`   テンプレ JSON:`, JSON.stringify(template.urls))
      logger.production(`   JSON一致:`, JSON.stringify(existingTask.urls) === JSON.stringify(template.urls))

      const needsUpdate =
        JSON.stringify(existingTask.urls) !== JSON.stringify(template.urls) ||
        existingTask.start_time !== template.start_time ||
        existingTask.end_time !== template.end_time

      if (needsUpdate) {
        logger.production(`🔄 既存タスクを同期更新: ${template.title} (${dueDate})`)
        const { error: updateError } = await this.supabase
          .from('unified_tasks')
          .update({
            urls: template.urls,
            start_time: template.start_time,
            end_time: template.end_time,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingTask.id)

        if (updateError) {
          logger.error(`❌ タスク同期エラー: ${template.title}`, updateError)
        } else {
          logger.production(`✅ タスク同期完了: ${template.title} (${dueDate})`)
        }
      } else {
        logger.production(`⏭️  同期不要: ${template.title} (${dueDate}) - データが一致しています`)
      }
      // 重複生成防止
      return
    }

    // 統一番号を生成（UnifiedTasksServiceの公式メソッドを使用）
    const displayNumber = await UnifiedTasksService.generateDisplayNumber()

    // デバッグ: テンプレートの情報をログ出力
    logger.production('📝 テンプレートからタスク生成:', {
      templateId: template.id,
      title: template.title,
      dueDate: dueDate,
      hasUrls: !!template.urls,
      urlsCount: template.urls?.length || 0,
      urls: template.urls,
      urlsType: typeof template.urls,
      urlsIsArray: Array.isArray(template.urls),
      urlsJson: JSON.stringify(template.urls),
      hasStartTime: !!template.start_time,
      hasEndTime: !!template.end_time,
      hasAttachment: !!template.attachment_file_name
    })

    // タスク作成（テンプレートのすべてのフィールドを引き継ぐ）
    const taskData: Record<string, unknown> = {
      title: template.title,
      memo: template.memo,
      due_date: dueDate,
      category: template.category,
      importance: template.importance,
      urls: template.urls || [], // テンプレートのURLsを引き継ぎ（null/undefinedの場合は空配列）
      start_time: template.start_time, // 開始時刻を引き継ぎ
      end_time: template.end_time, // 終了時刻を引き継ぎ
      task_type: 'RECURRING',
      recurring_pattern: template.pattern,
      recurring_weekdays: template.weekdays,
      recurring_template_id: template.id,
      display_number: displayNumber,
      completed: false,
      user_id: userId
    }

    // 添付ファイルがあれば引き継ぎ
    if (template.attachment_file_name) {
      taskData.attachment_file_name = template.attachment_file_name
      taskData.attachment_file_type = template.attachment_file_type
      taskData.attachment_file_size = template.attachment_file_size
      taskData.attachment_file_data = template.attachment_file_data
    }

    const { data: newTask, error } = await this.supabase
      .from('unified_tasks')
      .insert(taskData)
      .select()
      .single()

    if (error) {
      logger.error(`❌ タスク作成エラー: ${template.title} (${dueDate})`, error)
      throw error
    }

    logger.production(`✅ タスク作成成功: ${template.title} (${dueDate})`, {
      newTaskId: newTask.id,
      hasUrls: !!newTask.urls,
      urlsCount: Array.isArray(newTask.urls) ? newTask.urls.length : 0,
      urls: newTask.urls
    })

    // 買い物リストがある場合、subtasksもコピー
    if (template.category === '買い物') {
      const { data: templateSubtasks } = await this.supabase
        .from('subtasks')
        .select('*')
        .eq('parent_task_id', template.id)
        .order('sort_order', { ascending: true })

      if (templateSubtasks && templateSubtasks.length > 0) {
        const newSubtasks = templateSubtasks.map(sub => ({
          parent_task_id: newTask.id, // 新しいタスクのIDに変更
          title: sub.title,
          completed: false, // 初期状態は未完了
          sort_order: sub.sort_order,
          user_id: userId
        }))

        const { error: subtasksError } = await this.supabase
          .from('subtasks')
          .insert(newSubtasks)

        if (subtasksError) {
          logger.error(`買い物リストコピーエラー: ${template.title}`, subtasksError)
        } else {
          logger.production(`✅ 買い物リストコピー完了: ${newSubtasks.length}件`)
        }
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

  // 未来の繰り返しタスクの削除（パターン別の適切な期間を超えたタスクのみ削除）
  private async deleteFutureRecurringTasks(today: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId()
      let totalDeleted = 0

      // DAILY: 明日以降を削除（生成範囲: 過去3日〜今日）
      const dailyThreshold = today
      const { data: dailyDeleted } = await this.supabase
        .from('unified_tasks')
        .delete()
        .eq('user_id', userId)
        .eq('completed', false)
        .eq('recurring_pattern', 'DAILY')
        .not('recurring_template_id', 'is', null)
        .gt('due_date', dailyThreshold)
        .select('id, title')

      if (dailyDeleted && dailyDeleted.length > 0) {
        logger.production(`🗑️  DAILY 未来タスク削除: ${dailyDeleted.length}件 (${dailyThreshold}より後)`)
        totalDeleted += dailyDeleted.length
      }

      // WEEKLY: 15日以降を削除（生成範囲: 過去14日〜今日）
      const weeklyThreshold = addDays(today, 14)
      const { data: weeklyDeleted } = await this.supabase
        .from('unified_tasks')
        .delete()
        .eq('user_id', userId)
        .eq('completed', false)
        .eq('recurring_pattern', 'WEEKLY')
        .not('recurring_template_id', 'is', null)
        .gt('due_date', weeklyThreshold)
        .select('id, title')

      if (weeklyDeleted && weeklyDeleted.length > 0) {
        logger.production(`🗑️  WEEKLY 未来タスク削除: ${weeklyDeleted.length}件 (${weeklyThreshold}より後)`)
        totalDeleted += weeklyDeleted.length
      }

      // MONTHLY: 61日以降を削除（生成範囲: 過去60日〜今日）
      const monthlyThreshold = addDays(today, 60)
      const { data: monthlyDeleted } = await this.supabase
        .from('unified_tasks')
        .delete()
        .eq('user_id', userId)
        .eq('completed', false)
        .eq('recurring_pattern', 'MONTHLY')
        .not('recurring_template_id', 'is', null)
        .gt('due_date', monthlyThreshold)
        .select('id, title')

      if (monthlyDeleted && monthlyDeleted.length > 0) {
        logger.production(`🗑️  MONTHLY 未来タスク削除: ${monthlyDeleted.length}件 (${monthlyThreshold}より後)`)
        totalDeleted += monthlyDeleted.length
      }

      // YEARLY: 731日以降を削除（生成範囲: 過去730日〜今日）
      const yearlyThreshold = addDays(today, 730)
      const { data: yearlyDeleted } = await this.supabase
        .from('unified_tasks')
        .delete()
        .eq('user_id', userId)
        .eq('completed', false)
        .eq('recurring_pattern', 'YEARLY')
        .not('recurring_template_id', 'is', null)
        .gt('due_date', yearlyThreshold)
        .select('id, title')

      if (yearlyDeleted && yearlyDeleted.length > 0) {
        logger.production(`🗑️  YEARLY 未来タスク削除: ${yearlyDeleted.length}件 (${yearlyThreshold}より後)`)
        totalDeleted += yearlyDeleted.length
      }

      if (totalDeleted > 0) {
        logger.production(`✅ 未来タスク削除完了: 合計${totalDeleted}件`)
      } else {
        logger.production('✅ 削除対象の未来タスクなし')
      }
    } catch (error) {
      logger.error('❌ 未来タスク削除処理エラー:', error)
    }
  }

  // 期限切れ繰り返しタスクの自動削除
  // 動作: 今日を基準に過去N日間を保持、それより古い未完了タスクを削除
  // 日次: 期限から3日経過で削除（過去3日間保持）, 週次: 7日経過で削除（過去7日間保持）, 月次: 365日経過で削除（過去365日間保持）
  // 例: 今日が10/12の場合、10/06のタスクは10/13に削除（7日経過）
  private async deleteExpiredRecurringTasks(today: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId()

      // 日次タスク: 期限から3日経過で削除（過去3日間を保持）
      const dailyThreshold = subtractDays(today, 3)
      const { data: dailyDeleted, error: dailyError } = await this.supabase
        .from('unified_tasks')
        .delete()
        .eq('user_id', userId)
        .eq('completed', false)
        .eq('recurring_pattern', 'DAILY')
        .not('recurring_template_id', 'is', null)
        .lte('due_date', dailyThreshold)
        .select('id')

      if (dailyError) {
        logger.error('❌ 日次タスク削除エラー:', dailyError)
      } else if (dailyDeleted && dailyDeleted.length > 0) {
        logger.production(`🗑️  期限切れ日次タスク削除: ${dailyDeleted.length}件 (${dailyThreshold}以前)`)
      }

      // 週次タスク: 期限から7日経過で削除（過去7日間を保持）
      const weeklyThreshold = subtractDays(today, 7)
      const { data: weeklyDeleted, error: weeklyError } = await this.supabase
        .from('unified_tasks')
        .delete()
        .eq('user_id', userId)
        .eq('completed', false)
        .eq('recurring_pattern', 'WEEKLY')
        .not('recurring_template_id', 'is', null)
        .lte('due_date', weeklyThreshold)
        .select('id')

      if (weeklyError) {
        logger.error('❌ 週次タスク削除エラー:', weeklyError)
      } else if (weeklyDeleted && weeklyDeleted.length > 0) {
        logger.production(`🗑️  期限切れ週次タスク削除: ${weeklyDeleted.length}件 (${weeklyThreshold}以前)`)
      }

      // 月次タスク: 期限から365日経過で削除（過去365日間を保持）
      const monthlyThreshold = subtractDays(today, 365)
      const { data: monthlyDeleted, error: monthlyError } = await this.supabase
        .from('unified_tasks')
        .delete()
        .eq('user_id', userId)
        .eq('completed', false)
        .eq('recurring_pattern', 'MONTHLY')
        .not('recurring_template_id', 'is', null)
        .lte('due_date', monthlyThreshold)
        .select('id')

      if (monthlyError) {
        logger.error('❌ 月次タスク削除エラー:', monthlyError)
      } else if (monthlyDeleted && monthlyDeleted.length > 0) {
        logger.production(`🗑️  期限切れ月次タスク削除: ${monthlyDeleted.length}件 (${monthlyThreshold}以前)`)
      }

      const totalDeleted = (dailyDeleted?.length || 0) + (weeklyDeleted?.length || 0) + (monthlyDeleted?.length || 0)
      if (totalDeleted > 0) {
        logger.production(`✅ 期限切れ繰り返しタスク削除完了: 合計${totalDeleted}件`)
      } else {
        logger.production('✅ 削除対象の期限切れ繰り返しタスクなし')
      }
    } catch (error) {
      logger.error('❌ 期限切れタスク削除処理エラー:', error)
    }
  }

  // 日付ユーティリティ
  private parseDate(dateString: string): number {
    return new Date(dateString).getTime()
  }

  private formatDate(timestamp: number): string {
    return new Date(timestamp).toISOString().split('T')[0]
  }
}