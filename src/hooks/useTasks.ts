'use client'

// Tasks data management hook
import { useState, useEffect, useCallback } from 'react'
import { supabaseDb as db } from '@/lib/db/supabase-database'
import { getTodayJST, getDaysFromToday, getUrgencyLevel } from '@/lib/utils/date-jst'
import type { Task, TaskWithUrgency } from '@/lib/db/schema'

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
      setError(err instanceof Error ? err.message : 'Unknown error')
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
        task.due_date === today
      )
      .map(task => {
        const days_from_today = task.due_date ? getDaysFromToday(task.due_date) : 999
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
        const days_from_today = task.due_date ? getDaysFromToday(task.due_date) : 999
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
        const days_from_today = task.due_date ? getDaysFromToday(task.due_date) : 999
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

  // Get upcoming tasks (within 7 days, not today)
  const getUpcomingTasks = (): TaskWithUrgency[] => {
    const today = getTodayJST()
    
    return tasks
      .filter(task => 
        !task.completed && 
        !task.archived &&
        (!task.snoozed_until || task.snoozed_until <= today) &&
        task.due_date &&
        task.due_date !== today &&
        getDaysFromToday(task.due_date) <= 7 &&
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

  // Complete a task
  const completeTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')

      await db.updateTask(taskId, { completed: true, completed_at: getTodayJST() })
      await loadTasks() // Reload tasks
    } catch (err) {
      console.error('Failed to complete task:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Quick move task
  const quickMoveTask = async (taskId: string, newDueDate: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')

      await db.updateTask(taskId, { due_date: newDueDate })
      await loadTasks() // Reload tasks
    } catch (err) {
      console.error('Failed to move task:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
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
    urls?: string[]
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
        completed: false,
        archived: false,
        completed_at: undefined,
        snoozed_until: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await db.createTask(newTask)
      await loadTasks() // Reload tasks
    } catch (err) {
      console.error('Failed to create task:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Update an existing task
  const updateTask = async (taskId: string, updates: Partial<Pick<Task, 'title' | 'memo' | 'due_date' | 'category' | 'importance' | 'duration_min' | 'urls'>>) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')

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
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Delete a task
  const deleteTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')

      await db.deleteTask(taskId)
      await loadTasks() // Reload tasks
    } catch (err) {
      console.error('Failed to delete task:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Load tasks when database is initialized or component mounts
  useEffect(() => {
    loadTasks()
  }, [isDbInitialized, loadTasks])

  return {
    tasks,
    allTasks: tasks, // 繰り越し機能用
    loading,
    error,
    getTodayTasks,
    getTodayCompletedTasks,
    getAllCompletedTasks,
    getUpcomingTasks,
    completeTask,
    quickMoveTask,
    createTask,
    updateTask,
    deleteTask,
    reload: loadTasks
  }
}