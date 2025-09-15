'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

// Dynamic import to prevent static generation
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Starting Google OAuth...')
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Redirect URL:', `${window.location.origin}/auth/callback`)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      })

      if (error) {
        console.error('OAuth error:', error)
        setError(`ログインエラー: ${error.message}`)
        setLoading(false)
      }
      // 成功時はリダイレクトが発生するのでloadingは自動でfalseになる
    } catch (err) {
      console.error('Unexpected error:', err)
      setError(`予期しないエラー: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  return (
    <div style={{display:'flex',minHeight:'100vh',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',maxWidth:'400px'}}>
        <h1 style={{marginBottom:'20px'}}>Tasuku Login</h1>
        
        {error && (
          <div style={{
            background:'#fef2f2',
            color:'#dc2626',
            padding:'12px',
            borderRadius:'6px',
            marginBottom:'16px',
            fontSize:'14px'
          }}>
            エラー: {error}
          </div>
        )}
        
        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          style={{
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            gap:'12px',
            padding:'12px 24px',
            background: loading ? '#f3f4f6' : '#fff',
            color: loading ? '#9ca3af' : '#1f2937',
            border: loading ? '1px solid #d1d5db' : '1px solid #d1d5db',
            borderRadius:'8px',
            fontSize:'16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight:'500',
            width:'100%',
            boxShadow:'0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            transition:'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#f9fafb'
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#fff'
              e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }
          }}
        >
          {!loading && (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Google認証中...' : 'Googleでログイン'}
        </button>
        
        <div style={{fontSize:'12px',color:'#6b7280',marginTop:'16px'}}>
          Googleアカウントでセキュアにログイン
        </div>
      </div>
    </div>
  )
}