import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// デバッグ用API - 本番環境では無効
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is disabled in production' }, { status: 403 })
  }

  try {
    const supabase = await createClient()

    // 今日の日付
    const today = new Date().toLocaleDateString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').map(v => v.padStart(2, '0')).reverse().join('-')

    // 削除閾値の計算
    const dailyThresholdDate = new Date(today)
    dailyThresholdDate.setDate(dailyThresholdDate.getDate() - 3)
    const dailyThreshold = dailyThresholdDate.toISOString().split('T')[0]

    const weeklyThresholdDate = new Date(today)
    weeklyThresholdDate.setDate(weeklyThresholdDate.getDate() - 7)
    const weeklyThreshold = weeklyThresholdDate.toISOString().split('T')[0]

    // 1. 全タスクを取得
    const { data: allTasks, error: allError } = await supabase
      .from('unified_tasks')
      .select('*')
      .eq('title', '100回朝ジャンプ')
      .order('due_date', { ascending: true })

    if (allError) throw allError

    // 2. 集計
    const completed = allTasks?.filter(t => t.completed) || []
    const incomplete = allTasks?.filter(t => !t.completed) || []

    // 3. パターン別
    const patterns: Record<string, number> = {}
    allTasks?.forEach(t => {
      const pattern = t.recurring_pattern || 'NORMAL'
      patterns[pattern] = (patterns[pattern] || 0) + 1
    })

    // 4. テンプレートID
    const templateIds = new Set(allTasks?.map(t => t.recurring_template_id).filter(Boolean))

    // 5. 削除対象の判定
    const shouldDelete = incomplete.filter(task => {
      if (task.recurring_pattern === 'DAILY') {
        return task.due_date <= dailyThreshold
      } else if (task.recurring_pattern === 'WEEKLY') {
        return task.due_date <= weeklyThreshold
      }
      return false
    })

    // 6. 未完了タスクの詳細
    const incompleteDetails = incomplete.map(task => {
      const dueDate = new Date(task.due_date)
      const todayDate = new Date(today)
      const diffDays = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      const status = diffDays > 0 ? `${diffDays}日前` : diffDays === 0 ? '今日' : `${Math.abs(diffDays)}日後`

      let deleteStatus = '✅ 保持'
      if (task.recurring_pattern === 'DAILY' && task.due_date <= dailyThreshold) {
        deleteStatus = '❌ 削除対象'
      } else if (task.recurring_pattern === 'WEEKLY' && task.due_date <= weeklyThreshold) {
        deleteStatus = '❌ 削除対象'
      }

      return {
        due_date: task.due_date,
        status,
        pattern: task.recurring_pattern,
        template_id: task.recurring_template_id,
        created_at: task.created_at,
        delete_status: deleteStatus
      }
    })

    const result = {
      today,
      thresholds: {
        daily: dailyThreshold,
        weekly: weeklyThreshold
      },
      summary: {
        total: allTasks?.length || 0,
        completed: completed.length,
        incomplete: incomplete.length,
        should_delete: shouldDelete.length,
        should_keep: incomplete.length - shouldDelete.length
      },
      patterns,
      template_ids: Array.from(templateIds),
      incomplete_tasks: incompleteDetails,
      conclusion: shouldDelete.length > 0
        ? `⚠️ 削除されるべきタスクが ${shouldDelete.length} 件残っています！自動削除機能に問題がある可能性があります。`
        : '✅ すべて正常です（保持されるべきタスクのみ存在）。自動削除機能は正しく動作しています。'
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ エラー:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
