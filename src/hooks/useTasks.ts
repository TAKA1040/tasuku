'use client'

// Tasks data management hook
// API経由でmanariedbにアクセス（NextAuth認証対応）
import { useState, useEffect, useCallback } from 'react'
import { TasksApi } from '@/lib/api/tasks-api'
import { getTodayJST, getDaysFromToday, getUrgencyLevel } from '@/lib/utils/date-jst'
import type { Task, TaskWithUrgency } from '@/lib/db/schema'
import type { UnifiedTask } from '@/lib/types/unified-task'
import { TIME_CONSTANTS } from '@/lib/constants'
import { withErrorHandling } from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

// 簡易メモリキャッシュ
let taskCache: { data: Task[]; timestamp: number } | null = null
const CACHE_DURATION = 30000 // 30秒

// UnifiedTask → Task 変換ヘルパー
function toTask(u: UnifiedTask): Task {
  return {
    id: u.id,
    display_number: u.display_number || '',
    title: u.title,
    memo: u.memo || undefined,
    due_date: u.due_date || undefined,
    category: u.category || undefined,
    importance: u.importance as 1 | 2 | 3 | 4 | 5 | undefined,
    duration_min: u.duration_min || undefined,
    urls: u.urls || undefined,
    attachment: undefined,
    completed: u.completed,
    archived: u.archived,
    completed_at: u.completed_at || undefined,
    snoozed_until: u.snoozed_until || undefined,
    start_time: u.start_time || undefined,
    end_time: u.end_time || undefined,
    created_at: u.created_at,
    updated_at: u.updated_at,
  }
}

