import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    // サーバーサイドでのSupabaseクライアント作成
    const supabase = createClient()

    // 複数の方法でユーザー情報を取得試行
    const results = {
      timestamp: new Date().toISOString(),
      tests: []
    }

    // Test 1: getUser()
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      results.tests.push({
        method: 'getUser()',
        success: !error,
        user: user ? { id: user.id, email: user.email } : null,
        error: error?.message || null
      })
    } catch (err) {
      results.tests.push({
        method: 'getUser()',
        success: false,
        error: `Exception: ${err}`
      })
    }

    // Test 2: getSession()
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      results.tests.push({
        method: 'getSession()',
        success: !error,
        session: session ? {
          user: { id: session.user.id, email: session.user.email },
          expires_at: session.expires_at
        } : null,
        error: error?.message || null
      })
    } catch (err) {
      results.tests.push({
        method: 'getSession()',
        success: false,
        error: `Exception: ${err}`
      })
    }

    // Test 3: 直接データベースアクセス（認証なし）
    try {
      const { data: tasksCount, error } = await supabase
        .from('tasks')
        .select('user_id', { count: 'exact' })

      results.tests.push({
        method: 'Direct DB access (tasks)',
        success: !error,
        count: tasksCount ? tasksCount.length : 0,
        error: error?.message || null
      })
    } catch (err) {
      results.tests.push({
        method: 'Direct DB access (tasks)',
        success: false,
        error: `Exception: ${err}`
      })
    }

    // Test 4: ユニークユーザーID一覧取得
    try {
      const { data: uniqueUsers, error } = await supabase
        .from('tasks')
        .select('user_id')
        .limit(100)

      const userIds = uniqueUsers ? [...new Set(uniqueUsers.map(u => u.user_id))] : []

      results.tests.push({
        method: 'Get unique user_ids from tasks',
        success: !error,
        uniqueUserIds: userIds,
        count: userIds.length,
        error: error?.message || null
      })
    } catch (err) {
      results.tests.push({
        method: 'Get unique user_ids from tasks',
        success: false,
        error: `Exception: ${err}`
      })
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Auth debug failed', details: error },
      { status: 500 }
    )
  }
}