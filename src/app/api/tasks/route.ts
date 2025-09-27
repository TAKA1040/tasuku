import { NextRequest, NextResponse } from 'next/server'
import { UnifiedTasksService } from '@/lib/db/unified-tasks'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🎯 API: Creating task via UnifiedTasksService:', body)

    const result = await UnifiedTasksService.createUnifiedTask(body)
    console.log('✅ API: Task created successfully:', result)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('❌ API: Task creation failed:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('🎯 API: Getting all tasks...')
    const tasks = await UnifiedTasksService.getAllUnifiedTasks()
    console.log('✅ API: Retrieved tasks:', tasks.length)

    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    console.error('❌ API: Failed to get tasks:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}