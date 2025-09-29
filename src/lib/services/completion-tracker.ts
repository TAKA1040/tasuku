// 新システム: doneテーブルベースの完了記録管理
// 完了記録管理（done テーブルベース）

import { createClient } from '@/lib/supabase/client'
import { getTodayJST, formatDateJST } from '@/lib/utils/date-jst'
import type { UnifiedTask } from '@/lib/types/unified-task'

export interface CompletionRecord {
  id: string
  original_task_id: string
  task_title: string
  completion_date: string
  completion_time: string
  created_at: string
  updated_at: string
}

export interface RecurringCompletionStats {
  taskId: string
  taskTitle: string
  currentStreak: number
  totalCompletions: number
  lastCompletedDate?: string
  isCompletedToday: boolean
  completionDates: string[]
}

export class CompletionTracker {
  private static supabase = createClient()

  // ===================================
  // 完了記録の作成・削除
  // ===================================

  /**
   * タスク完了を記録
   */
  static async recordCompletion(
    task: UnifiedTask,
    completionDate?: string
  ): Promise<CompletionRecord> {
    const date = completionDate || getTodayJST()

    // 既に記録されているかチェック
    const existing = await this.getCompletionForDate(task.id, date)
    if (existing) {
      console.log(`Task ${task.id} already completed on ${date}`)
      return existing
    }

    const { data, error } = await this.supabase
      .from('done')
      .insert({
        original_task_id: task.id,
        task_title: task.title,
        completion_date: date,
        completion_time: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to record completion: ${error.message}`)
    }

    return data
  }

  /**
   * 完了記録を削除（未完了にする）
   */
  static async removeCompletion(
    taskId: string,
    completionDate?: string
  ): Promise<void> {
    const date = completionDate || getTodayJST()

    const { error } = await this.supabase
      .from('done')
      .delete()
      .eq('original_task_id', taskId)
      .eq('completion_date', date)

    if (error) {
      throw new Error(`Failed to remove completion: ${error.message}`)
    }
  }

  // ===================================
  // 完了記録の取得
  // ===================================

  /**
   * 特定タスクの特定日の完了記録を取得
   */
  static async getCompletionForDate(
    taskId: string,
    date: string
  ): Promise<CompletionRecord | null> {
    const { data, error } = await this.supabase
      .from('done')
      .select('*')
      .eq('original_task_id', taskId)
      .eq('completion_date', date)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw new Error(`Failed to get completion: ${error.message}`)
    }

    return data
  }

  /**
   * 特定タスクの全完了記録を取得
   */
  static async getTaskCompletions(taskId: string): Promise<CompletionRecord[]> {
    const { data, error } = await this.supabase
      .from('done')
      .select('*')
      .eq('original_task_id', taskId)
      .order('completion_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to get task completions: ${error.message}`)
    }

    return data || []
  }

  /**
   * 特定日の全完了記録を取得
   */
  static async getCompletionsForDate(date: string): Promise<CompletionRecord[]> {
    const { data, error } = await this.supabase
      .from('done')
      .select('*')
      .eq('completion_date', date)
      .order('completion_time', { ascending: false })

    if (error) {
      throw new Error(`Failed to get completions for date: ${error.message}`)
    }

    return data || []
  }

  // ===================================
  // 繰り返しタスク用ストリーク計算
  // ===================================

  /**
   * 特定の繰り返しタスクのストリーク計算
   */
  static async calculateStreak(taskId: string): Promise<number> {
    const completions = await this.getTaskCompletions(taskId)

    if (completions.length === 0) return 0

    const completionDates = completions
      .map(c => c.completion_date)
      .sort()
      .reverse() // 最新日から古い日の順

    let streak = 0
    const today = getTodayJST()

    // 今日から遡って連続日数をカウント
    for (let i = 0; i < 365; i++) { // 最大365日
      const checkDate = new Date()
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = formatDateJST(checkDate)

      const hasCompletion = completionDates.includes(dateStr)

      if (hasCompletion) {
        if (dateStr <= today) { // 今日以前の日付のみカウント
          streak++
        }
      } else {
        // 連続記録が途切れた（今日が初回でない場合は終了）
        if (i > 0 || dateStr !== today) break
      }
    }

    return streak
  }

  /**
   * 今日完了しているかチェック
   */
  static async isCompletedToday(taskId: string): Promise<boolean> {
    const today = getTodayJST()
    const completion = await this.getCompletionForDate(taskId, today)
    return completion !== null
  }

  /**
   * 繰り返しタスクの完了統計を取得
   */
  static async getRecurringStats(taskId: string): Promise<RecurringCompletionStats> {
    const completions = await this.getTaskCompletions(taskId)
    const currentStreak = await this.calculateStreak(taskId)
    const isCompletedToday = await this.isCompletedToday(taskId)

    const completionDates = completions.map(c => c.completion_date).sort()
    const lastCompletedDate = completionDates.length > 0 ? completionDates[completionDates.length - 1] : undefined

    // タスク情報を取得（タイトル用）
    const { data: task } = await this.supabase
      .from('unified_tasks')
      .select('title')
      .eq('id', taskId)
      .single()

    return {
      taskId,
      taskTitle: task?.title || 'Unknown Task',
      currentStreak,
      totalCompletions: completions.length,
      lastCompletedDate,
      isCompletedToday,
      completionDates
    }
  }

  // ===================================
  // バッチ処理・統計
  // ===================================

  /**
   * 複数の繰り返しタスクの統計を一括取得
   */
  static async getBulkRecurringStats(taskIds: string[]): Promise<RecurringCompletionStats[]> {
    const results = await Promise.all(
      taskIds.map(id => this.getRecurringStats(id))
    )
    return results
  }

  /**
   * 特定期間の完了統計を取得
   */
  static async getPeriodStats(startDate: string, endDate: string) {
    const { data, error } = await this.supabase
      .from('done')
      .select('completion_date, original_task_id, task_title')
      .gte('completion_date', startDate)
      .lte('completion_date', endDate)

    if (error) {
      throw new Error(`Failed to get period stats: ${error.message}`)
    }

    const dailyStats = new Map<string, number>()
    const taskStats = new Map<string, { title: string; count: number }>()

    data?.forEach(record => {
      // 日別統計
      const current = dailyStats.get(record.completion_date) || 0
      dailyStats.set(record.completion_date, current + 1)

      // タスク別統計
      const taskStat = taskStats.get(record.original_task_id) || { title: record.task_title, count: 0 }
      taskStat.count++
      taskStats.set(record.original_task_id, taskStat)
    })

    return {
      dailyCompletions: Object.fromEntries(dailyStats),
      taskCompletions: Object.fromEntries(taskStats),
      totalCompletions: data?.length || 0
    }
  }

  // ===================================
  // データ移行用ヘルパー
  // ===================================

  /**
   * レガシーマイグレーション関数（無効化済み）
   * recurring_logsは既に存在しないため、この関数は使用されない
   */
  static async migrateFromRecurringLogs(): Promise<void> {
    console.log('⚠️ Migration function disabled - recurring_logs table no longer exists')
    console.log('✅ Data migration already completed in previous setup')
    return
  }
}