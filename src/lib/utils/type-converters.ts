/**
 * Type converters for legacy type compatibility
 *
 * UnifiedTask と 旧型（Task, RecurringTask, Idea）の相互変換を提供
 * Type assertionの代わりに使用して型安全性を向上
 */

import type { UnifiedTask } from '@/lib/types/unified-task'
import { SPECIAL_DATES } from '@/lib/constants'

/**
 * 旧Task型の定義（互換性のため）
 */
export interface Task {
  id: string
  title: string
  memo?: string
  due_date?: string
  completed: boolean
  created_at: string
  updated_at: string
  completed_at?: string
  display_number: string
  rollover_count: number
  archived: boolean
  snoozed_until?: string
  duration_min?: number
  importance?: 1 | 2 | 3 | 4 | 5
  category?: string
  urls?: string[]
  attachment?: {
    file_name: string
    file_type: string
    file_size: number
    file_data: string
  }
  location_tag_id?: string
}

/**
 * UnifiedTask を 旧Task型 に変換
 *
 * @param unifiedTask - 変換元のUnifiedTask
 * @returns Task型のオブジェクト
 */
export function unifiedTaskToTask(unifiedTask: UnifiedTask): Task {
  return {
    id: unifiedTask.id,
    title: unifiedTask.title,
    memo: unifiedTask.memo ?? undefined,
    // 特別な日付値（NO_DUE_DATE）はundefinedに変換
    due_date: unifiedTask.due_date === SPECIAL_DATES.NO_DUE_DATE
      ? undefined
      : unifiedTask.due_date,
    completed: unifiedTask.completed ?? false,
    created_at: unifiedTask.created_at ?? new Date().toISOString(),
    updated_at: unifiedTask.updated_at ?? new Date().toISOString(),
    completed_at: unifiedTask.completed_at ?? undefined,
    display_number: unifiedTask.display_number,
    rollover_count: 0, // UnifiedTaskにはrollover_countがないため0固定
    archived: unifiedTask.archived ?? false,
    snoozed_until: unifiedTask.snoozed_until ?? undefined,
    duration_min: unifiedTask.duration_min ?? undefined,
    importance: unifiedTask.importance as 1 | 2 | 3 | 4 | 5 | undefined,
    category: unifiedTask.category ?? undefined,
    urls: unifiedTask.urls ?? undefined,
    attachment: unifiedTask.attachment ?? undefined,
    location_tag_id: undefined // UnifiedTaskにはlocation_tag_idがない
  }
}

/**
 * 旧Task型 を UnifiedTask に変換
 *
 * @param task - 変換元のTask
 * @param taskType - タスクタイプ（デフォルト: 'GENERAL'）
 * @returns UnifiedTask型のオブジェクト
 */
export function taskToUnifiedTask(
  task: Task,
  taskType: 'GENERAL' | 'RECURRING' | 'IDEA' | 'SHOPPING' = 'GENERAL'
): UnifiedTask {
  // user_idは実行時に取得する必要があるため、ここでは空文字
  // 実際の使用時はcreateClient().auth.getUser()で取得したIDを設定すること
  return {
    id: task.id,
    user_id: '', // 注意: 実際の使用時は適切なuser_idを設定すること
    task_type: taskType,
    display_number: task.display_number,
    title: task.title,
    memo: task.memo || null,
    due_date: task.due_date || SPECIAL_DATES.NO_DUE_DATE,
    completed: task.completed,
    created_at: task.created_at,
    updated_at: task.updated_at,
    completed_at: task.completed_at || null,
    archived: task.archived,
    snoozed_until: task.snoozed_until || null,
    start_time: null,
    end_time: null,
    duration_min: task.duration_min || null,
    importance: task.importance || null,
    category: task.category || null,
    urls: task.urls || null,
    attachment: task.attachment || null,
    recurring_pattern: null,
    recurring_weekdays: null,
    recurring_template_id: null
  }
}

/**
 * Task配列をUnifiedTask配列に一括変換
 *
 * @param tasks - 変換元のTask配列
 * @param taskType - タスクタイプ（デフォルト: 'GENERAL'）
 * @returns UnifiedTask配列
 */
export function tasksToUnifiedTasks(
  tasks: Task[],
  taskType: 'GENERAL' | 'RECURRING' | 'IDEA' | 'SHOPPING' = 'GENERAL'
): UnifiedTask[] {
  return tasks.map(task => taskToUnifiedTask(task, taskType))
}

/**
 * UnifiedTask配列をTask配列に一括変換
 *
 * @param unifiedTasks - 変換元のUnifiedTask配列
 * @returns Task配列
 */
export function unifiedTasksToTasks(unifiedTasks: UnifiedTask[]): Task[] {
  return unifiedTasks.map(task => unifiedTaskToTask(task))
}

/**
 * タスクがUnifiedTask型かどうかを判定（Type Guard）
 *
 * @param task - 判定対象のタスク
 * @returns UnifiedTask型ならtrue
 */
export function isUnifiedTask(task: unknown): task is UnifiedTask {
  if (typeof task !== 'object' || task === null) {
    return false
  }

  const t = task as Record<string, unknown>

  return (
    typeof t.id === 'string' &&
    typeof t.user_id === 'string' &&
    typeof t.task_type === 'string' &&
    typeof t.display_number === 'string' &&
    typeof t.title === 'string'
  )
}

/**
 * タスクが旧Task型かどうかを判定（Type Guard）
 *
 * @param task - 判定対象のタスク
 * @returns Task型ならtrue
 */
export function isLegacyTask(task: unknown): task is Task {
  if (typeof task !== 'object' || task === null) {
    return false
  }

  const t = task as Record<string, unknown>

  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.display_number === 'string' &&
    typeof t.completed === 'boolean' &&
    typeof t.rollover_count === 'number' &&
    !('task_type' in t) // UnifiedTaskには必ずtask_typeがある
  )
}
