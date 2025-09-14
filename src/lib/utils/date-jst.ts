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
 * Date オブジェクトを YYYY-MM-DD 形式（JST）に変換
 */
export function formatDateJST(date: Date): string {
  return date.toLocaleDateString('ja-CA', { // ja-CA は YYYY-MM-DD 形式
    timeZone: JST_TIMEZONE
  })
}

/**
 * YYYY-MM-DD 文字列を Date オブジェクトに変換（JST基準）
 */
export function parseDateJST(dateString: string): Date {
  // YYYY-MM-DD を JST の日付として解釈
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day) // month は 0-based
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
 * クイック移動用のヘルパー関数
 */
export const QuickMoves = {
  tomorrow: () => addDays(getTodayJST(), 1),
  plus3Days: () => addDays(getTodayJST(), 3),
  endOfMonth: () => getMonthEndJST()
} as const