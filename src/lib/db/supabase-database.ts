// Supabase Database Manager
// IndexedDBからSupabase PostgreSQLに完全移行

import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
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

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: Task & { user_id: string }
        Insert: Omit<Task & { user_id: string }, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>
      }
      recurring_tasks: {
        Row: RecurringTask & { user_id: string }
        Insert: Omit<RecurringTask & { user_id: string }, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<RecurringTask, 'id' | 'user_id' | 'created_at'>>
      }
      recurring_logs: {
        Row: RecurringLog & { user_id: string; id: string }
        Insert: Omit<RecurringLog & { user_id: string }, 'id'>
        Update: never
      }
      settings: {
        Row: Settings & { user_id: string }
        Insert: Omit<Settings, 'id'> & { user_id: string }
        Update: Partial<Omit<Settings, 'user_id'>>
      }
      location_tags: {
        Row: LocationTag & { user_id: string }
        Insert: Omit<LocationTag & { user_id: string }, 'id' | 'created_at'>
        Update: Partial<Omit<LocationTag, 'id' | 'user_id' | 'created_at'>>
      }
      unified_items: {
        Row: UnifiedItem & { user_id: string; id: string; created_at: string }
        Insert: Omit<UnifiedItem & { user_id: string }, 'id' | 'created_at'>
        Update: Partial<Omit<UnifiedItem, 'id' | 'user_id' | 'created_at' | 'read_only'>>
      }
    }
  }
}

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

  async getTasksWithUrgency(): Promise<TaskWithUrgency[]> {
    const { data, error } = await this.supabase
      .from('tasks_with_urgency')
      .select()
      .order('due_date', { ascending: true, nullsFirst: false })
      
    if (error) throw error
    
    return data.map(item => ({
      task: {
        id: item.id,
        title: item.title,
        memo: item.memo,
        due_date: item.due_date,
        completed: item.completed,
        created_at: item.created_at,
        updated_at: item.updated_at,
        completed_at: item.completed_at,
        rollover_count: item.rollover_count,
        archived: item.archived,
        snoozed_until: item.snoozed_until,
        duration_min: item.duration_min,
        importance: item.importance,
        category: item.category,
        urls: item.urls,
        location_tag_id: item.location_tag_id
      } as Task,
      urgency: item.urgency as UrgencyLevel,
      days_from_today: item.days_from_today
    }))
  }

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
    
    return data.map(({ user_id, id, ...log }) => log as RecurringLog)
  }

  async getRecurringLogsByDate(date: string): Promise<RecurringLog[]> {
    const { data, error } = await this.supabase
      .from('recurring_logs')
      .select()
      .eq('date', date)
      
    if (error) throw error
    
    return data.map(({ user_id, id, ...log }) => log as RecurringLog)
  }

  async getAllRecurringLogs(): Promise<RecurringLog[]> {
    const { data, error } = await this.supabase
      .from('recurring_logs')
      .select()
      .order('date', { ascending: false })
      
    if (error) throw error
    
    return data.map(({ user_id, id, ...log }) => log as RecurringLog)
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
  // SETTINGS Operations
  // ===================================

  async getSettings(): Promise<Settings> {
    const userId = await this.getCurrentUserId()
    const { data, error } = await this.supabase
      .from('settings')
      .select()
      .eq('user_id', userId)
      .single()
      
    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, create default
        return this.createDefaultSettings()
      }
      throw error
    }
    
    return {
      id: 'main', // Keep compatibility with IndexedDB schema
      timezone: data.timezone,
      urgency_thresholds: data.urgency_thresholds,
      features: data.features,
      updated_at: data.updated_at
    } as Settings
  }

  private async createDefaultSettings(): Promise<Settings> {
    const userId = await this.getCurrentUserId()
    const defaultSettings = {
      user_id: userId,
      timezone: 'Asia/Tokyo' as const,
      urgency_thresholds: { soon: 3, next7: 7, next30: 30 },
      features: {
        connectors_readonly: false,
        plan_suggestion: false,
        ml_ranking: false,
        geolocation: false
      }
    }
    
    const { data, error } = await this.supabase
      .from('settings')
      .insert(defaultSettings)
      .select()
      .single()
      
    if (error) throw error
    
    return {
      id: 'main',
      timezone: data.timezone,
      urgency_thresholds: data.urgency_thresholds,
      features: data.features,
      updated_at: data.updated_at
    } as Settings
  }

  async updateSettings(updates: Partial<Omit<Settings, 'id' | 'updated_at'>>): Promise<Settings> {
    const userId = await this.getCurrentUserId()
    const { data, error } = await this.supabase
      .from('settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
      
    if (error) throw error
    
    return {
      id: 'main',
      timezone: data.timezone,
      urgency_thresholds: data.urgency_thresholds,
      features: data.features,
      updated_at: data.updated_at
    } as Settings
  }

  // ===================================
  // LOCATION TAGS Operations
  // ===================================

  async createLocationTag(tag: Omit<LocationTag, 'id' | 'created_at'>): Promise<LocationTag> {
    const userId = await this.getCurrentUserId()
    const { data, error } = await this.supabase
      .from('location_tags')
      .insert({ ...tag, user_id: userId })
      .select()
      .single()
      
    if (error) throw error
    
    const { user_id, ...tagData } = data
    return tagData as LocationTag
  }

  async getAllLocationTags(): Promise<LocationTag[]> {
    const { data, error } = await this.supabase
      .from('location_tags')
      .select()
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    return data.map(({ user_id, ...tag }) => tag as LocationTag)
  }

  async deleteLocationTag(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('location_tags')
      .delete()
      .eq('id', id)
      
    if (error) throw error
  }

  // ===================================
  // UNIFIED ITEMS Operations
  // ===================================

  async createUnifiedItem(item: Omit<UnifiedItem, 'read_only'> & { id?: never; created_at?: never }): Promise<UnifiedItem> {
    const userId = await this.getCurrentUserId()
    const { data, error } = await this.supabase
      .from('unified_items')
      .insert({ ...item, user_id: userId, read_only: true })
      .select()
      .single()
      
    if (error) throw error
    
    const { user_id, id, created_at, ...itemData } = data
    return {
      ...itemData,
      read_only: true
    } as UnifiedItem
  }

  async getAllUnifiedItems(): Promise<UnifiedItem[]> {
    const { data, error } = await this.supabase
      .from('unified_items')
      .select()
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    return data.map(({ user_id, id, created_at, ...item }) => ({
      ...item,
      read_only: true
    } as UnifiedItem))
  }

  async deleteUnifiedItem(source: string, sourceId: string): Promise<void> {
    const { error } = await this.supabase
      .from('unified_items')
      .delete()
      .eq('source', source)
      .eq('source_id', sourceId)
      
    if (error) throw error
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
    
    // 関連データを削除（CASCADE設定により自動削除されるが、明示的に削除）
    const tables = ['unified_items', 'recurring_logs', 'tasks', 'recurring_tasks', 'location_tags', 'settings']
    
    for (const table of tables) {
      const { error } = await this.supabase
        .from(table)
        .delete()
        .eq('user_id', userId)
        
      if (error) throw error
    }
  }
}

// Singleton instance
export const supabaseDb = new SupabaseTasukuDatabase()

// Legacy compatibility - same interface as IndexedDB version
export const db = supabaseDb
export default supabaseDb