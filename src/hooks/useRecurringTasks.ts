'use client'

// Recurring tasks management hook
import { useState, useEffect } from 'react'
import { db, STORE_NAMES } from '@/lib/db/database'
import { getTodayJST } from '@/lib/utils/date-jst'
import { occursOn, getRecurringDisplayName } from '@/lib/utils/recurring'
import type { RecurringTask, RecurringLog } from '@/lib/db/schema'

export interface RecurringTaskWithStatus {
  task: RecurringTask
  occursToday: boolean
  completedToday: boolean
  displayName: string
}

export function useRecurringTasks(isDbInitialized: boolean = false) {
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([])
  const [recurringLogs, setRecurringLogs] = useState<RecurringLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load recurring tasks and logs
  const loadRecurringData = async () => {
    if (!isDbInitialized) {
      console.log('Database not yet initialized, skipping recurring data loading')
      setLoading(false) // Important: Set loading to false even when not initialized
      return
    }
    
    try {
      setLoading(true)
      const [tasks, logs] = await Promise.all([
        db.getAll<RecurringTask>(STORE_NAMES.RECURRING_TASKS),
        db.getAll<RecurringLog>(STORE_NAMES.RECURRING_LOGS)
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
  }

  // Get today's recurring tasks with completion status
  const getTodayRecurringTasks = (): RecurringTaskWithStatus[] => {
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
      .filter(item => item.occursToday && !item.completedToday)
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
        console.log('Task already completed today')
        return
      }

      const newLog: RecurringLog = {
        recurring_id: taskId,
        date: today,
        logged_at: new Date().toISOString()
      }

      await db.put(STORE_NAMES.RECURRING_LOGS, newLog)
      await loadRecurringData() // Reload data
    } catch (err) {
      console.error('Failed to complete recurring task:', err)
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
    urls?: string[]
  ) => {
    try {
      const newRecurringTask: RecurringTask = {
        id: crypto.randomUUID(),
        title: title.trim(),
        memo: memo?.trim() || undefined,
        frequency,
        interval_n: intervalN,
        weekdays: frequency === 'WEEKLY' ? weekdays : undefined,
        month_day: frequency === 'MONTHLY' ? monthDay : undefined,
        importance: (importance as 1 | 2 | 3 | 4 | 5) || undefined,
        duration_min: durationMin || undefined,
        urls: urls || undefined,
        start_date: startDate || getTodayJST(),
        end_date: endDate,
        max_occurrences: undefined,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await db.put(STORE_NAMES.RECURRING_TASKS, newRecurringTask)
      await loadRecurringData() // Reload data
    } catch (err) {
      console.error('Failed to create recurring task:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Update a recurring task
  const updateRecurringTask = async (
    taskId: string,
    updates: Partial<Pick<RecurringTask, 'title' | 'memo' | 'frequency' | 'interval_n' | 'weekdays' | 'month_day' | 'start_date' | 'end_date' | 'active' | 'importance' | 'duration_min'>>
  ) => {
    try {
      const existingTask = recurringTasks.find(t => t.id === taskId)
      if (!existingTask) {
        throw new Error('Recurring task not found')
      }

      const updatedTask: RecurringTask = {
        ...existingTask,
        ...updates,
        updated_at: new Date().toISOString()
      }

      await db.put(STORE_NAMES.RECURRING_TASKS, updatedTask)
      await loadRecurringData()
    } catch (err) {
      console.error('Failed to update recurring task:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Delete a recurring task
  const deleteRecurringTask = async (taskId: string) => {
    try {
      await db.delete(STORE_NAMES.RECURRING_TASKS, taskId)
      
      // Also delete all associated logs
      const logsToDelete = recurringLogs.filter(log => log.recurring_id === taskId)
      for (const log of logsToDelete) {
        await db.delete(STORE_NAMES.RECURRING_LOGS, [log.recurring_id, log.date])
      }
      
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

      const updatedTask: RecurringTask = {
        ...existingTask,
        active: !existingTask.active,
        updated_at: new Date().toISOString()
      }

      await db.put(STORE_NAMES.RECURRING_TASKS, updatedTask)
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
    const today = getTodayJST()
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
  }, [isDbInitialized])

  return {
    recurringTasks,
    allRecurringTasks: recurringTasks, // 繰り越し機能用
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
    reload: loadRecurringData
  }
}