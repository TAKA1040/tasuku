// クライアントサイド用 タスクAPIクライアント
// APIルート経由でmanariedbにアクセス

import type { UnifiedTask, SubTask, TaskFilters } from '@/lib/types/unified-task'

const API_BASE = '/api'

async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
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

export class TasksApi {
  // タスク一覧取得
  static async getAllTasks(filters?: TaskFilters): Promise<UnifiedTask[]> {
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
    return fetchApi<UnifiedTask[]>(`/tasks${query ? `?${query}` : ''}`)
  }

  // タスク作成
  static async createTask(task: Omit<UnifiedTask, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<UnifiedTask> {
    return fetchApi<UnifiedTask>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    })
  }

  // タスク更新
  static async updateTask(id: string, updates: Partial<UnifiedTask>): Promise<UnifiedTask> {
    return fetchApi<UnifiedTask>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  // タスク削除
  static async deleteTask(id: string): Promise<void> {
    await fetchApi<void>(`/tasks/${id}`, {
      method: 'DELETE',
    })
  }

  // タスク完了
  static async completeTask(id: string): Promise<UnifiedTask> {
    return fetchApi<UnifiedTask>(`/tasks/${id}/complete`, {
      method: 'POST',
    })
  }

  // タスク未完了
  static async uncompleteTask(id: string): Promise<UnifiedTask> {
    return fetchApi<UnifiedTask>(`/tasks/${id}/complete`, {
      method: 'DELETE',
    })
  }

  // ===================================
  // SUBTASKS
  // ===================================

  // サブタスク一覧取得
  static async getSubtasks(parentTaskId: string): Promise<SubTask[]> {
    return fetchApi<SubTask[]>(`/tasks/${parentTaskId}/subtasks`)
  }

  // サブタスク作成
  static async createSubtask(parentTaskId: string, title: string): Promise<SubTask> {
    return fetchApi<SubTask>(`/tasks/${parentTaskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    })
  }

  // サブタスク更新
  static async updateSubtask(id: string, updates: { title?: string; completed?: boolean; sort_order?: number }): Promise<SubTask> {
    return fetchApi<SubTask>(`/subtasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  // サブタスク削除
  static async deleteSubtask(id: string): Promise<void> {
    await fetchApi<void>(`/subtasks/${id}`, {
      method: 'DELETE',
    })
  }

  // サブタスクトグル
  static async toggleSubtask(id: string): Promise<SubTask> {
    return fetchApi<SubTask>(`/subtasks/${id}/toggle`, {
      method: 'POST',
    })
  }
}

export default TasksApi
