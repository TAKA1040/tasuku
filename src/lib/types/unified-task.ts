// 統一タスク管理システムの型定義
// YYYYMMDDTTCCC 形式の番号システム

import { logger } from '@/lib/utils/logger'

// ファイルアタッチメント型
export interface FileAttachment {
  file_name: string
  file_type: string
  file_size: number
  file_data: string
}

export interface SubTask {
  id: string
  parent_task_id: string
  title: string
  completed: boolean
  created_at: string
  updated_at: string
  sort_order?: number
}

export interface UnifiedTask {
  id: string
  user_id: string
  title: string
  memo?: string | null
  display_number: string // YYYYMMDDTTCCC形式
  category?: string | null
  importance?: number | null
  due_date: string // 必須フィールド: '2025-09-24' or '2999-12-31'(期限なし)
  urls?: string[] | null
  attachment?: FileAttachment | null
  completed?: boolean | null
  completed_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  archived?: boolean | null
  snoozed_until?: string | null
  duration_min?: number | null
  task_type?: string | null // 'NORMAL' | 'RECURRING' | 'IDEA' | 'INBOX' | null
  start_time?: string | null // HH:MM format (e.g., "09:00", "14:30")
  end_time?: string | null // HH:MM format (future use)

  // 繰り返しタスク関連（完了時に次回due_dateを計算するために保持）
  recurring_pattern?: string | null // 'DAILY' | 'WEEKLY' | 'MONTHLY' | null
  recurring_interval?: number | null
  recurring_weekdays?: number[] | null
  recurring_day?: number | null
  recurring_template_id?: string | null // テンプレートとの紐付け

  // 履歴タスクの識別フラグ（doneテーブルから取得されたタスク）
  _isHistory?: boolean
}

// 統一ルールの定数（deprecated: use @/lib/constants instead）
// This is kept for backward compatibility but should not be used in new code
export const SPECIAL_DATES = {
  NO_DUE_DATE: '2999-12-31', // 期限なし（アイデア、買い物リストなど）
} as const

export type TaskType = 'NORMAL' | 'RECURRING' | 'IDEA' | 'INBOX'

export interface TaskFilters {
  completed?: boolean
  category?: string
  date_range?: {
    start: string
    end: string
  }
  importance_min?: number
  has_due_date?: boolean // true: 期限あり, false: 期限なし
}

export interface TaskSorters {
  field: 'display_number' | 'created_at' | 'due_date' | 'importance'
  direction: 'asc' | 'desc'
}

// 番号生成・解析ユーティリティクラス
/**
 * DisplayNumberUtils - ディスプレイ番号の表示フォーマット用ユーティリティ
 *
 * ⚠️ 重要な注意事項:
 * - 番号の**生成**には UnifiedTasksService.generateDisplayNumber() を使用してください
 * - このクラスは主に番号の**表示**（formatCompact）に使用します
 * - generateDisplayNumber() メソッドは非推奨です（互換性のため残されています）
 */
export class DisplayNumberUtils {
  private static readonly TYPE_CODES = {
    NORMAL: '10',
    OVERDUE: '11',
    RECURRING: '12',
    IDEA: '13',
    INBOX: '14'
  } as const

  /**
   * ⚠️ 非推奨: このメソッドは使用しないでください
   *
   * 代わりに UnifiedTasksService.generateDisplayNumber() を使用してください。
   * 現在のシステムは T001 形式の番号を使用しています。
   *
   * @deprecated Use UnifiedTasksService.generateDisplayNumber() instead
   */
  static generateDisplayNumber(taskType: TaskType, date: Date = new Date()): string {
    const year = date.getFullYear().toString()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')

    let typeCode: string
    switch (taskType) {
      case 'NORMAL':
        typeCode = this.TYPE_CODES.NORMAL
        break
      case 'RECURRING':
        typeCode = this.TYPE_CODES.RECURRING
        break
      case 'IDEA':
        typeCode = this.TYPE_CODES.IDEA
        break
      case 'INBOX':
        typeCode = this.TYPE_CODES.INBOX
        break
      default:
        typeCode = this.TYPE_CODES.NORMAL
    }

    return `${year}${month}${day}${typeCode}001` // 001から開始
  }

