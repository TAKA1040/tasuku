// 統一タスクデータベースサービス
// unified_tasksテーブルの操作を行う

import { createClient } from '@/lib/supabase/client'
import type { UnifiedTask, TaskFilters, SPECIAL_DATES, SubTask } from '@/lib/types/unified-task'
import { getTodayJST, getNowJST, addDays, parseDateJST, formatDateJST } from '@/lib/utils/date-jst'

const NO_DUE_DATE = '2999-12-31'

export class UnifiedTasksService {
  // 統一番号を生成
  static async generateDisplayNumber(): Promise<string> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('unified_tasks')
        .select('display_number')
        .eq('user_id', user.id)
        .order('display_number', { ascending: false })
        .limit(1)

      if (error) {
        console.warn('Display number generation error:', error)
        return 'T001'
      }

      if (!data || data.length === 0) {
        return 'T001'
      }

      const lastNumber = data[0].display_number
      if (!lastNumber || !lastNumber.startsWith('T')) {
        return 'T001'
      }
      const number = parseInt(lastNumber.substring(1)) + 1
      if (isNaN(number)) {
        return 'T001'
      }
      return `T${number.toString().padStart(3, '0')}`
    } catch (error) {
      console.error('generateDisplayNumber error:', error)
      return 'T001'
    }
  }
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

      // シンプルに処理（一時的にデバッグ用）
      const processedTask = { ...task }

      console.log('タスク作成データ:', processedTask)

      const { data, error } = await supabase
        .from('unified_tasks')
        .insert({
          ...processedTask,
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
          completed_at: getNowJST() // 完了日時を記録
        })
      } else {
        // 通常タスクは完了
        return this.updateUnifiedTask(id, {
          completed: true,
          completed_at: getNowJST()
        })
      }
    } catch (error) {
      console.error('UnifiedTasksService.completeTask error:', error)
      throw error
    }
  }

  // 次回繰り返し日付を計算
  private static calculateNextRecurringDate(task: UnifiedTask): string {
    try {
      const todayJST = getTodayJST()

      switch (task.recurring_pattern) {
        case 'DAILY':
          return addDays(todayJST, 1)

        case 'WEEKLY':
          if (task.recurring_weekdays && task.recurring_weekdays.length > 0) {
            const todayDate = parseDateJST(todayJST)
            const currentDay = todayDate.getDay()
            const currentDayISO = currentDay === 0 ? 7 : currentDay

            // 次の対象曜日を探す
            for (let i = 1; i <= 7; i++) {
              const checkDay = (currentDay + i) % 7
              const checkDayISO = checkDay === 0 ? 7 : checkDay
              if (task.recurring_weekdays.includes(checkDayISO)) {
                return addDays(todayJST, i)
              }
            }
          }
          // デフォルト: 1週間後
          return addDays(todayJST, 7)

        case 'MONTHLY':
          const todayDate = parseDateJST(todayJST)
          const nextMonth = new Date(todayDate)
          nextMonth.setMonth(todayDate.getMonth() + 1)
          if (task.recurring_day) {
            nextMonth.setDate(task.recurring_day)
          }
          return formatDateJST(nextMonth)

        default:
          // デフォルト: 翌日
          return addDays(todayJST, 1)
      }
    } catch (error) {
      console.error('Error in calculateNextRecurringDate:', error, 'task:', task)
      // フォールバック: 翌日を返す
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    }
  }

  // タスクを未完了にする
  static async uncompleteTask(id: string): Promise<UnifiedTask> {
    return this.updateUnifiedTask(id, {
      completed: false,
      completed_at: undefined
    })
  }

  // ===================================
  // SUBTASKS Operations
  // ===================================

  // 指定タスクのサブタスクを取得
  static async getSubtasks(parentTaskId: string): Promise<SubTask[]> {
    try {
      const supabase = createClient()

      // ユーザー認証情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('parent_task_id', parentTaskId)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch subtasks: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('UnifiedTasksService.getSubtasks error:', error)
      throw error
    }
  }

  // サブタスクを作成
  static async createSubtask(parentTaskId: string, title: string): Promise<SubTask> {
    try {
      const supabase = createClient()

      // ユーザー認証情報を取得
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error('Authentication error:', authError)
        throw new Error(`Authentication failed: ${authError.message}`)
      }

      if (!user?.id) {
        throw new Error('User not authenticated - no user ID found')
      }

      console.log('🔐 createSubtask - User ID:', user.id)
      console.log('📝 createSubtask - Parent Task ID:', parentTaskId)
      console.log('📄 createSubtask - Title:', title)

      // 現在のサブタスク数を取得してsort_orderを決定
      const { data: existingSubtasks } = await supabase
        .from('subtasks')
        .select('sort_order')
        .eq('parent_task_id', parentTaskId)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: false })
        .limit(1)

      const nextSortOrder = existingSubtasks && existingSubtasks.length > 0
        ? (existingSubtasks[0].sort_order || 0) + 1
        : 1

      const insertData = {
        parent_task_id: parentTaskId,
        title,
        sort_order: nextSortOrder,
        completed: false,
        user_id: user.id
      }

      console.log('🔢 createSubtask - Insert data:', insertData)

      const { data, error } = await supabase
        .from('subtasks')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('🚨 Subtask insert error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw new Error(`Failed to create subtask: ${error.message}`)
      }

      console.log('✅ Subtask created successfully:', data)
      return data
    } catch (error) {
      console.error('UnifiedTasksService.createSubtask error:', error)
      throw error
    }
  }

  // サブタスクの完了状態を切り替え
  static async toggleSubtask(subtaskId: string): Promise<SubTask> {
    try {
      const supabase = createClient()

      // ユーザー認証情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      // 現在の状態を取得
      const { data: current } = await supabase
        .from('subtasks')
        .select('completed')
        .eq('id', subtaskId)
        .eq('user_id', user.id)
        .single()

      if (!current) {
        throw new Error('Subtask not found')
      }

      // 完了状態を反転
      const { data, error } = await supabase
        .from('subtasks')
        .update({
          completed: !current.completed
        })
        .eq('id', subtaskId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to toggle subtask: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('UnifiedTasksService.toggleSubtask error:', error)
      throw error
    }
  }

  // サブタスクを削除
  static async deleteSubtask(subtaskId: string): Promise<void> {
    try {
      const supabase = createClient()

      // ユーザー認証情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId)
        .eq('user_id', user.id)

      if (error) {
        throw new Error(`Failed to delete subtask: ${error.message}`)
      }
    } catch (error) {
      console.error('UnifiedTasksService.deleteSubtask error:', error)
      throw error
    }
  }
}

export default UnifiedTasksService