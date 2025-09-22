import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // 統一タスクを取得
    const { data: tasks, error } = await supabase
      .from('unified_tasks')
      .select('*')
      .limit(10)

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    const today = new Date().toISOString().split('T')[0] // 2025-09-21

    // 各タスクがどのフィルタに該当するか分析
    const analysis = tasks?.map(task => ({
      title: task.title,
      task_type: task.task_type,
      due_date: task.due_date,
      completed: task.completed,
      archived: task.archived,
      active: task.active,
      category: task.category,

      // フィルタ判定
      filters: {
        today_due: task.due_date === today && !task.completed && !task.archived,
        overdue: task.due_date && task.due_date < today && !task.completed && !task.archived,
        upcoming: task.due_date && task.due_date > today && !task.completed && !task.archived,
        shopping: task.category === '買い物' && !task.completed && !task.archived,
        todo_list: (
          (task.task_type === 'RECURRING' && task.active !== false) ||
          (task.task_type === 'NORMAL' && !task.due_date) ||
          task.task_type === 'IDEA'
        ) && !task.completed && !task.archived,
        no_date: task.task_type === 'NORMAL' && !task.due_date && !task.completed && !task.archived
      }
    })) || []

    return NextResponse.json({
      today,
      total_tasks: tasks?.length || 0,
      analysis,
      summary: {
        today_due: analysis.filter(t => t.filters.today_due).length,
        overdue: analysis.filter(t => t.filters.overdue).length,
        upcoming: analysis.filter(t => t.filters.upcoming).length,
        shopping: analysis.filter(t => t.filters.shopping).length,
        todo_list: analysis.filter(t => t.filters.todo_list).length,
        no_date: analysis.filter(t => t.filters.no_date).length
      }
    })

  } catch (error) {
    console.error('Filter test error:', error)
    return NextResponse.json(
      { error: 'Filter test failed', details: error },
      { status: 500 }
    )
  }
}