export function useTasks(_isDbInitialized: boolean = false) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load tasks from API
  const loadTasks = useCallback(async (forceRefresh = false) => {
    // キャッシュチェック（強制更新でない場合）
    if (!forceRefresh && taskCache && Date.now() - taskCache.timestamp < CACHE_DURATION) {
      if (process.env.NODE_ENV === 'development') {
        logger.info('Using cached tasks data')
      }
      setTasks(taskCache.data)
      setLoading(false)
      return
    }

    await withErrorHandling(
      async () => {
        setLoading(true)
        const allUnifiedTasks = await TasksApi.getAllTasks()
        const allTasks = allUnifiedTasks.map(toTask)

        // キャッシュを更新
        taskCache = {
          data: allTasks,
          timestamp: Date.now()
        }

        setTasks(allTasks)
        setError(null)
        return allTasks
      },
      'useTasks.loadTasks',
      setError
    )

    setLoading(false)
  }, [])

  // Get today's tasks with urgency
  const getTodayTasks = (): TaskWithUrgency[] => {
    const today = getTodayJST()
    
    return tasks
      .filter(task =>
        !task.completed &&
        !task.archived &&
        (!task.snoozed_until || task.snoozed_until <= today) &&
        task.due_date && task.due_date === today  // Show only tasks due today
      )
      .map(task => {
        const days_from_today = task.due_date ? getDaysFromToday(task.due_date) : TIME_CONSTANTS.MAX_DAYS_FROM_TODAY_FALLBACK
        const urgency = task.due_date ? getUrgencyLevel(task.due_date) : 'Normal'
        
        return {
          task,
          urgency,
          days_from_today
        }
      })
      .sort((a, b) => {
        // Sort by urgency first, then by due date, then by creation time
        const urgencyOrder = ['Overdue', 'Soon', 'Next7', 'Next30', 'Normal']
        const urgencyDiff = urgencyOrder.indexOf(a.urgency) - urgencyOrder.indexOf(b.urgency)
        
        if (urgencyDiff !== 0) return urgencyDiff
        if (a.days_from_today !== b.days_from_today) return a.days_from_today - b.days_from_today
        
        return new Date(a.task.created_at).getTime() - new Date(b.task.created_at).getTime()
      })
  }

  // Get today's completed tasks
  const getTodayCompletedTasks = (): TaskWithUrgency[] => {
    const today = getTodayJST()
    
    return tasks
      .filter(task => 
        task.completed && 
        !task.archived &&
        task.completed_at === today
      )
      .map(task => {
        const days_from_today = task.due_date ? getDaysFromToday(task.due_date) : TIME_CONSTANTS.MAX_DAYS_FROM_TODAY_FALLBACK
        const urgency = task.due_date ? getUrgencyLevel(task.due_date) : 'Normal'
        
        return {
          task,
          urgency,
          days_from_today
        }
      })
      .sort((a, b) => {
        // Sort by completion order (recently completed first)
        return new Date(b.task.updated_at).getTime() - new Date(a.task.updated_at).getTime()
      })
  }

  // Get all completed tasks (for Done page)
  const getAllCompletedTasks = (): TaskWithUrgency[] => {
    return tasks
      .filter(task => task.completed && !task.archived)
      .map(task => {
        const days_from_today = task.due_date ? getDaysFromToday(task.due_date) : TIME_CONSTANTS.MAX_DAYS_FROM_TODAY_FALLBACK
        const urgency = task.due_date ? getUrgencyLevel(task.due_date) : 'Normal'
        
        return {
          task,
          urgency,
          days_from_today
        }
      })
      .sort((a, b) => {
        // Sort by completion date (newest first)
        if (a.task.completed_at && b.task.completed_at) {
          return b.task.completed_at.localeCompare(a.task.completed_at)
        }
        if (a.task.completed_at) return -1
        if (b.task.completed_at) return 1
        // Fallback to updated_at if no completed_at
        return new Date(b.task.updated_at).getTime() - new Date(a.task.updated_at).getTime()
      })
  }

  // Get upcoming tasks (all future tasks, not today)
  const getUpcomingTasks = (): TaskWithUrgency[] => {
    const today = getTodayJST()

    return tasks
      .filter(task =>
        !task.completed &&
        !task.archived &&
        (!task.snoozed_until || task.snoozed_until <= today) &&
        task.due_date &&
        task.due_date !== today &&
        getDaysFromToday(task.due_date) > 0
      )
      .map(task => {
        const days_from_today = getDaysFromToday(task.due_date!)
        const urgency = getUrgencyLevel(task.due_date!)
        
        return {
          task,
          urgency,
          days_from_today
        }
      })
      .sort((a, b) => a.days_from_today - b.days_from_today)
      .slice(0, 3) // Max 3 items for preview
  }

  // Get overdue tasks (past due date, not completed)
  const getOverdueTasks = (): TaskWithUrgency[] => {
    const today = getTodayJST()

    return tasks
      .filter(task =>
        !task.completed &&
        !task.archived &&
        (!task.snoozed_until || task.snoozed_until <= today) &&
        task.due_date &&
        task.due_date !== today &&
        getDaysFromToday(task.due_date) < 0 // 期日が過ぎているもの
      )
      .map(task => {
        const days_from_today = getDaysFromToday(task.due_date!)
        const urgency = getUrgencyLevel(task.due_date!)

        return {
          task,
          urgency,
          days_from_today
        }
      })
      .sort((a, b) => b.days_from_today - a.days_from_today) // Sort by overdue date descending (most recent overdue first)
  }

  // Complete a task
  const completeTask = async (taskId: string) => {
    await withErrorHandling(
      async () => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) throw new Error('タスクが見つかりません')

        await TasksApi.completeTask(taskId)
        await loadTasks(true) // 強制リフレッシュ
      },
      'useTasks.completeTask',
      setError
    )
  }

  // Uncomplete a task (mark as not completed)
  const uncompleteTask = async (taskId: string) => {
    await withErrorHandling(
      async () => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) throw new Error('タスクが見つかりません')

        await TasksApi.uncompleteTask(taskId)
        await loadTasks(true) // 強制リフレッシュ
      },
      'useTasks.uncompleteTask',
      setError
    )
  }

  // Quick move task
  const quickMoveTask = async (taskId: string, newDueDate: string) => {
    await withErrorHandling(
      async () => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) throw new Error('タスクが見つかりません')

        await TasksApi.updateTask(taskId, { due_date: newDueDate })
        await loadTasks(true) // 強制リフレッシュ
      },
      'useTasks.quickMoveTask',
      setError
    )
  }

  // Create a new task
  const createTask = async (
    title: string,
    memo?: string,
    dueDate?: string,
    category?: string,
    importance?: number,
    durationMin?: number,
    urls?: string[],
    _attachment?: {
      file_name: string
      file_type: string
      file_size: number
      file_data: string
    }
  ) => {
    await withErrorHandling(
      async () => {
        await TasksApi.createTask({
          title: title.trim(),
          memo: memo?.trim() || null,
          due_date: dueDate || getTodayJST(),
          category: category?.trim() || null,
          importance: importance || null,
          duration_min: durationMin || null,
          urls: urls || [],
          task_type: 'NORMAL',
          completed: false,
          archived: false,
        })
        await loadTasks(true) // 強制リフレッシュ
      },
      'useTasks.createTask',
      setError
    )
  }

  // Update an existing task
  const updateTask = async (taskId: string, updates: Partial<Pick<Task, 'title' | 'memo' | 'due_date' | 'category' | 'importance' | 'duration_min' | 'urls'>>) => {
    await withErrorHandling(
      async () => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) throw new Error('タスクが見つかりません')

        const cleanedUpdates = {
          ...updates,
          title: updates.title?.trim(),
          memo: updates.memo?.trim(),
          category: updates.category?.trim()
        }

        await TasksApi.updateTask(taskId, cleanedUpdates)
        await loadTasks(true) // 強制リフレッシュ
      },
      'useTasks.updateTask',
      setError
    )
  }

  // Delete a task
  const deleteTask = async (taskId: string) => {
    await withErrorHandling(
      async () => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) {
          throw new Error('タスクが見つかりません')
        }

        await TasksApi.deleteTask(taskId)
        await loadTasks(true) // 強制リフレッシュ
      },
      'useTasks.deleteTask',
      setError
    )
  }

  // Load tasks on component mount
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  return {
    tasks,
    allTasks: tasks, // 繰り越し機能用
    loading,
    error,
    getTodayTasks,
    getTodayCompletedTasks,
    getAllCompletedTasks,
    getUpcomingTasks,
    getOverdueTasks,
    completeTask,
    quickMoveTask,
    createTask,
    updateTask,
    deleteTask,
    uncompleteTask,
    reload: loadTasks
  }
}