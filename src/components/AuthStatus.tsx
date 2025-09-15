'use client'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'

export function AuthStatus() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  if (loading) {
    return (
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        認証状態確認中...
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        borderRadius: '6px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        ⚠️ ログインが必要です
        <a
          href="/login"
          style={{
            color: '#2563eb',
            textDecoration: 'underline',
            fontWeight: '500'
          }}
        >
          ログイン
        </a>
      </div>
    )
  }

  return (
    <div style={{
      padding: '8px 12px',
      backgroundColor: '#f0f9ff',
      color: '#0ea5e9',
      borderRadius: '6px',
      fontSize: '12px'
    }}>
      ✅ {user.email}でログイン中
    </div>
  )
}