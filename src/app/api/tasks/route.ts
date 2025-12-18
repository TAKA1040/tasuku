import { NextRequest, NextResponse } from 'next/server'
import { PostgresTasksService } from '@/lib/db/postgres-tasks'
import { requireUserId } from '@/lib/auth/get-user-id'
import { logger } from '@/lib/utils/logger'

// タスク作成
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const body = await request.json()
    logger.info('🎯 API: Creating task via PostgresTasksService:', body.title)

    // display_numberが無い場合は生成
    if (!body.display_number) {
      body.display_number = await PostgresTasksService.generateDisplayNumber(userId)
    }

    const result = await PostgresTasksService.createUnifiedTask(userId, body)
    logger.info('✅ API: Task created successfully:', result.id)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('❌ API: Task creation failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

// タスク一覧取得
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const { searchParams } = new URL(request.url)

    // 未関連付け繰り返しタスクの取得（テンプレート管理画面用）
    const orphanRecurring = searchParams.get('orphan_recurring')
    if (orphanRecurring === 'true') {
      logger.info('🎯 API: Getting orphan recurring tasks')
      const orphanTasks = await PostgresTasksService.getOrphanRecurringTasks(userId)
      logger.info('✅ API: Retrieved orphan tasks:', orphanTasks.length)
      return NextResponse.json({ success: true, data: orphanTasks })
    }

    // フィルターパラメータを取得
    const filters: {
      completed?: boolean
      category?: string
      date_range?: { start?: string; end?: string }
      has_due_date?: boolean
    } = {}

    const completed = searchParams.get('completed')
    if (completed !== null) {
      filters.completed = completed === 'true'
    }

    const category = searchParams.get('category')
    if (category) {
      filters.category = category
    }

    const dateStart = searchParams.get('date_start')
    const dateEnd = searchParams.get('date_end')
    if (dateStart || dateEnd) {
      filters.date_range = {}
      if (dateStart) filters.date_range.start = dateStart
      if (dateEnd) filters.date_range.end = dateEnd
    }

    const hasDueDate = searchParams.get('has_due_date')
    if (hasDueDate !== null) {
      filters.has_due_date = hasDueDate === 'true'
    }

    logger.info('🎯 API: Getting tasks with filters:', filters)
    const tasks = await PostgresTasksService.getAllUnifiedTasks(userId, filters)
    logger.info('✅ API: Retrieved tasks:', tasks.length)

    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    logger.error('❌ API: Failed to get tasks:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

// タスク更新
export async function PUT(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID is required' }, { status: 400 })
    }

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

// タスク削除
export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID is required' }, { status: 400 })
    }

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
