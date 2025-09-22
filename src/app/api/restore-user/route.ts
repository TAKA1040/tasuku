import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json()

    if (!email || !userId) {
      return NextResponse.json({ error: 'Email and userId required' }, { status: 400 })
    }

    const supabase = createClient()

    // 管理者権限でユーザーを作成
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: 'tempPassword123!',
      email_confirm: true,
      user_metadata: {
        restored: true,
        original_id: userId
      }
    })

    if (createError) {
      return NextResponse.json({
        error: 'Failed to create user',
        details: createError.message
      }, { status: 500 })
    }

    // 以前のデータがあるかチェック
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .limit(5)

    const { data: existingUnified } = await supabase
      .from('unified_tasks')
      .select('*')
      .eq('user_id', userId)
      .limit(5)

    return NextResponse.json({
      success: true,
      newUser: {
        id: user.user?.id,
        email: user.user?.email
      },
      originalUserId: userId,
      existingData: {
        tasks: existingTasks?.length || 0,
        unified_tasks: existingUnified?.length || 0
      }
    })
  } catch (error) {
    console.error('Restore user error:', error)
    return NextResponse.json(
      { error: 'Restore failed', details: error },
      { status: 500 }
    )
  }
}