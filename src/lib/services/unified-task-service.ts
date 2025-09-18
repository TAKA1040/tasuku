// Unified Task Service
// Handles all CRUD operations for the unified_tasks table
// NOTE: This is a placeholder implementation until the unified_tasks table is created

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import {
  UnifiedTask,
  TaskType,
  DisplayNumberUtils,
  TaskFilters,
  TaskSorters
} from '@/lib/types/unified-task'

type SupabaseClient = ReturnType<typeof createClient<Database>>

export class UnifiedTaskService {
  constructor(private supabase: SupabaseClient) {}

  // TODO: Remove this when unified_tasks table is created
  private async checkTableExists(): Promise<boolean> {
    try {
      // Check if unified_tasks table exists by attempting a query
      const { error } = await this.supabase.rpc('check_table_exists', { table_name: 'unified_tasks' })
      return !error
    } catch {
      // For now, always return false since table doesn't exist
      return false
    }
  }

  /**
   * Get all tasks for a user, sorted by display number
   */
  async getAllTasks(userId: string): Promise<UnifiedTask[]> {
    // TODO: Replace with actual unified_tasks query when table is created
    const tableExists = await this.checkTableExists()
    if (!tableExists) {
      console.warn('unified_tasks table does not exist yet, returning empty array')
      return []
    }

    const { data, error } = await this.supabase
      .from('unified_tasks' as any)
      .select('*')
      .eq('user_id', userId)
      .order('display_number', { ascending: true })

    if (error) throw new Error(`Failed to fetch tasks: ${error.message}`)
    return (data || []) as UnifiedTask[]
  }

  /**
   * Get tasks by type
   */
  async getTasksByType(userId: string, taskType: TaskType): Promise<UnifiedTask[]> {
    const tableExists = await this.checkTableExists()
    if (!tableExists) return []

    const { data, error } = await this.supabase
      .from('unified_tasks' as any)
      .select('*')
      .eq('user_id', userId)
      .eq('task_type', taskType)
      .order('display_number', { ascending: true })

    if (error) throw new Error(`Failed to fetch tasks by type: ${error.message}`)
    return (data || []) as UnifiedTask[]
  }

  /**
   * Get today's tasks (due today + overdue)
   */
  async getTodayTasks(userId: string): Promise<{
    today: UnifiedTask[]
    overdue: UnifiedTask[]
  }> {
    const allTasks = await this.getAllTasks(userId)

    const today = allTasks.filter(TaskFilters.isTodayTask).sort(TaskSorters.byDisplaySequence)
    const overdue = allTasks.filter(TaskFilters.isOverdueTask).sort(TaskSorters.byDisplaySequence)

    return { today, overdue }
  }

  /**
   * Get upcoming tasks
   */
  async getUpcomingTasks(userId: string): Promise<UnifiedTask[]> {
    const allTasks = await this.getAllTasks(userId)
    return allTasks.filter(TaskFilters.isUpcomingTask).sort(TaskSorters.byDueDate)
  }

  /**
   * Get shopping tasks
   */
  async getShoppingTasks(userId: string): Promise<UnifiedTask[]> {
    const allTasks = await this.getAllTasks(userId)
    return allTasks.filter(TaskFilters.isShoppingTask).sort(TaskSorters.byDisplaySequence)
  }

  /**
   * Get idea tasks
   */
  async getIdeaTasks(userId: string): Promise<UnifiedTask[]> {
    const allTasks = await this.getAllTasks(userId)
    return allTasks.filter(TaskFilters.isIdeaTask).sort(TaskSorters.byDisplaySequence)
  }

