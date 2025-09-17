'use client'

// Tasks data management hook
import { useState, useEffect, useCallback } from 'react'
import { supabaseDb as db } from '@/lib/db/supabase-database'
import { getTodayJST, getDaysFromToday, getUrgencyLevel } from '@/lib/utils/date-jst'
import type { Task, TaskWithUrgency } from '@/lib/db/schema'
import { TIME_CONSTANTS } from '@/lib/constants'
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/messages'

export function useTasks(isDbInitialized: boolean = false) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load tasks from database
  const loadTasks = useCallback(async () => {
    if (!isDbInitialized) {
      console.log('Database not yet initialized, skipping task loading')
      setLoading(false) // Important: Set loading to false even when not initialized
      return
    }
    
    try {
      setLoading(true)
      const allTasks = await db.getAllTasks()
      setTasks(allTasks)
      setError(null)
    } catch (err) {
      console.error('Failed to load tasks:', err)
      // Handle authentication errors specifically
      if (err instanceof Error && err.message.includes('Authentication required')) {
        setError(ERROR_MESSAGES.AUTH_REQUIRED)
        // Redirect to login or handle auth error appropriately
      } else {
        setError(getErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }, [isDbInitialized])

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
        // Sort by order_index first (if set), then by urgency, then by due date, then by creation time
        const aOrder = a.task.order_index ?? 999999
        const bOrder = b.task.order_index ?? 999999

        if (aOrder !== bOrder) return aOrder - bOrder

        // Fallback to existing sorting logic
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
      .sort((a, b) => {
        // Sort by order_index first (if set), then by days from today
        const aOrder = a.task.order_index ?? 999999
        const bOrder = b.task.order_index ?? 999999

        if (aOrder !== bOrder) return aOrder - bOrder

        return a.days_from_today - b.days_from_today
      })
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
      .sort((a, b) => {
        // Sort by order_index first (if set), then by overdue date descending (most recent overdue first)
        const aOrder = a.task.order_index ?? 999999
        const bOrder = b.task.order_index ?? 999999

        if (aOrder !== bOrder) return aOrder - bOrder

        return b.days_from_today - a.days_from_today
      })
  }

  // Complete a task
  const completeTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) throw new Error(ERROR_MESSAGES.TASK_NOT_FOUND)

      await db.updateTask(taskId, { completed: true, completed_at: getTodayJST() })
      await loadTasks() // Reload tasks
    } catch (err) {
      console.error('Failed to complete task:', err)
      setError(getErrorMessage(err))
    }
  }

  // Uncomplete a task (mark as not completed)
  const uncompleteTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) throw new Error(ERROR_MESSAGES.TASK_NOT_FOUND)

      await db.updateTask(taskId, {
        completed: false,
        completed_at: undefined
      })
      await loadTasks() // Reload tasks
    } catch (err) {
      console.error('Failed to uncomplete task:', err)
      setError(getErrorMessage(err))
    }
  }

  // Quick move task
  const quickMoveTask = async (taskId: string, newDueDate: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) throw new Error(ERROR_MESSAGES.TASK_NOT_FOUND)

      await db.updateTask(taskId, { due_date: newDueDate })
      await loadTasks() // Reload tasks
    } catch (err) {
      console.error('Failed to move task:', err)
      setError(getErrorMessage(err))
    }
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
    attachment?: {
      file_name: string
      file_type: string
      file_size: number
      file_data: string
    }
  ) => {
    try {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: title.trim(),
        memo: memo?.trim() || undefined,
        due_date: dueDate || getTodayJST(),
        category: category?.trim() || undefined,
        importance: (importance as 1 | 2 | 3 | 4 | 5) || undefined,
        duration_min: durationMin || undefined,
        urls: urls || undefined,
        attachment: attachment || undefined,
        completed: false,
        archived: false,
        completed_at: undefined,
        snoozed_until: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('useTasks: Creating task with category:', category, '-> processed:', newTask.category)

      await db.createTask(newTask)
      await loadTasks() // Reload tasks
    } catch (err) {
      console.error('Failed to create task:', err)
      setError(getErrorMessage(err))
    }
  }

  // Update an existing task
  const updateTask = async (taskId: string, updates: Partial<Pick<Task, 'title' | 'memo' | 'due_date' | 'category' | 'importance' | 'duration_min' | 'urls'>>) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) throw new Error(ERROR_MESSAGES.TASK_NOT_FOUND)

      const cleanedUpdates = {
        ...updates,
        title: updates.title?.trim(),
        memo: updates.memo?.trim(),
        category: updates.category?.trim()
      }

      await db.updateTask(taskId, cleanedUpdates)
      await loadTasks() // Reload tasks
    } catch (err) {
      console.error('Failed to update task:', err)
      setError(getErrorMessage(err))
    }
  }

  // Delete a task
  const deleteTask = async (taskId: string) => {
    try {
      console.log('useTasks: deleteTask called with ID:', taskId)
      const task = tasks.find(t => t.id === taskId)
      if (!task) {
        console.error('useTasks: Task not found:', taskId)
        throw new Error(ERROR_MESSAGES.TASK_NOT_FOUND)
      }

      console.log('useTasks: Deleting task:', task.title)
      await db.deleteTask(taskId)
      console.log('useTasks: Task deleted successfully, reloading tasks...')
      await loadTasks() // Reload tasks
      console.log('useTasks: Tasks reloaded after deletion')
    } catch (err) {
      console.error('useTasks: Failed to delete task:', err)
      setError(getErrorMessage(err))
    }
  }

  // Load tasks when database is initialized or component mounts
  useEffect(() => {
    loadTasks()
  }, [isDbInitialized]) // Remove loadTasks from dependencies to prevent infinite loops

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