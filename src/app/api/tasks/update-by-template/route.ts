import { NextRequest, NextResponse } from 'next/server'
import { PostgresTasksService } from '@/lib/db/postgres-tasks'
import { requireUserId } from '@/lib/auth/get-user-id'
import { logger } from '@/lib/utils/logger'

// テンプレートIDに基づくタスク一括更新
export async function PUT(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const body = await request.json()
    const { template_id, urls, start_time, end_time } = body

    if (!template_id) {
      return NextResponse.json({ success: false, error: 'Template ID is required' }, { status: 400 })
    }

    logger.info('🎯 API: Updating tasks by template:', template_id)
    const count = await PostgresTasksService.updateTasksByTemplate(userId, template_id, {
      urls,
      start_time,
      end_time
    })
    logger.info('✅ API: Tasks updated:', count)

    return NextResponse.json({ success: true, data: { count } })
  } catch (error) {
    logger.error('❌ API: Tasks update by template failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
