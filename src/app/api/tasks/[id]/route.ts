import { NextRequest, NextResponse } from 'next/server'
import { PostgresTasksService } from '@/lib/db/postgres-tasks'
import { requireUserId } from '@/lib/auth/get-user-id'
import { logger } from '@/lib/utils/logger'

type RouteParams = Promise<{ id: string }>

// 単一タスク取得
export async function GET(
  _request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const userId = await requireUserId()
    const { id } = await params

    const tasks = await PostgresTasksService.getAllUnifiedTasks(userId)
    const task = tasks.find(t => t.id === id)

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    logger.error('❌ API: Failed to get task:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

// 単一タスク更新
export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const updates = await request.json()

    logger.info('🎯 API: Updating task:', id)
    const result = await PostgresTasksService.updateUnifiedTask(userId, id, updates)
    logger.info('✅ API: Task updated successfully')

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('❌ API: Task update failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

// 単一タスク削除
export async function DELETE(
  _request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const userId = await requireUserId()
    const { id } = await params

    logger.info('🎯 API: Deleting task:', id)
    await PostgresTasksService.deleteUnifiedTask(userId, id)
    logger.info('✅ API: Task deleted successfully')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('❌ API: Task deletion failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
