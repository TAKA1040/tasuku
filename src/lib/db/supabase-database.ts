// Supabase Database Manager
// IndexedDBからSupabase PostgreSQLに完全移行

import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/supabase'
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
  type UnifiedItem
} from './schema'

// Note: TaskInsert, RecurringTaskInsert, _IdeaInsert are unused (using Omit inline instead)
// 挿入専用の薄い型定義（display_numberを省略可）
type _IdeaInsert = Omit<Idea, 'id' | 'created_at' | 'updated_at' | 'display_number' | 'text'> & {
  display_number?: string | null
  title: string // textの代わりにtitleを使用
}

// JSON⇄FileAttachment 相互変換関数
type FileAttachment = {
  file_name: string
  file_type: string
  file_size: number
  file_data: string
}

const serializeAttachment = (attachment: FileAttachment | undefined): Json | null => {
  if (!attachment) return null
  try {
    // 安全なクローン
    return {
      file_name: attachment.file_name,
      file_type: attachment.file_type,
      file_size: attachment.file_size,
      file_data: attachment.file_data
    }
  } catch (error) {
    console.error('serializeAttachment error:', error)
    return null
  }
}

const deserializeAttachment = (_json: Json | null): FileAttachment | undefined => {
  // 一時的に無効化してテスト
  return undefined
}

// 挿入用の型をDatabase型から直接使用
type UnifiedTaskInsertPayload = Database['public']['Tables']['unified_tasks']['Insert']

// buildUnifiedTaskInsert関数の入力データ型
type BuildTaskInputData = {
  display_number?: string | null
  user_id?: string | null
  attachment?: FileAttachment
  text?: string
  title?: string
  urls?: string[]
  memo?: string | null
  category?: string | null
  importance?: number | null
  due_date?: string | null
  completed?: boolean
  completed_at?: string | null
  archived?: boolean
  snoozed_until?: string | null
  duration_min?: number | null
  [key: string]: unknown // その他のプロパティを許可
}

