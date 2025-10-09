// 未完了タスクの繰り越し機能
// PHASE 1.2 実装

import { getTodayJST, getDaysDifference } from './date-jst'
import type { Task, RecurringTask, RecurringLog } from '../db/schema'
import { occursOn } from './recurring'
import { logger } from '@/lib/utils/logger'

/**
 * 過去の未完了タスクを検出
 */
export function findIncompleTasks(
  singleTasks: Task[],
  recurringTasks: RecurringTask[],
  recurringLogs: RecurringLog[] = []
): {
  incompleteSingle: Task[]
  incompleteRecurring: Array<{ task: RecurringTask; missedDates: string[] }>
} {
  const today = getTodayJST()
  const incompleteSingle: Task[] = []
  const incompleteRecurring: Array<{ task: RecurringTask; missedDates: string[] }> = []

  // 1. 単発タスクの未完了チェック（今日より前の日付で未完了）
  singleTasks.forEach(task => {
    // 買い物カテゴリは専用の完了処理があるため繰り越し対象から除外
    if (task.category === '買い物') {
      if (process.env.NODE_ENV === 'development') {
        logger.info('自動繰り越しをスキップ（買い物タスク）:', task.title)
      }
      return
    }

    if (!task.completed && task.due_date && getDaysDifference(task.due_date, today) < 0) {
      // 最近更新されたタスク（1時間以内）は自動繰り越し対象から除外
      const now = new Date()
      const updatedAt = new Date(task.updated_at)
      const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)

      if (hoursSinceUpdate > 1) {
        // 1時間以上前に更新されたタスクのみ自動繰り越し対象
        incompleteSingle.push(task)
      } else {
        if (process.env.NODE_ENV === 'development') {
          logger.info('自動繰り越しをスキップ（最近更新されたタスク）:', task.title, `${hoursSinceUpdate.toFixed(1)}時間前`)
        }
      }
    }
  })

  // 2. 繰り返しタスクの未完了チェック（過去7日間で発生したが完了記録がない）
  recurringTasks.forEach(recurring => {
    if (!recurring.active) return

    const missedDates: string[] = []
    
    // 過去7日分をチェック
    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date()
      checkDate.setDate(checkDate.getDate() - i)
      const checkDateStr = checkDate.toLocaleDateString('ja-CA')
      
      // その日に発生予定だったかチェック
      if (occursOn(checkDateStr, recurring)) {
        // RecurringLogテーブルで完了記録をチェック
        const isCompleted = recurringLogs.some(
          log => log.recurring_id === recurring.id && log.date === checkDateStr
        )
        
        if (!isCompleted) {
          missedDates.push(checkDateStr)
        }
      }
    }

    if (missedDates.length > 0) {
      incompleteRecurring.push({ task: recurring, missedDates })
    }
  })

  return { incompleteSingle, incompleteRecurring }
}

/**
 * 単発タスクを今日に繰り越し
 */
export function rolloverSingleTask(task: Task): Task {
  // 安全なデータクリーニング
  const cleanedTask = {
    id: `${task.id}-rollover-${Date.now()}`, // 新しいIDで複製
    title: task.title || '',
    memo: task.memo || undefined,
    due_date: getTodayJST(),
    completed: false,
    completed_at: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    rollover_count: (task.rollover_count || 0) + 1,
    archived: false,
    snoozed_until: undefined,
    duration_min: task.duration_min || undefined,
    importance: task.importance || undefined,
    category: task.category || undefined,
    urls: Array.isArray(task.urls) && task.urls.length > 0 ? task.urls : undefined,
    location_tag_id: task.location_tag_id || undefined
  }

  // 必須フィールドを保証して型安全に返す
  return cleanedTask as Task
}

/**
 * 繰り返しタスクの未完了分を今日に繰り越し
 */
export function rolloverRecurringTask(
  recurring: RecurringTask,
  missedDates: string[]
): Task[] {
  return missedDates.map(missedDate => {
    // 安全なデータクリーニング
    const cleanedTask = {
      id: `rollover-${recurring.id}-${missedDate}-${Date.now()}`,
      title: `${recurring.title} (${missedDate}から繰り越し)`,
      memo: recurring.memo || undefined,
      due_date: getTodayJST(),
      completed: false,
      completed_at: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rollover_count: 1,
      archived: false,
      snoozed_until: undefined,
      duration_min: recurring.duration_min || undefined,
      importance: recurring.importance || undefined,
      category: recurring.category || undefined,
      urls: Array.isArray(recurring.urls) && recurring.urls.length > 0 ? recurring.urls : undefined,
      location_tag_id: undefined
    }

    // 必須フィールドを保証して型安全に返す
    return cleanedTask as Task
  })
}

/**
 * 繰り越し候補の表示名を生成
 */
export function getRolloverDisplayText(
  incompleteSingle: Task[],
  incompleteRecurring: Array<{ task: RecurringTask; missedDates: string[] }>
): string {
  const singleCount = incompleteSingle.length
  const recurringCount = incompleteRecurring.reduce((sum, item) => sum + item.missedDates.length, 0)
  const totalCount = singleCount + recurringCount
  
  if (totalCount === 0) return ''
  
  const parts: string[] = []
  if (singleCount > 0) parts.push(`単発タスク${singleCount}件`)
  if (recurringCount > 0) parts.push(`繰り返しタスク${recurringCount}件`)
  
  return `未完了: ${parts.join('、')}`
}