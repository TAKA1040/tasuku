import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // 日付別にタスクを確認
    const results = {
      timestamp: new Date().toISOString(),
      today: new Date().toISOString().split('T')[0],
      dateAnalysis: {} as any
    }

    // tasksテーブルの日付分布を確認
    const { data: tasks } = await supabase
      .from('tasks')
      .select('due_date, created_at, title')
      .order('due_date', { ascending: false })
      .limit(50)

    // unified_tasksテーブルの日付分布を確認
    const { data: unified } = await supabase
      .from('unified_tasks')
      .select('due_date, created_at, title')
      .order('due_date', { ascending: false })
      .limit(50)

    results.dateAnalysis = {
      tasks: {
        count: tasks?.length || 0,
        dates: tasks?.map(t => ({
          due_date: t.due_date,
          created_at: t.created_at?.split('T')[0],
          title: t.title
        })) || []
      },
      unified_tasks: {
        count: unified?.length || 0,
        dates: unified?.map(t => ({
          due_date: t.due_date,
          created_at: t.created_at?.split('T')[0],
          title: t.title
        })) || []
      }
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Date check failed', details: error },
      { status: 500 }
    )
  }
}