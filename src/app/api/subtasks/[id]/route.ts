import { NextRequest, NextResponse } from 'next/server'
import { PostgresTasksService } from '@/lib/db/postgres-tasks'
import { requireUserId } from '@/lib/auth/get-user-id'
import { logger } from '@/lib/utils/logger'

type RouteParams = Promise<{ id: string }>

// サブタスク更新
export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const updates = await request.json()

    logger.info('🎯 API: Updating subtask:', id)
    const result = await PostgresTasksService.updateSubtask(userId, id, updates)
    logger.info('✅ API: Subtask updated successfully')

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('❌ API: Subtask update failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

// サブタスク削除
export async function DELETE(
  _request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const userId = await requireUserId()
    const { id } = await params

    logger.info('🎯 API: Deleting subtask:', id)
    await PostgresTasksService.deleteSubtask(userId, id)
    logger.info('✅ API: Subtask deleted successfully')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('❌ API: Subtask deletion failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
