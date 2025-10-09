import { NextRequest, NextResponse } from 'next/server'
import { UnifiedTasksService } from '@/lib/db/unified-tasks'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    logger.info('🎯 API: Creating task via UnifiedTasksService:', body)

    const result = await UnifiedTasksService.createUnifiedTask(body)
    logger.info('✅ API: Task created successfully:', result)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('❌ API: Task creation failed:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  try {
    logger.info('🎯 API: Getting all tasks...')
    const tasks = await UnifiedTasksService.getAllUnifiedTasks()
    logger.info('✅ API: Retrieved tasks:', tasks.length)

    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    logger.error('❌ API: Failed to get tasks:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}