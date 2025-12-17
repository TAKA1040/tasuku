// Recurring Templates Database Service - Phase 2: Template Management System
// Based on RECURRING_REDESIGN_LOG.md specification

import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  RecurringTemplate,
  RecurringTemplateCreate,
  RecurringTemplateUpdate,
  RecurringTemplateFilters
} from '@/lib/types/recurring-template'
import { logger } from '@/lib/utils/logger'

export class RecurringTemplatesService {
  private supabase: SupabaseClient

  constructor(supabase?: SupabaseClient) {
    // サーバー側から呼ばれる場合はsupabaseを受け取り、クライアント側は自動生成
    this.supabase = supabase || createClient()
  }

  async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user?.id) {
      throw new Error('User not authenticated')
    }
    return user.id
  }

  // Create new recurring template
  async createTemplate(template: RecurringTemplateCreate): Promise<RecurringTemplate> {
    const userId = await this.getCurrentUserId()

    const { data, error } = await this.supabase
      .from('recurring_templates')
      .insert({ ...template, user_id: userId })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create recurring template:', error)
      throw error
    }

    return data
  }

  // Get all templates for current user
  async getAllTemplates(filters?: RecurringTemplateFilters): Promise<RecurringTemplate[]> {
    const userId = await this.getCurrentUserId()

    let query = this.supabase
      .from('recurring_templates')
      .select('*')
      .eq('user_id', userId)

    // Apply filters
    if (filters?.pattern) {
      query = query.eq('pattern', filters.pattern)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch recurring templates:', error)
      throw error
    }

    // デバッグ: 取得したテンプレートのURL情報をログ出力
    if (data && data.length > 0) {
      logger.info('📋 テンプレート取得:', data.map(t => ({
        id: t.id,
        title: t.title,
        hasUrls: !!t.urls,
        urlsCount: Array.isArray(t.urls) ? t.urls.length : 0,
        urls: t.urls
      })))

      // 詳細ログ: 各テンプレートのURLsを個別に出力
      data.forEach(t => {
        logger.info(`🔍 [${t.title}] urls:`, t.urls, 'type:', typeof t.urls, 'isArray:', Array.isArray(t.urls))
        if (Array.isArray(t.urls) && t.urls.length > 0) {
          logger.info(`   ↳ URL内容:`, JSON.stringify(t.urls))
        }
      })
    }

    return data || []
  }

  // Get active templates only
  async getActiveTemplates(): Promise<RecurringTemplate[]> {
    return this.getAllTemplates({ active: true })
  }

  // Get template by ID
  async getTemplateById(id: string): Promise<RecurringTemplate | null> {
    const userId = await this.getCurrentUserId()

    const { data, error } = await this.supabase
      .from('recurring_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      logger.error('Failed to fetch recurring template:', error)
      throw error
    }

    return data
  }

  // Update recurring template
  async updateTemplate(id: string, updates: RecurringTemplateUpdate): Promise<RecurringTemplate> {
    const userId = await this.getCurrentUserId()

    const { data, error } = await this.supabase
      .from('recurring_templates')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update recurring template:', error)
      throw error
    }

    return data
  }

  // Delete recurring template
  async deleteTemplate(id: string): Promise<void> {
    const userId = await this.getCurrentUserId()

    const { error } = await this.supabase
      .from('recurring_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      logger.error('Failed to delete recurring template:', error)
      throw error
    }
  }

  // Toggle template active status
  async toggleTemplate(id: string): Promise<RecurringTemplate> {
    const template = await this.getTemplateById(id)
    if (!template) {
      throw new Error('Template not found')
    }

    return this.updateTemplate(id, { active: !template.active })
  }

  // Get templates by pattern
  async getTemplatesByPattern(pattern: RecurringTemplate['pattern']): Promise<RecurringTemplate[]> {
    return this.getAllTemplates({ pattern, active: true })
  }
}