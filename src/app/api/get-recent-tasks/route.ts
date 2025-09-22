import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // 最新の10件のタスクを取得
    const { data: tasks, error } = await supabase
      .from('unified_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    return NextResponse.json({
      count: tasks?.length || 0,
      tasks: tasks?.map(task => ({
        title: task.title,
        task_type: task.task_type,
        due_date: task.due_date,
        created_at: task.created_at,
        completed: task.completed,
        category: task.category
      })) || []
    })

  } catch (error) {
    console.error('Get recent tasks error:', error)
    return NextResponse.json(
      { error: 'Failed to get recent tasks', details: error },
      { status: 500 }
    )
  }
}