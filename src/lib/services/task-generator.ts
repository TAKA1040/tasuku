// Task Generation Service - Phase 3: Background Generation System
// Based on RECURRING_REDESIGN_LOG.md specification

import { createClient } from '@/lib/supabase/client'
import { RecurringTemplatesService } from '@/lib/db/recurring-templates'
import { UnifiedTasksService } from '@/lib/db/unified-tasks'
import type { RecurringTemplate } from '@/lib/types/recurring-template'
import type { UnifiedTask } from '@/lib/types/unified-task'
import { getTodayJST, addDays, subtractDays, getStartOfWeek, getStartOfMonth } from '@/lib/utils/date-jst'

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
    console.log(`🚀 タスク生成開始: 今日=${today}, 前回=${lastProcessed}`)

    try {
      const userId = await this.getCurrentUserId()
      console.log('👤 ユーザーID:', userId)
    } catch (error) {
      console.error('❌ ユーザー認証エラー:', error)
      return
    }

    console.log('🔍 生成判定:', `lastProcessed (${lastProcessed}) < today (${today})`, '=', lastProcessed < today)

    // 生成判定: 手動の場合は強制実行、自動の場合は日付チェック
    if (lastProcessed < today || forceToday) {
      console.log('🎯 タスク生成を実行します (forceToday:', forceToday, ')')

      if (forceToday) {
        // 手動生成: 自動生成と同じセキュリティルール適用
        console.log('🎯 手動生成: セキュリティルール適用')

        // 日次: 3日制限適用
        const startDate = Math.max(
          this.parseDate(addDays(lastProcessed, 1)),
          this.parseDate(subtractDays(today, 3))
        )
        await this.generateDailyTasks(this.formatDate(startDate), today)

        // 週次: 週が変わった場合のみ今週分
        if (this.isNewWeek(lastProcessed, today)) {
          const thisMonday = getStartOfWeek(today)
          await this.generateWeeklyTasks(thisMonday, today)
          console.log('🎯 手動週次生成: 今週分生成')
        }

        // 月次: 月が変わった場合のみ今月分
        if (this.isNewMonth(lastProcessed, today)) {
          const thisFirstDay = getStartOfMonth(today)
          await this.generateMonthlyTasks(thisFirstDay, today)
          console.log('🎯 手動月次生成: 今月分生成')
        }
      } else {
        // 自動生成: パターン別の生成期間

        // 日次: 今日を含めた3日間（今日、昨日、一昨日）
        const dailyStart = subtractDays(today, 2)
        await this.generateDailyTasks(dailyStart, today)

        // 週次: 先週の月曜日〜翌週の日曜日まで（14日分）
        const thisMonday = getStartOfWeek(today)
        const lastMonday = subtractDays(thisMonday, 7)
        const nextSunday = addDays(thisMonday, 13) // 月曜+13日=翌週日曜
        await this.generateWeeklyTasks(lastMonday, nextSunday)

        // 月次: 1年前から1年後の前日まで（約730日分）
        const yearAgo = subtractDays(today, 365)
        const yearLater = addDays(today, 364) // 今日+364日=1年後の前日
        await this.generateMonthlyTasks(yearAgo, yearLater)
      }

      // lastProcessed翌日から今日までに完了した買い物タスクの未完了子タスクを処理
      await this.processCompletedShoppingTasks(lastProcessed, today)

      // 最終更新日を更新
      await this.updateLastGenerationDate(today)
    }

    console.log('タスク生成完了')
  }

  // lastProcessed翌日から今日までに完了した買い物タスクの未完了子タスク処理
  private async processCompletedShoppingTasks(lastProcessed: string, today: string): Promise<void> {
    try {
      const startDate = addDays(lastProcessed, 1)

      console.log(`🛒 買い物タスク処理: ${startDate}〜${today}に完了したタスクをチェック`)

      // lastProcessed翌日から今日までに完了した買い物タスクを取得
      const { data: completedShoppingTasks, error } = await this.supabase
        .from('unified_tasks')
        .select('*')
        .eq('category', '買い物')
        .eq('completed', true)
        .gte('completed_at', `${startDate}T00:00:00`)
        .lt('completed_at', `${addDays(today, 1)}T00:00:00`)

      if (error) {
        console.error('❌ 完了買い物タスク取得エラー:', error)
        return
      }

      if (!completedShoppingTasks || completedShoppingTasks.length === 0) {
        console.log('✅ 期間内に完了した買い物タスクなし')
        return
      }

      console.log(`📋 ${completedShoppingTasks.length}件の買い物タスクを処理`)

      // 各タスクの未完了子タスクを処理
      for (const task of completedShoppingTasks) {
        // 重複チェック: このタスクから既に繰り越しタスクを作成済みかチェック
        const { data: existingRollover, error: checkError } = await this.supabase
          .from('unified_tasks')
          .select('id')
          .eq('title', task.title)
          .eq('category', '買い物')
          .eq('due_date', '2999-12-31')
          .eq('completed', false)
          .limit(1)

        if (checkError) {
          console.error('❌ 繰り越しタスク存在チェックエラー:', checkError)
          continue
        }

        if (existingRollover && existingRollover.length > 0) {
          console.log(`⏭️  スキップ: 「${task.title}」は既に繰り越し済み (ID: ${existingRollover[0].id})`)
          continue
        }

        await UnifiedTasksService.handleShoppingTaskCompletion(task as UnifiedTask)
      }

      console.log('✅ 買い物タスク処理完了')
    } catch (error) {
      console.error('❌ 買い物タスク処理エラー:', error)
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
          console.log('初回タスク生成（user_metadataにレコードなし）')
          return '1970-01-01'
        }
        console.warn('最終処理日取得エラー:', error)
        return '1970-01-01'
      }

      if (!data || !data.value) {
        console.log('user_metadataに値なし、初期値を返す')
        return '1970-01-01'
      }

      console.log(`user_metadataから取得: last_task_generation = ${data.value}`)
      return data.value
    } catch (error) {
      console.error('最終処理日取得エラー:', error)
      return '1970-01-01'
    }
  }

  // 最終更新日を更新（メタデータテーブルに記録）
  private async updateLastGenerationDate(date: string): Promise<void> {
    const userId = await this.getCurrentUserId()

    // user_metadataテーブルに記録（upsert）
    await this.supabase
      .from('user_metadata')
      .upsert({
        user_id: userId,
        key: 'last_task_generation',
        value: date
      }, {
        onConflict: 'user_id,key'
      })
  }

  // 日次タスク生成
  async generateDailyTasks(startDate: string, endDate: string): Promise<void> {
    const templates = await this.templatesService.getTemplatesByPattern('DAILY')
    console.log(`🔄 日次タスク生成: ${startDate} - ${endDate}, テンプレート数: ${templates.length}`)
    console.log('🔄 日次テンプレート一覧:', templates.map(t => ({ id: t.id, title: t.title, active: t.active })))

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
    console.log(`週次タスク生成（今日のみ）: ${today}, テンプレート数: ${templates.length}`)

    const todayWeekday = new Date(today).getDay()
    const todayIsoWeekday = todayWeekday === 0 ? 7 : todayWeekday // 日曜=7に変換

    for (const template of templates) {
      // 今日が指定された曜日かチェック
      if (template.weekdays?.includes(todayIsoWeekday)) {
        console.log(`今日用タスク作成: ${template.title} (${today})`)
        await this.createTaskFromTemplate(template, today)
      }
    }
  }

  // 週次タスク生成（範囲指定版）
  async generateWeeklyTasks(startDate: string, endDate: string): Promise<void> {
    const templates = await this.templatesService.getTemplatesByPattern('WEEKLY')
    console.log(`週次タスク生成: ${startDate} - ${endDate}, テンプレート数: ${templates.length}`)

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
    console.log(`月次タスク生成: ${startDate} - ${endDate}, テンプレート数: ${templates.length}`)

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

  // テンプレートからタスクを作成
  private async createTaskFromTemplate(template: RecurringTemplate, dueDate: string): Promise<void> {
    const userId = await this.getCurrentUserId()

    // 既に同じテンプレート&日付のタスクが存在するかチェック
    const { data: existing } = await this.supabase
      .from('unified_tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('recurring_template_id', template.id)
      .eq('due_date', dueDate)
      .limit(1)

    if (existing && existing.length > 0) {
      // 重複生成防止
      return
    }

    // 統一番号を生成（UnifiedTasksServiceの公式メソッドを使用）
    const displayNumber = await UnifiedTasksService.generateDisplayNumber()

    // デバッグ: テンプレートの情報をログ出力
    console.log('📝 テンプレートからタスク生成:', {
      templateId: template.id,
      title: template.title,
      dueDate: dueDate,
      hasUrls: !!template.urls,
      urlsCount: template.urls?.length || 0,
      urls: template.urls,
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
      urls: template.urls, // テンプレートのURLsを引き継ぎ
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
      console.error(`❌ タスク作成エラー: ${template.title} (${dueDate})`, error)
      throw error
    }

    console.log(`✅ タスク作成成功: ${template.title} (${dueDate})`, {
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
          console.error(`買い物リストコピーエラー: ${template.title}`, subtasksError)
        } else {
          console.log(`✅ 買い物リストコピー完了: ${newSubtasks.length}件`)
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

  // 日付ユーティリティ
  private parseDate(dateString: string): number {
    return new Date(dateString).getTime()
  }

  private formatDate(timestamp: number): string {
    return new Date(timestamp).toISOString().split('T')[0]
  }
}