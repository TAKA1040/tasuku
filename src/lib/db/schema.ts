// Tasuku IndexedDB Schema Definition v1.0
// 設計図に厳密準拠したデータベース構造

export const DB_NAME = 'TasukuDB'
export const DB_VERSION = 2

// Entity Types
export interface Task {
  id: string
  title: string
  memo?: string
  due_date?: string // YYYY-MM-DD format (JST)
  completed: boolean
  created_at: string // ISO string (JST)
  updated_at: string // ISO string (JST)
  completed_at?: string // YYYY-MM-DD format (JST), only when completed
  
  // PHASE 1.2 - 繰り越し関連
  rollover_count?: number
  archived?: boolean
  snoozed_until?: string // YYYY-MM-DD format (JST)
  
  // PHASE 4.2 - 拡張フィールド
  duration_min?: number // 想定所要時間（分）
  importance?: 1 | 2 | 3 | 4 | 5 // 重要度
  category?: string // カテゴリ（仕事、プライベート、勉強など）
  urls?: string[] // 関連URL（最大5個）
  attachment?: {
    file_name: string
    file_type: string
    file_size: number
    file_data: string // Base64エンコードされたファイルデータ
  }
  location_tag_id?: string
}

export interface RecurringTask {
  id: string
  title: string
  memo?: string
  frequency: 'DAILY' | 'INTERVAL_DAYS' | 'WEEKLY' | 'MONTHLY'
  interval_n: number // 間隔（省略時1）
  weekdays?: number[] // WEEKLY用 0=月〜6=日
  month_day?: number // MONTHLY用 1〜31
  start_date: string // YYYY-MM-DD format (JST)
  end_date?: string // YYYY-MM-DD format (JST), 任意
  max_occurrences?: number // 回数上限、任意
  active: boolean
  created_at: string // ISO string (JST)
  updated_at: string // ISO string (JST)
}

// サブタスク（買い物リスト等で使用）
export interface SubTask {
  id: string
  parent_task_id: string // 親タスクのID
  title: string
  completed: boolean
  sort_order: number // 表示順序
  created_at: string // ISO string (JST)
}

// 買い物リスト
export interface ShoppingList {
  id: string
  store_name: string // 店舗名（セブンイレブン等）
  created_at: string // ISO string (JST)
  updated_at: string // ISO string (JST)
}

// 買い物アイテム
export interface ShoppingItem {
  id: string
  shopping_list_id: string // 買い物リストのID
  item_name: string // 商品名
  completed: boolean // 購入済みかどうか
  sort_order: number // 表示順序
  created_at: string // ISO string (JST)
}

export interface RecurringLog {
  recurring_id: string
  date: string // YYYY-MM-DD format (JST)
  logged_at: string // ISO string (JST)
}

// Ideas (やることリスト)
export interface Idea {
  id: string
  text: string
  completed: boolean
  created_at: string // ISO string (JST)
  updated_at: string // ISO string (JST)
}

export interface Settings {
  id: 'main' // Single record
  timezone: 'Asia/Tokyo'
  urgency_thresholds: {
    soon: 3 // days
    next7: 7 // days
    next30: 30 // days
  }
  // PHASE 0 - フィーチャーフラグ
  features: {
    connectors_readonly: boolean
    plan_suggestion: boolean
    ml_ranking: boolean
    geolocation: boolean
  }
  updated_at: string
}

// PHASE 6 - 位置タグ
export interface LocationTag {
  id: string
  alias: string // '自宅', 'オフィス' など
  lat: number
  lng: number
  radius_m: number // 近接判定の閾値（メートル）
  created_at: string
}

// PHASE 4 - 統合ビュー（read-only）
export interface UnifiedItem {
  source: 'task' | 'recurring' | 'calendar' | 'email' | 'message'
  source_id: string
  title: string
  note?: string
  due_date?: string // YYYY-MM-DD format (JST)
  duration_min?: number
  location_tag_id?: string
  importance?: 1 | 2 | 3 | 4 | 5
  link?: string // 外部アイテムの原本URL
  read_only: boolean
}

// Store Names
export const STORE_NAMES = {
  TASKS: 'tasks',
  RECURRING_TASKS: 'recurring_tasks',
  RECURRING_LOGS: 'recurring_logs',
  IDEAS: 'ideas',
  SETTINGS: 'settings',
  LOCATION_TAGS: 'location_tags',
  SUB_TASKS: 'sub_tasks',
  SHOPPING_LISTS: 'shopping_lists',
  SHOPPING_ITEMS: 'shopping_items',
  UNIFIED_ITEMS: 'unified_items'
} as const

// Index Definitions
export const INDEXES = {
  TASKS: {
    BY_DUE_DATE: 'by_due_date',
    BY_COMPLETED: 'by_completed',
    BY_CREATED_AT: 'by_created_at'
  },
  RECURRING_TASKS: {
    BY_ACTIVE: 'by_active',
    BY_START_DATE: 'by_start_date'
  },
  RECURRING_LOGS: {
    BY_DATE: 'by_date',
    BY_RECURRING_ID: 'by_recurring_id'
  }
} as const

// Urgency levels for prioritization
export type UrgencyLevel = 'Overdue' | 'Soon' | 'Next7' | 'Next30' | 'Normal'

// Task categories
export const TASK_CATEGORIES = {
  WORK: '仕事',
  PERSONAL: 'プライベート',
  STUDY: '勉強',
  HEALTH: '健康',
  SHOPPING: '買い物',
  HOUSEHOLD: '家事',
  OTHER: 'その他'
} as const

export type TaskCategory = typeof TASK_CATEGORIES[keyof typeof TASK_CATEGORIES]

// Task importance levels
export const TASK_IMPORTANCE = {
  VERY_LOW: 1,
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
  VERY_HIGH: 5
} as const

export const TASK_IMPORTANCE_LABELS = {
  1: '最低',
  2: '低',
  3: '普通',
  4: '高',
  5: '最高'
} as const

export type TaskImportance = typeof TASK_IMPORTANCE[keyof typeof TASK_IMPORTANCE]

// URL設定
export const URL_LIMITS = {
  RECOMMENDED: 3,
  MAX_ALLOWED: 5,
  WARNING_THRESHOLD: 3
} as const

// Helper type for task display
export interface TaskWithUrgency {
  task: Task
  urgency: UrgencyLevel
  days_from_today: number
}