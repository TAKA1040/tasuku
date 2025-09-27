// Task Generation Service - Phase 3: Background Generation System
// Based on RECURRING_REDESIGN_LOG.md specification

import { createClient } from '@/lib/supabase/client'
import { RecurringTemplatesService } from '@/lib/db/recurring-templates'
import type { RecurringTemplate } from '@/lib/types/recurring-template'
import type { UnifiedTask } from '@/lib/types/unified-task'
import { getTodayJST, addDays, subtractDays, isMonday, getStartOfWeek, getStartOfMonth } from '@/lib/utils/date-jst'

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
  async generateMissingTasks(): Promise<void> {
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

    // デバッグ: 強制的に今日のタスクを生成
    const forceGenerate = true
    if (lastProcessed < today || forceGenerate) {
      console.log('🎯 タスク生成を実行します (forceGenerate:', forceGenerate, ')')
      // 日次: 最大3日分復旧
      const startDate = Math.max(
        this.parseDate(addDays(lastProcessed, 1)),
        this.parseDate(subtractDays(today, 3))
      )
      await this.generateDailyTasks(this.formatDate(startDate), today)

      // 週次: 週が変わった場合のみ
      if (this.isNewWeek(lastProcessed, today)) {
        const thisMonday = getStartOfWeek(today)
        await this.generateWeeklyTasks(thisMonday, today)
      }

      // 月次: 月が変わった場合のみ
      if (this.isNewMonth(lastProcessed, today)) {
        const thisFirstDay = getStartOfMonth(today)
        await this.generateMonthlyTasks(thisFirstDay, today)
      }

      // 最終更新日を更新
      await this.updateLastGenerationDate(today)
    }

    console.log('タスク生成完了')
  }

  // 最終処理日取得（既存のタスクから推定）
  private async getLastGenerationDate(): Promise<string> {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await this.supabase
        .from('unified_tasks')
        .select('due_date')
        .eq('user_id', userId)
        .eq('task_type', 'RECURRING') // recurring_patternの代わりにtask_typeを使用
        .not('due_date', 'is', null) // due_dateがnullでないものだけ
        .order('due_date', { ascending: false })
        .limit(1)

      if (error) {
        console.warn('最終処理日取得エラー:', error)
        return '1970-01-01'
      }

      if (!data || data.length === 0) {
        return '1970-01-01'
      }

      return data[0].due_date || '1970-01-01'
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
    console.log('🔄 日次テンプレート一覧:', templates.map(t => ({ id: t.id, title: t.title, is_active: t.is_active })))

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

    // 統一番号を生成
    const displayNumber = await this.generateDisplayNumber()

    // タスク作成
    const taskData = {
      title: template.title,
      memo: template.memo,
      due_date: dueDate,
      category: template.category,
      importance: template.importance,
      task_type: 'RECURRING',
      recurring_pattern: template.pattern,
      recurring_weekdays: template.weekdays,
      recurring_template_id: template.id, // template.idは既にstring型
      display_number: displayNumber,
      completed: false,
      user_id: userId
    }

    const { error } = await this.supabase
      .from('unified_tasks')
      .insert(taskData)

    if (error) {
      console.error(`タスク作成エラー: ${template.title} (${dueDate})`, error)
      throw error
    }

    console.log(`タスク作成: ${template.title} (${dueDate})`)
  }

  // 統一番号生成
  private async generateDisplayNumber(): Promise<string> {
    const userId = await this.getCurrentUserId()

    const { data, error } = await this.supabase
      .from('unified_tasks')
      .select('display_number')
      .eq('user_id', userId)
      .order('display_number', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      return 'T001'
    }

    const lastNumber = data[0].display_number
    const number = parseInt(lastNumber.substring(1)) + 1
    return `T${number.toString().padStart(3, '0')}`
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