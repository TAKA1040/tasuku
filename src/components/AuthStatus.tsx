'use client'
import { useSession } from 'next-auth/react'

export function AuthStatus() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
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

  if (!session?.user) {
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
      ✅ {session.user.email}でログイン中
    </div>
  )
}