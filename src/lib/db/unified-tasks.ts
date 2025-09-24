// 統一タスクデータベースサービス
// unified_tasksテーブルの操作を行う

import { createClient } from '@/lib/supabase/client'
import type { UnifiedTask, TaskFilters, SPECIAL_DATES } from '@/lib/types/unified-task'
import { getTodayJST } from '@/lib/utils/date-jst'

const NO_DUE_DATE = '2999-12-31'

export class UnifiedTasksService {
  // 全統一タスクを取得
  static async getAllUnifiedTasks(filters?: TaskFilters): Promise<UnifiedTask[]> {
    try {
      const supabase = createClient()
      let query = supabase
        .from('unified_tasks')
        .select('*')
        .order('display_number', { ascending: true })

      // フィルターを適用（統一ルール）
      if (filters?.completed !== undefined) {
        query = query.eq('completed', filters.completed)
      }

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.date_range) {
        if (filters.date_range.start) {
          query = query.gte('due_date', filters.date_range.start)
        }
        if (filters.date_range.end) {
          query = query.lte('due_date', filters.date_range.end)
        }
      }

      if (filters?.has_due_date !== undefined) {
        if (filters.has_due_date) {
          // 期限ありタスク
          query = query.neq('due_date', NO_DUE_DATE)
        } else {
          // 期限なしタスク（アイデア等）
          query = query.eq('due_date', NO_DUE_DATE)
        }
      }

      if (filters?.importance_min) {
        query = query.gte('importance', filters.importance_min)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch unified tasks: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('UnifiedTasksService.getAllUnifiedTasks error:', error)
      throw error
    }
  }

  // 今日のタスクを取得（due_date = 今日）
  static async getTodayTasks(): Promise<UnifiedTask[]> {
    const today = getTodayJST()

    return this.getAllUnifiedTasks({
      completed: false,
      date_range: {
        start: today,
        end: today
      }
    })
  }

  // やることリスト（期限なし）を取得
  static async getIdeaTasks(): Promise<UnifiedTask[]> {
    return this.getAllUnifiedTasks({
      completed: false,
      has_due_date: false // due_date = '2999-12-31'
    })
  }

  // 買い物リスト（期限なし + 買い物カテゴリ）を取得
  static async getShoppingTasks(): Promise<UnifiedTask[]> {
    return this.getAllUnifiedTasks({
      category: '買い物',
      completed: false,
      has_due_date: false // due_date = '2999-12-31'
    })
  }

  // 期限切れタスクを取得
  static async getOverdueTasks(): Promise<UnifiedTask[]> {
    const today = getTodayJST()

    return this.getAllUnifiedTasks({
      completed: false,
      date_range: {
        start: '2000-01-01',
        end: today
      }
    }).then(tasks =>
      // 期限なしタスクは除外
      tasks.filter(task => task.due_date !== NO_DUE_DATE)
    )
  }

  // 完了済みタスクを取得
  static async getCompletedTasks(): Promise<UnifiedTask[]> {
    return this.getAllUnifiedTasks({
      completed: true
    })
  }

  // 新しい統一タスクを作成
  static async createUnifiedTask(task: Omit<UnifiedTask, 'id' | 'created_at' | 'updated_at'>): Promise<UnifiedTask> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('unified_tasks')
        .insert({
          ...task,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create unified task: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('UnifiedTasksService.createUnifiedTask error:', error)
      throw error
    }
  }

  // 統一タスクを更新
  static async updateUnifiedTask(id: string, updates: Partial<UnifiedTask>): Promise<UnifiedTask> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('unified_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update unified task: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('UnifiedTasksService.updateUnifiedTask error:', error)
      throw error
    }
  }

  // 統一タスクを削除
  static async deleteUnifiedTask(id: string): Promise<void> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('unified_tasks')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete unified task: ${error.message}`)
      }
    } catch (error) {
      console.error('UnifiedTasksService.deleteUnifiedTask error:', error)
      throw error
    }
  }

  // タスクを完了にする（統一ルール）
  static async completeTask(id: string): Promise<UnifiedTask> {
    try {
      const supabase = createClient()

      // 現在のタスクを取得
      const { data: task, error: fetchError } = await supabase
        .from('unified_tasks')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch task: ${fetchError.message}`)
      }

      // 繰り返しタスクの場合は次回の due_date を計算
      if (task.recurring_pattern) {
        const nextDueDate = this.calculateNextRecurringDate(task)
        return this.updateUnifiedTask(id, {
          completed: false, // 繰り返しタスクは完了せず次回日付に更新
          due_date: nextDueDate,
          completed_at: getTodayJST() // 完了記録は保持
        })
      } else {
        // 通常タスクは完了
        return this.updateUnifiedTask(id, {
          completed: true,
          completed_at: getTodayJST()
        })
      }
    } catch (error) {
      console.error('UnifiedTasksService.completeTask error:', error)
      throw error
    }
  }

  // 次回繰り返し日付を計算
  private static calculateNextRecurringDate(task: any): string {
    const today = new Date()

    switch (task.recurring_pattern) {
      case 'DAILY':
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]

      case 'WEEKLY':
        if (task.recurring_weekdays && task.recurring_weekdays.length > 0) {
          const currentDay = today.getDay()
          const currentDayISO = currentDay === 0 ? 7 : currentDay

          // 次の対象曜日を探す
          for (let i = 1; i <= 7; i++) {
            const checkDay = (currentDay + i) % 7
            const checkDayISO = checkDay === 0 ? 7 : checkDay
            if (task.recurring_weekdays.includes(checkDayISO)) {
              const nextDate = new Date(today)
              nextDate.setDate(today.getDate() + i)
              return nextDate.toISOString().split('T')[0]
            }
          }
        }
        // デフォルト: 1週間後
        const nextWeek = new Date(today)
        nextWeek.setDate(today.getDate() + 7)
        return nextWeek.toISOString().split('T')[0]

      case 'MONTHLY':
        const nextMonth = new Date(today)
        nextMonth.setMonth(today.getMonth() + 1)
        if (task.recurring_day) {
          nextMonth.setDate(task.recurring_day)
        }
        return nextMonth.toISOString().split('T')[0]

      default:
        // デフォルト: 翌日
        const defaultNext = new Date(today)
        defaultNext.setDate(today.getDate() + 1)
        return defaultNext.toISOString().split('T')[0]
    }
  }

  // タスクを未完了にする
  static async uncompleteTask(id: string): Promise<UnifiedTask> {
    return this.updateUnifiedTask(id, {
      completed: false,
      completed_at: undefined
    })
  }
}

export default UnifiedTasksService