import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // 期限切れ繰り返しタスクを全て取得
  const { data: tasks, error } = await supabase
    .from('unified_tasks')
    .select('*')
    .eq('completed', false)
    .lt('due_date', today)
    .not('recurring_template_id', 'is', null)
    .order('due_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // パターン別に集計
  interface TaskInfo {
    id: string
    due_date: string
    title: string
    recurring_pattern: string
    daysOverdue: number
    [key: string]: unknown
  }

  const byPattern: Record<string, TaskInfo[]> = {}
  const shouldBeDeleted: TaskInfo[] = []

  tasks?.forEach(task => {
    const pattern = task.recurring_pattern || 'UNKNOWN'
    if (!byPattern[pattern]) byPattern[pattern] = []

    const dueDate = new Date(task.due_date)
    const todayDate = new Date(today)
    const daysOverdue = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    const taskInfo = {
      ...task,
      daysOverdue
    }

    byPattern[pattern].push(taskInfo)

    // 削除されるべきかチェック
    let shouldDelete = false
    if (pattern === 'DAILY' && daysOverdue >= 3) shouldDelete = true
    if (pattern === 'WEEKLY' && daysOverdue >= 7) shouldDelete = true
    if (pattern === 'MONTHLY' && daysOverdue >= 365) shouldDelete = true

    if (shouldDelete) {
      shouldBeDeleted.push(taskInfo)
    }
  })

  // 最終処理日を取得
  const { data: metadata } = await supabase
    .from('user_metadata')
    .select('*')
    .in('key', ['last_task_generation', 'last_shopping_processed'])

  const lastGeneration = metadata?.find(m => m.key === 'last_task_generation')
  const lastShopping = metadata?.find(m => m.key === 'last_shopping_processed')

  return NextResponse.json({
    today,
    totalCount: tasks?.length || 0,
    byPattern: Object.entries(byPattern).map(([pattern, items]) => ({
      pattern,
      count: items.length,
      tasks: items.map(t => ({
        due_date: t.due_date,
        days_overdue: t.daysOverdue,
        title: t.title,
        id: t.id
      }))
    })),
    shouldBeDeleted: {
      count: shouldBeDeleted.length,
      tasks: shouldBeDeleted.map(t => ({
        pattern: t.recurring_pattern,
        due_date: t.due_date,
        days_overdue: t.daysOverdue,
        title: t.title,
        id: t.id
      }))
    },
    metadata: {
      lastGeneration: lastGeneration?.value || null,
      lastGenerationUpdated: lastGeneration?.updated_at || null,
      lastShopping: lastShopping?.value || null,
      lastShoppingUpdated: lastShopping?.updated_at || null,
      todayProcessed: lastGeneration?.value === today
    }
  })
}
