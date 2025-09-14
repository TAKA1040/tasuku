'use client'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string | null
  status: string
  role: string
  approved_at: string | null
  approved_by: string | null
  created_at?: string
  updated_at?: string
}

export default function AuthDebugPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const loadAuthData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // ユーザー情報取得
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      
      setUser(user)

      // プロファイル情報取得（ユーザーがいる場合のみ）
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError)
        } else {
          setProfile(profile)
        }
      }
    } catch (err) {
      console.error('Auth debug error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadAuthData()
  }, [loadAuthData])

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: `${window.location.origin}/auth/callback?next=/debug/auth`
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    }
  }

  const createProfile = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          status: 'APPROVED',
          role: 'USER',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .select()
        .single()
      
      if (error) throw error
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile creation failed')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>認証デバッグ</h1>
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>認証デバッグページ</h1>
      
      {error && (
        <div style={{
          background: '#fee2e2',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          エラー: {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {!user ? (
          <button 
            onClick={handleLogin}
            style={{
              padding: '8px 16px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Googleログイン
          </button>
        ) : (
          <>
            <button 
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ログアウト
            </button>
            <button 
              onClick={loadAuthData}
              style={{
                padding: '8px 16px',
                background: '#059669',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              再読み込み
            </button>
            {!profile && (
              <button 
                onClick={createProfile}
                style={{
                  padding: '8px 16px',
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                プロファイル作成
              </button>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <h2>ユーザー情報</h2>
          <pre style={{
            background: '#f3f4f6',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
            {user ? JSON.stringify(user, null, 2) : 'ログインしていません'}
          </pre>
        </div>

        <div>
          <h2>プロファイル情報</h2>
          <pre style={{
            background: '#f3f4f6',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
            {profile ? JSON.stringify(profile, null, 2) : 'プロファイルなし'}
          </pre>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>環境情報</h2>
        <ul style={{ fontSize: '14px' }}>
          <li>URL: {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</li>
          <li>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</li>
          <li>Callback URL: {typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'N/A'}</li>
        </ul>
      </div>
    </div>
  )
}