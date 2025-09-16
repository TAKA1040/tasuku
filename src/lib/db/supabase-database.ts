// Supabase Database Manager
// IndexedDBからSupabase PostgreSQLに完全移行

import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { URGENCY_THRESHOLDS } from '@/lib/constants'
import { ERROR_MESSAGES } from '@/lib/messages'
import {
  type Settings,
  type Task,
  type RecurringTask,
  type RecurringLog,
  type Idea,
  type SubTask,
  type LocationTag,
  type UnifiedItem,
  type TaskWithUrgency,
  type UrgencyLevel
} from './schema'

class SupabaseTasukuDatabase {
  private supabase: SupabaseClient<Database>
  
  constructor() {
    this.supabase = createClient()
  }

  // ユーザーIDを取得する共通メソッド
  private async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await this.supabase.auth.getUser()
    if (error || !user) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED)
    }
    return user.id
  }

  // ===================================
  // TASKS CRUD Operations
  // ===================================
  
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const userId = await this.getCurrentUserId()

    // 開発環境でのみデバッグログを出力
    if (process.env.NODE_ENV === 'development') {
      console.log('createTask: Creating task:', task.title)
    }

    const { data, error } = await this.supabase
      .from('tasks')
      .insert({ ...task, user_id: userId })
      .select()
      .single()

    if (error) {
      console.error('createTask: Failed to create task:', {
        title: task.title,
        error: error.message,
        code: error.code
      })
      throw error
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('createTask: Successfully created task:', task.title)
    }

    // user_idを除いてTaskを返す
    const { user_id, ...taskData } = data
    return taskData as Task
  }

  async getTask(id: string): Promise<Task | null> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select()
      .eq('id', id)
      .single()
      
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    
    const { user_id, ...taskData } = data
    return taskData as Task
  }

  async getAllTasks(): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select()
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    return data.map(({ user_id, ...task }) => task as Task)
  }

  async getTasksByDate(date: string): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select()
      .eq('due_date', date)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    return data.map(({ user_id, ...task }) => task as Task)
  }

  // Remove this method as the view doesn't exist
  // Use getAllTasks() and compute urgency on client side instead

  async updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    
    const { user_id, ...taskData } = data
    return taskData as Task
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      
    if (error) throw error
  }

  // ===================================
  // RECURRING TASKS CRUD Operations
  // ===================================

  async createRecurringTask(task: Omit<RecurringTask, 'id' | 'created_at' | 'updated_at'>): Promise<RecurringTask> {
    const userId = await this.getCurrentUserId()
    const { data, error } = await this.supabase
      .from('recurring_tasks')
      .insert({ ...task, user_id: userId })
      .select()
      .single()
      
    if (error) throw error
    
    const { user_id, ...taskData } = data
    return taskData as RecurringTask
  }

  async getRecurringTask(id: string): Promise<RecurringTask | null> {
    const { data, error } = await this.supabase
      .from('recurring_tasks')
      .select()
      .eq('id', id)
      .single()
      
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    
    const { user_id, ...taskData } = data
    return taskData as RecurringTask
  }

  async getAllRecurringTasks(): Promise<RecurringTask[]> {
    const { data, error } = await this.supabase
      .from('recurring_tasks')
      .select()
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    return data.map(({ user_id, ...task }) => task as RecurringTask)
  }

  async getActiveRecurringTasks(): Promise<RecurringTask[]> {
    const { data, error } = await this.supabase
      .from('recurring_tasks')
      .select()
      .eq('active', true)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    return data.map(({ user_id, ...task }) => task as RecurringTask)
  }

  async updateRecurringTask(id: string, updates: Partial<Omit<RecurringTask, 'id' | 'created_at' | 'updated_at'>>): Promise<RecurringTask> {
    if (process.env.NODE_ENV === 'development') {
      console.log('updateRecurringTask: Updating task:', updates.title || id)
    }

    const { data, error } = await this.supabase
      .from('recurring_tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase updateRecurringTask error:', {
        error,
        id,
        updates,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw error
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('updateRecurringTask: Successfully updated task')
    }
    const { user_id, ...taskData } = data
    return taskData as RecurringTask
  }

  async deleteRecurringTask(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('recurring_tasks')
      .delete()
      .eq('id', id)
      
    if (error) throw error
  }

  // ===================================
  // RECURRING LOGS Operations
  // ===================================

  async logRecurringTask(recurringId: string, date: string): Promise<void> {
    const userId = await this.getCurrentUserId()
    const { error } = await this.supabase
      .from('recurring_logs')
      .insert({
        user_id: userId,
        recurring_id: recurringId,
        date: date
      })
      
    if (error) throw error
  }

  async getRecurringLogs(recurringId: string): Promise<RecurringLog[]> {
    const { data, error } = await this.supabase
      .from('recurring_logs')
      .select()
      .eq('recurring_id', recurringId)
      .order('date', { ascending: false })
      
    if (error) throw error
    
    return data.map(({ user_id, ...log }) => log as RecurringLog)
  }

  async getRecurringLogsByDate(date: string): Promise<RecurringLog[]> {
    const { data, error } = await this.supabase
      .from('recurring_logs')
      .select()
      .eq('date', date)
      
    if (error) throw error
    
    return data.map(({ user_id, ...log }) => log as RecurringLog)
  }

  async getAllRecurringLogs(): Promise<RecurringLog[]> {
    const { data, error } = await this.supabase
      .from('recurring_logs')
      .select()
      .order('date', { ascending: false })
      
    if (error) throw error
    
    return data.map(({ user_id, ...log }) => log as RecurringLog)
  }

  async deleteRecurringLog(recurringId: string, date: string): Promise<void> {
    const { error } = await this.supabase
      .from('recurring_logs')
      .delete()
      .eq('recurring_id', recurringId)
      .eq('date', date)

    if (error) throw error
  }

  // ===================================
  // IDEAS CRUD Operations
  // ===================================

  async createIdea(idea: Omit<Idea, 'id' | 'created_at' | 'updated_at'>): Promise<Idea> {
    const userId = await this.getCurrentUserId()

    if (process.env.NODE_ENV === 'development') {
      console.log('createIdea: Creating idea:', idea.text)
    }

    const { data, error } = await this.supabase
      .from('ideas')
      .insert({ ...idea, user_id: userId })
      .select()
      .single()

    if (error) {
      console.error('createIdea: Failed to create idea:', {
        text: idea.text,
        error: error.message,
        code: error.code
      })
      throw error
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('createIdea: Successfully created idea:', idea.text)
    }

    const { user_id, ...ideaData } = data
    return ideaData as Idea
  }

  async getIdea(id: string): Promise<Idea | null> {
    const { data, error } = await this.supabase
      .from('ideas')
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    const { user_id, ...ideaData } = data
    return ideaData as Idea
  }

  async getAllIdeas(): Promise<Idea[]> {
    const { data, error } = await this.supabase
      .from('ideas')
      .select()
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(({ user_id, ...idea }) => idea as Idea)
  }

  async updateIdea(id: string, updates: Partial<Omit<Idea, 'id' | 'created_at' | 'updated_at'>>): Promise<Idea> {
    const { data, error } = await this.supabase
      .from('ideas')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const { user_id, ...ideaData } = data
    return ideaData as Idea
  }

  async deleteIdea(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('ideas')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ===================================
  // SUBTASKS CRUD Operations
  // ===================================

  async createSubTask(subTask: Omit<SubTask, 'id' | 'created_at'>): Promise<SubTask> {
    const userId = await this.getCurrentUserId()

    if (process.env.NODE_ENV === 'development') {
      console.log('createSubTask: Creating subtask:', subTask.title)
    }

    const { data, error } = await this.supabase
      .from('subtasks')
      .insert({ ...subTask, user_id: userId })
      .select()
      .single()

    if (error) {
      console.error('createSubTask: Failed to create subtask:', {
        title: subTask.title,
        error: error.message,
        code: error.code
      })
      throw error
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('createSubTask: Successfully created subtask:', subTask.title)
    }

    const { user_id, ...subTaskData } = data
    return subTaskData as SubTask
  }

  async getSubTask(id: string): Promise<SubTask | null> {
    const { data, error } = await this.supabase
      .from('subtasks')
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    const { user_id, ...subTaskData } = data
    return subTaskData as SubTask
  }

  async getSubTasksByParentId(parentTaskId: string): Promise<SubTask[]> {
    const { data, error } = await this.supabase
      .from('subtasks')
      .select()
      .eq('parent_task_id', parentTaskId)
      .order('sort_order', { ascending: true })

    if (error) throw error

    return data.map(({ user_id, ...subTask }) => subTask as SubTask)
  }

  async getAllSubTasks(): Promise<SubTask[]> {
    const { data, error } = await this.supabase
      .from('subtasks')
      .select()
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(({ user_id, ...subTask }) => subTask as SubTask)
  }

  async updateSubTask(id: string, updates: Partial<Omit<SubTask, 'id' | 'created_at'>>): Promise<SubTask> {
    const { data, error } = await this.supabase
      .from('subtasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const { user_id, ...subTaskData } = data
    return subTaskData as SubTask
  }

  async deleteSubTask(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('subtasks')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async deleteSubTasksByParentId(parentTaskId: string): Promise<void> {
    const { error } = await this.supabase
      .from('subtasks')
      .delete()
      .eq('parent_task_id', parentTaskId)

    if (error) throw error
  }

  // ===================================
  // SETTINGS Operations
  // ===================================

  async getSettings(): Promise<Settings> {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await this.supabase
        .from('user_settings')
        .select()
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default settings
          return await this.createDefaultSettings()
        }
        throw error
      }

      // Convert database format to Settings interface
      return {
        id: 'main',
        timezone: data.timezone as 'Asia/Tokyo',
        urgency_thresholds: data.urgency_thresholds as { soon: number; next7: number; next30: number },
        features: data.features as { connectors_readonly: boolean; plan_suggestion: boolean; ml_ranking: boolean; geolocation: boolean },
        updated_at: data.updated_at
      }
    } catch (err) {
      console.error('Failed to get settings from database, using localStorage fallback:', err)
      return this.getSettingsFromLocalStorage()
    }
  }

  private async createDefaultSettings(): Promise<Settings> {
    try {
      const userId = await this.getCurrentUserId()

      const defaultSettings = {
        timezone: 'Asia/Tokyo' as const,
        urgency_thresholds: {
          soon: URGENCY_THRESHOLDS.SOON,
          next7: URGENCY_THRESHOLDS.NEXT_7,
          next30: URGENCY_THRESHOLDS.NEXT_30
        },
        features: {
          connectors_readonly: false,
          plan_suggestion: false,
          ml_ranking: false,
          geolocation: false
        }
      }

      const { data, error } = await this.supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          ...defaultSettings
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: 'main',
        timezone: data.timezone as 'Asia/Tokyo',
        urgency_thresholds: data.urgency_thresholds as { soon: number; next7: number; next30: number },
        features: data.features as { connectors_readonly: boolean; plan_suggestion: boolean; ml_ranking: boolean; geolocation: boolean },
        updated_at: data.updated_at
      }
    } catch (err) {
      console.error('Failed to create default settings:', err)
      return this.getSettingsFromLocalStorage()
    }
  }

  private getSettingsFromLocalStorage(): Settings {
    // Fallback to localStorage
    const storedSettings = localStorage.getItem('tasuku-settings')
    if (storedSettings) {
      return JSON.parse(storedSettings)
    }

    // Return default settings
    const defaultSettings: Settings = {
      id: 'main',
      timezone: 'Asia/Tokyo' as const,
      urgency_thresholds: {
        soon: URGENCY_THRESHOLDS.SOON,
        next7: URGENCY_THRESHOLDS.NEXT_7,
        next30: URGENCY_THRESHOLDS.NEXT_30
      },
      features: {
        connectors_readonly: false,
        plan_suggestion: false,
        ml_ranking: false,
        geolocation: false
      },
      updated_at: new Date().toISOString()
    }

    localStorage.setItem('tasuku-settings', JSON.stringify(defaultSettings))
    return defaultSettings
  }

  async updateSettings(updates: Partial<Omit<Settings, 'id' | 'updated_at'>>): Promise<Settings> {
    try {
      const userId = await this.getCurrentUserId()

      const { data, error } = await this.supabase
        .from('user_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create new settings
          const { data: newData, error: insertError } = await this.supabase
            .from('user_settings')
            .insert({
              user_id: userId,
              timezone: 'Asia/Tokyo',
              urgency_thresholds: {
                soon: URGENCY_THRESHOLDS.SOON,
                next7: URGENCY_THRESHOLDS.NEXT_7,
                next30: URGENCY_THRESHOLDS.NEXT_30
              },
              features: {
                connectors_readonly: false,
                plan_suggestion: false,
                ml_ranking: false,
                geolocation: false
              },
              ...updates
            })
            .select()
            .single()

          if (insertError) throw insertError

          return {
            id: 'main',
            timezone: newData.timezone as 'Asia/Tokyo',
            urgency_thresholds: newData.urgency_thresholds as { soon: number; next7: number; next30: number },
            features: newData.features as { connectors_readonly: boolean; plan_suggestion: boolean; ml_ranking: boolean; geolocation: boolean },
            updated_at: newData.updated_at
          }
        }
        throw error
      }

      return {
        id: 'main',
        timezone: data.timezone as 'Asia/Tokyo',
        urgency_thresholds: data.urgency_thresholds as { soon: number; next7: number; next30: number },
        features: data.features as { connectors_readonly: boolean; plan_suggestion: boolean; ml_ranking: boolean; geolocation: boolean },
        updated_at: data.updated_at
      }
    } catch (err) {
      console.error('Failed to update settings in database, using localStorage fallback:', err)
      // Fallback to localStorage
      const currentSettings = this.getSettingsFromLocalStorage()
      const updatedSettings: Settings = {
        ...currentSettings,
        ...updates,
        updated_at: new Date().toISOString()
      }

      localStorage.setItem('tasuku-settings', JSON.stringify(updatedSettings))
      return updatedSettings
    }
  }

  // ===================================
  // LOCATION TAGS Operations (Not implemented - tables don't exist)
  // ===================================

  async createLocationTag(tag: Omit<LocationTag, 'id' | 'created_at'>): Promise<LocationTag> {
    throw new Error(ERROR_MESSAGES.LOCATION_TAGS_NOT_IMPLEMENTED)
  }

  async getAllLocationTags(): Promise<LocationTag[]> {
    return [] // Return empty array for now
  }

  async deleteLocationTag(id: string): Promise<void> {
    throw new Error(ERROR_MESSAGES.LOCATION_TAGS_NOT_IMPLEMENTED)
  }

  // ===================================
  // UNIFIED ITEMS Operations (Not implemented - tables don't exist)
  // ===================================

  async createUnifiedItem(item: Omit<UnifiedItem, 'read_only'> & { id?: never; created_at?: never }): Promise<UnifiedItem> {
    throw new Error(ERROR_MESSAGES.UNIFIED_ITEMS_NOT_IMPLEMENTED)
  }

  async getAllUnifiedItems(): Promise<UnifiedItem[]> {
    return [] // Return empty array for now
  }

  async deleteUnifiedItem(source: string, sourceId: string): Promise<void> {
    throw new Error(ERROR_MESSAGES.UNIFIED_ITEMS_NOT_IMPLEMENTED)
  }

  // ===================================
  // Database Utility Methods
  // ===================================

  async init(): Promise<void> {
    // Supabaseでは明示的な初期化は不要
    // 認証状態のみ確認
    await this.getCurrentUserId()
  }

  async clearAllData(): Promise<void> {
    const userId = await this.getCurrentUserId()

    // Only clear tables that exist
    const tables = ['subtasks', 'recurring_logs', 'tasks', 'recurring_tasks', 'ideas', 'user_settings'] as const

    for (const table of tables) {
      const { error } = await this.supabase
        .from(table)
        .delete()
        .eq('user_id', userId)

      if (error) throw error
    }

    // Clear localStorage settings
    localStorage.removeItem('tasuku-settings')
  }
}

// Singleton instance
export const supabaseDb = new SupabaseTasukuDatabase()

// Legacy compatibility - same interface as IndexedDB version
export const db = supabaseDb
export default supabaseDb