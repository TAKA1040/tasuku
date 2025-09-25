// Recurring Template Types - Phase 2: Template Management System
// Based on RECURRING_REDESIGN_LOG.md specification

export interface RecurringTemplate {
  id: string
  title: string
  memo?: string
  category?: string
  importance: number
  pattern: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

  // For weekly: weekday specification [1,2,3,4,5] (Mon=1, Tue=2, ..., Sun=7)
  weekdays?: number[]

  // For monthly: day specification (1-31)
  day_of_month?: number

  // For yearly: month specification (1-12)
  month_of_year?: number

  // For yearly: day specification (1-31)
  day_of_year?: number

  active: boolean
  user_id: string
  created_at: string
  updated_at: string
}

export type RecurringTemplateCreate = Omit<RecurringTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export type RecurringTemplateUpdate = Partial<RecurringTemplateCreate>

export interface RecurringTemplateFilters {
  pattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  category?: string
  active?: boolean
}