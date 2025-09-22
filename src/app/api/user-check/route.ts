import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // 現在のセッション状況を詳細確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // dash201206@gmail.comユーザーのデータを検索
    let dashUserData = null
    try {
      const { data: users } = await supabase.auth.admin.listUsers()
      dashUserData = users?.users?.find(u => u.email === 'dash201206@gmail.com') || 'User not found in auth.users'
    } catch (err) {
      dashUserData = 'Cannot access auth.users table'
    }

    // 認証が取れている場合、そのユーザーのタスクデータを取得
    let userTasks = null
    let userUnifiedTasks = null
    if (user) {
      try {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .limit(5)
        userTasks = tasks

        const { data: unified } = await supabase
          .from('unified_tasks')
          .select('*')
          .eq('user_id', user.id)
          .limit(5)
        userUnifiedTasks = unified
      } catch (err) {
        userTasks = `Error: ${err}`
        userUnifiedTasks = `Error: ${err}`
      }
    }

    // 特定ユーザーID (8b4eaeb8-16b6-4e69-a5c5-affde6a17b6c) のデータも確認
    const specificUserId = '8b4eaeb8-16b6-4e69-a5c5-affde6a17b6c'
    let specificUserTasks = null
    try {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', specificUserId)
        .limit(3)
      specificUserTasks = tasks
    } catch (err) {
      specificUserTasks = `Error: ${err}`
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session: session ? {
        access_token: session.access_token?.substring(0, 20) + '...',
        user: {
          id: session.user?.id,
          email: session.user?.email,
          created_at: session.user?.created_at
        }
      } : null,
      sessionError: sessionError?.message || null,
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      } : null,
      userError: userError?.message || null,
      dashUserData,
      userTasks,
      userUnifiedTasks,
      specificUserTasks
    })
  } catch (error) {
    console.error('User check error:', error)
    return NextResponse.json(
      { error: 'User check failed', details: error },
      { status: 500 }
    )
  }
}