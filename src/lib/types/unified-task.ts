// 統一タスク管理システムの型定義
// YYYYMMDDTTCCC 形式の番号システム

// ファイルアタッチメント型
export interface FileAttachment {
  file_name: string
  file_type: string
  file_size: number
  file_data: string
}

export interface UnifiedTask {
  id: string
  user_id: string
  title: string
  memo?: string
  display_number: string // YYYYMMDDTTCCC形式
  task_type: TaskType
  category: string
  importance: number
  due_date?: string
  urls?: string[]
  attachment?: {
    file_name: string
    file_type: string
    file_data: string
  }
  completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string

  // 繰り返しタスク関連
  recurring_pattern?: string
  recurring_interval?: number
  last_completed_date?: string
}

export type TaskType = 'NORMAL' | 'RECURRING' | 'IDEA'

export interface TaskFilters {
  completed?: boolean
  task_type?: TaskType
  category?: string
  date_range?: {
    start: string
    end: string
  }
  importance_min?: number
}

export interface TaskSorters {
  field: 'display_number' | 'created_at' | 'due_date' | 'importance'
  direction: 'asc' | 'desc'
}

// 番号生成・解析ユーティリティクラス
export class DisplayNumberUtils {
  private static readonly TYPE_CODES = {
    NORMAL: '10',
    OVERDUE: '11',
    RECURRING: '12',
    IDEA: '13'
  } as const

  // YYYYMMDDTTCCC形式の番号を生成
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
      'IDEA': 'アイデア'
    }[parsed.taskType] || '通常'

    return `${parsed.year}/${parsed.month}/${parsed.day}-${typeLabel}-${parsed.sequence.toString().padStart(3, '0')}`
  }

  // コンパクト番号表示（連番のみ）
  static formatCompact(displayNumber: string): string {
    const parsed = this.parseDisplayNumber(displayNumber)
    if (!parsed.isValid) return '---'
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