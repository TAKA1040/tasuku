import { NextRequest, NextResponse } from 'next/server'
import { PostgresTasksService } from '@/lib/db/postgres-tasks'
import { requireUserId } from '@/lib/auth/get-user-id'
import { logger } from '@/lib/utils/logger'

// テンプレート一覧取得
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const { searchParams } = new URL(request.url)

    // フィルターパラメータを取得
    const filters: {
      pattern?: string
      category?: string
      active?: boolean
    } = {}

    const pattern = searchParams.get('pattern')
    if (pattern) {
      filters.pattern = pattern
    }

    const category = searchParams.get('category')
    if (category) {
      filters.category = category
    }

    const active = searchParams.get('active')
    if (active !== null) {
      filters.active = active === 'true'
    }

    logger.info('🎯 API: Getting templates with filters:', filters)
    const templates = await PostgresTasksService.getAllTemplates(userId, filters)
    logger.info('✅ API: Retrieved templates:', templates.length)

    return NextResponse.json({ success: true, data: templates })
  } catch (error) {
    logger.error('❌ API: Failed to get templates:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

// テンプレート作成
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const body = await request.json()

    logger.info('🎯 API: Creating template:', body.title)
    const result = await PostgresTasksService.createTemplate(userId, body)
    logger.info('✅ API: Template created:', result.id)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('❌ API: Template creation failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

// テンプレート更新
export async function PUT(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Template ID is required' }, { status: 400 })
    }

    logger.info('🎯 API: Updating template:', id)
    const result = await PostgresTasksService.updateTemplate(userId, id, updates)
    logger.info('✅ API: Template updated')

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('❌ API: Template update failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

// テンプレート削除
export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Template ID is required' }, { status: 400 })
    }

    logger.info('🎯 API: Deleting template:', id)
    await PostgresTasksService.deleteTemplate(userId, id)
    logger.info('✅ API: Template deleted')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('❌ API: Template deletion failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
