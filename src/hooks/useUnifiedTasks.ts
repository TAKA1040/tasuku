// 統一タスク管理フック
// unified_tasksテーブルからフィルター方式でデータを取得

'use client'

import { useState, useEffect, useCallback } from 'react'
import { UnifiedTasksService } from '@/lib/db/unified-tasks'
import type { UnifiedTask, TaskFilters, SPECIAL_DATES } from '@/lib/types/unified-task'
import { withErrorHandling } from '@/lib/utils/error-handler'

const NO_DUE_DATE = '2999-12-31'

interface UseUnifiedTasksResult {
  tasks: UnifiedTask[]
  loading: boolean
  error: string | null

  // データ取得関数
  loadTasks: () => Promise<void>

  // フィルター別取得関数
  getTodayTasks: () => UnifiedTask[]
  getShoppingTasks: () => UnifiedTask[]
  getIdeaTasks: () => UnifiedTask[]
  getRecurringTasks: () => UnifiedTask[]
  getCompletedTasks: () => UnifiedTask[]

  // 操作関数
  completeTask: (id: string) => Promise<void>
  uncompleteTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  updateTask: (id: string, updates: Partial<UnifiedTask>) => Promise<void>
}

export function useUnifiedTasks(autoLoad: boolean = true): UseUnifiedTasksResult {
  const [tasks, setTasks] = useState<UnifiedTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 全タスクを読み込み
  const loadTasks = useCallback(async () => {
    await withErrorHandling(
      async () => {
        setLoading(true)
        const allTasks = await UnifiedTasksService.getAllUnifiedTasks()
        setTasks(allTasks)
        setError(null)
      },
      'useUnifiedTasks.loadTasks',
      setError
    )
    setLoading(false)
  }, [])

  // フィルター関数群（統一ルール）
  const getTodayTasks = useCallback((): UnifiedTask[] => {
    const today = new Date().toISOString().split('T')[0]
    return tasks.filter(task =>
      !task.completed &&
      task.due_date === today
    ).sort((a, b) => {
      const priorityA = a.importance || 0
      const priorityB = b.importance || 0

      // 優先度が異なる場合は優先度で比較（高い方が先）
      if (priorityA !== priorityB) {
        return priorityB - priorityA
      }

      // 優先度が同じ場合は統一番号順
      return (a.display_number || '').localeCompare(b.display_number || '')
    })
  }, [tasks])

  const getShoppingTasks = useCallback((): UnifiedTask[] => {
    return tasks.filter(task =>
      !task.completed &&
      task.category === '買い物' &&
      task.due_date === NO_DUE_DATE // 期限なし買い物リスト
    ).sort((a, b) => {
      const priorityA = a.importance || 0
      const priorityB = b.importance || 0

      // 優先度が異なる場合は優先度で比較（高い方が先）
      if (priorityA !== priorityB) {
        return priorityB - priorityA
      }

      // 優先度が同じ場合は統一番号順
      return (a.display_number || '').localeCompare(b.display_number || '')
    })
  }, [tasks])

  const getIdeaTasks = useCallback((): UnifiedTask[] => {
    return tasks.filter(task =>
      task.due_date === NO_DUE_DATE // 期限なし（アイデア）
    ).sort((a, b) => {
      const priorityA = a.importance || 0
      const priorityB = b.importance || 0

      // 優先度が異なる場合は優先度で比較（高い方が先）
      if (priorityA !== priorityB) {
        return priorityB - priorityA
      }

      // 優先度が同じ場合は統一番号順
      return (a.display_number || '').localeCompare(b.display_number || '')
    })
  }, [tasks])

  const getRecurringTasks = useCallback((): UnifiedTask[] => {
    return tasks.filter(task =>
      !task.completed &&
      task.recurring_pattern // 繰り返しパターンがある
    ).sort((a, b) => {
      const priorityA = a.importance || 0
      const priorityB = b.importance || 0

      // 優先度が異なる場合は優先度で比較（高い方が先）
      if (priorityA !== priorityB) {
        return priorityB - priorityA
      }

      // 優先度が同じ場合は統一番号順
      return (a.display_number || '').localeCompare(b.display_number || '')
    })
  }, [tasks])

  const getCompletedTasks = useCallback((): UnifiedTask[] => {
    return tasks.filter(task => task.completed).sort((a, b) => {
      const priorityA = a.importance || 0
      const priorityB = b.importance || 0

      // 優先度が異なる場合は優先度で比較（高い方が先）
      if (priorityA !== priorityB) {
        return priorityB - priorityA
      }

      // 優先度が同じ場合は統一番号順
      return (a.display_number || '').localeCompare(b.display_number || '')
    })
  }, [tasks])

  // タスク操作関数
  const completeTask = useCallback(async (id: string) => {
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.completeTask(id)
        await loadTasks() // データを再読み込み
      },
      'useUnifiedTasks.completeTask',
      setError
    )
  }, [loadTasks])

  const uncompleteTask = useCallback(async (id: string) => {
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.uncompleteTask(id)
        await loadTasks() // データを再読み込み
      },
      'useUnifiedTasks.uncompleteTask',
      setError
    )
  }, [loadTasks])

  const deleteTask = useCallback(async (id: string) => {
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.deleteUnifiedTask(id)
        await loadTasks() // データを再読み込み
      },
      'useUnifiedTasks.deleteTask',
      setError
    )
  }, [loadTasks])

  const updateTask = useCallback(async (id: string, updates: Partial<UnifiedTask>) => {
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.updateUnifiedTask(id, updates)
        await loadTasks() // データを再読み込み
      },
      'useUnifiedTasks.updateTask',
      setError
    )
  }, [loadTasks])

  // 初期読み込み
  useEffect(() => {
    if (autoLoad) {
      loadTasks()
    }
  }, [autoLoad, loadTasks])

  return {
    tasks,
    loading,
    error,
    loadTasks,
    getTodayTasks,
    getShoppingTasks,
    getIdeaTasks,
    getRecurringTasks,
    getCompletedTasks,
    completeTask,
    uncompleteTask,
    deleteTask,
    updateTask
  }
}