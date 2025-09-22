'use client'

// Unified Tasks data management hook
import { useState, useEffect, useCallback } from 'react'
import { supabaseDb as db } from '@/lib/db/supabase-database'
import { getTodayJST, getDaysFromToday, getUrgencyLevel } from '@/lib/utils/date-jst'
import type { UnifiedTask, TaskWithUrgency } from '@/lib/db/schema'
import { TIME_CONSTANTS } from '@/lib/constants'
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/messages'

export function useUnifiedTasks(isDbInitialized: boolean = false) {
  const [tasks, setTasks] = useState<UnifiedTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load tasks function
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      console.log('useUnifiedTasks: Starting to load tasks from database...')
      const allTasks = await db.getAllUnifiedTasks()
      console.log('useUnifiedTasks: Received tasks from database:', allTasks.length)
      if (allTasks.length > 0) {
        console.log('useUnifiedTasks: Sample task:', allTasks[0])
        console.log('useUnifiedTasks: Task types:', allTasks.map(t => t.task_type).join(', '))
      }
      setTasks(allTasks)
      setError(null)
      console.log(`Loaded ${allTasks.length} unified tasks`)
    } catch (err) {
      console.error('Failed to load unified tasks:', err)
      setTasks([])
      setError(null)
      console.log('Using empty task array due to database error (this is expected before migration)')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load tasks when database is initialized
  useEffect(() => {
    if (!isDbInitialized) {
      console.log('Database not yet initialized, skipping unified task loading')
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        const allTasks = await db.getAllUnifiedTasks()
        setTasks(allTasks)
        setError(null)
        console.log(`Loaded ${allTasks.length} unified tasks`)
      } catch (err) {
        console.error('Failed to load unified tasks:', err)
        setTasks([])
        setError(null)
        console.log('Using empty task array due to database error (this is expected before migration)')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isDbInitialized])

  // Helper function to convert UnifiedTask to old Task format
  const convertToOldTask = useCallback((unifiedTask: UnifiedTask) => {
    return {
      id: unifiedTask.id,
      title: unifiedTask.title,
      memo: unifiedTask.memo || '',
      due_date: unifiedTask.due_date || undefined,
      category: unifiedTask.category || '',
      importance: unifiedTask.importance || 1,
      duration_min: unifiedTask.duration_min || undefined,
      urls: unifiedTask.urls || undefined,
      attachment: unifiedTask.attachment || undefined,
      completed: unifiedTask.completed,
      archived: unifiedTask.archived || false,
      snoozed_until: unifiedTask.snoozed_until || undefined,
      created_at: unifiedTask.created_at,
      updated_at: unifiedTask.updated_at,
      completed_at: unifiedTask.completed_at || undefined
    }
  }, [])

  // Get today's tasks with urgency (ALL task types)
  const getTodayTasks = useCallback((): TaskWithUrgency[] => {
    const today = getTodayJST()

    return tasks
      .filter(task => {
        // 基本条件
        if (task.completed || task.archived) return false
        if (task.snoozed_until && task.snoozed_until > today) return false

        // タスクタイプ別の表示条件
        if (task.task_type === 'NORMAL') {
          // 通常タスク：今日期限のみ（期限なしは除外）
          return task.due_date === today
        }

        if (task.task_type === 'RECURRING') {
          // 繰り返しタスク：アクティブで、今日実行すべきもの
          return task.active !== false // TODO: 実際の繰り返しロジックを実装
        }

        // IDEAタイプは今日のタスクには表示しない
        return false
      })
      .map(task => {
        const days_from_today = task.due_date ? getDaysFromToday(task.due_date) : 0
        const urgency = task.due_date ? getUrgencyLevel(task.due_date) : 'Normal'
        return {
          task: convertToOldTask(task),
          urgency,
          days_from_today
        }
      })
      .sort((a, b) => {
        // 重要度順、期日順
        const importanceDiff = (a.task.importance || 3) - (b.task.importance || 3)
        if (importanceDiff !== 0) return importanceDiff
        return a.days_from_today - b.days_from_today
      })
  }, [tasks, convertToOldTask])

  // Get today's completed tasks
  const getTodayCompletedTasks = useCallback((): TaskWithUrgency[] => {
    const today = getTodayJST()

    return tasks
      .filter(task => {
        if (!task.completed || task.archived) return false
        if (task.task_type === 'IDEA') return false // IDEAタイプは除外

        // 今日完了したタスク
        return task.completed_at === today
      })
      .map(task => {
        const days_from_today = task.due_date ? getDaysFromToday(task.due_date) : 0
        const urgency = task.due_date ? getUrgencyLevel(task.due_date) : 'Normal'
        return {
          task: convertToOldTask(task),
          urgency,
          days_from_today
        }
      })
      .sort((a, b) => (a.task.importance || 3) - (b.task.importance || 3))
  }, [tasks, convertToOldTask])

  // Get all completed tasks
  const getAllCompletedTasks = useCallback((): TaskWithUrgency[] => {
    return tasks
      .filter(task => task.completed && !task.archived && task.task_type !== 'IDEA')
      .map(task => {
        const days_from_today = task.due_date ? getDaysFromToday(task.due_date) : TIME_CONSTANTS.MAX_DAYS_FROM_TODAY_FALLBACK
        const urgency = task.due_date ? getUrgencyLevel(task.due_date) : 'Normal'
        return {
          task: convertToOldTask(task),
          urgency,
          days_from_today
        }
      })
      .sort((a, b) => {
        // 完了日の新しい順
        if (a.task.completed_at && b.task.completed_at) {
          return b.task.completed_at.localeCompare(a.task.completed_at)
        }
        return a.days_from_today - b.days_from_today
      })
  }, [tasks, convertToOldTask])

  // Get upcoming tasks (7日以内)
  const getUpcomingTasks = useCallback((): TaskWithUrgency[] => {
    const today = getTodayJST()

    return tasks
      .filter(task => {
        if (task.completed || task.archived || task.task_type !== 'NORMAL') return false
        if (task.snoozed_until && task.snoozed_until > today) return false
        if (!task.due_date) return false

        const days = getDaysFromToday(task.due_date)
        return days > 0 && days <= 7
      })
      .map(task => {
        const days_from_today = getDaysFromToday(task.due_date!)
        const urgency = getUrgencyLevel(task.due_date!)
        return {
          task: convertToOldTask(task),
          urgency,
          days_from_today
        }
      })
      .sort((a, b) => a.days_from_today - b.days_from_today) // 近い順
  }, [tasks, convertToOldTask])

  // Get active recurring tasks
  const getActiveRecurringTasks = useCallback(() => {
    return tasks
      .filter(task => task.task_type === 'RECURRING' && task.active !== false && !task.archived)
      .map(task => ({
        id: task.id,
        title: task.title,
        memo: task.memo || '',
        frequency: task.frequency || 'DAILY',
        interval_n: task.interval_n || 1,
        weekdays: task.weekdays || undefined,
        month_day: task.month_day || undefined,
        year_month: task.year_month || undefined,
        year_day: task.year_day || undefined,
        importance: task.importance || 1,
        duration_min: task.duration_min || undefined,
        urls: task.urls || undefined,
        category: task.category || '',
        attachment: task.attachment || undefined,
        active: task.active !== false,
        created_at: task.created_at,
        updated_at: task.updated_at
      }))
  }, [tasks])

  // Get ideas
  const getIdeas = useCallback(() => {
    const ideaTasks = tasks.filter(task => task.task_type === 'IDEA' && !task.archived)
    console.log('getIdeas: found', ideaTasks.length, 'IDEA tasks from', tasks.length, 'total tasks')
    if (ideaTasks.length > 0) {
      console.log('Sample idea task:', ideaTasks[0])
    }
    return ideaTasks
      .map(task => ({
        id: task.id,
        text: task.title,
        completed: task.completed,
        createdAt: task.created_at,
        category: task.category,
        importance: task.importance
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [tasks])

  // Get today's recurring tasks
  const getTodayRecurringTasks = useCallback(() => {
    // TODO: 実際の繰り返しロジックを実装
    return []
  }, [])

  // Get today's completed recurring tasks
  const getTodayCompletedRecurringTasks = useCallback(() => {
    // TODO: 実際の繰り返しロジックを実装
    return []
  }, [])

  // Get upcoming recurring tasks
  const getUpcomingRecurringTasks = useCallback(() => {
    // TODO: 実際の繰り返しロジックを実装
    return []
  }, [])

  // Get today due tasks
  const getTodayDueTasks = useCallback((): TaskWithUrgency[] => {
    const today = getTodayJST()

    return tasks
      .filter(task => {
        if (task.completed || task.archived || task.task_type !== 'NORMAL') return false
        if (task.snoozed_until && task.snoozed_until > today) return false
        return task.due_date === today
      })
      .map(task => {
        const urgency = getUrgencyLevel(task.due_date!)
        return {
          task: convertToOldTask(task),
          urgency,
          days_from_today: 0
        }
      })
      .sort((a, b) => (a.task.importance || 3) - (b.task.importance || 3))
  }, [tasks, convertToOldTask])

  // Get overdue tasks
  const getOverdueTasks = useCallback((): TaskWithUrgency[] => {
    const today = getTodayJST()
    const allFilteredTasks = tasks.filter(task =>
      task.task_type === 'NORMAL' &&  // Added this filter
      !task.completed &&
      !task.archived &&
      task.due_date &&
      task.due_date < today &&
      (!task.snoozed_until || task.snoozed_until <= today)
    )

    // console.log(`[getOverdueTasks] Today: ${today}, Found ${allFilteredTasks.length} overdue tasks:`, allFilteredTasks)

    return allFilteredTasks.map(task => {
      const days_from_today = getDaysFromToday(task.due_date!)
      const urgency = getUrgencyLevel(task.due_date!)
      return {
        task: convertToOldTask(task),
        urgency,
        days_from_today
      }
    }).sort((a, b) => a.days_from_today - b.days_from_today)
  }, [tasks, convertToOldTask])

  // Get upcoming week tasks
  const getUpcomingWeekTasks = useCallback((): TaskWithUrgency[] => {
    const today = getTodayJST()

    return tasks
      .filter(task => {
        if (task.completed || task.archived || task.task_type !== 'NORMAL') return false
        if (task.snoozed_until && task.snoozed_until > today) return false
        if (!task.due_date) return false

        const days = getDaysFromToday(task.due_date)
        return days > 0 && days <= 7
      })
      .map(task => {
        const days_from_today = getDaysFromToday(task.due_date!)
        const urgency = getUrgencyLevel(task.due_date!)
        return {
          task: convertToOldTask(task),
          urgency,
          days_from_today
        }
      })
      .sort((a, b) => a.days_from_today - b.days_from_today) // 近い順
  }, [tasks, convertToOldTask])

  // 買い物のタスク（カテゴリが買い物）
  const getShoppingTasks = useCallback((): TaskWithUrgency[] => {
    return tasks
      .filter(task =>
        !task.completed &&
        !task.archived &&
        task.category === '買い物' &&
        (!task.snoozed_until || task.snoozed_until <= getTodayJST()) &&
        (task.task_type === 'NORMAL' || task.task_type === 'IDEA' || task.task_type === 'RECURRING')
      )
      .map(task => {
        const days_from_today = task.due_date ? getDaysFromToday(task.due_date) : TIME_CONSTANTS.MAX_DAYS_FROM_TODAY_FALLBACK
        const urgency = task.due_date ? getUrgencyLevel(task.due_date) : 'Normal'
        return {
          task: convertToOldTask(task),
          urgency,
          days_from_today
        }
      })
      .sort((a, b) => {
        // 期限あり → 期限なし → 重要度順
        if (a.task.due_date && !b.task.due_date) return -1
        if (!a.task.due_date && b.task.due_date) return 1
        if (a.task.due_date && b.task.due_date) return a.days_from_today - b.days_from_today
        return (a.task.importance || 3) - (b.task.importance || 3)
      })
  }, [tasks, convertToOldTask])

  // やることリスト（繰り返しタスク + 期限なしタスク）
  const getTodoListTasks = useCallback((): TaskWithUrgency[] => {
    return tasks
      .filter(task =>
        !task.completed &&
        !task.archived &&
        (
          (task.task_type === 'RECURRING' && task.active !== false) ||
          (task.task_type === 'NORMAL' && !task.due_date) ||
          task.task_type === 'IDEA'
        ) &&
        (!task.snoozed_until || task.snoozed_until <= getTodayJST())
      )
      .map(task => ({
        task: convertToOldTask(task),
        urgency: 'Normal' as const,
        days_from_today: TIME_CONSTANTS.MAX_DAYS_FROM_TODAY_FALLBACK
      }))
      .sort((a, b) => {
        // 重要度順
        return (a.task.importance || 3) - (b.task.importance || 3)
      })
  }, [tasks, convertToOldTask])

  // 期限の決まっていないタスク（NORMAL かつ期限なし）
  const getNoDateTasks = useCallback((): TaskWithUrgency[] => {
    return tasks
      .filter(task =>
        task.task_type === 'NORMAL' &&
        !task.completed &&
        !task.archived &&
        !task.due_date &&
        (!task.snoozed_until || task.snoozed_until <= getTodayJST())
      )
      .map(task => ({
        task: convertToOldTask(task),
        urgency: 'Normal' as const,
        days_from_today: TIME_CONSTANTS.MAX_DAYS_FROM_TODAY_FALLBACK
      }))
      .sort((a, b) => (a.task.importance || 3) - (b.task.importance || 3))
  }, [tasks, convertToOldTask])

  // Task creation
  const createTask = async (
    title: string,
    memo: string = '',
    dueDate?: string,
    category?: string,
    importance: number = 1,
    durationMin?: number,
    urls?: string[],
    attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }
  ) => {
    try {
      const task_type = dueDate && dueDate.trim() ? 'NORMAL' : 'IDEA'

      await db.createUnifiedTask({
        title: title.trim(),
        memo: memo.trim(),
        due_date: dueDate && dueDate.trim() ? dueDate.trim() : undefined,
        task_type,
        category: category || '',
        importance,
        duration_min: durationMin,
        urls,
        attachment
      })
      await loadTasks()
    } catch (err) {
      console.error('Failed to create task:', err)
      setError(getErrorMessage(err))
    }
  }

  // Task completion
  const completeTask = async (taskId: string) => {
    try {
      await db.updateUnifiedTask(taskId, {
        completed: true,
        completed_at: getTodayJST()
      })
      await loadTasks()
    } catch (err) {
      console.error('Failed to complete task:', err)
      setError(getErrorMessage(err))
    }
  }

  // Task uncompletion
  const uncompleteTask = async (taskId: string) => {
    try {
      await db.updateUnifiedTask(taskId, {
        completed: false,
        completed_at: undefined
      })
      await loadTasks()
    } catch (err) {
      console.error('Failed to uncomplete task:', err)
      setError(getErrorMessage(err))
    }
  }

  // Task update
  const updateTask = async (taskId: string, updates: any) => {
    try {
      await db.updateUnifiedTask(taskId, updates)
      await loadTasks()
    } catch (err) {
      console.error('Failed to update task:', err)
      setError(getErrorMessage(err))
    }
  }

  // Task deletion
  const deleteTask = async (taskId: string) => {
    try {
      await db.deleteUnifiedTask(taskId)
      await loadTasks()
    } catch (err) {
      console.error('Failed to delete task:', err)
      setError(getErrorMessage(err))
    }
  }

  // Recurring task functions
  const createRecurringTask = async (
    title: string,
    memo: string = '',
    frequency: 'DAILY' | 'INTERVAL_DAYS' | 'WEEKLY' | 'MONTHLY',
    intervalN: number = 1,
    weekdays?: number[],
    monthDay?: number,
    yearMonth?: number,
    yearDay?: number,
    importance: number = 1,
    durationMin?: number,
    urls?: string[],
    category?: string,
    attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }
  ) => {
    try {
      await db.createUnifiedTask({
        title: title.trim(),
        memo: memo.trim(),
        task_type: 'RECURRING',
        frequency,
        interval_n: intervalN,
        weekdays,
        month_day: monthDay,
        year_month: yearMonth,
        year_day: yearDay,
        importance,
        duration_min: durationMin,
        urls,
        category: category || '',
        attachment,
        active: true
      })
      await loadTasks()
    } catch (err) {
      console.error('Failed to create recurring task:', err)
      setError(getErrorMessage(err))
    }
  }

  const completeRecurringTask = async (taskId: string, date: string) => {
    // TODO: 実装
    console.log('Complete recurring task:', taskId, date)
  }

  const uncompleteRecurringTask = async (taskId: string, date: string) => {
    // TODO: 実装
    console.log('Uncomplete recurring task:', taskId, date)
  }

  const updateRecurringTask = async (taskId: string, updates: any) => {
    try {
      await db.updateUnifiedTask(taskId, updates)
      await loadTasks()
    } catch (err) {
      console.error('Failed to update recurring task:', err)
      setError(getErrorMessage(err))
    }
  }

  const deleteRecurringTask = async (taskId: string) => {
    try {
      await db.deleteUnifiedTask(taskId)
      await loadTasks()
    } catch (err) {
      console.error('Failed to delete recurring task:', err)
      setError(getErrorMessage(err))
    }
  }

  // Idea functions
  const addIdea = async (text: string, category?: string, importance?: number) => {
    try {
      await db.createUnifiedTask({
        title: text.trim(),
        memo: '',
        task_type: 'IDEA',
        category: category || '',
        importance: importance || 1
      })
      await loadTasks()
    } catch (err) {
      console.error('Failed to add idea:', err)
      setError(getErrorMessage(err))
    }
  }

  const toggleIdea = async (ideaId: string) => {
    try {
      const idea = tasks.find(t => t.id === ideaId)
      if (idea) {
        await db.updateUnifiedTask(ideaId, {
          completed: !idea.completed,
          completed_at: !idea.completed ? getTodayJST() : undefined
        })
        await loadTasks()
      }
    } catch (err) {
      console.error('Failed to toggle idea:', err)
      setError(getErrorMessage(err))
    }
  }

  const editIdea = async (ideaId: string, text: string) => {
    try {
      await db.updateUnifiedTask(ideaId, {
        title: text.trim()
      })
      await loadTasks()
    } catch (err) {
      console.error('Failed to edit idea:', err)
      setError(getErrorMessage(err))
    }
  }

  const deleteIdea = async (ideaId: string) => {
    try {
      await db.deleteUnifiedTask(ideaId)
      await loadTasks()
    } catch (err) {
      console.error('Failed to delete idea:', err)
      setError(getErrorMessage(err))
    }
  }

  return {
    tasks: tasks.filter(task => task.task_type === 'NORMAL').map(convertToOldTask),
    allTasks: tasks.filter(task => task.task_type === 'NORMAL').map(convertToOldTask),
    allUnifiedTasks: tasks, // All unified tasks for internal operations
    recurringTasks: getActiveRecurringTasks(),
    allRecurringTasks: getActiveRecurringTasks(), // Add this for compatibility
    ideas: getIdeas(),
    loading,
    error,

    // 既存の関数
    getTodayTasks,
    getTodayCompletedTasks,
    getAllCompletedTasks,
    getUpcomingTasks,
    getActiveRecurringTasks,
    getTodayRecurringTasks,
    getTodayCompletedRecurringTasks,
    getUpcomingRecurringTasks,
    getTodayDueTasks,
    getOverdueTasks,
    getUpcomingWeekTasks,
    getShoppingTasks,
    getTodoListTasks,
    getNoDateTasks,

    // CRUD operations
    createTask,
    completeTask,
    uncompleteTask,
    updateTask,
    deleteTask,

    // Recurring task operations
    createRecurringTask,
    completeRecurringTask,
    uncompleteRecurringTask,
    updateRecurringTask,
    deleteRecurringTask,

    // Idea operations
    addIdea,
    toggleIdea,
    editIdea,
    deleteIdea,

    // Utility
    reload: loadTasks
  }
}