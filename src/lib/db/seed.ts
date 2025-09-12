// ダミーデータ生成（開発・テスト用）
// PHASE 0 合格条件：ダミーデータ読込可

import { db, STORE_NAMES } from './database'
import { getTodayJST, addDays, getWeekStartJST } from '../utils/date-jst'
import type { Task, RecurringTask } from './schema'

/**
 * ダミーデータを生成してDBに投入
 */
export async function seedDummyData(): Promise<void> {
  console.log('Seeding dummy data...')
  
  const today = getTodayJST()
  
  // ダミー単発タスク
  const dummyTasks: Task[] = [
    {
      id: 'task-1',
      title: 'プロジェクト提案書を作成',
      memo: '来週のミーティング用',
      due_date: today,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'task-2', 
      title: '歯医者の予約',
      due_date: addDays(today, 2),
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'task-3',
      title: '月次レポート作成',
      memo: '売上分析を含める',
      due_date: addDays(today, 5),
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'task-4',
      title: '完了済みタスク',
      due_date: addDays(today, -1),
      completed: true,
      completed_at: today,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
  
  // ダミー繰り返しタスク
  const dummyRecurringTasks: RecurringTask[] = [
    {
      id: 'recurring-1',
      title: '毎日の振り返り',
      memo: '今日良かったこと・改善点',
      frequency: 'DAILY',
      interval_n: 1,
      start_date: getWeekStartJST(),
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'recurring-2',
      title: 'ジム（火・木）',
      frequency: 'WEEKLY',
      interval_n: 1,
      weekdays: [1, 3], // 火曜・木曜
      start_date: getWeekStartJST(),
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'recurring-3',
      title: '家計簿記録',
      frequency: 'MONTHLY',
      interval_n: 1,
      month_day: 1,
      start_date: '2024-01-01',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
  
  // データベースに投入
  for (const task of dummyTasks) {
    await db.put(STORE_NAMES.TASKS, task)
  }
  
  for (const recurringTask of dummyRecurringTasks) {
    await db.put(STORE_NAMES.RECURRING_TASKS, recurringTask)
  }
  
  console.log(`Seeded ${dummyTasks.length} tasks and ${dummyRecurringTasks.length} recurring tasks`)
}

/**
 * 全データをクリア（テスト用）
 */
export async function clearAllData(): Promise<void> {
  console.log('Clearing all data...')
  
  const storeNames = Object.values(STORE_NAMES)
  for (const storeName of storeNames) {
    if (storeName === STORE_NAMES.SETTINGS) continue // 設定は保持
    
    const allItems = await db.getAll(storeName)
    for (const item of allItems) {
      const key = Array.isArray(item) ? item : (item as { id: string }).id
      await db.delete(storeName, key)
    }
  }
  
  console.log('All data cleared')
}

/**
 * データベースの状態を確認
 */
export async function checkDatabaseState(): Promise<{
  tasks: number
  recurringTasks: number
  recurringLogs: number
}> {
  const tasks = await db.getAll(STORE_NAMES.TASKS)
  const recurringTasks = await db.getAll(STORE_NAMES.RECURRING_TASKS)
  const recurringLogs = await db.getAll(STORE_NAMES.RECURRING_LOGS)
  
  return {
    tasks: tasks.length,
    recurringTasks: recurringTasks.length,
    recurringLogs: recurringLogs.length
  }
}