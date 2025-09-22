// ダミーデータ生成（開発・テスト用）
// PHASE 0 合格条件：ダミーデータ読込可

import { supabaseDb as db } from './supabase-database'
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
  
  // データベースに投入（統一テーブル使用）
  try {
    for (const task of dummyTasks) {
      const { id, created_at, updated_at, ...taskData } = task
      await db.createUnifiedTask({
        ...taskData,
        task_type: 'NORMAL'
      })
    }

    for (const recurringTask of dummyRecurringTasks) {
      const { id, created_at, updated_at, ...taskData } = recurringTask
      await db.createUnifiedTask({
        ...taskData,
        task_type: 'RECURRING'
      })
    }
  } catch (err) {
    console.log('Failed to seed data with unified table, skipping:', err)
    return
  }
  
  console.log(`Seeded ${dummyTasks.length} tasks and ${dummyRecurringTasks.length} recurring tasks`)
}

/**
 * 全データをクリア（テスト用）
 */
export async function clearAllData(): Promise<void> {
  console.log('Clearing all data...')
  
  // Use Supabase clearAllData method
  await db.clearAllData()
  
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
  try {
    // 統一テーブルから取得
    const unifiedTasks = await db.getAllUnifiedTasks()
    const normalTasks = unifiedTasks.filter(task => task.task_type === 'NORMAL')
    const recurringTasks = unifiedTasks.filter(task => task.task_type === 'RECURRING')

    // 繰り返しログは既存のメソッドを使用（テーブルが存在する場合）
    let recurringLogs: any[] = []
    try {
      recurringLogs = await db.getAllRecurringLogs()
    } catch (err) {
      console.log('Recurring logs table not accessible, assuming 0')
    }

    return {
      tasks: normalTasks.length,
      recurringTasks: recurringTasks.length,
      recurringLogs: recurringLogs.length
    }
  } catch (err) {
    console.log('Database state check failed, assuming empty database:', err)
    return {
      tasks: 0,
      recurringTasks: 0,
      recurringLogs: 0
    }
  }
}