// Unified Task Types and Utilities
// Implements the YYYYMMDDTTCCC display numbering system

export type TaskType = 'NORMAL' | 'RECURRING' | 'SHOPPING' | 'IDEA'

export interface RecurringConfig {
  frequency: 'DAILY' | 'INTERVAL_DAYS' | 'WEEKLY' | 'MONTHLY'
  interval_n: number
  weekdays?: number[] // 0=Monday, 6=Sunday
  month_day?: number // 1-31
  active: boolean
  start_date: string
  end_date?: string
  max_occurrences?: number
}

export interface UnifiedTask {
  id: string
  user_id: string

  // Basic task information
  title: string
  memo?: string

  // Unified numbering system
  display_number: string // Format: YYYYMMDDTTCCC

  // Task classification
  task_type: TaskType

  // Date fields
  due_date?: string // YYYY-MM-DD
  created_at: string
  updated_at: string
  completed_at?: string
  completed: boolean

  // Recurring configuration
  recurring_config?: RecurringConfig

  // Extended fields
  importance?: number // 1-5
  category?: string
  urls?: string[]
  attachment?: any

  // Legacy compatibility
  rollover_count?: number
  archived?: boolean
  snoozed_until?: string
  duration_min?: number
}

// Type codes for the numbering system (TT part)
export const TYPE_CODES = {
  NORMAL: '10',
  OVERDUE: '11',
  RECURRING: '12',
  IDEA: '13',
} as const

export type TypeCode = typeof TYPE_CODES[keyof typeof TYPE_CODES]

// Display number utilities
export class DisplayNumberUtils {
  /**
   * Generate a new display number
   * Format: YYYYMMDDTTCCC
   */
  static generate(
    dueDate: string | null,
    taskType: TaskType,
    existingNumbers: string[] = []
  ): string {
    const date = dueDate || new Date().toISOString().split('T')[0]
    const datePrefix = date.replace(/-/g, '') // YYYYMMDD

    // Determine type code
    let typeCode: string
    if (taskType === 'NORMAL' && dueDate) {
      const today = new Date().toISOString().split('T')[0]
      typeCode = dueDate < today ? TYPE_CODES.OVERDUE : TYPE_CODES.NORMAL
    } else {
      typeCode = TYPE_CODES[taskType] || TYPE_CODES.NORMAL
    }

    const prefix = datePrefix + typeCode // YYYYMMDDTT

    // Find next available sequence number
    const existingSequences = existingNumbers
      .filter(num => num.startsWith(prefix))
      .map(num => parseInt(num.slice(-3)))
      .filter(seq => !isNaN(seq))
      .sort((a, b) => a - b)

    let nextSequence = 1
    for (const seq of existingSequences) {
      if (seq === nextSequence) {
        nextSequence++
      } else {
        break
      }
    }

    if (nextSequence > 999) {
      throw new Error(`Too many tasks for ${prefix}`)
    }

    return prefix + nextSequence.toString().padStart(3, '0')
  }

  /**
   * Extract display number for UI (CCC part only)
   */
  static getDisplaySequence(displayNumber: string): number {
    const sequence = displayNumber.slice(-3)
    return parseInt(sequence)
  }

  /**
   * Get formatted display number for UI
   */
  static formatForDisplay(displayNumber: string): string {
    return this.getDisplaySequence(displayNumber).toString()
  }

  /**
   * Parse user input back to full display number
   */
  static parseUserInput(
    input: string,
    datePrefix: string,
    typeCode: string
  ): string {
    const sequence = parseInt(input)
    if (isNaN(sequence) || sequence < 1 || sequence > 999) {
      throw new Error('Invalid sequence number')
    }

    return datePrefix + typeCode + sequence.toString().padStart(3, '0')
  }

  /**
   * Extract components from display number
   */
  static parseDisplayNumber(displayNumber: string): {
    date: string // YYYY-MM-DD
    typeCode: string
    sequence: number
  } {
    if (displayNumber.length !== 13) {
      throw new Error('Invalid display number format')
    }

    const dateStr = displayNumber.slice(0, 8) // YYYYMMDD
    const date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
    const typeCode = displayNumber.slice(8, 10)
    const sequence = parseInt(displayNumber.slice(10, 13))

    return { date, typeCode, sequence }
  }

  /**
   * Check if a display number represents an overdue task
   */
  static isOverdue(displayNumber: string): boolean {
    const { typeCode } = this.parseDisplayNumber(displayNumber)
    return typeCode === TYPE_CODES.OVERDUE
  }

  /**
   * Update type code for overdue detection
   */
  static updateTypeCode(
    displayNumber: string,
    newTaskType: TaskType,
    dueDate?: string
  ): string {
    const { date, sequence } = this.parseDisplayNumber(displayNumber)

    let typeCode: string
    if (newTaskType === 'NORMAL' && dueDate) {
      const today = new Date().toISOString().split('T')[0]
      typeCode = dueDate < today ? TYPE_CODES.OVERDUE : TYPE_CODES.NORMAL
    } else {
      typeCode = TYPE_CODES[newTaskType] || TYPE_CODES.NORMAL
    }

    const datePrefix = date.replace(/-/g, '')
    return datePrefix + typeCode + sequence.toString().padStart(3, '0')
  }

  /**
   * Get tasks that need type code updates (for daily batch processing)
   */
  static getTasksNeedingUpdate(tasks: UnifiedTask[]): UnifiedTask[] {
    const today = new Date().toISOString().split('T')[0]

    return tasks.filter(task => {
      if (task.task_type !== 'NORMAL' || !task.due_date || task.completed) {
        return false
      }

      const isOverdue = task.due_date < today
      const hasOverdueCode = this.isOverdue(task.display_number)

      // Need update if overdue status doesn't match type code
      return isOverdue !== hasOverdueCode
    })
  }
}

// Helper functions for task filtering
export class TaskFilters {
  static isTodayTask(task: UnifiedTask): boolean {
    const today = new Date().toISOString().split('T')[0]
    return !task.completed && task.due_date === today
  }

  static isOverdueTask(task: UnifiedTask): boolean {
    const today = new Date().toISOString().split('T')[0]
    return !task.completed && task.due_date !== null && task.due_date < today
  }

  static isUpcomingTask(task: UnifiedTask): boolean {
    const today = new Date().toISOString().split('T')[0]
    return !task.completed && task.due_date !== null && task.due_date > today
  }

  static isShoppingTask(task: UnifiedTask): boolean {
    return !task.completed && task.category === '買い物'
  }

  static isIdeaTask(task: UnifiedTask): boolean {
    return task.task_type === 'IDEA'
  }

  static isRecurringTask(task: UnifiedTask): boolean {
    return task.task_type === 'RECURRING'
  }
}

// Sort functions for unified tasks
export class TaskSorters {
  static byDisplayNumber(a: UnifiedTask, b: UnifiedTask): number {
    return a.display_number.localeCompare(b.display_number)
  }

  static byDisplaySequence(a: UnifiedTask, b: UnifiedTask): number {
    const seqA = DisplayNumberUtils.getDisplaySequence(a.display_number)
    const seqB = DisplayNumberUtils.getDisplaySequence(b.display_number)
    return seqA - seqB
  }

  static byDueDate(a: UnifiedTask, b: UnifiedTask): number {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date.localeCompare(b.due_date)
  }

  static byImportance(a: UnifiedTask, b: UnifiedTask): number {
    const impA = a.importance || 3
    const impB = b.importance || 3
    return impB - impA // Higher importance first
  }
}