// Recurring Templates Database Service - manarieDB (PostgreSQL) 対応版
// API経由でPostgreSQLにアクセス

import type {
  RecurringTemplate,
  RecurringTemplateCreate,
  RecurringTemplateUpdate,
  RecurringTemplateFilters
} from '@/lib/types/recurring-template'
import { logger } from '@/lib/utils/logger'

// APIヘルパー
async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'API request failed')
  }

  return data.data
}

export class RecurringTemplatesService {
  // Create new recurring template
  async createTemplate(template: RecurringTemplateCreate): Promise<RecurringTemplate> {
    logger.info('📝 テンプレート作成:', template.title)
    return fetchApi<RecurringTemplate>('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    })
  }

  // Get all templates for current user
  async getAllTemplates(filters?: RecurringTemplateFilters): Promise<RecurringTemplate[]> {
    const params = new URLSearchParams()

    if (filters?.pattern) {
      params.set('pattern', filters.pattern)
    }
    if (filters?.category) {
      params.set('category', filters.category)
    }
    if (filters?.active !== undefined) {
      params.set('active', String(filters.active))
    }

    const query = params.toString()
    const templates = await fetchApi<RecurringTemplate[]>(`/templates${query ? `?${query}` : ''}`)

    // デバッグ: 取得したテンプレートのURL情報をログ出力
    if (templates && templates.length > 0) {
      logger.info('📋 テンプレート取得:', templates.map(t => ({
        id: t.id,
        title: t.title,
        hasUrls: !!t.urls,
        urlsCount: Array.isArray(t.urls) ? t.urls.length : 0,
        urls: t.urls
      })))
    }

    return templates || []
  }

  // Get active templates only
  async getActiveTemplates(): Promise<RecurringTemplate[]> {
    return this.getAllTemplates({ active: true })
  }

  // Get template by ID
  async getTemplateById(id: string): Promise<RecurringTemplate | null> {
    try {
      const templates = await this.getAllTemplates()
      return templates.find(t => t.id === id) || null
    } catch (error) {
      logger.error('Failed to fetch recurring template:', error)
      throw error
    }
  }

  // Update recurring template
  async updateTemplate(id: string, updates: RecurringTemplateUpdate): Promise<RecurringTemplate> {
    logger.info('📝 テンプレート更新:', id)
    return fetchApi<RecurringTemplate>('/templates', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    })
  }

  // Delete recurring template
  async deleteTemplate(id: string): Promise<void> {
    logger.info('🗑️ テンプレート削除:', id)
    await fetchApi<void>(`/templates?id=${id}`, {
      method: 'DELETE',
    })
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
