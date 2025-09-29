// Recurring Templates Hook - Phase 2: Template Management System
// Based on RECURRING_REDESIGN_LOG.md specification

'use client'

import { useState, useEffect, useCallback } from 'react'
import { RecurringTemplatesService } from '@/lib/db/recurring-templates'
import type {
  RecurringTemplate,
  RecurringTemplateCreate,
  RecurringTemplateUpdate,
  RecurringTemplateFilters
} from '@/lib/types/recurring-template'
import { withErrorHandling } from '@/lib/utils/error-handler'

interface UseRecurringTemplatesResult {
  templates: RecurringTemplate[]
  loading: boolean
  error: string | null

  // Data operations
  loadTemplates: (filters?: RecurringTemplateFilters) => Promise<void>
  createTemplate: (template: RecurringTemplateCreate) => Promise<void>
  updateTemplate: (id: string, updates: RecurringTemplateUpdate) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  toggleTemplate: (id: string) => Promise<void>

  // Filtering
  getActiveTemplates: () => RecurringTemplate[]
  getTemplatesByPattern: (pattern: RecurringTemplate['pattern']) => RecurringTemplate[]
}

export function useRecurringTemplates(autoLoad: boolean = true): UseRecurringTemplatesResult {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const templatesService = new RecurringTemplatesService()

  // Load templates with optional filters
  const loadTemplates = useCallback(async (filters?: RecurringTemplateFilters) => {
    await withErrorHandling(
      async () => {
        setLoading(true)
        const allTemplates = await templatesService.getAllTemplates(filters)
        setTemplates(allTemplates)
        setError(null)
      },
      'useRecurringTemplates.loadTemplates',
      setError
    )
    setLoading(false)
  }, [templatesService])

  // Create new template
  const createTemplate = useCallback(async (template: RecurringTemplateCreate) => {
    await withErrorHandling(
      async () => {
        await templatesService.createTemplate(template)
        await loadTemplates() // Reload templates
      },
      'useRecurringTemplates.createTemplate',
      setError
    )
  }, [loadTemplates, templatesService])

  // Update template
  const updateTemplate = useCallback(async (id: string, updates: RecurringTemplateUpdate) => {
    await withErrorHandling(
      async () => {
        await templatesService.updateTemplate(id, updates)
        await loadTemplates() // Reload templates
      },
      'useRecurringTemplates.updateTemplate',
      setError
    )
  }, [loadTemplates, templatesService])

  // Delete template
  const deleteTemplate = useCallback(async (id: string) => {
    await withErrorHandling(
      async () => {
        await templatesService.deleteTemplate(id)
        await loadTemplates() // Reload templates
      },
      'useRecurringTemplates.deleteTemplate',
      setError
    )
  }, [loadTemplates, templatesService])

  // Toggle template active status
  const toggleTemplate = useCallback(async (id: string) => {
    await withErrorHandling(
      async () => {
        await templatesService.toggleTemplate(id)
        await loadTemplates() // Reload templates
      },
      'useRecurringTemplates.toggleTemplate',
      setError
    )
  }, [loadTemplates, templatesService])

  // Get active templates only
  const getActiveTemplates = useCallback((): RecurringTemplate[] => {
    return templates.filter(template => template.active)
  }, [templates])

  // Get templates by pattern
  const getTemplatesByPattern = useCallback((pattern: RecurringTemplate['pattern']): RecurringTemplate[] => {
    return templates.filter(template => template.pattern === pattern && template.active)
  }, [templates])

  // Initial load
  useEffect(() => {
    if (autoLoad) {
      loadTemplates()
    }
  }, [autoLoad, loadTemplates])

  return {
    templates,
    loading,
    error,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplate,
    getActiveTemplates,
    getTemplatesByPattern
  }
}