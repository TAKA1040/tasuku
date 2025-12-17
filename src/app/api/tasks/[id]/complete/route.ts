import { NextRequest, NextResponse } from 'next/server'
import { PostgresTasksService } from '@/lib/db/postgres-tasks'
import { requireUserId } from '@/lib/auth/get-user-id'
import { logger } from '@/lib/utils/logger'

type RouteParams = Promise<{ id: string }>

// タスクを完了にする
export async function POST(
  _request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const userId = await requireUserId()
    const { id } = await params

    logger.info('🎯 API: Completing task:', id)
    const result = await PostgresTasksService.completeTask(userId, id)
    logger.info('✅ API: Task completed successfully')

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('❌ API: Task completion failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

// タスクを未完了にする
export async function DELETE(
  _request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const userId = await requireUserId()
    const { id } = await params

    logger.info('🎯 API: Uncompleting task:', id)
    const result = await PostgresTasksService.uncompleteTask(userId, id)
    logger.info('✅ API: Task uncompleted successfully')

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('❌ API: Task uncompletion failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
