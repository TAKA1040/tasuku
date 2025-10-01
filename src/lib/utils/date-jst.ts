// JST (Asia/Tokyo) Date utilities
// 設計図に厳密準拠した日付操作（日単位、夏時間なし前提）

import { TIME_CONSTANTS, URGENCY_THRESHOLDS } from '@/lib/constants'

const JST_TIMEZONE = 'Asia/Tokyo'

/**
 * 現在のJST日付を YYYY-MM-DD 形式で取得
 */
export function getTodayJST(): string {
  return formatDateJST(new Date())
}

/**
 * 現在のJSTタイムスタンプを ISO 8601 形式で取得（完了日時記録用）
 */
export function getNowJST(): string {
  const now = new Date()
  // JST でのタイムスタンプを取得し、ISO 形式で返す
  const jstTime = new Date(now.toLocaleString("en-US", { timeZone: JST_TIMEZONE }))
  return jstTime.toISOString()
}

/**
 * 明日のJST日付を YYYY-MM-DD 形式で取得
 */
export function getTomorrowJST(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return formatDateJST(tomorrow)
}

/**
 * 明後日のJST日付を YYYY-MM-DD 形式で取得
 */
export function getDayAfterTomorrowJST(): string {
  const dayAfterTomorrow = new Date()
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
  return formatDateJST(dayAfterTomorrow)
}

/**
 * Date オブジェクトを YYYY-MM-DD 形式（JST）に変換
 */
export function formatDateJST(date: Date): string {
  // JST タイムゾーンで日付を取得
  const jstDate = new Date(date.toLocaleString("en-US", { timeZone: JST_TIMEZONE }))

  // YYYY-MM-DD 形式で手動フォーマット
  const year = jstDate.getFullYear()
  const month = String(jstDate.getMonth() + 1).padStart(2, '0')
  const day = String(jstDate.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * YYYY-MM-DD 文字列を Date オブジェクトに変換（JST基準）
 *
 * @throws {Error} 不正な日付文字列の場合
 */
export function parseDateJST(dateString: string): Date {
  // 入力バリデーション
  if (!dateString || typeof dateString !== 'string') {
    throw new Error(`Invalid date string: expected string, got ${typeof dateString}`)
  }

  // YYYY-MM-DD フォーマットチェック
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) {
    throw new Error(`Invalid date format: expected YYYY-MM-DD, got "${dateString}"`)
  }

  // YYYY-MM-DD を JST の日付として解釈
  const [year, month, day] = dateString.split('-').map(Number)

  // 数値バリデーション
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Invalid date components: year=${year}, month=${month}, day=${day}`)
  }

  // 範囲チェック
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month} (must be 1-12)`)
  }
  if (day < 1 || day > 31) {
    throw new Error(`Invalid day: ${day} (must be 1-31)`)
  }

  const date = new Date(year, month - 1, day) // month は 0-based

  // 日付の妥当性チェック（例: 2月30日など）
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error(`Invalid date: ${dateString} does not represent a valid calendar date`)
  }

  return date
}

/**
 * YYYY-MM-DD 文字列を Date オブジェクトに安全に変換（JST基準）
 *
 * エラーの代わりにnullを返すバージョン。
 * UI入力などエラーハンドリングが不要な場合に使用。
 *
 * @returns Date object or null if invalid
 */
export function safeParseDateJST(dateString: string): Date | null {
  try {
    return parseDateJST(dateString)
  } catch {
    return null
  }
}

/**
 * 2つの日付間の日数差を計算（JST基準、日単位）
 */
export function getDaysDifference(date1: string, date2: string): number {
  const d1 = parseDateJST(date1)
  const d2 = parseDateJST(date2)
  const diffTime = d2.getTime() - d1.getTime()
  return Math.floor(diffTime / TIME_CONSTANTS.MILLISECONDS_PER_DAY)
}

/**
 * 指定日付に日数を追加
 */
export function addDays(dateString: string, days: number): string {
  const date = parseDateJST(dateString)
  date.setDate(date.getDate() + days)
  return formatDateJST(date)
}

/**
 * 指定日付から日数を減算
 */
export function subtractDays(dateString: string, days: number): string {
  const date = parseDateJST(dateString)
  date.setDate(date.getDate() - days)
  return formatDateJST(date)
}

