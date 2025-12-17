// 統一タスクデータベースサービス
// APIルート経由でmanariedb (PostgreSQL) にアクセス
// ※元のSupabase版は unified-tasks.supabase-backup.ts に保存

import type { UnifiedTask, TaskFilters, SubTask } from '@/lib/types/unified-task'
import { getTodayJST } from '@/lib/utils/date-jst'
import { SPECIAL_DATES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'

const NO_DUE_DATE = SPECIAL_DATES.NO_DUE_DATE

// APIヘルパー
async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'API request failed')
  }

  return data.data
}

export class UnifiedTasksService {
  /**
   * ✅ 公式のディスプレイ番号生成メソッド - T001形式
   * サーバーサイドで生成されるため、クライアントでは不要
   * APIがdisplay_numberを自動生成
   */
  static async generateDisplayNumber(): Promise<string> {
    // APIがdisplay_numberを自動生成するため、ダミーを返す
    // 実際の番号はcreateUnifiedTask時にサーバーで生成される
    return 'T000'
  }

  // 全統一タスクを取得
  static async getAllUnifiedTasks(filters?: TaskFilters): Promise<UnifiedTask[]> {
    try {
      const params = new URLSearchParams()

      if (filters?.completed !== undefined) {
        params.set('completed', String(filters.completed))
      }
      if (filters?.category) {
        params.set('category', filters.category)
      }
      if (filters?.date_range?.start) {
        params.set('date_start', filters.date_range.start)
      }
      if (filters?.date_range?.end) {
        params.set('date_end', filters.date_range.end)
      }
      if (filters?.has_due_date !== undefined) {
        params.set('has_due_date', String(filters.has_due_date))
      }

      const query = params.toString()
      return await fetchApi<UnifiedTask[]>(`/tasks${query ? `?${query}` : ''}`)
    } catch (error) {
      logger.error('UnifiedTasksService.getAllUnifiedTasks error:', error)
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
  // display_numberはAPIが自動生成するため、省略可能
  static async createUnifiedTask(task: Omit<UnifiedTask, 'id' | 'created_at' | 'updated_at' | 'display_number'>): Promise<UnifiedTask> {
    try {
      logger.info('タスク作成データ:', task)
      return await fetchApi<UnifiedTask>('/tasks', {
        method: 'POST',
        body: JSON.stringify(task),
      })
    } catch (error) {
      logger.error('UnifiedTasksService.createUnifiedTask error:', error)
      throw error
    }
  }

  // 統一タスクを更新
  static async updateUnifiedTask(id: string, updates: Partial<UnifiedTask>): Promise<UnifiedTask> {
    try {
      logger.info('🔍 DEBUG: Updating task:', { id, updates })
      return await fetchApi<UnifiedTask>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
    } catch (error) {
      logger.error('UnifiedTasksService.updateUnifiedTask error:', error)
      throw error
    }
  }

  // 統一タスクを削除
  static async deleteUnifiedTask(id: string): Promise<void> {
    try {
      await fetchApi<void>(`/tasks/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      logger.error('UnifiedTasksService.deleteUnifiedTask error:', error)
      throw error
    }
  }

  // 孤児化したdone記録をクリーンアップ
  static async cleanupOrphanedDoneRecords(): Promise<{ deletedCount: number }> {
    // TODO: APIルートを作成する
    logger.warn('cleanupOrphanedDoneRecords: Not implemented for API mode')
    return { deletedCount: 0 }
  }

  // タスクを完了にする（統一ルール）
  static async completeTask(id: string): Promise<UnifiedTask> {
    try {
      return await fetchApi<UnifiedTask>(`/tasks/${id}/complete`, {
        method: 'POST',
      })
    } catch (error) {
      logger.error('UnifiedTasksService.completeTask error:', error)
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
        logger.info(`🛒 買い物タスク「${task.title}」に未完了の子タスクが ${uncompletedSubTasks.length} 個あります`)

        // 新しいタスクを期日なし（やることリスト）として作成
        const newTaskData = {
          title: task.title,
          memo: task.memo || '',
          due_date: '2999-12-31', // 期日なし = やることリスト
          category: '買い物',
          importance: task.importance || 1,
          task_type: 'NORMAL' as const,
          completed: false,
          user_id: task.user_id
        }

        const newTask = await this.createUnifiedTask(newTaskData)
        logger.info(`📝 新しい買い物タスク（やることリスト）を作成: ${newTask.title} (${newTask.id})`)

        // 未完了の子タスクを新しいタスクに移行
        for (const uncompletedSubTask of uncompletedSubTasks) {
          await this.createSubtask(newTask.id, uncompletedSubTask.title)
          logger.info(`  ✅ 子タスク移行: ${uncompletedSubTask.title}`)
        }

        logger.info(`🎯 買い物リストの未完了項目 ${uncompletedSubTasks.length} 個をやることリストに繰り越しました`)
      }
    } catch (error) {
      logger.error('買い物タスク完了処理エラー:', error)
      throw error
    }
  }

  // タスクを未完了にする
  static async uncompleteTask(id: string): Promise<UnifiedTask> {
    try {
      return await fetchApi<UnifiedTask>(`/tasks/${id}/complete`, {
        method: 'DELETE',
      })
    } catch (error) {
      logger.error('UnifiedTasksService.uncompleteTask error:', error)
      throw error
    }
  }

  // ===================================
  // SUBTASKS Operations
  // ===================================

  // 指定タスクのサブタスクを取得
  static async getSubtasks(parentTaskId: string): Promise<SubTask[]> {
    try {
      return await fetchApi<SubTask[]>(`/tasks/${parentTaskId}/subtasks`)
    } catch (error) {
      logger.error('UnifiedTasksService.getSubtasks error:', error)
      throw error
    }
  }

  // サブタスクを作成
  static async createSubtask(parentTaskId: string, title: string): Promise<SubTask> {
    try {
      logger.info('🔐 createSubtask - Parent Task ID:', parentTaskId)
      logger.info('📄 createSubtask - Title:', title)

      return await fetchApi<SubTask>(`/tasks/${parentTaskId}/subtasks`, {
        method: 'POST',
        body: JSON.stringify({ title }),
      })
    } catch (error) {
      logger.error('UnifiedTasksService.createSubtask error:', error)
      throw error
    }
  }

  // サブタスクの完了状態を切り替え
  static async toggleSubtask(subtaskId: string): Promise<SubTask> {
    try {
      return await fetchApi<SubTask>(`/subtasks/${subtaskId}/toggle`, {
        method: 'POST',
      })
    } catch (error) {
      logger.error('UnifiedTasksService.toggleSubtask error:', error)
      throw error
    }
  }

  // サブタスクを削除
  static async deleteSubtask(subtaskId: string): Promise<void> {
    try {
      await fetchApi<void>(`/subtasks/${subtaskId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      logger.error('UnifiedTasksService.deleteSubtask error:', error)
      throw error
    }
  }

  // サブタスクを更新
  static async updateSubtask(subtaskId: string, updates: { title?: string; completed?: boolean; sort_order?: number }): Promise<SubTask> {
    try {
      return await fetchApi<SubTask>(`/subtasks/${subtaskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
    } catch (error) {
      logger.error('UnifiedTasksService.updateSubtask error:', error)
      throw error
    }
  }
}

export default UnifiedTasksService
