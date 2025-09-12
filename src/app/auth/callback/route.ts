import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data?.session) {
        // ログイン成功時は今日のタスクページにリダイレクト
        const next = searchParams.get('next') ?? '/today'
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error?.message || 'Unknown error')}`)
      }
    } catch (err) {
      console.error('Auth callback exception:', err)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=callback_failed`)
    }
  } else {
    // コードが無い場合
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`)
  }
}