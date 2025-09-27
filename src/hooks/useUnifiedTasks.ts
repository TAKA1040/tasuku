// 統一タスク管理フック
// unified_tasksテーブルからフィルター方式でデータを取得

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { UnifiedTasksService } from '@/lib/db/unified-tasks'
import type { UnifiedTask, TaskFilters, SPECIAL_DATES, SubTask } from '@/lib/types/unified-task'
import { withErrorHandling } from '@/lib/utils/error-handler'
import { createClient } from '@/lib/supabase/client'
import { getTodayJST } from '@/lib/utils/date-jst'

const NO_DUE_DATE = '2999-12-31'

// キャッシュ管理
let taskCache: { data: UnifiedTask[]; timestamp: number } | null = null
const CACHE_DURATION = 2000 // 2秒間キャッシュ（さらに短縮）

// グローバルキャッシュ無効化関数
const invalidateGlobalCache = () => {
  taskCache = null
  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️ Global task cache invalidated')
  }
}

interface UseUnifiedTasksResult {
  tasks: UnifiedTask[]
  loading: boolean
  error: string | null

  // データ取得関数
  loadTasks: (forceRefresh?: boolean) => Promise<void>

  // フィルター別取得関数
  getTodayTasks: () => UnifiedTask[]
  getShoppingTasks: () => UnifiedTask[]
  getIdeaTasks: () => UnifiedTask[]
  getRecurringTasks: () => UnifiedTask[]
  getCompletedTasks: () => UnifiedTask[]
  getCompletedTasksWithHistory: () => Promise<UnifiedTask[]>

