'use client'

import { useState, useEffect, useCallback } from 'react'
import { CompletionTracker, type RecurringCompletionStats, type CompletionRecord } from '@/lib/services/completion-tracker'
import { getTodayJST } from '@/lib/utils/date-jst'
import type { UnifiedTask } from '@/lib/types/unified-task'

export interface UseCompletionTrackerReturn {
  // 完了記録データ
  completions: CompletionRecord[]
  recurringStats: Map<string, RecurringCompletionStats>
  loading: boolean
  error: string | null

  // 完了記録操作
  recordCompletion: (task: UnifiedTask, date?: string) => Promise<void>
  removeCompletion: (taskId: string, date?: string) => Promise<void>

  // 状態確認
  isCompletedToday: (taskId: string) => boolean
  isCompletedOnDate: (taskId: string, date: string) => boolean
  getStreak: (taskId: string) => number
  getCompletionDates: (taskId: string) => string[]

  // データ更新
  refresh: () => Promise<void>
  refreshRecurringStats: (taskIds: string[]) => Promise<void>
}

export function useCompletionTracker(
  isDbInitialized: boolean = false,
  recurringTaskIds: string[] = []
): UseCompletionTrackerReturn {
  const [completions, setCompletions] = useState<CompletionRecord[]>([])
  const [recurringStats, setRecurringStats] = useState<Map<string, RecurringCompletionStats>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ===================================
  // データ読み込み
  // ===================================

  const loadTodayCompletions = useCallback(async () => {
    if (!isDbInitialized) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const today = getTodayJST()
      const todayCompletions = await CompletionTracker.getCompletionsForDate(today)
      setCompletions(todayCompletions)
      setError(null)
    } catch (err) {
      console.error('Failed to load today completions:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [isDbInitialized])

  const loadRecurringStats = useCallback(async (taskIds: string[]) => {
    if (!isDbInitialized || taskIds.length === 0) return

    try {
      const stats = await CompletionTracker.getBulkRecurringStats(taskIds)
      const statsMap = new Map<string, RecurringCompletionStats>()
      stats.forEach(stat => {
        statsMap.set(stat.taskId, stat)
      })
      setRecurringStats(statsMap)
    } catch (err) {
      console.error('Failed to load recurring stats:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [isDbInitialized])

  // ===================================
  // 完了記録操作
  // ===================================

  const recordCompletion = useCallback(async (task: UnifiedTask, date?: string) => {
    try {
      await CompletionTracker.recordCompletion(task, date)

      // データを再読み込み
      await loadTodayCompletions()

      // 繰り返しタスクの場合、統計も更新
      if (task.task_type === 'RECURRING') {
        await loadRecurringStats([task.id])
      }
    } catch (err) {
      console.error('Failed to record completion:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }, [loadTodayCompletions, loadRecurringStats])

  const removeCompletion = useCallback(async (taskId: string, date?: string) => {
    try {
      await CompletionTracker.removeCompletion(taskId, date)

      // データを再読み込み
      await loadTodayCompletions()

      // 繰り返しタスクの統計も更新
      await loadRecurringStats([taskId])
    } catch (err) {
      console.error('Failed to remove completion:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }, [loadTodayCompletions, loadRecurringStats])

  // ===================================
  // 状態確認ヘルパー
  // ===================================

  const isCompletedToday = useCallback((taskId: string): boolean => {
    const today = getTodayJST()
    return completions.some(c => c.original_task_id === taskId && c.completion_date === today)
  }, [completions])

  const isCompletedOnDate = useCallback((taskId: string, date: string): boolean => {
    return completions.some(c => c.original_task_id === taskId && c.completion_date === date)
  }, [completions])

  const getStreak = useCallback((taskId: string): number => {
    const stats = recurringStats.get(taskId)
    return stats?.currentStreak || 0
  }, [recurringStats])

  const getCompletionDates = useCallback((taskId: string): string[] => {
    const stats = recurringStats.get(taskId)
    return stats?.completionDates || []
  }, [recurringStats])

  // ===================================
  // データ更新
  // ===================================

  const refresh = useCallback(async () => {
    await loadTodayCompletions()
    if (recurringTaskIds.length > 0) {
      await loadRecurringStats(recurringTaskIds)
    }
  }, [loadTodayCompletions, loadRecurringStats, recurringTaskIds])

  const refreshRecurringStats = useCallback(async (taskIds: string[]) => {
    await loadRecurringStats(taskIds)
  }, [loadRecurringStats])

  // ===================================
  // Effect: 初期データ読み込み
  // ===================================

  useEffect(() => {
    loadTodayCompletions()
  }, [loadTodayCompletions])

  useEffect(() => {
    if (recurringTaskIds.length > 0) {
      loadRecurringStats(recurringTaskIds)
    }
  }, [loadRecurringStats, recurringTaskIds])

  return {
    // データ
    completions,
    recurringStats,
    loading,
    error,

    // 操作
    recordCompletion,
    removeCompletion,

    // 状態確認
    isCompletedToday,
    isCompletedOnDate,
    getStreak,
    getCompletionDates,

    // データ更新
    refresh,
    refreshRecurringStats
  }
}

// ===================================
// レガシーuseRecurringLogsとの互換性ヘルパー
// ===================================

/**
 * 旧useRecurringLogsと同じインターフェースを提供する互換レイヤー
 */
export function useRecurringLogsCompat(isDbInitialized: boolean) {
  const tracker = useCompletionTracker(isDbInitialized)

  // 旧インターフェースに合わせた関数
  const addLog = async (recurringTaskId: string, date?: string) => {
    // 仮のタスクオブジェクトを作成（実際の使用時は適切なタスクを渡す）
    const fakeTask = {
      id: recurringTaskId,
      title: 'Legacy Task',
      task_type: 'RECURRING' as const
    }
    await tracker.recordCompletion(fakeTask as UnifiedTask, date)
  }

  const removeLog = async (recurringTaskId: string, date?: string) => {
    await tracker.removeCompletion(recurringTaskId, date)
  }

  const isTaskCompletedOnDate = (recurringTaskId: string, date: string) => {
    return tracker.isCompletedOnDate(recurringTaskId, date)
  }

  const getCurrentStreak = (recurringTaskId: string) => {
    return tracker.getStreak(recurringTaskId)
  }

  const getLogsForTask = (recurringTaskId: string) => {
    const dates = tracker.getCompletionDates(recurringTaskId)
    return dates.map(date => ({
      recurring_id: recurringTaskId,
      date,
      logged_at: new Date().toISOString() // 仮の値
    }))
  }

  const getLogsForDate = (date: string) => {
    return tracker.completions
      .filter(c => c.completion_date === date)
      .map(c => ({
        recurring_id: c.original_task_id,
        date: c.completion_date,
        logged_at: c.completion_time
      }))
  }

  return {
    logs: [], // レガシー互換性のため空配列
    loading: tracker.loading,
    error: tracker.error,
    addLog,
    removeLog,
    getLogsForTask,
    getLogsForDate,
    isTaskCompletedOnDate,
    getCurrentStreak,
    reload: tracker.refresh
  }
}