/**
 * 指定日付の週の開始日（月曜日）を取得
 */
export function getStartOfWeek(dateString: string): string {
  const date = parseDateJST(dateString)
  const day = date.getDay() // 0=日曜, 1=月曜, ...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // 月曜日に調整
  const monday = new Date(date.setDate(diff))
  return formatDateJST(monday)
}

/**
 * 指定日付の月の開始日（1日）を取得
 */
export function getStartOfMonth(dateString: string): string {
  const date = parseDateJST(dateString)
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  return formatDateJST(firstDay)
}

/**
 * 今日から指定日までの日数を計算
 */
export function getDaysFromToday(targetDate: string): number {
  return getDaysDifference(getTodayJST(), targetDate)
}

/**
 * 緊急度レベルを判定
 */
export function getUrgencyLevel(dueDate: string): 'Overdue' | 'Soon' | 'Next7' | 'Next30' | 'Normal' {
  const days = getDaysFromToday(dueDate)
  
  if (days < 0) return 'Overdue'
  if (days <= URGENCY_THRESHOLDS.SOON) return 'Soon'
  if (days <= URGENCY_THRESHOLDS.NEXT_7) return 'Next7'
  if (days <= URGENCY_THRESHOLDS.NEXT_30) return 'Next30'
  return 'Normal'
}

/**
 * 今週の開始日（月曜日）を取得
 */
export function getWeekStartJST(): string {
  const today = new Date()
  const day = today.getDay() // 0=日曜, 1=月曜, ...
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) // 月曜日に調整
  const monday = new Date(today.setDate(diff))
  return formatDateJST(monday)
}

/**
 * 今週の終了日（日曜日）を取得
 */
export function getWeekEndJST(): string {
  const weekStart = parseDateJST(getWeekStartJST())
  weekStart.setDate(weekStart.getDate() + 6)
  return formatDateJST(weekStart)
}

/**
 * 今月の開始日を取得
 */
export function getMonthStartJST(): string {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  return formatDateJST(firstDay)
}

/**
 * 今月の終了日を取得
 */
export function getMonthEndJST(): string {
  const today = new Date()
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  return formatDateJST(lastDay)
}

/**
 * 指定月の最終日を取得（月末丸め用）
 */
export function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * 月日を月末に丸める（存在しない日付の場合）
 */
export function clampToMonthEnd(year: number, month: number, day: number): number {
  const lastDay = getLastDayOfMonth(year, month)
  return Math.min(day, lastDay)
}

/**
 * 今日の曜日を取得（0=月曜, 1=火曜, ..., 6=日曜）
 */
export function getWeekdayJST(dateString?: string): number {
  const date = dateString ? parseDateJST(dateString) : new Date()
  const day = date.getDay()
  return day === 0 ? 6 : day - 1 // 日曜(0) → 6, 月曜(1) → 0
}

/**
 * 日付文字列を日本語表示用にフォーマット
 */
export function formatDateForDisplay(dateString: string): string {
  const date = parseDateJST(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  })
}

/**
 * 指定日または今日が月曜日かを判定
 */
export function isMonday(dateString?: string): boolean {
  const date = dateString ? parseDateJST(dateString) : new Date()
  const day = date.getDay()
  return day === 1
}

/**
 * クイック移動用のヘルパー関数
 */
export const QuickMoves = {
  tomorrow: () => addDays(getTodayJST(), 1),
  plus3Days: () => addDays(getTodayJST(), 3),
  endOfMonth: () => getMonthEndJST()
} as const

/**
 * 日付文字列が有効なYYYY-MM-DD形式かチェック
 *
 * @returns true if valid, false otherwise
 */
export function isValidDateString(dateString: string): boolean {
  return safeParseDateJST(dateString) !== null
}

/**
 * 日付文字列の配列をバリデーション
 *
 * @returns { valid: string[], invalid: string[] }
 */
export function validateDateStrings(dateStrings: string[]): {
  valid: string[]
  invalid: string[]
} {
  const valid: string[] = []
  const invalid: string[] = []

  dateStrings.forEach(dateString => {
    if (isValidDateString(dateString)) {
      valid.push(dateString)
    } else {
      invalid.push(dateString)
    }
  })

  return { valid, invalid }
}