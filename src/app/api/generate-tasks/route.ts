import { NextResponse } from 'next/server'
import { TaskGeneratorService } from '@/lib/services/task-generator'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // 認証確認（Supabase Authを使用）
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      )
    }

    // リクエストボディから forceToday フラグを取得
    const body = await request.json().catch(() => ({}))
    const forceToday = body.forceToday === true

    // タスク生成実行（ユーザーIDを渡す）
    const generator = new TaskGeneratorService(user.id)
    await generator.generateMissingTasks(forceToday)

    return NextResponse.json({
      success: true,
      message: 'Task generation completed',
      forceToday
    })
  } catch (error) {
    console.error('Task generation error:', error)
    return NextResponse.json(
      {
        error: 'Task generation failed',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// GETリクエストでも実行可能にする（ブラウザから簡単にテストできるように）
export async function GET() {
  try {
    // 認証確認
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      )
    }

    // タスク生成実行（ユーザーIDを渡す）
    const generator = new TaskGeneratorService(user.id)
    await generator.generateMissingTasks(false)

    return NextResponse.json({
      success: true,
      message: 'Task generation completed (auto mode)'
    })
  } catch (error) {
    console.error('Task generation error:', error)
    return NextResponse.json(
      {
        error: 'Task generation failed',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
