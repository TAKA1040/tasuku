// 繰り返しタスクの発生日計算
// 設計図 PHASE 1.1 の occursOn(date, rule) 実装

import { 
  parseDateJST, 
  formatDateJST, 
  getDaysDifference,
  // getWeekdayJST, // 将来使用予定
  clampToMonthEnd 
} from './date-jst'
import type { RecurringTask } from '../db/schema'

/**
 * 指定日に繰り返しタスクが発生するかを判定
 */
export function occursOn(date: string, rule: RecurringTask): boolean {
  // 非アクティブなタスクは発生しない
  if (!rule.active) return false
  
  // 開始日より前は発生しない
  if (getDaysDifference(rule.start_date, date) < 0) return false
  
  // 終了日より後は発生しない
  if (rule.end_date && getDaysDifference(date, rule.end_date) < 0) return false
  
  // 回数制限チェック（簡易版、実際は完了回数をカウント）
  // TODO: PHASE 1.1 で RecurringLog と組み合わせて実装
  
  const targetDate = parseDateJST(date)
  const startDate = parseDateJST(rule.start_date)
  
  switch (rule.frequency) {
    case 'DAILY':
      return occursOnDaily(targetDate, startDate, rule.interval_n)
      
    case 'INTERVAL_DAYS':
      return occursOnInterval(targetDate, startDate, rule.interval_n)
      
    case 'WEEKLY':
      return occursOnWeekly(targetDate, startDate, rule.interval_n, rule.weekdays || [])
      
    case 'MONTHLY':
      return occursOnMonthly(targetDate, startDate, rule.interval_n, rule.month_day || 1)
      
    default:
      return false
  }
}

/**
 * 毎日パターンの判定
 */
function occursOnDaily(targetDate: Date, startDate: Date, intervalN: number = 1): boolean {
  const daysDiff = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  return daysDiff >= 0 && daysDiff % intervalN === 0
}

/**
 * 間隔日パターンの判定
 */
function occursOnInterval(targetDate: Date, startDate: Date, intervalN: number): boolean {
  return occursOnDaily(targetDate, startDate, intervalN)
}

/**
 * 毎週パターンの判定
 */
function occursOnWeekly(
  targetDate: Date, 
  startDate: Date, 
  intervalN: number = 1, 
  weekdays: number[]
): boolean {
  if (weekdays.length === 0) return false
  
  // 1. 対象日の曜日が指定曜日に含まれるかチェック
  const targetWeekday = targetDate.getDay() === 0 ? 6 : targetDate.getDay() - 1
  if (!weekdays.includes(targetWeekday)) return false
  
  // 2. 対象日が開始日より前でないかチェック
  if (targetDate.getTime() < startDate.getTime()) return false
  
  // 3. 間隔チェック（intervalN = 1 の場合は毎週なのでOK）
  if (intervalN === 1) return true
  
  // 4. intervalN > 1 の場合の週間隔計算
  const startWeekday = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1
  const targetWeekday2 = targetDate.getDay() === 0 ? 6 : targetDate.getDay() - 1
  
  // 各日付の週の開始日（月曜日）を計算
  const startWeekStart = new Date(startDate)
  startWeekStart.setDate(startDate.getDate() - startWeekday)
  
  const targetWeekStart = new Date(targetDate)  
  targetWeekStart.setDate(targetDate.getDate() - targetWeekday2)
  
  // 週数差を計算
  const daysDiff = Math.floor((targetWeekStart.getTime() - startWeekStart.getTime()) / (1000 * 60 * 60 * 24))
  const weeksDiff = Math.floor(daysDiff / 7)
  
  return weeksDiff >= 0 && weeksDiff % intervalN === 0
}

/**
 * 毎月パターンの判定
 */
function occursOnMonthly(
  targetDate: Date, 
  startDate: Date, 
  intervalN: number = 1, 
  monthDay: number
): boolean {
  const targetYear = targetDate.getFullYear()
  const targetMonth = targetDate.getMonth() + 1
  const targetDay = targetDate.getDate()
  
  const startYear = startDate.getFullYear()
  const startMonth = startDate.getMonth() + 1
  
  // 月末丸め適用
  const adjustedMonthDay = clampToMonthEnd(targetYear, targetMonth, monthDay)
  if (targetDay !== adjustedMonthDay) return false
  
  // 開始月からの月数差を計算
  const monthsDiff = (targetYear - startYear) * 12 + (targetMonth - startMonth)
  
  return monthsDiff >= 0 && monthsDiff % intervalN === 0
}

/**
 * 指定期間内の次回発生日を取得
 */
export function getNextOccurrence(
  rule: RecurringTask, 
  fromDate: string, 
  maxDays: number = 7
): string | null {
  const start = parseDateJST(fromDate)
  
  for (let i = 1; i <= maxDays; i++) {
    const checkDate = new Date(start)
    checkDate.setDate(start.getDate() + i)
    const checkDateStr = formatDateJST(checkDate)
    
    if (occursOn(checkDateStr, rule)) {
      return checkDateStr
    }
  }
  
  return null
}

/**
 * 繰り返しタスクの表示名を生成
 */
export function getRecurringDisplayName(rule: RecurringTask): string {
  const { frequency, interval_n, weekdays, month_day } = rule
  
  switch (frequency) {
    case 'DAILY':
      return interval_n === 1 ? '毎日' : `${interval_n}日おき`
      
    case 'INTERVAL_DAYS':
      return `${interval_n}日おき`
      
    case 'WEEKLY': {
      const weekdayNames = ['月', '火', '水', '木', '金', '土', '日']
      const days = (weekdays || []).map(w => weekdayNames[w]).join('・')
      const prefix = interval_n === 1 ? '毎週' : `${interval_n}週おき`
      return `${prefix} ${days}`
    }
      
    case 'MONTHLY':
      const prefix = interval_n === 1 ? '毎月' : `${interval_n}ヶ月おき`
      return `${prefix} ${month_day}日`
      
    default:
      return '不明'
  }
}