import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('unified_tasks')
      .select('id, title, due_date, task_type, recurring_pattern, created_at')
      .eq('task_type', 'RECURRING')
      .gt('due_date', today)
      .order('title')
      .order('due_date')
      .limit(200)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        message: '✅ 未来の繰り返しタスクは存在しません',
        count: 0,
        tasks: []
      })
    }

    // タイトル別にグループ化
    const grouped: Record<string, typeof data> = {}
    data.forEach(task => {
      if (!grouped[task.title]) {
        grouped[task.title] = []
      }
      grouped[task.title].push(task)
    })

    return NextResponse.json({
      message: `⚠️  ${data.length}件の未来の繰り返しタスクが見つかりました`,
      count: data.length,
      grouped,
      tasks: data
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
