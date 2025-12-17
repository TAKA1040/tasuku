import { NextRequest, NextResponse } from 'next/server'
import { PostgresTasksService } from '@/lib/db/postgres-tasks'
import { requireUserId } from '@/lib/auth/get-user-id'
import { logger } from '@/lib/utils/logger'

type RouteParams = Promise<{ id: string }>

// サブタスク一覧取得
export async function GET(
  _request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const userId = await requireUserId()
    const { id: parentTaskId } = await params

    const subtasks = await PostgresTasksService.getSubtasks(userId, parentTaskId)
    return NextResponse.json({ success: true, data: subtasks })
  } catch (error) {
    logger.error('❌ API: Failed to get subtasks:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

// サブタスク作成
export async function POST(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const userId = await requireUserId()
    const { id: parentTaskId } = await params
    const { title } = await request.json()

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    logger.info('🎯 API: Creating subtask for task:', parentTaskId)
    const result = await PostgresTasksService.createSubtask(userId, parentTaskId, title)
    logger.info('✅ API: Subtask created successfully')

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('❌ API: Subtask creation failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
