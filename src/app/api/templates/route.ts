import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  try {
    console.log('🎯 API: Getting all templates...')
    const supabase = createClient()

    const { data: templates, error } = await supabase
      .from('recurring_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`)
    }

    console.log('✅ API: Retrieved templates:', templates?.length || 0)
    return NextResponse.json(templates || [])
  } catch (error) {
    console.error('❌ API: Failed to get templates:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}