// 統一タスクデータベースサービス
// unified_tasksテーブルの操作を行う

import { createClient } from '@/lib/supabase/client'
import type { UnifiedTask, TaskFilters, SubTask } from '@/lib/types/unified-task'
import { getTodayJST, getNowJST, addDays, parseDateJST, formatDateJST } from '@/lib/utils/date-jst'
import { SPECIAL_DATES } from '@/lib/constants'

const NO_DUE_DATE = SPECIAL_DATES.NO_DUE_DATE

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
      console.log('generateDisplayNumber: lastNumber found:', lastNumber)

      if (!lastNumber || !lastNumber.startsWith('T')) {
        console.log('generateDisplayNumber: no valid T number, returning T001')
        return 'T001'
      }

      // T001形式のみを対象にする
      if (lastNumber.length === 4) {
        const number = parseInt(lastNumber.substring(1)) + 1
        if (isNaN(number)) {
          console.log('generateDisplayNumber: parseInt failed for T001 format, returning T001')
          return 'T001'
        }
        const result = `T${number.toString().padStart(3, '0')}`
        console.log('generateDisplayNumber: T001 format, returning:', result)
        return result
      } else {
        // 古い形式がある場合は、T001形式のみを検索し直す
        console.log('generateDisplayNumber: found old format, searching for T001 format only')
        const { data: t001Data, error: t001Error } = await supabase
          .from('unified_tasks')
          .select('display_number')
          .eq('user_id', user.id)
          .like('display_number', 'T___')  // T + 3桁の数字のパターン
          .order('display_number', { ascending: false })
          .limit(1)

        if (t001Error || !t001Data || t001Data.length === 0) {
          console.log('generateDisplayNumber: no T001 format found, returning T001')
          return 'T001'
        }

        const lastT001 = t001Data[0].display_number
        const number = parseInt(lastT001.substring(1)) + 1
        if (isNaN(number)) {
          console.log('generateDisplayNumber: parseInt failed for found T001, returning T001')
          return 'T001'
        }
        const result = `T${number.toString().padStart(3, '0')}`
        console.log('generateDisplayNumber: T001 format search, returning:', result)
        return result
      }
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

      // 繰り返しタスクの場合、自動的にテンプレートを作成
      if (data.task_type === 'RECURRING' && data.recurring_pattern) {
        await this.createTemplateFromTask(data)
      }

      return data
    } catch (error) {
      console.error('UnifiedTasksService.createUnifiedTask error:', error)
      throw error
    }
  }

  // 繰り返しタスクからテンプレートを同期更新
  private static async syncTemplateFromTask(task: UnifiedTask): Promise<void> {
    try {
      console.log('🔄 syncTemplateFromTask called with:', {
        id: task.id,
        title: task.title,
        category: task.category,
        template_id: task.recurring_template_id,
        weekdays: task.recurring_weekdays
      })

      const supabase = createClient()

      // テンプレートが存在する場合は更新
      if (task.recurring_template_id) {
        // まず、テンプレートが存在するかチェック
        console.log('🔍 Checking if template exists:', task.recurring_template_id)
        const { data: existingTemplate, error: checkError } = await supabase
          .from('recurring_templates')
          .select('id, title')
          .eq('id', task.recurring_template_id)
          .single()

        if (checkError) {
          console.error('❌ Error checking template existence:', JSON.stringify(checkError, null, 2))
          return
        }

        if (!existingTemplate) {
          console.error('❌ Template not found:', task.recurring_template_id)
          return
        }

        console.log('✅ Template exists:', existingTemplate)

        const updatePayload = {
          title: task.title,
          memo: task.memo,
          category: task.category,
          importance: task.importance,
          weekdays: task.recurring_weekdays,
          updated_at: new Date().toISOString()
        }

        console.log('🆕 Syncing template with payload:', JSON.stringify(updatePayload, null, 2))

        const { error } = await supabase
          .from('recurring_templates')
          .update(updatePayload)
          .eq('id', task.recurring_template_id)

        if (error) {
          console.error('❌ Failed to sync template - Full error details:')
          console.error('  Error:', JSON.stringify(error, null, 2))
          console.error('  Template ID:', task.recurring_template_id)
          console.error('  Payload:', JSON.stringify(updatePayload, null, 2))
          console.error('  Query:', `recurring_templates.update().eq('id', '${task.recurring_template_id}')`)
        } else {
          console.log('✅ Template synced successfully')
        }
      } else {
        console.log('⚠️ No template_id found, cannot sync')
      }
    } catch (error) {
      console.error('❌ UnifiedTasksService.syncTemplateFromTask error:', error)
    }
  }

  // 繰り返しタスクから自動的にテンプレートを作成
  private static async createTemplateFromTask(task: UnifiedTask): Promise<void> {
    try {
      console.log('🔄 createTemplateFromTask called with:', {
        id: task.id,
        title: task.title,
        category: task.category,
        pattern: task.recurring_pattern,
        weekdays: task.recurring_weekdays,
        user_id: task.user_id
      })

      const supabase = createClient()

      // 既に同じテンプレートが存在するかチェック
      const { data: existingTemplate } = await supabase
        .from('recurring_templates')
        .select('id')
        .eq('user_id', task.user_id)
        .eq('title', task.title)
        .eq('pattern', task.recurring_pattern)
        .eq('category', task.category || '')
        .limit(1)

      console.log('🔍 Existing template check:', existingTemplate)

      if (existingTemplate && existingTemplate.length > 0) {
        // 既存テンプレートのIDを設定
        console.log('📎 Linking to existing template:', existingTemplate[0].id)
        await supabase
          .from('unified_tasks')
          .update({ recurring_template_id: existingTemplate[0].id })
          .eq('id', task.id)
        return
      }

      // 新しいテンプレートを作成
      const templatePayload = {
        title: task.title,
        memo: task.memo,
        category: task.category,
        importance: task.importance || 1,
        pattern: task.recurring_pattern,
        weekdays: task.recurring_weekdays,
        user_id: task.user_id,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('🆕 Creating new template with payload:', templatePayload)

      const { data: templateData, error: templateError } = await supabase
        .from('recurring_templates')
        .insert(templatePayload)
        .select()
        .single()

      if (templateError) {
        console.error('❌ Template creation error:', templateError)
        return
      }

      console.log('✅ Template created successfully:', templateData)

      // タスクにテンプレートIDを設定
      const { error: linkError } = await supabase
        .from('unified_tasks')
        .update({ recurring_template_id: templateData.id })
        .eq('id', task.id)

      if (linkError) {
        console.error('❌ Template linking error:', linkError)
      } else {
        console.log('🔗 Task linked to template successfully')
      }

      console.log(`✅ 自動テンプレート作成完了: ${task.title} (${task.recurring_pattern})`)

    } catch (error) {
      console.error('❌ createTemplateFromTask error:', error)
    }
  }

  // 統一タスクを更新
  static async updateUnifiedTask(id: string, updates: Partial<UnifiedTask>): Promise<UnifiedTask> {
    try {
      const supabase = createClient()

      // まず現在のタスク情報を取得
      const { data: currentTask, error: fetchError } = await supabase
        .from('unified_tasks')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch current task: ${fetchError.message}`)
      }

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

      // デバッグ: 更新されたタスクの情報をログ出力
      console.log('🔍 DEBUG: Updated task info:', {
        id: data.id,
        title: data.title,
        task_type: data.task_type,
        recurring_template_id: data.recurring_template_id,
        category: data.category
      })

      // 繰り返しタスクの場合、テンプレートも同期更新
      if (data.task_type === 'RECURRING') {
        console.log('🔄 RECURRING task detected, attempting template sync...')

        // recurring_template_idがない場合は、テンプレートを探すか作成
        if (!data.recurring_template_id) {
          console.log('⚠️ No recurring_template_id found, searching for existing template...')
          await this.createTemplateFromTask(data)
        } else {
          console.log('🔗 recurring_template_id found, syncing template...')
          await this.syncTemplateFromTask(data)
        }
      } else {
        console.log('🔍 DEBUG: Task is not RECURRING type:', data.task_type)
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

      // 削除前にタスクの情報を取得（done記録削除のため）
      const { data: task, error: fetchError } = await supabase
        .from('unified_tasks')
        .select('due_date, recurring_pattern')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch task before deletion: ${fetchError.message}`)
      }

      // タスクを削除
      const { error: deleteError } = await supabase
        .from('unified_tasks')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(`Failed to delete unified task: ${deleteError.message}`)
      }

      // 削除したタスクに対応するdone記録も削除
      if (task) {
        const { error: doneDeleteError } = await supabase
          .from('done')
          .delete()
          .eq('original_task_id', id)

        if (doneDeleteError) {
          console.warn('Failed to delete related done records:', doneDeleteError.message)
          // done記録の削除に失敗してもタスク削除は成功とする
        }
      }
    } catch (error) {
      console.error('UnifiedTasksService.deleteUnifiedTask error:', error)
      throw error
    }
  }

  // 孤児化したdone記録をクリーンアップ
  static async cleanupOrphanedDoneRecords(): Promise<{ deletedCount: number }> {
    try {
      const supabase = createClient()

      console.log('Starting cleanup of orphaned done records...')

      // まず、doneテーブルが存在するか確認
      const { data: allDoneRecords, error: doneError } = await supabase
        .from('done')
        .select('id, original_task_id')

      if (doneError) {
        console.error('Error fetching done records:', doneError)

        // doneテーブルが存在しない場合は作成が必要
        if (doneError.message.includes('does not exist') || doneError.message.includes('not found')) {
          throw new Error('doneテーブルが存在しません。データベースマイグレーションを実行してください。')
        }

        throw new Error(`Failed to fetch done records: ${doneError.message}`)
      }

      console.log(`Found ${allDoneRecords?.length || 0} done records`)

      if (!allDoneRecords || allDoneRecords.length === 0) {
        console.log('No done records found, nothing to cleanup')
        return { deletedCount: 0 }
      }

      // 全てのunified_tasksのIDを取得
      const { data: allTasks, error: tasksError } = await supabase
        .from('unified_tasks')
        .select('id')

      if (tasksError) {
        console.error('Error fetching unified tasks:', tasksError)
        throw new Error(`Failed to fetch unified tasks: ${tasksError.message}`)
      }

      console.log(`Found ${allTasks?.length || 0} unified tasks`)

      const validTaskIds = new Set(allTasks?.map(t => t.id) || [])

      // 孤児化したdone記録を特定
      const orphanedRecords = allDoneRecords.filter(
        done => !validTaskIds.has(done.original_task_id)
      )

      console.log(`Found ${orphanedRecords.length} orphaned done records`)

      if (orphanedRecords.length === 0) {
        return { deletedCount: 0 }
      }

      // 孤児化した記録を削除
      const orphanedIds = orphanedRecords.map(r => r.id)
      const { error: deleteError } = await supabase
        .from('done')
        .delete()
        .in('id', orphanedIds)

      if (deleteError) {
        console.error('Error deleting orphaned records:', deleteError)
        throw new Error(`Failed to delete orphaned done records: ${deleteError.message}`)
      }

      console.log(`Successfully cleaned up ${orphanedRecords.length} orphaned done records`)
      return { deletedCount: orphanedRecords.length }
    } catch (error) {
      console.error('UnifiedTasksService.cleanupOrphanedDoneRecords error:', error)
      throw error
    }
  }

  // タスクを完了にする（統一ルール）
  static async completeTask(id: string): Promise<UnifiedTask> {
    const supabase = createClient()

    try {
      // 現在のタスクを取得
      const { data: task, error: fetchError } = await supabase
        .from('unified_tasks')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch task: ${fetchError.message}`)
      }

      const completedAt = getNowJST()

      // 買い物タスクの未完了子タスク処理は日付変更時（TaskGeneratorService）に延期
      // その日が終わるまでは、checkモレや買い忘れへの対応を可能にするため

      // 全てのタスクの完了履歴をdoneテーブルに記録
      await this.saveToDoneHistory(task, completedAt)

      // 繰り返しタスクも通常タスクも同じ処理：完了状態にする
      // 新しい日のタスクはTaskGeneratorServiceが日付変更時に自動生成
      return this.updateUnifiedTask(id, {
        completed: true,
        completed_at: completedAt
      })
    } catch (error) {
      console.error('UnifiedTasksService.completeTask error:', error)
      throw error
    }
  }

  // 買い物タスク完了時の子タスク処理（日付変更時に実行）
  static async handleShoppingTaskCompletion(task: UnifiedTask): Promise<void> {
    try {
      // 未完了の子タスクを取得
      const incompleteSubTasks = await this.getSubtasks(task.id)
      const uncompletedSubTasks = incompleteSubTasks.filter(subTask => !subTask.completed)

      if (uncompletedSubTasks.length > 0) {
        console.log(`🛒 買い物タスク「${task.title}」に未完了の子タスクが ${uncompletedSubTasks.length} 個あります`)

        // 新しいタスクを期日なし（やることリスト）として作成
        const displayNumber = await this.generateDisplayNumber()
        const newTaskData = {
          title: task.title,
          memo: task.memo || '',
          due_date: '2999-12-31', // 期日なし = やることリスト
          category: '買い物',
          importance: task.importance || 1,
          task_type: 'NORMAL' as const,
          display_number: displayNumber,
          completed: false,
          user_id: task.user_id
        }

        const newTask = await this.createUnifiedTask(newTaskData)
        console.log(`📝 新しい買い物タスク（やることリスト）を作成: ${newTask.title} (${newTask.id})`)

        // 未完了の子タスクを新しいタスクに移行
        for (const uncompletedSubTask of uncompletedSubTasks) {
          await this.createSubtask(newTask.id, uncompletedSubTask.title)
          console.log(`  ✅ 子タスク移行: ${uncompletedSubTask.title}`)
        }

        console.log(`🎯 買い物リストの未完了項目 ${uncompletedSubTasks.length} 個をやることリストに繰り越しました`)
      }
    } catch (error) {
      console.error('買い物タスク完了処理エラー:', error)
      throw error
    }
  }

  // 完了履歴をdoneテーブルに保存
  private static async saveToDoneHistory(task: UnifiedTask, completedAt: string): Promise<void> {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('done')
        .insert({
          original_task_id: task.id,
          original_title: task.title,
          original_memo: task.memo,
          original_category: task.category,
          original_importance: task.importance,
          original_due_date: task.due_date,
          original_recurring_pattern: task.recurring_pattern,
          original_display_number: task.display_number,
          completed_at: completedAt,
          user_id: task.user_id
        })

      if (error) {
        console.error('Failed to save completion history to done table:', error)
        // エラーがあってもタスク完了処理は続行する
      }
    } catch (error) {
      console.error('Error saving to done history:', error)
      // エラーがあってもタスク完了処理は続行する
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

  // サブタスクを更新
  static async updateSubtask(subtaskId: string, updates: { title?: string; completed?: boolean; sort_order?: number }): Promise<SubTask> {
    try {
      const supabase = createClient()

      // ユーザー認証情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('subtasks')
        .update(updates)
        .eq('id', subtaskId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update subtask: ${error.message}`)
      }

      if (!data) {
        throw new Error('No data returned from update')
      }

      return data as SubTask
    } catch (error) {
      console.error('UnifiedTasksService.updateSubtask error:', error)
      throw error
    }
  }
}

export default UnifiedTasksService