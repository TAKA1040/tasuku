// Supabase Database Manager
// IndexedDBからSupabase PostgreSQLに完全移行

import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { URGENCY_THRESHOLDS } from '@/lib/constants'
import {
  type Settings,
  type Task,
  type RecurringTask,
  type RecurringLog,
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
      throw new Error('Authentication required')
    }
    return user.id
  }

  // ===================================
  // TASKS CRUD Operations
  // ===================================
  
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const userId = await this.getCurrentUserId()
    const { data, error } = await this.supabase
      .from('tasks')
      .insert({ ...task, user_id: userId })
      .select()
      .single()
      
    if (error) throw error
    
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
    const { data, error } = await this.supabase
      .from('recurring_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    
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
  // SETTINGS Operations (Simplified - stored in localStorage for now)
  // ===================================

  async getSettings(): Promise<Settings> {
    // Simplified implementation using localStorage
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
    const currentSettings = await this.getSettings()
    const updatedSettings: Settings = {
      ...currentSettings,
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    localStorage.setItem('tasuku-settings', JSON.stringify(updatedSettings))
    return updatedSettings
  }

  // ===================================
  // LOCATION TAGS Operations (Not implemented - tables don't exist)
  // ===================================

  async createLocationTag(tag: Omit<LocationTag, 'id' | 'created_at'>): Promise<LocationTag> {
    throw new Error('Location tags feature not implemented in current database schema')
  }

  async getAllLocationTags(): Promise<LocationTag[]> {
    return [] // Return empty array for now
  }

  async deleteLocationTag(id: string): Promise<void> {
    throw new Error('Location tags feature not implemented in current database schema')
  }

  // ===================================
  // UNIFIED ITEMS Operations (Not implemented - tables don't exist)
  // ===================================

  async createUnifiedItem(item: Omit<UnifiedItem, 'read_only'> & { id?: never; created_at?: never }): Promise<UnifiedItem> {
    throw new Error('Unified items feature not implemented in current database schema')
  }

  async getAllUnifiedItems(): Promise<UnifiedItem[]> {
    return [] // Return empty array for now
  }

  async deleteUnifiedItem(source: string, sourceId: string): Promise<void> {
    throw new Error('Unified items feature not implemented in current database schema')
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
    const tables = ['recurring_logs', 'tasks', 'recurring_tasks'] as const
    
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