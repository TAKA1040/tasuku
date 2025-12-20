// 統一タスク管理フック
// unified_tasksテーブルからフィルター方式でデータを取得

'use client'

import { useState, useEffect, useCallback } from 'react'
import { UnifiedTasksService } from '@/lib/db/unified-tasks'
import type { UnifiedTask, SubTask } from '@/lib/types/unified-task'
import { withErrorHandling } from '@/lib/utils/error-handler'
import { getTodayJST, getNowJST } from '@/lib/utils/date-jst'
import { SPECIAL_DATES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'

const NO_DUE_DATE = SPECIAL_DATES.NO_DUE_DATE

// キャッシュ管理（バージョン追跡付き）
let taskCache: {
  data: UnifiedTask[]
  timestamp: number
  version: string  // ユーザーIDまたはセッションIDでバージョン管理
} | null = null
const CACHE_DURATION = 30000 // 30秒間キャッシュ（2秒から延長してパフォーマンス向上）

// グローバルキャッシュ無効化関数
const invalidateGlobalCache = () => {
  taskCache = null
  if (process.env.NODE_ENV === 'development') {
    logger.info('🗑️ Global task cache invalidated')
  }
}

export interface UseUnifiedTasksResult {
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
  updateSubtask: (subtaskId: string, updates: { title?: string; completed?: boolean; sort_order?: number }) => Promise<void>
}

export function useUnifiedTasks(autoLoad: boolean = true, isInitialized?: boolean): UseUnifiedTasksResult {
  const [tasks, setTasks] = useState<UnifiedTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 全タスクを読み込み
  const loadTasks = useCallback(async (forceRefresh = false) => {
    // キャッシュバージョンは固定（認証はサーバー側で処理）
    const currentVersion = 'session'

    // キャッシュチェック（強制更新でない場合 & バージョン一致）
    if (
      !forceRefresh &&
      taskCache &&
      taskCache.version === currentVersion &&
      Date.now() - taskCache.timestamp < CACHE_DURATION
    ) {
      if (process.env.NODE_ENV === 'development') {
        logger.info('✅ Using cached unified tasks data (valid for',
          Math.round((CACHE_DURATION - (Date.now() - taskCache.timestamp)) / 1000), 'more seconds)')
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

        // キャッシュを更新（バージョン情報付き）
        taskCache = {
          data: allTasks,
          timestamp: Date.now(),
          version: currentVersion
        }

        setTasks(allTasks)
        setError(null)

        if (process.env.NODE_ENV === 'development') {
          logger.info(`🔄 Unified tasks loaded: ${allTasks.length} items (cache duration: ${CACHE_DURATION / 1000}s)`)
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
  // TODO: doneテーブルのAPIを作成後、履歴取得を追加
  const getCompletedTasksWithHistory = useCallback(async (): Promise<UnifiedTask[]> => {
    // 現在は通常の完了済みタスクのみ返す
    const completedTasks = tasks.filter(task => task.completed)
    return completedTasks.sort((a, b) => {
      // 完了日時で降順（新しい順）
      const dateA = a.completed_at || a.updated_at || ''
      const dateB = b.completed_at || b.updated_at || ''
      return dateB.localeCompare(dateA)
    })
  }, [tasks])

  // タスク操作関数
  const createTask = useCallback(async (task: Omit<UnifiedTask, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<UnifiedTask> => {
    const result = await withErrorHandling(
      async () => {
        // user_idはサーバー側で自動設定
        const createdTask = await UnifiedTasksService.createUnifiedTask(task as Omit<UnifiedTask, 'id' | 'created_at' | 'updated_at'>)

        // 作成されたタスクをローカル状態に追加（全タスク再取得を回避）
        setTasks(prevTasks => [...prevTasks, createdTask])

        // キャッシュにも追加
        if (taskCache) {
          taskCache.data = [...taskCache.data, createdTask]
        }

        return createdTask
      },
      'useUnifiedTasks.createTask',
      setError
    )

    if (!result) {
      throw new Error('Failed to create task')
    }

    return result
  }, [])

  const completeTask = useCallback(async (id: string) => {
    // 楽観的UI更新: 即座にローカル状態を更新してスクロール位置を保持
    const completedAt = getNowJST()

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id
          ? { ...task, completed: true, completed_at: completedAt }
          : task
      )
    )

    // キャッシュも部分更新
    if (taskCache) {
      taskCache.data = taskCache.data.map(task =>
        task.id === id
          ? { ...task, completed: true, completed_at: completedAt }
          : task
      )
    }

    // バックグラウンドでサーバー更新
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.completeTask(id)
        // 成功時は既にローカル状態が更新済みなので、全タスク再取得は不要
      },
      'useUnifiedTasks.completeTask',
      (error) => {
        // エラー時はローカル状態をロールバック
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === id
              ? { ...task, completed: false, completed_at: undefined }
              : task
          )
        )
        // キャッシュもロールバック
        if (taskCache) {
          taskCache.data = taskCache.data.map(task =>
            task.id === id
              ? { ...task, completed: false, completed_at: undefined }
              : task
          )
        }
        setError(error)
      }
    )
  }, [])

  const uncompleteTask = useCallback(async (id: string) => {
    // 楽観的UI更新: 即座にローカル状態を更新してスクロール位置を保持
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id
          ? { ...task, completed: false, completed_at: undefined }
          : task
      )
    )

    // キャッシュも部分更新
    if (taskCache) {
      taskCache.data = taskCache.data.map(task =>
        task.id === id
          ? { ...task, completed: false, completed_at: undefined }
          : task
      )
    }

    // バックグラウンドでサーバー更新
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.uncompleteTask(id)
        // 成功時は既にローカル状態が更新済みなので、全タスク再取得は不要
      },
      'useUnifiedTasks.uncompleteTask',
      (error) => {
        // エラー時はローカル状態をロールバック
        const completedAt = getNowJST()
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === id
              ? { ...task, completed: true, completed_at: completedAt }
              : task
          )
        )
        // キャッシュもロールバック
        if (taskCache) {
          taskCache.data = taskCache.data.map(task =>
            task.id === id
              ? { ...task, completed: true, completed_at: completedAt }
              : task
          )
        }
        setError(error)
      }
    )
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    // 楽観的UI更新: 削除前の状態を保存
    let deletedTask: UnifiedTask | undefined

    setTasks(prevTasks => {
      deletedTask = prevTasks.find(task => task.id === id)
      return prevTasks.filter(task => task.id !== id)
    })

    // キャッシュも部分更新
    if (taskCache) {
      taskCache.data = taskCache.data.filter(task => task.id !== id)
    }

    // バックグラウンドでサーバー削除
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.deleteUnifiedTask(id)
        // 成功時は既にローカル状態が更新済みなので、全タスク再取得は不要
      },
      'useUnifiedTasks.deleteTask',
      (error) => {
        // エラー時はローカル状態をロールバック（削除したタスクを復元）
        if (deletedTask) {
          setTasks(prevTasks => [...prevTasks, deletedTask!])
          // キャッシュもロールバック
          if (taskCache) {
            taskCache.data = [...taskCache.data, deletedTask!]
          }
        }
        setError(error)
      }
    )
  }, [])

  const updateTask = useCallback(async (id: string, updates: Partial<UnifiedTask>) => {
    // 楽観的UI更新: 更新前の状態を保存
    let previousTask: UnifiedTask | undefined

    setTasks(prevTasks => {
      previousTask = prevTasks.find(task => task.id === id)
      return prevTasks.map(task =>
        task.id === id
          ? { ...task, ...updates, updated_at: getNowJST() }
          : task
      )
    })

    // キャッシュも部分更新
    if (taskCache) {
      taskCache.data = taskCache.data.map(task =>
        task.id === id
          ? { ...task, ...updates, updated_at: getNowJST() }
          : task
      )
    }

    // バックグラウンドでサーバー更新
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.updateUnifiedTask(id, updates)
        // 成功時は既にローカル状態が更新済みなので、全タスク再取得は不要
      },
      'useUnifiedTasks.updateTask',
      (error) => {
        // エラー時はローカル状態をロールバック
        if (previousTask) {
          setTasks(prevTasks =>
            prevTasks.map(task =>
              task.id === id ? previousTask! : task
            )
          )
          // キャッシュもロールバック
          if (taskCache) {
            taskCache.data = taskCache.data.map(task =>
              task.id === id ? previousTask! : task
            )
          }
        }
        setError(error)
      }
    )
  }, [])

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

  const updateSubtask = useCallback(async (subtaskId: string, updates: { title?: string; completed?: boolean; sort_order?: number }) => {
    await withErrorHandling(
      async () => {
        await UnifiedTasksService.updateSubtask(subtaskId, updates)
        // サブタスクの変更はタスクリストの再読み込みは不要
      },
      'useUnifiedTasks.updateSubtask',
      setError
    )
  }, [])

  // 初期読み込み（DB初期化完了を待つ）
  useEffect(() => {
    // isInitializedが指定されている場合は、それがtrueになるまで待つ
    if (autoLoad && (isInitialized === undefined || isInitialized === true)) {
      loadTasks()
    }
  }, [autoLoad, isInitialized, loadTasks])

  // ページフォーカス時の自動リロード & タスク生成完了時のリロード
  // 注: 楽観的UI更新実装により、フォーカス/Visibility イベントでの自動リロードは不要
  // タスク更新は即座に反映され、サーバー同期はバックグラウンドで行われる
  useEffect(() => {
    if (!autoLoad) return

    const handleTasksUpdated = () => {
      if (process.env.NODE_ENV === 'development') {
        logger.info('Tasks updated event received, invalidating cache and reloading tasks...')
      }
      invalidateGlobalCache() // キャッシュを無効化
      loadTasks(true) // 強制リロード
    }

    // タスク生成完了時のみリロード（新しいタスクが追加された場合）
    window.addEventListener('tasksUpdated', handleTasksUpdated)

    return () => {
      window.removeEventListener('tasksUpdated', handleTasksUpdated)
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
    deleteSubtask,
    updateSubtask
  }
}