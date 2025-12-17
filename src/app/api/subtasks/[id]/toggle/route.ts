import { NextRequest, NextResponse } from 'next/server'
import { PostgresTasksService } from '@/lib/db/postgres-tasks'
import { requireUserId } from '@/lib/auth/get-user-id'
import { logger } from '@/lib/utils/logger'

type RouteParams = Promise<{ id: string }>

// サブタスクの完了状態を切り替え
export async function POST(
  _request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const userId = await requireUserId()
    const { id } = await params

    logger.info('🎯 API: Toggling subtask:', id)
    const result = await PostgresTasksService.toggleSubtask(userId, id)
    logger.info('✅ API: Subtask toggled successfully')

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('❌ API: Subtask toggle failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