  /**
   * Create a new task
   */
  async createTask(
    userId: string,
    task: Omit<UnifiedTask, 'id' | 'user_id' | 'display_number' | 'created_at' | 'updated_at'>
  ): Promise<UnifiedTask> {
    // Get existing numbers to avoid conflicts
    const existingTasks = await this.getAllTasks(userId)
    const existingNumbers = existingTasks.map(t => t.display_number)

    // Generate display number
    const displayNumber = DisplayNumberUtils.generate(
      task.due_date || null,
      task.task_type,
      existingNumbers
    )

    const newTask = {
      ...task,
      user_id: userId,
      display_number: displayNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await this.supabase
      .from('unified_tasks')
      .insert(newTask)
      .select()
      .single()

    if (error) throw new Error(`Failed to create task: ${error.message}`)
    return data as UnifiedTask
  }

  /**
   * Update a task
   */
  async updateTask(
    userId: string,
    taskId: string,
    updates: Partial<Omit<UnifiedTask, 'id' | 'user_id' | 'created_at'>>
  ): Promise<UnifiedTask> {
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await this.supabase
      .from('unified_tasks')
      .update(updatedData)
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update task: ${error.message}`)
    return data as UnifiedTask
  }

  /**
   * Update task display number (for manual reordering)
   */
  async updateDisplayNumber(
    userId: string,
    taskId: string,
    newSequence: number
  ): Promise<UnifiedTask> {
    // Get current task to extract date and type prefix
    const { data: currentTask, error: fetchError } = await this.supabase
      .from('unified_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw new Error(`Failed to fetch current task: ${fetchError.message}`)

    // Parse current display number
    const { date, typeCode } = DisplayNumberUtils.parseDisplayNumber(currentTask.display_number)
    const datePrefix = date.replace(/-/g, '')

    // Generate new display number
    const newDisplayNumber = DisplayNumberUtils.parseUserInput(
      newSequence.toString(),
      datePrefix,
      typeCode
    )

    // Update the task
    return this.updateTask(userId, taskId, { display_number: newDisplayNumber })
  }

  /**
   * Complete/uncomplete a task
   */
  async toggleTaskCompletion(
    userId: string,
    taskId: string,
    completed: boolean
  ): Promise<UnifiedTask> {
    const updates: Partial<UnifiedTask> = {
      completed,
      completed_at: completed ? new Date().toISOString().split('T')[0] : undefined,
    }

    return this.updateTask(userId, taskId, updates)
  }

  /**
   * Delete a task
   */
  async deleteTask(userId: string, taskId: string): Promise<void> {
    const { error } = await this.supabase
      .from('unified_tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) throw new Error(`Failed to delete task: ${error.message}`)
  }

  /**
   * Daily batch update for overdue type codes
   */
  async updateOverdueTypeCodes(userId: string): Promise<number> {
    const allTasks = await this.getAllTasks(userId)
    const tasksNeedingUpdate = DisplayNumberUtils.getTasksNeedingUpdate(allTasks)

    let updateCount = 0

    for (const task of tasksNeedingUpdate) {
      try {
        const newDisplayNumber = DisplayNumberUtils.updateTypeCode(
          task.display_number,
          task.task_type,
          task.due_date
        )

        await this.updateTask(userId, task.id, {
          display_number: newDisplayNumber
        })

        updateCount++
      } catch (error) {
        console.error(`Failed to update task ${task.id}:`, error)
      }
    }

    return updateCount
  }

  /**
   * Migrate data from legacy tables
   */
  async migrateFromLegacyTables(userId: string): Promise<{
    tasks: number
    recurring: number
    ideas: number
    total: number
  }> {
    let migratedCounts = { tasks: 0, recurring: 0, ideas: 0, total: 0 }

    try {
      // Get existing unified tasks to avoid conflicts
      const existingTasks = await this.getAllTasks(userId)
      const existingNumbers = existingTasks.map(t => t.display_number)

      // Migrate regular tasks
      const { data: legacyTasks } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)

      if (legacyTasks) {
        for (const legacyTask of legacyTasks) {
          const displayNumber = DisplayNumberUtils.generate(
            legacyTask.due_date,
            'NORMAL',
            existingNumbers
          )

          const unifiedTask = {
            user_id: userId,
            title: legacyTask.title,
            memo: legacyTask.memo,
            display_number: displayNumber,
            task_type: 'NORMAL' as TaskType,
            due_date: legacyTask.due_date,
            completed: legacyTask.completed || false,
            completed_at: legacyTask.completed_at,
            importance: legacyTask.importance,
            category: legacyTask.category,
            urls: legacyTask.urls,
            attachment: legacyTask.attachment,
            rollover_count: legacyTask.rollover_count,
            archived: legacyTask.archived,
            snoozed_until: legacyTask.snoozed_until,
            duration_min: legacyTask.duration_min,
            created_at: legacyTask.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          await this.supabase.from('unified_tasks').insert(unifiedTask)
          existingNumbers.push(displayNumber)
          migratedCounts.tasks++
        }
      }

      // Migrate recurring tasks
      const { data: legacyRecurring } = await this.supabase
        .from('recurring_tasks')
        .select('*')
        .eq('user_id', userId)

      if (legacyRecurring) {
        for (const recurring of legacyRecurring) {
          const displayNumber = DisplayNumberUtils.generate(
            recurring.start_date,
            'RECURRING',
            existingNumbers
          )

          const recurringConfig = {
            frequency: recurring.frequency,
            interval_n: recurring.interval_n || 1,
            weekdays: recurring.weekdays,
            month_day: recurring.month_day,
            active: recurring.active || true,
            start_date: recurring.start_date,
            end_date: recurring.end_date,
            max_occurrences: recurring.max_occurrences,
          }

          const unifiedTask = {
            user_id: userId,
            title: recurring.title,
            memo: recurring.memo,
            display_number: displayNumber,
            task_type: 'RECURRING' as TaskType,
            due_date: recurring.start_date,
            completed: false,
            recurring_config: recurringConfig,
            importance: recurring.importance,
            category: recurring.category,
            urls: recurring.urls,
            attachment: recurring.attachment,
            duration_min: recurring.duration_min,
            created_at: recurring.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          await this.supabase.from('unified_tasks').insert(unifiedTask)
          existingNumbers.push(displayNumber)
          migratedCounts.recurring++
        }
      }

      // Migrate ideas
      const { data: legacyIdeas } = await this.supabase
        .from('ideas')
        .select('*')
        .eq('user_id', userId)

      if (legacyIdeas) {
        for (const idea of legacyIdeas) {
          const displayNumber = DisplayNumberUtils.generate(
            null,
            'IDEA',
            existingNumbers
          )

          const unifiedTask = {
            user_id: userId,
            title: idea.text,
            display_number: displayNumber,
            task_type: 'IDEA' as TaskType,
            completed: idea.completed || false,
            created_at: idea.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          await this.supabase.from('unified_tasks').insert(unifiedTask)
          existingNumbers.push(displayNumber)
          migratedCounts.ideas++
        }
      }

      migratedCounts.total = migratedCounts.tasks + migratedCounts.recurring + migratedCounts.ideas

      return migratedCounts
    } catch (error) {
      throw new Error(`Migration failed: ${error}`)
    }
  }
}

// Hook for React components
export function useUnifiedTaskService(supabase: SupabaseClient) {
  return new UnifiedTaskService(supabase)
}