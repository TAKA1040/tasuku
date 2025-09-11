'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Starting Google OAuth...')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${location.origin}/auth/callback` },
      })
      
      if (error) {
        console.error('OAuth error:', error)
        setError(error.message)
      } else {
        console.log('OAuth success:', data)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('予期しないエラーが発生しました')
    } finally {
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
            padding:'12px 24px',
            background: loading ? '#9ca3af' : '#2563eb',
            color:'#fff',
            border:'none',
            borderRadius:8,
            fontSize:'16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight:'500'
          }}
        >
          {loading ? 'ログイン中...' : 'Login with Google'}
        </button>
        
        <div style={{fontSize:'12px',color:'#6b7280',marginTop:'16px'}}>
          ※ Supabaseの設定が必要です
        </div>
      </div>
    </div>
  )
}