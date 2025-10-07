import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 𝕏ポストテンプレートを検索
    const { data: templates, error } = await supabase
      .from('recurring_templates')
      .select('*')
      .eq('user_id', user.id)
      .or('title.ilike.%ポスト%,title.ilike.%𝕏%,title.ilike.%X%')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // デバッグ情報を追加
    const debugInfo = templates?.map(t => ({
      id: t.id,
      title: t.title,
      urls: t.urls,
      urls_type: typeof t.urls,
      urls_is_array: Array.isArray(t.urls),
      urls_length: Array.isArray(t.urls) ? t.urls.length : null,
      urls_status: t.urls === null ? 'NULL' :
                   t.urls === undefined ? 'UNDEFINED' :
                   Array.isArray(t.urls) && t.urls.length === 0 ? 'EMPTY_ARRAY' :
                   Array.isArray(t.urls) ? `HAS_${t.urls.length}_URLS` : 'UNKNOWN',
      active: t.active,
      pattern: t.pattern,
      weekdays: t.weekdays,
      created_at: t.created_at,
      updated_at: t.updated_at
    }))

    return NextResponse.json({
      success: true,
      count: templates?.length || 0,
      templates: debugInfo
    })
  } catch (error) {
    console.error('Debug templates error:', error)
    return NextResponse.json({
      error: String(error)
    }, { status: 500 })
  }
}
