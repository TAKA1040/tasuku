// ダミーデータ生成（開発・テスト用）
// PHASE 0 合格条件：ダミーデータ読込可

import { supabaseDb as db } from './supabase-database'
import { getTodayJST, addDays, getWeekStartJST } from '../utils/date-jst'
import type { Task, RecurringTask } from './schema'

/**
 * ダミーデータを生成してDBに投入
 */
export async function seedDummyData(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('Seeding dummy data...')
  }
  
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
    const { id, created_at, updated_at, ...taskData } = task
    await db.createTask(taskData)
  }
  
  for (const recurringTask of dummyRecurringTasks) {
    const { id, created_at, updated_at, ...taskData } = recurringTask
    await db.createRecurringTask(taskData)
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Seeded ${dummyTasks.length} tasks and ${dummyRecurringTasks.length} recurring tasks`)
  }
}

/**
 * 全データをクリア（テスト用）
 */
export async function clearAllData(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('Clearing all data...')
  }
  
  // Use Supabase clearAllData method
  await db.clearAllData()
  
  if (process.env.NODE_ENV === 'development') {
    console.log('All data cleared')
  }
}

/**
 * データベースの状態を確認
 */
export async function checkDatabaseState(): Promise<{
  tasks: number
  recurringTasks: number
  recurringLogs: number
}> {
  const tasks = await db.getAllTasks()
  const recurringTasks = await db.getAllRecurringTasks()
  const recurringLogs = await db.getAllRecurringLogs()
  
  return {
    tasks: tasks.length,
    recurringTasks: recurringTasks.length,
    recurringLogs: recurringLogs.length
  }
}