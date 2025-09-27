import { createClient } from '@/lib/supabase/client'
import { getTodayJST, formatDateJST } from '@/lib/utils/date-jst'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient()

    // 今日と昨日の日付を取得
    const today = getTodayJST()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = formatDateJST(yesterday)

    console.log(`復旧対象: ${yesterdayStr} → ${today}`)

    // 現在のユーザーIDを取得
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // 今日のタスクを取得（これらが昨日も存在していたと仮定）
    const { data: todayTasks, error: todayError } = await supabase
      .from('unified_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('due_date', today)
      .eq('completed', false) // 現在未完了のタスク

    if (todayError) {
      return NextResponse.json({ error: `今日のタスク取得エラー: ${todayError.message}` }, { status: 500 })
    }

    console.log(`対象タスク数: ${todayTasks?.length || 0}件`)

    // 各タスクについて昨日の完了履歴を作成
    let restoredCount = 0
    const results = []

    for (const task of todayTasks || []) {
      // 既に昨日の完了履歴があるかチェック
      const { data: existingDone } = await supabase
        .from('done')
        .select('id')
        .eq('original_task_id', task.id)
        .like('completed_at', `${yesterdayStr}%`)
        .limit(1)

      if (existingDone && existingDone.length > 0) {
        results.push(`スキップ: ${task.title} (既に履歴あり)`)
        continue
      }

      // 昨日の完了履歴を作成
      const { error: insertError } = await supabase
        .from('done')
        .insert({
          original_task_id: task.id,
          original_title: task.title,
          original_memo: task.memo,
          original_category: task.category,
          original_importance: task.importance,
          original_due_date: yesterdayStr, // 昨日の日付として記録
          original_recurring_pattern: task.recurring_pattern,
          original_display_number: task.display_number,
          completed_at: `${yesterdayStr}T23:59:59.000Z`, // 昨日の終了時刻（UTC）
          user_id: user.id
        })

      if (insertError) {
        console.error(`履歴作成エラー (${task.title}):`, insertError)
        results.push(`エラー: ${task.title} - ${insertError.message}`)
      } else {
        restoredCount++
        results.push(`復旧完了: ${task.title} (${yesterdayStr})`)
        console.log(`復旧完了: ${task.title} (${yesterdayStr})`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `復旧完了！ ${restoredCount}件の昨日の達成記録を復旧しました。`,
      restoredCount,
      totalTasks: todayTasks?.length || 0,
      yesterdayDate: yesterdayStr,
      results
    })

  } catch (error) {
    console.error('復旧エラー:', error)
    return NextResponse.json({
      success: false,
      error: `復旧エラー: ${error}`
    }, { status: 500 })
  }
}