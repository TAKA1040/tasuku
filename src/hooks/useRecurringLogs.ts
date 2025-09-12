'use client'

import { useState, useEffect, useCallback } from 'react'
import { db, STORE_NAMES } from '@/lib/db/database'
import type { RecurringLog } from '@/lib/db/schema'
import { getTodayJST } from '@/lib/utils/date-jst'

export function useRecurringLogs(isDbInitialized: boolean) {
  const [logs, setLogs] = useState<RecurringLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all logs
  const loadLogs = useCallback(async () => {
    if (!isDbInitialized) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const allLogs = await db.getAll<RecurringLog>(STORE_NAMES.RECURRING_LOGS)
      setLogs(allLogs)
      setError(null)
    } catch (err) {
      console.error('Failed to load recurring logs:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [isDbInitialized])

  // Add a completion log
  const addLog = async (recurringTaskId: string, date?: string) => {
    try {
      const logDate = date || getTodayJST()
      
      // Check if log already exists for this task and date
      const existingLog = logs.find(log => 
        log.recurring_id === recurringTaskId && log.date === logDate
      )
      
      if (existingLog) {
        console.log('Log already exists for this task and date')
        return existingLog
      }

      const newLog: RecurringLog = {
        recurring_id: recurringTaskId,
        date: logDate,
        logged_at: new Date().toISOString()
      }

      await db.put(STORE_NAMES.RECURRING_LOGS, newLog)
      await loadLogs() // Reload logs
      return newLog
    } catch (err) {
      console.error('Failed to add recurring log:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }

  // Remove a completion log
  const removeLog = async (recurringTaskId: string, date?: string) => {
    try {
      const logDate = date || getTodayJST()
      
      const existingLog = logs.find(log => 
        log.recurring_id === recurringTaskId && log.date === logDate
      )
      
      if (!existingLog) {
        console.log('No log found for this task and date')
        return
      }

      await db.delete(STORE_NAMES.RECURRING_LOGS, [recurringTaskId, logDate])
      await loadLogs() // Reload logs
    } catch (err) {
      console.error('Failed to remove recurring log:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }

  // Get logs for a specific recurring task
  const getLogsForTask = (recurringTaskId: string) => {
    return logs.filter(log => log.recurring_id === recurringTaskId)
      .sort((a, b) => b.date.localeCompare(a.date)) // Latest first
  }

  // Get logs for a specific date
  const getLogsForDate = (date: string) => {
    return logs.filter(log => log.date === date)
  }

  // Check if task is completed for a specific date
  const isTaskCompletedOnDate = (recurringTaskId: string, date: string) => {
    return logs.some(log => 
      log.recurring_id === recurringTaskId && log.date === date
    )
  }

  // Get current streak for a recurring task
  const getCurrentStreak = (recurringTaskId: string) => {
    const taskLogs = getLogsForTask(recurringTaskId)
    if (taskLogs.length === 0) return 0

    let streak = 0
    const today = getTodayJST()
    
    // Start from today and count backwards
    for (let i = 0; i < 365; i++) { // Maximum 1 year
      const checkDate = new Date()
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]
      
      const hasLog = taskLogs.some(log => log.date === dateStr)
      
      if (hasLog) {
        if (dateStr <= today) { // Only count if date is today or earlier
          streak++
        }
      } else {
        // Break if we find a day without completion (but allow for today if it's the first check)
        if (i > 0 || dateStr !== today) break
      }
    }

    return streak
  }

  // Load logs when database is initialized
  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  return {
    logs,
    loading,
    error,
    addLog,
    removeLog,
    getLogsForTask,
    getLogsForDate,
    isTaskCompletedOnDate,
    getCurrentStreak,
    reload: loadLogs
  }
}