  // 操作関数
  createTask: (task: Omit<UnifiedTask, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<UnifiedTask>
  completeTask: (id: string) => Promise<void>
  uncompleteTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  updateTask: (id: string, updates: Partial<UnifiedTask>) => Promise<void>

  // サブタスク管理関数
  getSubtasks: (parentTaskId: string) => Promise<SubTask[]>
  createSubtask: (parentTaskId: string, title: string) => Promise<void>
  toggleSubtask: (subtaskId: string) => Promise<void>
  deleteSubtask: (subtaskId: string) => Promise<void>
}

export function useUnifiedTasks(autoLoad: boolean = true): UseUnifiedTasksResult {
  const [tasks, setTasks] = useState<UnifiedTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 全タスクを読み込み
  const loadTasks = useCallback(async (forceRefresh = false) => {
    // キャッシュチェック（強制更新でない場合）
    if (!forceRefresh && taskCache && Date.now() - taskCache.timestamp < CACHE_DURATION) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Using cached unified tasks data')
      }
      setTasks(taskCache.data)
      setError(null)
      setLoading(false)
      return
    }

    await withErrorHandling(
      async () => {
        setLoading(true)
        const allTasks = await UnifiedTasksService.getAllUnifiedTasks()

        // キャッシュを更新
        taskCache = {
          data: allTasks,
          timestamp: Date.now()
        }

        setTasks(allTasks)
        setError(null)

        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Unified tasks loaded: ${allTasks.length} items`)
        }
      },
      'useUnifiedTasks.loadTasks',
      setError
    )
    setLoading(false)
  }, [])

  // フィルター関数群（統一ルール）
  const getTodayTasks = useCallback((): UnifiedTask[] => {
    const today = getTodayJST() // JST日付を使用
    const filtered = tasks.filter(task => {
      return !task.completed && task.due_date === today
    })
    return filtered.sort((a, b) => {
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
    const shoppingTasks = tasks.filter(task =>
      !task.completed &&
      task.category === '買い物'
    )

    return shoppingTasks.sort((a, b) => {
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
      (task.recurring_pattern || task.task_type === 'RECURRING') // 繰り返しパターンまたは繰り返しタイプ
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

  // doneテーブルの完了履歴も含む完了タスク取得
  const getCompletedTasksWithHistory = useCallback(async (): Promise<UnifiedTask[]> => {
    return await withErrorHandling(
      async () => {
        const supabase = createClient()

        // 1. 通常の完了済みタスク (unified_tasks.completed = true)
        const completedTasks = tasks.filter(task => task.completed)

        // 2. doneテーブルから完了履歴を取得
        const { data: doneRecords, error } = await supabase
          .from('done')
          .select(`
            original_task_id,
            completed_at,
            unified_tasks!inner(*)
          `)
          .order('completed_at', { ascending: false })

        if (error) {
          console.error('Failed to fetch done records:', error)
          return completedTasks
        }

        // 3. doneレコードから仮想的な完了タスクを構築
        const historyTasks: UnifiedTask[] = doneRecords?.map(record => ({
          ...record.unified_tasks,
          completed: true,
          completed_at: record.completed_at
        } as unknown as UnifiedTask)) || []

        // 4. 重複を除去（同一タスクの複数完了履歴は最新のみ保持）
        const uniqueHistoryTasks = historyTasks.filter((historyTask, index, array) => {
          return array.findIndex(t => t.id === historyTask.id) === index
        })

        // 5. 結合して並び替え
        const allCompletedTasks = [...completedTasks, ...uniqueHistoryTasks]

        return allCompletedTasks.sort((a, b) => {
          // 完了日時で降順（新しい順）
          const dateA = a.completed_at || a.updated_at || ''
          const dateB = b.completed_at || b.updated_at || ''
          return dateB.localeCompare(dateA)
        })
      },
      'useUnifiedTasks.getCompletedTasksWithHistory',
      setError
    ) || []
  }, [tasks])

  // タスク操作関数
  const createTask = useCallback(async (task: Omit<UnifiedTask, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<UnifiedTask> => {
    const result = await withErrorHandling(
      async () => {
        // user_idを自動で取得してタスクを作成
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) {
          throw new Error('User not authenticated')
        }

        const taskWithUserId = {
          ...task,
          user_id: user.id
        }

        const createdTask = await UnifiedTasksService.createUnifiedTask(taskWithUserId)
        // グローバルキャッシュを無効化して強制リロード
        invalidateGlobalCache()
        await loadTasks(true)
        return createdTask
      },
      'useUnifiedTasks.createTask',
      setError
    )

    if (!result) {
      throw new Error('Failed to create task')
    }

    return result
  }, [loadTasks])

  const completeTask = useCallback(async (id: string) => {
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.completeTask(id)
        // グローバルキャッシュを無効化して強制リロード
        invalidateGlobalCache()
        await loadTasks(true)
      },
      'useUnifiedTasks.completeTask',
      setError
    )
  }, [loadTasks])

  const uncompleteTask = useCallback(async (id: string) => {
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.uncompleteTask(id)
        // グローバルキャッシュを無効化して強制リロード
        invalidateGlobalCache()
        await loadTasks(true)
      },
      'useUnifiedTasks.uncompleteTask',
      setError
    )
  }, [loadTasks])

  const deleteTask = useCallback(async (id: string) => {
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.deleteUnifiedTask(id)
        // グローバルキャッシュを無効化して強制リロード
        invalidateGlobalCache()
        await loadTasks(true)
      },
      'useUnifiedTasks.deleteTask',
      setError
    )
  }, [loadTasks])

  const updateTask = useCallback(async (id: string, updates: Partial<UnifiedTask>) => {
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.updateUnifiedTask(id, updates)
        // グローバルキャッシュを無効化して強制リロード
        invalidateGlobalCache()
        await loadTasks(true)
      },
      'useUnifiedTasks.updateTask',
      setError
    )
  }, [loadTasks])

  // サブタスク管理関数
  const getSubtasks = useCallback(async (parentTaskId: string) => {
    return await UnifiedTasksService.getSubtasks(parentTaskId)
  }, [])


  const createSubtask = useCallback(async (parentTaskId: string, title: string) => {
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.createSubtask(parentTaskId, title)
        // サブタスクの変更はタスクリストの再読み込みは不要
      },
      'useUnifiedTasks.createSubtask',
      setError
    )
  }, [])

  const toggleSubtask = useCallback(async (subtaskId: string) => {
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.toggleSubtask(subtaskId)
        // サブタスクの変更はタスクリストの再読み込みは不要
      },
      'useUnifiedTasks.toggleSubtask',
      setError
    )
  }, [])

  const deleteSubtask = useCallback(async (subtaskId: string) => {
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.deleteSubtask(subtaskId)
        // サブタスクの変更はタスクリストの再読み込みは不要
      },
      'useUnifiedTasks.deleteSubtask',
      setError
    )
  }, [])

  // 初期読み込み
  useEffect(() => {
    if (autoLoad) {
      loadTasks()
    }
  }, [autoLoad, loadTasks])

  // ページフォーカス時の自動リロード
  useEffect(() => {
    if (!autoLoad) return

    const handleFocus = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Page focused, invalidating cache and reloading tasks...')
      }
      invalidateGlobalCache() // キャッシュを無効化
      loadTasks(true) // 強制リロード
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Page became visible, invalidating cache and reloading tasks...')
        }
        invalidateGlobalCache() // キャッシュを無効化
        loadTasks(true) // 強制リロード
      }
    }

    // フォーカス時とページが表示状態になった時にリロード
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
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
    getCompletedTasksWithHistory,
    createTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    updateTask,
    getSubtasks,
    createSubtask,
    toggleSubtask,
    deleteSubtask
  }
}