// payload構築の共通ヘルパ
const buildUnifiedTaskInsert = (data: BuildTaskInputData, taskType: string): UnifiedTaskInsertPayload => {
  const { display_number, user_id, attachment, text, urls, ...cleanData } = data

  // 安全なペイロードを構築
  const safePayload: UnifiedTaskInsertPayload = {
    title: text || cleanData.title || '',
    task_type: taskType,
    memo: cleanData.memo || null,
    category: cleanData.category || null,
    importance: cleanData.importance || null,
    due_date: cleanData.due_date || null,
    urls: urls && Array.isArray(urls) ? urls : undefined,
    attachment: serializeAttachment(attachment),
    completed: cleanData.completed || false,
    completed_at: cleanData.completed_at || null,
    archived: cleanData.archived || false,
    snoozed_until: cleanData.snoozed_until || null,
    duration_min: cleanData.duration_min || null,
    display_number: display_number || '',
    user_id: user_id || ''
  }

  return safePayload
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
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED)
    }
    return user.id
  }

  // ===================================
  // TASKS CRUD Operations
  // ===================================
  
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    // Note: userId取得は認証確認のため（RLSが自動的にuser_idを設定）
    const _userId = await this.getCurrentUserId()

    // 開発環境でのみデバッグログを出力
    if (process.env.NODE_ENV === 'development') {
      console.log('createTask: Creating task:', task.title)
    }

    // buildUnifiedTaskInsertヘルパを使用
    const insertPayload = buildUnifiedTaskInsert(task, 'NORMAL')
    const { data, error } = await this.supabase
      .from('unified_tasks')
      .insert(insertPayload)
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

    // user_idを除いてTaskを返す、attachmentをデシリアライズ
    const { user_id: _user_id, ...taskData } = data
    return {
      ...taskData,
      attachment: deserializeAttachment(taskData.attachment)
    } as Task
  }

  async getTask(id: string): Promise<Task | null> {
    const { data, error } = await this.supabase
      .from('unified_tasks')
      .select()
      .eq('id', id)
      .eq('task_type', 'NORMAL')
      .single()
      
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    const { user_id: _user_id, ...taskData } = data
    return {
      ...taskData,
      attachment: deserializeAttachment(taskData.attachment)
    } as Task
  }

  async getAllTasks(): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('unified_tasks')
      .select()
      .eq('task_type', 'NORMAL')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(({ user_id: _user_id, ...task }) => ({
      ...task,
      attachment: deserializeAttachment(task.attachment)
    } as Task))
  }

  async getTasksByDate(date: string): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('unified_tasks')
      .select()
      .eq('due_date', date)
      .eq('task_type', 'NORMAL')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(({ user_id: _user_id, ...task }) => ({
      ...task,
      attachment: deserializeAttachment(task.attachment)
    } as Task))
  }

  // Remove this method as the view doesn't exist
  // Use getAllTasks() and compute urgency on client side instead

  async updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>): Promise<Task> {
    const { data, error } = await this.supabase
      .from('unified_tasks')
      .update(updates)
      .eq('id', id)
      .eq('task_type', 'NORMAL')
      .select()
      .single()
      
    if (error) throw error
    
    const { user_id: _user_id, ...taskData } = data
    return {
      ...taskData,
      attachment: taskData.attachment as Task['attachment']
    } as Task
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('unified_tasks')
      .delete()
      .eq('id', id)
      .eq('task_type', 'NORMAL')
      
    if (error) throw error
  }

  // ===================================
  // RECURRING TASKS CRUD Operations
  // ===================================

  async createRecurringTask(task: Omit<RecurringTask, 'id' | 'created_at' | 'updated_at'>): Promise<RecurringTask> {
    // buildUnifiedTaskInsertヘルパを使用
    const insertPayload = buildUnifiedTaskInsert(task, 'RECURRING')
    const { data, error } = await this.supabase
      .from('unified_tasks')
      .insert(insertPayload)
      .select()
      .single()
      
    if (error) throw error

    const { user_id: _user_id, ...taskData } = data
    return {
      ...taskData,
      attachment: deserializeAttachment(taskData.attachment)
    } as RecurringTask
  }

  async getRecurringTask(id: string): Promise<RecurringTask | null> {
    const { data, error } = await this.supabase
      .from('unified_tasks')
      .select()
      .eq('id', id)
      .eq('task_type', 'RECURRING')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    const { user_id: _user_id, ...taskData } = data
    return {
      ...taskData,
      attachment: deserializeAttachment(taskData.attachment)
    } as RecurringTask
  }

  async getAllRecurringTasks(): Promise<RecurringTask[]> {
    const { data, error } = await this.supabase
      .from('unified_tasks')
      .select()
      .eq('task_type', 'RECURRING')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(({ user_id: _user_id, ...task }) => ({
      ...task,
      attachment: deserializeAttachment(task.attachment)
    } as RecurringTask))
  }

  async getActiveRecurringTasks(): Promise<RecurringTask[]> {
    const { data, error } = await this.supabase
      .from('unified_tasks')
      .select()
      .eq('task_type', 'RECURRING')
      .eq('active', true)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    return data.map(({ user_id: _user_id, ...task }) => ({
      ...task,
      attachment: deserializeAttachment(task.attachment)
    } as RecurringTask))
  }

  async updateRecurringTask(id: string, updates: Partial<Omit<RecurringTask, 'id' | 'created_at' | 'updated_at'>>): Promise<RecurringTask> {
    if (process.env.NODE_ENV === 'development') {
      console.log('updateRecurringTask: Updating task:', updates.title || id)
    }

    const { data, error } = await this.supabase
      .from('unified_tasks')
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
    const { user_id: _user_id, ...taskData } = data
    return {
      ...taskData,
      attachment: deserializeAttachment(taskData.attachment)
    } as RecurringTask
  }

  async deleteRecurringTask(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('unified_tasks')
      .delete()
      .eq('id', id)
      .eq('task_type', 'RECURRING')
      
    if (error) throw error
  }

  // ===================================
  // RECURRING LOGS Operations
  // ===================================

  async logRecurringTask(recurringId: string, date: string): Promise<void> {
    const userId = await this.getCurrentUserId()
    const { error } = await this.supabase
      .from('done')
      .insert({
        user_id: userId,
        original_task_id: recurringId,
        task_type: 'RECURRING',
        task_title: 'Legacy recurring task',
        completion_date: date
      })
      
    if (error) throw error
  }

  async getRecurringLogs(recurringId: string): Promise<RecurringLog[]> {
    const { data, error } = await this.supabase
      .from('done')
      .select()
      .eq('original_task_id', recurringId)
      .eq('task_type', 'RECURRING')
      .order('completion_date', { ascending: false })
      
    if (error) throw error
    
    return data.map(({ user_id: _user_id, ...log }) => ({
      recurring_id: log.original_task_id,
      date: log.completed_at?.substring(0, 10) || '',
      logged_at: log.completed_at || ''
    } as RecurringLog))
  }

  async getRecurringLogsByDate(date: string): Promise<RecurringLog[]> {
    const { data, error } = await this.supabase
      .from('done')
      .select()
      .eq('completion_date', date)
      .eq('task_type', 'RECURRING')
      
    if (error) throw error
    
    return data.map(({ user_id: _user_id, ...log }) => ({
      recurring_id: log.original_task_id,
      date: log.completed_at?.substring(0, 10) || '',
      logged_at: log.completed_at || ''
    } as RecurringLog))
  }

  async getAllRecurringLogs(): Promise<RecurringLog[]> {
    const { data, error } = await this.supabase
      .from('done')
      .select()
      .eq('task_type', 'RECURRING')
      .order('completion_date', { ascending: false })
      
    if (error) throw error
    
    return data.map(({ user_id: _user_id, ...log }) => ({
      recurring_id: log.original_task_id,
      date: log.completed_at?.substring(0, 10) || '',
      logged_at: log.completed_at || ''
    } as RecurringLog))
  }

  async deleteRecurringLog(recurringId: string, date: string): Promise<void> {
    const { error } = await this.supabase
      .from('done')
      .delete()
      .eq('original_task_id', recurringId)
      .eq('completion_date', date)
      .eq('task_type', 'RECURRING')

    if (error) throw error
  }

  // ===================================
  // IDEAS CRUD Operations
  // ===================================

  async createIdea(idea: Omit<Idea, 'id' | 'created_at' | 'updated_at'>): Promise<Idea> {
    if (process.env.NODE_ENV === 'development') {
      console.log('createIdea: Creating idea:', idea.text)
    }

    // buildUnifiedTaskInsertヘルパを使用（text→title変換も含む）
    const insertPayload = buildUnifiedTaskInsert(idea, 'IDEA')
    const { data, error } = await this.supabase
      .from('unified_tasks')
      .insert(insertPayload)
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

    const { user_id: _user_id, ...ideaData } = data
    return {
      ...ideaData,
      text: ideaData.title, // title を text に正規化
      attachment: deserializeAttachment(ideaData.attachment)
    } as Idea
  }

  async getIdea(id: string): Promise<Idea | null> {
    const { data, error } = await this.supabase
      .from('unified_tasks')
      .select()
      .eq('id', id)
      .eq('task_type', 'IDEA')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    const { user_id: _user_id, ...ideaData } = data
    return {
      ...ideaData,
      text: ideaData.title, // title を text に正規化
      attachment: deserializeAttachment(ideaData.attachment)
    } as Idea
  }

  async getAllIdeas(): Promise<Idea[]> {
    const { data, error } = await this.supabase
      .from('unified_tasks')
      .select()
      .eq('task_type', 'IDEA')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(({ user_id: _user_id, ...idea }) => ({
      ...idea,
      text: idea.title, // title を text に正規化
      attachment: deserializeAttachment(idea.attachment)
    } as Idea))
  }

  async updateIdea(id: string, updates: Partial<Omit<Idea, 'id' | 'created_at' | 'updated_at'>>): Promise<Idea> {
    const payload = buildUnifiedTaskInsert(updates, 'IDEA')

    const { data, error } = await this.supabase
      .from('unified_tasks')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const { user_id: _user_id, ...ideaData } = data
    return {
      ...ideaData,
      text: ideaData.title, // title を text に正規化
      attachment: deserializeAttachment(ideaData.attachment)
    } as Idea
  }

  async deleteIdea(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('unified_tasks')
      .delete()
      .eq('id', id)
      .eq('task_type', 'IDEA')

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

    const { user_id: _user_id, ...subTaskData } = data
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

    const { user_id: _user_id, ...subTaskData } = data
    return subTaskData as SubTask
  }

  async getSubTasksByParentId(parentTaskId: string): Promise<SubTask[]> {
    const { data, error } = await this.supabase
      .from('subtasks')
      .select()
      .eq('parent_task_id', parentTaskId)
      .order('sort_order', { ascending: true })

    if (error) throw error

    return data.map(({ user_id: _user_id, ...subTask }) => subTask as SubTask)
  }

  async getAllSubTasks(): Promise<SubTask[]> {
    const { data, error } = await this.supabase
      .from('subtasks')
      .select()
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(({ user_id: _user_id, ...subTask }) => subTask as SubTask)
  }

  async updateSubTask(id: string, updates: Partial<Omit<SubTask, 'id' | 'created_at'>>): Promise<SubTask> {
    const { data, error } = await this.supabase
      .from('subtasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const { user_id: _user_id, ...subTaskData } = data
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

  async createLocationTag(_tag: Omit<LocationTag, 'id' | 'created_at'>): Promise<LocationTag> {
    throw new Error(ERROR_MESSAGES.LOCATION_TAGS_NOT_IMPLEMENTED)
  }

  async getAllLocationTags(): Promise<LocationTag[]> {
    return [] // Return empty array for now
  }

  async deleteLocationTag(_id: string): Promise<void> {
    throw new Error(ERROR_MESSAGES.LOCATION_TAGS_NOT_IMPLEMENTED)
  }

  // ===================================
  // UNIFIED ITEMS Operations (Not implemented - tables don't exist)
  // ===================================

  async createUnifiedItem(_item: Omit<UnifiedItem, 'read_only'> & { id?: never; created_at?: never }): Promise<UnifiedItem> {
    throw new Error(ERROR_MESSAGES.UNIFIED_ITEMS_NOT_IMPLEMENTED)
  }

  async getAllUnifiedItems(): Promise<UnifiedItem[]> {
    return [] // Return empty array for now
  }

  async deleteUnifiedItem(_source: string, _sourceId: string): Promise<void> {
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
    const tables = ['subtasks', 'unified_tasks', 'done', 'user_settings'] as const

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