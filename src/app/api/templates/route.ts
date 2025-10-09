import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    logger.info('🎯 API: Getting all templates...')
    const supabase = createClient()

    const { data: templates, error } = await supabase
      .from('recurring_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`)
    }

    logger.info('✅ API: Retrieved templates:', templates?.length || 0)
    return NextResponse.json(templates || [])
  } catch (error) {
    logger.error('❌ API: Failed to get templates:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}