  // 番号を解析して情報を取得
  static parseDisplayNumber(displayNumber: string): {
    year: number
    month: number
    day: number
    taskType: TaskType
    sequence: number
    isValid: boolean
  } {
    if (displayNumber.length !== 13) {
      return { year: 0, month: 0, day: 0, taskType: 'NORMAL', sequence: 0, isValid: false }
    }

    const year = parseInt(displayNumber.slice(0, 4))
    const month = parseInt(displayNumber.slice(4, 6))
    const day = parseInt(displayNumber.slice(6, 8))
    const typeCode = displayNumber.slice(8, 10)
    const sequence = parseInt(displayNumber.slice(10, 13))

    let taskType: TaskType = 'NORMAL'
    switch (typeCode) {
      case this.TYPE_CODES.NORMAL:
        taskType = 'NORMAL'
        break
      case this.TYPE_CODES.OVERDUE:
        taskType = 'NORMAL' // 期限切れも通常タスク扱い
        break
      case this.TYPE_CODES.RECURRING:
        taskType = 'RECURRING'
        break
      case this.TYPE_CODES.IDEA:
        taskType = 'IDEA'
        break
      case this.TYPE_CODES.INBOX:
        taskType = 'INBOX'
        break
    }

    const isValid = year > 2020 && month >= 1 && month <= 12 && day >= 1 && day <= 31 && sequence >= 1 && sequence <= 999

    return { year, month, day, taskType, sequence, isValid }
  }

  // 次の連番を生成
  static generateNextSequence(existingNumbers: string[], baseNumber: string): string {
    const base = baseNumber.slice(0, 10) // YYYYMMDDTT部分
    const existingSequences = existingNumbers
      .filter(num => num.startsWith(base))
      .map(num => parseInt(num.slice(10, 13)))
      .filter(seq => !isNaN(seq))
      .sort((a, b) => a - b)

    let nextSequence = 1
    for (const seq of existingSequences) {
      if (seq === nextSequence) {
        nextSequence++
      } else {
        break
      }
    }

    if (nextSequence > 999) {
      throw new Error('Maximum sequence number reached for this date and type')
    }

    return `${base}${nextSequence.toString().padStart(3, '0')}`
  }

  // 番号の妥当性をチェック
  static isValidDisplayNumber(displayNumber: string): boolean {
    return this.parseDisplayNumber(displayNumber).isValid
  }

  // 表示用フォーマット（読みやすい形式）
  static formatForDisplay(displayNumber: string): string {
    const parsed = this.parseDisplayNumber(displayNumber)
    if (!parsed.isValid) return displayNumber

    const typeLabel = {
      'NORMAL': '通常',
      'RECURRING': '繰返',
      'IDEA': 'アイデア',
      'INBOX': 'Inbox'
    }[parsed.taskType] || '通常'

    return `${parsed.year}/${parsed.month}/${parsed.day}-${typeLabel}-${parsed.sequence.toString().padStart(3, '0')}`
  }

  // コンパクト番号表示（連番のみ）
  static formatCompact(displayNumber: string): string {
    // デバッグログ
    if (process.env.NODE_ENV === 'development') {
      logger.info('formatCompact input:', { displayNumber, type: typeof displayNumber, length: displayNumber?.length })
    }

    // null/undefined/空文字チェック
    if (!displayNumber) {
      logger.info('formatCompact: displayNumber is empty')
      return '---'
    }

    // 新形式 T001 のような形式に対応
    if (displayNumber.startsWith('T') && displayNumber.length === 4) {
      const number = displayNumber.substring(1)
      if (/^\d{3}$/.test(number)) {
        if (process.env.NODE_ENV === 'development') {
          logger.info('formatCompact: T001 format matched, returning:', number)
        }
        return number
      } else {
        logger.info('formatCompact: T format but invalid number part:', number)
      }
    }

    // 古いアイデア形式 T1234567890-abcdef に対応
    if (displayNumber.startsWith('T') && displayNumber.includes('-')) {
      // 最後の数文字を表示番号として使用
      const parts = displayNumber.split('-')
      if (parts.length >= 2) {
        const suffix = parts[parts.length - 1]
        if (process.env.NODE_ENV === 'development') {
          logger.info('formatCompact: old idea format, returning suffix:', suffix)
        }
        return suffix.substring(0, 3).toUpperCase() // 最初の3文字を大文字で
      }
    }

    // 旧形式 YYYYMMDDTTCCC のような形式にも対応
    const parsed = this.parseDisplayNumber(displayNumber)
    if (process.env.NODE_ENV === 'development') {
      logger.info('formatCompact: parseDisplayNumber result:', parsed)
    }
    if (!parsed.isValid) {
      logger.info('formatCompact: parsed invalid, returning ---')
      return '---'
    }
    return parsed.sequence.toString().padStart(3, '0')
  }
}

// マイグレーション関連の型
export interface MigrationResult {
  success: boolean
  total: number
  migrated: number
  errors: string[]
}

export interface LegacyTask {
  id: string
  title: string
  memo?: string
  category: string
  importance: number
  due_date?: string
  urls?: string[]
  attachment?: FileAttachment
  completed: boolean
  created_at: string
}

export interface LegacyRecurringTask {
  id: string
  title: string
  memo?: string
  category: string
  importance: number
  urls?: string[]
  attachment?: FileAttachment
  pattern: string
  interval: number
  created_at: string
}