'use client'

// Recurring tasks management hook
import { useState, useEffect, useCallback } from 'react'
import { supabaseDb as db } from '@/lib/db/supabase-database'
import { getTodayJST } from '@/lib/utils/date-jst'
import { occursOn, getRecurringDisplayName } from '@/lib/utils/recurring'
import type { RecurringTask, RecurringLog } from '@/lib/db/schema'
import { TIME_CONSTANTS } from '@/lib/constants'

export interface RecurringTaskWithStatus {
  task: RecurringTask
  occursToday: boolean
  completedToday: boolean
  displayName: string
  overdueDate?: string
}

export function useRecurringTasks(isDbInitialized: boolean = false) {
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([])
  const [recurringLogs, setRecurringLogs] = useState<RecurringLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load recurring tasks and logs
  const loadRecurringData = useCallback(async () => {
    if (!isDbInitialized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Database not yet initialized, skipping recurring data loading')
      }
      setLoading(false) // Important: Set loading to false even when not initialized
      return
    }
    
    try {
      setLoading(true)
      const [tasks, logs] = await Promise.all([
        db.getAllRecurringTasks(),
        db.getAllRecurringLogs()
      ])
      
      setRecurringTasks(tasks)
      setRecurringLogs(logs)
      setError(null)
    } catch (err) {
      console.error('Failed to load recurring data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [isDbInitialized])

  // Get today's recurring tasks with completion status (including yesterday for daily tasks)
  const getTodayRecurringTasks = (): RecurringTaskWithStatus[] => {
    const today = getTodayJST()
    const yesterday = new Date(new Date(today + 'T00:00:00').getTime() - TIME_CONSTANTS.MILLISECONDS_PER_DAY)
      .toISOString().split('T')[0]

    const allItems: RecurringTaskWithStatus[] = []

    recurringTasks
      .filter(task => task.active)
      .forEach(task => {
        // Today's tasks
        const occursToday = occursOn(today, task)
        const completedToday = recurringLogs.some(
          log => log.recurring_id === task.id && log.date === today
        )

        if (occursToday && !completedToday) {
          allItems.push({
            task,
            occursToday: true,
            completedToday: false,
            displayName: getRecurringDisplayName(task)
          })
        }

        // Yesterday's daily tasks (only if uncompleted and task is daily)
        if (task.frequency === 'DAILY') {
          const occursYesterday = occursOn(yesterday, task)
          const completedYesterday = recurringLogs.some(
            log => log.recurring_id === task.id && log.date === yesterday
          )

          if (occursYesterday && !completedYesterday && !completedToday) {
            // Only add if not already added for today
            const alreadyAdded = allItems.some(item => item.task.id === task.id)
            if (!alreadyAdded) {
              allItems.push({
                task,
                occursToday: false, // This is yesterday's task
                completedToday: false,
                displayName: getRecurringDisplayName(task) + ' (前日分)',
                overdueDate: yesterday
              })
            }
          }
        }
      })

    return allItems
  }

  // Get today's completed recurring tasks
  const getTodayCompletedRecurringTasks = (): RecurringTaskWithStatus[] => {
    const today = getTodayJST()
    
    return recurringTasks
      .filter(task => task.active)
      .map(task => {
        const occursToday = occursOn(today, task)
        const completedToday = recurringLogs.some(
          log => log.recurring_id === task.id && log.date === today
        )
        
        return {
          task,
          occursToday,
          completedToday,
          displayName: getRecurringDisplayName(task)
        }
      })
      .filter(item => item.occursToday && item.completedToday)
      .sort((a, b) => {
        // Sort by completion order (recently completed first)
        const aLog = recurringLogs.find(log => log.recurring_id === a.task.id && log.date === today)
        const bLog = recurringLogs.find(log => log.recurring_id === b.task.id && log.date === today)
        
        if (!aLog || !bLog) return 0
        return new Date(bLog.logged_at).getTime() - new Date(aLog.logged_at).getTime()
      })
  }

  // Complete a recurring task for today
  const completeRecurringTask = async (taskId: string) => {
    try {
      const today = getTodayJST()
      
      // Check if already completed today
      const existingLog = recurringLogs.find(
        log => log.recurring_id === taskId && log.date === today
      )
      
      if (existingLog) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Task already completed today')
        }
        return
      }

      await db.logRecurringTask(taskId, today)
      await loadRecurringData() // Reload data
    } catch (err) {
      console.error('Failed to complete recurring task:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Uncomplete a recurring task
  const uncompleteRecurringTask = async (taskId: string) => {
    try {
      const todayJST = getTodayJST()

      // Find today's log in the already loaded recurringLogs
      const todayLog = recurringLogs.find(
        log => log.recurring_id === taskId && log.date === todayJST
      )

      if (todayLog) {
        // Delete the completion log using database function
        await db.deleteRecurringLog(taskId, todayJST)
        await loadRecurringData()
      }
    } catch (err) {
      console.error('Failed to uncomplete recurring task:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Create a new recurring task
  const createRecurringTask = async (
    title: string,
    memo?: string,
    frequency: 'DAILY' | 'INTERVAL_DAYS' | 'WEEKLY' | 'MONTHLY' = 'DAILY',
    intervalN: number = 1,
    weekdays?: number[],
    monthDay?: number,
    startDate?: string,
    endDate?: string,
    importance?: number,
    durationMin?: number,
    urls?: string[],
    category?: string,
    attachment?: {
      file_name: string
      file_type: string
      file_size: number
      file_data: string
    }
  ) => {
    try {
      const newRecurringTask: RecurringTask = {
        id: crypto.randomUUID(),
        title: title.trim(),
        memo: memo?.trim() || undefined,
        category: category?.trim() || undefined,
        frequency,
        interval_n: intervalN,
        weekdays: frequency === 'WEEKLY' ? weekdays : undefined,
        month_day: frequency === 'MONTHLY' ? monthDay : undefined,
        importance: (importance as 1 | 2 | 3 | 4 | 5) || undefined,
        duration_min: durationMin || undefined,
        urls: urls || undefined,
        attachment: attachment || undefined,
        start_date: startDate || getTodayJST(),
        end_date: endDate,
        max_occurrences: undefined,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('useRecurringTasks: Creating recurring task with category:', category, '-> processed:', newRecurringTask.category)
      }

      await db.createRecurringTask(newRecurringTask)
      await loadRecurringData() // Reload data
    } catch (err) {
      console.error('Failed to create recurring task:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Update a recurring task
  const updateRecurringTask = async (
    taskId: string,
    updates: Partial<Pick<RecurringTask, 'title' | 'memo' | 'frequency' | 'interval_n' | 'weekdays' | 'month_day' | 'start_date' | 'end_date' | 'active' | 'importance' | 'duration_min' | 'category' | 'urls'>>
  ) => {
    try {
      const existingTask = recurringTasks.find(t => t.id === taskId)
      if (!existingTask) {
        throw new Error('Recurring task not found')
      }

      await db.updateRecurringTask(taskId, updates)
      await loadRecurringData()
    } catch (err) {
      console.error('Failed to update recurring task:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Delete a recurring task
  const deleteRecurringTask = async (taskId: string) => {
    try {
      await db.deleteRecurringTask(taskId)
      
      // Logs will be automatically deleted due to CASCADE constraint
      
      await loadRecurringData()
    } catch (err) {
      console.error('Failed to delete recurring task:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Toggle recurring task active status
  const toggleRecurringTaskActive = async (taskId: string) => {
    try {
      const existingTask = recurringTasks.find(t => t.id === taskId)
      if (!existingTask) {
        throw new Error('Recurring task not found')
      }

      await db.updateRecurringTask(taskId, { active: !existingTask.active })
      await loadRecurringData()
    } catch (err) {
      console.error('Failed to toggle recurring task:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Get upcoming recurring tasks (next 7 days)
  const getUpcomingRecurringTasks = (): Array<{
    task: RecurringTask
    nextDate: string
    daysFromToday: number
  }> => {
    const result = []
    
    for (const task of recurringTasks.filter(t => t.active)) {
      // Check next 7 days for occurrence
      for (let i = 1; i <= 7; i++) {
        const checkDate = new Date()
        checkDate.setDate(checkDate.getDate() + i)
        const checkDateStr = checkDate.toLocaleDateString('ja-CA')
        
        if (occursOn(checkDateStr, task)) {
          // Check if already completed on that date
          const isCompleted = recurringLogs.some(
            log => log.recurring_id === task.id && log.date === checkDateStr
          )
          
          if (!isCompleted) {
            result.push({
              task,
              nextDate: checkDateStr,
              daysFromToday: i
            })
            break // Only get the next occurrence
          }
        }
      }
    }
    
    return result.sort((a, b) => a.daysFromToday - b.daysFromToday).slice(0, 3)
  }

  // Load data when database is initialized or component mounts
  useEffect(() => {
    loadRecurringData()
  }, [isDbInitialized, loadRecurringData])

  return {
    recurringTasks,
    allRecurringTasks: recurringTasks, // 繰り越し機能用
    recurringLogs,
    loading,
    error,
    getTodayRecurringTasks,
    getTodayCompletedRecurringTasks,
    getUpcomingRecurringTasks,
    completeRecurringTask,
    createRecurringTask,
    updateRecurringTask,
    deleteRecurringTask,
    toggleRecurringTaskActive,
    uncompleteRecurringTask,
    reload: loadRecurringData
  }
}