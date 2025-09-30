'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'
import { useCompletionTracker } from '@/hooks/useCompletionTracker'
import { getTodayJST } from '@/lib/utils/date-jst'
import type { UnifiedTask } from '@/lib/types/unified-task'

export interface UnifiedRecurringTaskWithStatus {
  task: UnifiedTask
  occursToday: boolean
  completedToday: boolean
  currentStreak: number
  totalCompletions: number
  lastCompletedDate?: string
  displayName: string
}

export interface UseUnifiedRecurringTasksReturn {
  // データ
  recurringTasks: UnifiedRecurringTaskWithStatus[]
  todayRecurringTasks: UnifiedRecurringTaskWithStatus[]
  completedRecurringTasks: UnifiedRecurringTaskWithStatus[]
  loading: boolean
  error: string | null

  // 操作
  completeRecurringTask: (taskId: string, date?: string) => Promise<void>
  uncompleteRecurringTask: (taskId: string, date?: string) => Promise<void>

  // データ更新
  refresh: () => Promise<void>
}

/**
 * 新システム: unified_tasksベースの繰り返しタスク管理
 * 旧useRecurringTasksの機能をunified_tasks + CompletionTrackerで実現
 */
export function useUnifiedRecurringTasks(
  isDbInitialized: boolean = false
): UseUnifiedRecurringTasksReturn {
  const unifiedTasks = useUnifiedTasks(isDbInitialized)

  // 繰り返しタスクのIDリストを取得
  const recurringTaskIds = useMemo(() => {
    return unifiedTasks.tasks
      .filter(task => task.task_type === 'RECURRING')
      .map(task => task.id)
  }, [unifiedTasks.tasks])

  const completionTracker = useCompletionTracker(isDbInitialized, recurringTaskIds)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ===================================
  // 繰り返しタスクの状態計算
  // ===================================

  const recurringTasksWithStatus = useMemo(() => {
    return unifiedTasks.tasks
      .filter(task => task.task_type === 'RECURRING')
      .map(task => {
        const stats = completionTracker.recurringStats.get(task.id)

        // 今日発生するかチェック（簡易実装、実際は繰り返しパターンを見る）
        const occursToday = shouldOccurToday(task)

        const completedToday = completionTracker.isCompletedToday(task.id)

        return {
          task,
          occursToday,
          completedToday,
          currentStreak: stats?.currentStreak || 0,
          totalCompletions: stats?.totalCompletions || 0,
          lastCompletedDate: stats?.lastCompletedDate,
          displayName: getDisplayName(task)
        }
      })
  }, [unifiedTasks.tasks, completionTracker])

  // 今日の繰り返しタスク
  const todayRecurringTasks = useMemo(() => {
    return recurringTasksWithStatus.filter(rt =>
      rt.occursToday && !rt.completedToday
    )
  }, [recurringTasksWithStatus])

  // 今日完了した繰り返しタスク
  const completedRecurringTasks = useMemo(() => {
    return recurringTasksWithStatus.filter(rt =>
      rt.completedToday
    )
  }, [recurringTasksWithStatus])

  // ===================================
  // 完了・未完了操作
  // ===================================

  const completeRecurringTask = useCallback(async (taskId: string, date?: string) => {
    try {
      const task = unifiedTasks.tasks.find(t => t.id === taskId)
      if (!task) {
        throw new Error(`Task ${taskId} not found`)
      }

      await completionTracker.recordCompletion(task, date)
    } catch (err) {
      console.error('Failed to complete recurring task:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }, [unifiedTasks.tasks, completionTracker])

  const uncompleteRecurringTask = useCallback(async (taskId: string, date?: string) => {
    try {
      await completionTracker.removeCompletion(taskId, date)
    } catch (err) {
      console.error('Failed to uncomplete recurring task:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }, [completionTracker])

  // ===================================
  // データ更新
  // ===================================

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      await Promise.all([
        unifiedTasks.loadTasks(true),
        completionTracker.refresh()
      ])
      setError(null)
    } catch (err) {
      console.error('Failed to refresh recurring tasks:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [unifiedTasks, completionTracker])

  // ===================================
  // Effects
  // ===================================

  useEffect(() => {
    const isLoading = unifiedTasks.loading || completionTracker.loading
    setLoading(isLoading)
  }, [unifiedTasks.loading, completionTracker.loading])

  useEffect(() => {
    const errorMessages = [unifiedTasks.error, completionTracker.error].filter(Boolean)
    setError(errorMessages.length > 0 ? errorMessages.join('; ') : null)
  }, [unifiedTasks.error, completionTracker.error])

  return {
    // データ
    recurringTasks: recurringTasksWithStatus,
    todayRecurringTasks,
    completedRecurringTasks,
    loading,
    error,

    // 操作
    completeRecurringTask,
    uncompleteRecurringTask,

    // データ更新
    refresh
  }
}

// ===================================
// ヘルパー関数
// ===================================

/**
 * タスクが今日発生するかチェック
 * TODO: 実際の繰り返しパターン（recurring_pattern, weekdays等）を考慮
 */
function shouldOccurToday(task: UnifiedTask): boolean {
  if (task.task_type !== 'RECURRING') return false

  // 簡易実装: 完了していない繰り返しタスクは毎日発生するとみなす
  // 実際の実装では recurring_pattern, recurring_weekdays 等をチェック
  return !task.completed
}

/**
 * タスクの表示名を生成
 */
function getDisplayName(task: UnifiedTask): string {
  let displayName = task.title

  // 繰り返しパターンを表示名に含める
  if (task.recurring_pattern) {
    const patternText = {
      'DAILY': '毎日',
      'WEEKLY': '毎週',
      'MONTHLY': '毎月',
      'YEARLY': '毎年'
    }[task.recurring_pattern] || task.recurring_pattern

    displayName += ` (${patternText})`
  }

  return displayName
}

// ===================================
// レガシー互換性レイヤー
// ===================================

/**
 * 旧useRecurringTasksと同じインターフェースを提供
 * 段階的移行のための互換レイヤー
 */
export function useRecurringTasksCompat(isDbInitialized: boolean = false) {
  const unified = useUnifiedRecurringTasks(isDbInitialized)

  // 旧形式のUnifiedRecurringTaskWithStatusに変換
  const convertToLegacyFormat = (unifiedTask: UnifiedRecurringTaskWithStatus) => {
    return {
      task: {
        id: unifiedTask.task.id,
        title: unifiedTask.task.title,
        memo: unifiedTask.task.memo || undefined,
        category: unifiedTask.task.category || undefined,
        frequency: unifiedTask.task.recurring_pattern || 'DAILY',
        active: !unifiedTask.task.completed,
        created_at: unifiedTask.task.created_at || new Date().toISOString(),
        updated_at: unifiedTask.task.updated_at || new Date().toISOString(),
        user_id: unifiedTask.task.user_id || 'dummy' // レガシー互換性のため
      },
      occursToday: unifiedTask.occursToday,
      completedToday: unifiedTask.completedToday,
      displayName: unifiedTask.displayName
    }
  }

  return {
    recurringTasks: unified.recurringTasks.map(convertToLegacyFormat),
    recurringLogs: [], // 新システムでは使用しない
    loading: unified.loading,
    error: unified.error,

    // 今日のタスク関連
    getTodayRecurringTasks: () => unified.todayRecurringTasks.map(convertToLegacyFormat),
    getCompletedRecurringTasksToday: () => unified.completedRecurringTasks.map(convertToLegacyFormat),

    // 完了操作
    completeRecurringTask: unified.completeRecurringTask,
    uncompleteRecurringTask: unified.uncompleteRecurringTask,

    // データ更新
    reload: unified.refresh
  }
}