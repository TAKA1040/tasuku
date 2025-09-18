// React Hook for Unified Tasks
// Manages all task operations with the new numbering system

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import {
  UnifiedTask,
  TaskType,
  DisplayNumberUtils,
  TaskFilters,
  TaskSorters
} from '@/lib/types/unified-task'
import { UnifiedTaskService } from '@/lib/services/unified-task-service'

interface UseUnifiedTasksReturn {
  // Data
  allTasks: UnifiedTask[]
  todayTasks: UnifiedTask[]
  overdueTasks: UnifiedTask[]
  upcomingTasks: UnifiedTask[]
  shoppingTasks: UnifiedTask[]
  ideaTasks: UnifiedTask[]

  // Loading states
  loading: boolean
  error: string | null

  // Actions
  createTask: (task: Omit<UnifiedTask, 'id' | 'user_id' | 'display_number' | 'created_at' | 'updated_at'>) => Promise<UnifiedTask>
  updateTask: (taskId: string, updates: Partial<UnifiedTask>) => Promise<UnifiedTask>
  deleteTask: (taskId: string) => Promise<void>
  toggleCompletion: (taskId: string, completed: boolean) => Promise<UnifiedTask>
  updateDisplayNumber: (taskId: string, newSequence: number) => Promise<UnifiedTask>

  // Utilities
  refreshTasks: () => Promise<void>
  updateOverdueCodes: () => Promise<number>
  migrateLegacyData: () => Promise<{ tasks: number; recurring: number; ideas: number; total: number }>

  // Display utilities
  getDisplayNumber: (task: UnifiedTask) => string
  formatDisplayNumber: (displayNumber: string) => string
}

export function useUnifiedTasks(): UseUnifiedTasksReturn {
  const [allTasks, setAllTasks] = useState<UnifiedTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  // Initialize client and service
  const supabase = useMemo(() => createClient(), [])
  const taskService = useMemo(() => new UnifiedTaskService(supabase), [supabase])

  // Get user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  // Filtered task lists
  const todayTasks = useMemo(() =>
    allTasks.filter(TaskFilters.isTodayTask).sort(TaskSorters.byDisplaySequence)
  , [allTasks])

  const overdueTasks = useMemo(() =>
    allTasks.filter(TaskFilters.isOverdueTask).sort(TaskSorters.byDisplaySequence)
  , [allTasks])

  const upcomingTasks = useMemo(() =>
    allTasks.filter(TaskFilters.isUpcomingTask).sort(TaskSorters.byDueDate)
  , [allTasks])

  const shoppingTasks = useMemo(() =>
    allTasks.filter(TaskFilters.isShoppingTask).sort(TaskSorters.byDisplaySequence)
  , [allTasks])

  const ideaTasks = useMemo(() =>
    allTasks.filter(TaskFilters.isIdeaTask).sort(TaskSorters.byDisplaySequence)
  , [allTasks])

  // Load tasks
  const refreshTasks = useCallback(async () => {
    if (!user?.id) return

    try {
      setError(null)
      const tasks = await taskService.getAllTasks(user.id)
      setAllTasks(tasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [user?.id, taskService])

  // Initial load
  useEffect(() => {
    refreshTasks()
  }, [refreshTasks])

  // Create task
  const createTask = useCallback(async (
    task: Omit<UnifiedTask, 'id' | 'user_id' | 'display_number' | 'created_at' | 'updated_at'>
  ): Promise<UnifiedTask> => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const newTask = await taskService.createTask(user.id, task)
      setAllTasks(prev => [...prev, newTask].sort(TaskSorters.byDisplayNumber))
      return newTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [user?.id, taskService])

  // Update task
  const updateTask = useCallback(async (
    taskId: string,
    updates: Partial<UnifiedTask>
  ): Promise<UnifiedTask> => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const updatedTask = await taskService.updateTask(user.id, taskId, updates)
      setAllTasks(prev =>
        prev.map(task => task.id === taskId ? updatedTask : task)
           .sort(TaskSorters.byDisplayNumber)
      )
      return updatedTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [user?.id, taskService])

  // Delete task
  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      await taskService.deleteTask(user.id, taskId)
      setAllTasks(prev => prev.filter(task => task.id !== taskId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [user?.id, taskService])

  // Toggle completion
  const toggleCompletion = useCallback(async (
    taskId: string,
    completed: boolean
  ): Promise<UnifiedTask> => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const updatedTask = await taskService.toggleTaskCompletion(user.id, taskId, completed)
      setAllTasks(prev =>
        prev.map(task => task.id === taskId ? updatedTask : task)
           .sort(TaskSorters.byDisplayNumber)
      )
      return updatedTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle completion'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [user?.id, taskService])

  // Update display number
  const updateDisplayNumber = useCallback(async (
    taskId: string,
    newSequence: number
  ): Promise<UnifiedTask> => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const updatedTask = await taskService.updateDisplayNumber(user.id, taskId, newSequence)
      setAllTasks(prev =>
        prev.map(task => task.id === taskId ? updatedTask : task)
           .sort(TaskSorters.byDisplayNumber)
      )
      return updatedTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update display number'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [user?.id, taskService])

  // Update overdue type codes
  const updateOverdueCodes = useCallback(async (): Promise<number> => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const updateCount = await taskService.updateOverdueTypeCodes(user.id)
      // Refresh tasks to reflect changes
      await refreshTasks()
      return updateCount
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update overdue codes'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [user?.id, taskService, refreshTasks])

  // Migrate legacy data
  const migrateLegacyData = useCallback(async () => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const result = await taskService.migrateFromLegacyTables(user.id)
      // Refresh tasks to include migrated data
      await refreshTasks()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to migrate legacy data'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [user?.id, taskService, refreshTasks])

  // Display utilities
  const getDisplayNumber = useCallback((task: UnifiedTask): string => {
    return task.display_number
  }, [])

  const formatDisplayNumber = useCallback((displayNumber: string): string => {
    return DisplayNumberUtils.formatForDisplay(displayNumber)
  }, [])

  return {
    // Data
    allTasks,
    todayTasks,
    overdueTasks,
    upcomingTasks,
    shoppingTasks,
    ideaTasks,

    // Loading states
    loading,
    error,

    // Actions
    createTask,
    updateTask,
    deleteTask,
    toggleCompletion,
    updateDisplayNumber,

    // Utilities
    refreshTasks,
    updateOverdueCodes,
    migrateLegacyData,

    // Display utilities
    getDisplayNumber,
    formatDisplayNumber,
  }
}

// Additional hook for daily maintenance
export function useTaskMaintenance() {
  const { updateOverdueCodes } = useUnifiedTasks()

  // Check for overdue updates on app startup
  useEffect(() => {
    const checkOverdueUpdates = async () => {
      const lastCheck = localStorage.getItem('lastOverdueCheck')
      const today = new Date().toISOString().split('T')[0]

      if (lastCheck !== today) {
        try {
          await updateOverdueCodes()
          localStorage.setItem('lastOverdueCheck', today)
        } catch (error) {
          console.error('Failed to update overdue codes:', error)
        }
      }
    }

    checkOverdueUpdates()
  }, [updateOverdueCodes])

  return { updateOverdueCodes }
}