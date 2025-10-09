import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // 全ての PENDING 状態のプロフィールを APPROVED に更新
    const { data, error } = await supabase
      .from('profiles')
      .update({
        status: 'APPROVED',
        approved_at: new Date().toISOString(),
        approved_by: 'system-auto-approval'
      })
      .eq('status', 'PENDING')
      .select()

    if (error) {
      logger.error('Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      updated: data?.length || 0,
      profiles: data 
    })
  } catch (error) {
    logger.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}