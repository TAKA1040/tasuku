import { NextResponse } from 'next/server'
import { TaskGeneratorService } from '@/lib/services/task-generator'
import { requireUserId } from '@/lib/auth/get-user-id'

export async function POST(request: Request) {
  try {
    // NextAuth認証確認
    const userId = await requireUserId()

    // リクエストボディから forceToday フラグを取得
    const body = await request.json().catch(() => ({}))
    const forceToday = body.forceToday === true

    // タスク生成実行（ユーザーIDを渡す）
    const generator = new TaskGeneratorService(userId)
    await generator.generateMissingTasks(forceToday)

    return NextResponse.json({
      success: true,
      message: 'Task generation completed',
      forceToday
    })
  } catch (error) {
    console.error('Task generation error:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json(
      {
        error: status === 401 ? 'Unauthorized' : 'Task generation failed',
        details: message
      },
      { status }
    )
  }
}

// GETリクエストでも実行可能にする（ブラウザから簡単にテストできるように）
export async function GET() {
  try {
    // NextAuth認証確認
    const userId = await requireUserId()

    // タスク生成実行（ユーザーIDを渡す）
    const generator = new TaskGeneratorService(userId)
    await generator.generateMissingTasks(false)

    return NextResponse.json({
      success: true,
      message: 'Task generation completed (auto mode)'
    })
  } catch (error) {
    console.error('Task generation error:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json(
      {
        error: status === 401 ? 'Unauthorized' : 'Task generation failed',
        details: message
      },
      { status }
    )
  }
}
