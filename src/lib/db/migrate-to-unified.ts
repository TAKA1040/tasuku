// データを既存テーブルからunified_tasksテーブルに移行する

import { createClient } from '@/lib/supabase/client'
import { DisplayNumberUtils } from '@/lib/types/unified-task'

export async function migrateToUnifiedTasks() {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 データ移行を開始します...')
    }

    const supabase = createClient()

    // 既存のタスクを取得
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at')

    // 既存の繰り返しタスクを取得
    const { data: recurringTasks } = await supabase
      .from('recurring_tasks')
      .select('*')
      .order('created_at')

    // 既存のアイデアを取得
    const { data: ideas } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at')

    // 通常タスクを移行
    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        const displayNumber = task.display_number ||
          DisplayNumberUtils.generateDisplayNumber('NORMAL', new Date(task.created_at))

        await supabase.from('unified_tasks').upsert({
          id: task.id,
          user_id: task.user_id,
          title: task.title,
          memo: task.memo,
          display_number: displayNumber,
          task_type: 'NORMAL',
          category: task.category,
          importance: task.importance,
          due_date: task.due_date,
          urls: task.urls,
          attachment: task.attachment,
          completed: task.completed,
          completed_at: task.completed_at,
          created_at: task.created_at,
          updated_at: task.updated_at,
          archived: task.archived,
          snoozed_until: task.snoozed_until,
          duration_min: task.duration_min
        }, {
          onConflict: 'id'
        })
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ 通常タスク ${tasks.length}件を移行しました`)
      }
    }

    // 繰り返しタスクを移行
    if (recurringTasks && recurringTasks.length > 0) {
      for (const task of recurringTasks) {
        const displayNumber = task.display_number ||
          DisplayNumberUtils.generateDisplayNumber('RECURRING', new Date(task.created_at))

        await supabase.from('unified_tasks').upsert({
          id: task.id,
          user_id: task.user_id,
          title: task.title,
          memo: task.memo,
          display_number: displayNumber,
          task_type: 'RECURRING',
          category: task.category,
          importance: task.importance,
          completed: false, // 繰り返しタスクは基本的に未完了
          created_at: task.created_at,
          updated_at: task.updated_at,
          active: task.active,
          frequency: task.frequency,
          interval_n: task.interval_n,
          start_date: task.start_date,
          end_date: task.end_date,
          weekdays: task.weekdays,
          month_day: task.month_day,
          last_completed_date: task.last_completed_date
        }, {
          onConflict: 'id'
        })
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ 繰り返しタスク ${recurringTasks.length}件を移行しました`)
      }
    }

    // アイデアを移行
    if (ideas && ideas.length > 0) {
      for (const idea of ideas) {
        const displayNumber = idea.display_number ||
          DisplayNumberUtils.generateDisplayNumber('IDEA', new Date(idea.created_at))

        await supabase.from('unified_tasks').upsert({
          id: idea.id,
          user_id: idea.user_id,
          title: idea.text, // ideasテーブルでは text フィールド
          display_number: displayNumber,
          task_type: 'IDEA',
          category: 'アイデア',
          completed: idea.completed,
          created_at: idea.created_at,
          updated_at: idea.updated_at
        }, {
          onConflict: 'id'
        })
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ アイデア ${ideas.length}件を移行しました`)
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🎉 データ移行が完了しました！')
    }

    return true
  } catch (error) {
    console.error('データ移行エラー:', error)
    throw error
  }
}