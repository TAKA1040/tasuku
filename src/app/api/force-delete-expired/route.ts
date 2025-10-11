import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTodayJST, subtractDays } from '@/lib/utils/date-jst'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createClient()
    const today = getTodayJST()

    // ユーザーIDを取得
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated', details: authError }, { status: 401 })
    }

    const results = {
      today,
      userId: user.id,
      daily: { threshold: '', deleted: 0, error: null as unknown },
      weekly: { threshold: '', deleted: 0, error: null as unknown },
      monthly: { threshold: '', deleted: 0, error: null as unknown },
      total: 0
    }

    // 日次タスク削除
    const dailyThreshold = subtractDays(today, 3)
    results.daily.threshold = dailyThreshold

    const { data: dailyDeleted, error: dailyError } = await supabase
      .from('unified_tasks')
      .delete()
      .eq('user_id', user.id)
      .eq('completed', false)
      .eq('recurring_pattern', 'DAILY')
      .not('recurring_template_id', 'is', null)
      .lte('due_date', dailyThreshold)
      .select('id, title, due_date')

    if (dailyError) {
      results.daily.error = dailyError
    } else {
      results.daily.deleted = dailyDeleted?.length || 0
      results.total += results.daily.deleted
    }

    // 週次タスク削除
    const weeklyThreshold = subtractDays(today, 7)
    results.weekly.threshold = weeklyThreshold

    const { data: weeklyDeleted, error: weeklyError } = await supabase
      .from('unified_tasks')
      .delete()
      .eq('user_id', user.id)
      .eq('completed', false)
      .eq('recurring_pattern', 'WEEKLY')
      .not('recurring_template_id', 'is', null)
      .lte('due_date', weeklyThreshold)
      .select('id, title, due_date')

    if (weeklyError) {
      results.weekly.error = weeklyError
    } else {
      results.weekly.deleted = weeklyDeleted?.length || 0
      results.total += results.weekly.deleted
    }

    // 月次タスク削除
    const monthlyThreshold = subtractDays(today, 365)
    results.monthly.threshold = monthlyThreshold

    const { data: monthlyDeleted, error: monthlyError } = await supabase
      .from('unified_tasks')
      .delete()
      .eq('user_id', user.id)
      .eq('completed', false)
      .eq('recurring_pattern', 'MONTHLY')
      .not('recurring_template_id', 'is', null)
      .lte('due_date', monthlyThreshold)
      .select('id, title, due_date')

    if (monthlyError) {
      results.monthly.error = monthlyError
    } else {
      results.monthly.deleted = monthlyDeleted?.length || 0
      results.total += results.monthly.deleted
    }

    return NextResponse.json({
      success: true,
      message: `削除完了: 合計${results.total}件`,
      details: results,
      deletedTasks: {
        daily: dailyDeleted || [],
        weekly: weeklyDeleted || [],
        monthly: monthlyDeleted || []
      }
    })
  } catch (error) {
    console.error('❌ 強制削除エラー:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
