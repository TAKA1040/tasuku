// ダミーデータ生成（開発・テスト用）
// PHASE 0 合格条件：ダミーデータ読込可

import { getTodayJST, addDays, getWeekStartJST } from '../utils/date-jst'
import type { UnifiedTask } from '@/lib/types/unified-task'

/**
 * ダミーデータを生成してDBに投入（新統一システム対応）
 */
export async function seedDummyData(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('Seeding dummy data...')
  }

  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    // 認証済みユーザーのIDを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('User not authenticated, skipping seed data')
      return
    }

    const today = getTodayJST()

    // ダミーデータをunified_tasksテーブル用に作成
    const dummyUnifiedTasks = [
      // 通常タスク
      {
        title: 'プロジェクト提案書を作成',
        memo: '来週のミーティング用',
        task_type: 'NORMAL',
        due_date: today,
        completed: false,
        display_number: '',  // Supabaseトリガーで自動生成
        user_id: user.id
      },
      {
        title: '歯医者の予約',
        task_type: 'NORMAL',
        due_date: addDays(today, 2),
        completed: false,
        display_number: '',  // Supabaseトリガーで自動生成
        user_id: user.id
      },
      {
        title: '月次レポート作成',
        memo: '売上分析を含める',
        task_type: 'NORMAL',
        due_date: addDays(today, 5),
        completed: false,
        display_number: '',  // Supabaseトリガーで自動生成
        user_id: user.id
      },
      // 繰り返しタスク（due_dateは「期限なし」の意味で'2999-12-31'を使用）
      {
        title: '毎日の振り返り',
        memo: '今日良かったこと・改善点',
        task_type: 'RECURRING',
        due_date: '2999-12-31', // 期限なし
        completed: false,
        display_number: '',  // Supabaseトリガーで自動生成
        recurring_pattern: 'DAILY',
        user_id: user.id
      },
      {
        title: 'ジム（火・木）',
        task_type: 'RECURRING',
        due_date: '2999-12-31', // 期限なし
        completed: false,
        display_number: '',  // Supabaseトリガーで自動生成
        recurring_pattern: 'WEEKLY',
        recurring_weekdays: [2, 4], // 火曜・木曜（0=日曜）
        user_id: user.id
      },
      {
        title: '家計簿記録',
        task_type: 'RECURRING',
        due_date: '2999-12-31', // 期限なし
        completed: false,
        display_number: '',  // Supabaseトリガーで自動生成
        recurring_pattern: 'MONTHLY',
        user_id: user.id
      }
    ]

    // 既存のダミーデータをチェックして重複を避ける
    const { data: existingTasks } = await supabase
      .from('unified_tasks')
      .select('title')
      .eq('user_id', user.id)

    const existingTitles = new Set(existingTasks?.map(t => t.title) || [])

    // unified_tasksテーブルに投入（重複チェック付き）
    for (const task of dummyUnifiedTasks) {
      // 既に同じタイトルのタスクが存在する場合はスキップ
      if (existingTitles.has(task.title)) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Skipping duplicate dummy task: ${task.title}`)
        }
        continue
      }

      const { error } = await supabase
        .from('unified_tasks')
        .insert(task)

      if (error) {
        console.error('Failed to seed dummy task:', error, task.title)
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Successfully seeded dummy task: ${task.title}`)
        }
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`Seeded ${dummyUnifiedTasks.length} unified tasks`)
    }
  } catch (error) {
    console.error('Failed to seed dummy data:', error)
  }
}

/**
 * 全データをクリア（テスト用）
 */
export async function clearAllData(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('Clearing all data...')
  }

  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    // 認証済みユーザーのIDを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('User not authenticated, skipping clear data')
      return
    }

    // 新しいシステムのテーブルをクリア
    const tables = ['done', 'unified_tasks', 'ideas', 'user_settings'] as const

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error(`Failed to clear ${table}:`, error)
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('All data cleared')
    }
  } catch (error) {
    console.error('Failed to clear all data:', error)
  }
}

/**
 * データベースの状態を確認（新統一システム対応）
 */
export async function checkDatabaseState(): Promise<{
  tasks: number
  recurringTasks: number
  recurringLogs: number
}> {
  try {
    // 新しい統一システム（unified_tasks）からデータを取得
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    // 認証済みユーザーのIDを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { tasks: 0, recurringTasks: 0, recurringLogs: 0 }
    }

    // unified_tasksから各種タスク数を取得
    const { data: unifiedTasks, error: tasksError } = await supabase
      .from('unified_tasks')
      .select('task_type')
      .eq('user_id', user.id)

    if (tasksError) {
      console.error('Failed to get unified tasks:', tasksError)
      return { tasks: 0, recurringTasks: 0, recurringLogs: 0 }
    }

    // doneテーブルから完了記録数を取得
    const { data: doneRecords, error: doneError } = await supabase
      .from('done')
      .select('id')
      .eq('user_id', user.id)

    if (doneError) {
      console.error('Failed to get done records:', doneError)
    }

    const taskCount = (unifiedTasks || []).filter(t => t.task_type === 'TASK').length
    const recurringTaskCount = (unifiedTasks || []).filter(t => t.task_type === 'RECURRING').length
    const doneCount = (doneRecords || []).length

    return {
      tasks: taskCount,
      recurringTasks: recurringTaskCount,
      recurringLogs: doneCount  // 完了記録数をrecurringLogsとして返す（互換性）
    }
  } catch (error) {
    console.error('Failed to check database state:', error)
    return { tasks: 0, recurringTasks: 0, recurringLogs: 0 }
  }
}