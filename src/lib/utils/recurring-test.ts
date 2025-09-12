// 繰り返しタスクのoccursOn関数テスト（開発用）

import { occursOn } from './recurring'
import type { RecurringTask } from '../db/schema'

/**
 * 開発環境でのみ利用可能なテスト関数
 */
export function testRecurringRules() {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Recurring tests are only available in development mode')
    return
  }

  console.log('🧪 Testing recurring task rules...')

  // テスト用の日付
  const testDates = [
    '2025-09-11', // 木曜日
    '2025-09-12', // 金曜日  
    '2025-09-13', // 土曜日
    '2025-09-14', // 日曜日
    '2025-09-15', // 月曜日
  ]

  // DAILY テスト
  const dailyTask: RecurringTask = {
    id: 'test-daily',
    title: '毎日のタスク',
    frequency: 'DAILY',
    interval_n: 1,
    start_date: '2025-09-10', // 水曜日開始
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  console.log('Daily task (every day from 2025-09-10):')
  testDates.forEach(date => {
    const occurs = occursOn(date, dailyTask)
    console.log(`  ${date}: ${occurs ? '✅' : '❌'}`)
  })

  // WEEKLY テスト（火・木曜日）
  const weeklyTask: RecurringTask = {
    id: 'test-weekly',
    title: '週2回のタスク',
    frequency: 'WEEKLY',
    interval_n: 1,
    weekdays: [1, 3], // 火曜(1), 木曜(3)
    start_date: '2025-09-09', // 火曜日開始
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  console.log('Weekly task (Tue & Thu from 2025-09-09):')
  testDates.forEach(date => {
    const occurs = occursOn(date, weeklyTask)
    console.log(`  ${date}: ${occurs ? '✅' : '❌'}`)
  })

  // MONTHLY テスト（毎月15日）
  const monthlyTask: RecurringTask = {
    id: 'test-monthly',
    title: '月1回のタスク',
    frequency: 'MONTHLY',
    interval_n: 1,
    month_day: 15,
    start_date: '2025-08-15',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  console.log('Monthly task (15th of each month from 2025-08-15):')
  testDates.forEach(date => {
    const occurs = occursOn(date, monthlyTask)
    console.log(`  ${date}: ${occurs ? '✅' : '❌'}`)
  })

  // 2日おきのテスト
  const intervalTask: RecurringTask = {
    id: 'test-interval',
    title: '2日おきのタスク',
    frequency: 'INTERVAL_DAYS',
    interval_n: 2,
    start_date: '2025-09-10',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  console.log('Interval task (every 2 days from 2025-09-10):')
  testDates.forEach(date => {
    const occurs = occursOn(date, intervalTask)
    console.log(`  ${date}: ${occurs ? '✅' : '❌'}`)
  })

  console.log('🧪 Recurring tests completed!')
}

/**
 * 開発者ツールに追加
 */
export function setupRecurringDevTools() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // @ts-expect-error Development tools: Adding global function for testing
    window.testRecurringRules = testRecurringRules
    console.log('Development tools: window.testRecurringRules()')
  }
}