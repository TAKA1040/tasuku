import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    console.log('Starting data migration from tasks to unified_tasks...')

    // 1. tasks → unified_tasks 移行
    const { data: existingTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')

    if (fetchError) {
      throw new Error(`Failed to fetch tasks: ${fetchError.message}`)
    }

    console.log(`Found ${existingTasks?.length || 0} tasks to migrate`)

    if (existingTasks && existingTasks.length > 0) {
      const migratedTasks = existingTasks.map((task, index) => ({
        id: task.id,
        user_id: task.user_id,
        display_number: task.display_number ||
          `${(task.due_date || task.created_at?.split('T')[0] || '20250921').replace(/-/g, '')}10${String(index + 1).padStart(3, '0')}`,
        task_type: 'NORMAL',
        title: task.title,
        completed: task.completed,
        memo: task.memo,
        due_date: task.due_date,
        category: task.category,
        importance: task.importance || 3,
        duration_min: task.duration_min,
        urls: task.urls,
        created_at: task.created_at,
        updated_at: task.updated_at,
        completed_at: task.completed_at,
        archived: task.archived || false,
        snoozed_until: task.snoozed_until,
        rollover_count: task.rollover_count || 0,
        attachment: task.attachment
      }))

      const { error: insertError } = await supabase
        .from('unified_tasks')
        .upsert(migratedTasks, { onConflict: 'id' })

      if (insertError) {
        throw new Error(`Failed to insert tasks: ${insertError.message}`)
      }
    }

    // 2. recurring_tasks → unified_tasks 移行
    const { data: existingRecurring, error: fetchRecurringError } = await supabase
      .from('recurring_tasks')
      .select('*')

    console.log(`Found ${existingRecurring?.length || 0} recurring tasks to migrate`)

    if (existingRecurring && existingRecurring.length > 0) {
      const migratedRecurring = existingRecurring.map((task, index) => ({
        id: task.id,
        user_id: task.user_id,
        display_number: `${(task.start_date || task.created_at?.split('T')[0] || '20250921').replace(/-/g, '')}12${String(index + 1).padStart(3, '0')}`,
        task_type: 'RECURRING',
        title: task.title,
        completed: false,
        memo: task.memo,
        due_date: null,
        category: task.category,
        importance: task.importance || 3,
        duration_min: task.duration_min,
        created_at: task.created_at,
        updated_at: task.updated_at,
        active: task.active,
        frequency: task.frequency,
        interval_n: task.interval_n || 1,
        weekdays: task.weekdays,
        month_day: task.month_day,
        start_date: task.start_date,
        end_date: task.end_date
      }))

      const { error: insertRecurringError } = await supabase
        .from('unified_tasks')
        .upsert(migratedRecurring, { onConflict: 'id' })

      if (insertRecurringError) {
        throw new Error(`Failed to insert recurring tasks: ${insertRecurringError.message}`)
      }
    }

    // 3. 結果確認
    const { data: finalCount } = await supabase
      .from('unified_tasks')
      .select('*', { count: 'exact' })

    return NextResponse.json({
      success: true,
      migrated: {
        tasks: existingTasks?.length || 0,
        recurring_tasks: existingRecurring?.length || 0,
        total_unified: finalCount?.length || 0
      },
      message: 'Data migration completed successfully'
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error },
      { status: 500 }
    )
  }
}