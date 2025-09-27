'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestPage() {
  // Disable test page in production
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Page Not Available</h1>
        <p>This test page is only available in development mode.</p>
      </div>
    )
  }

  const [status, setStatus] = useState('接続テスト中...')
  const [error, setError] = useState('')

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = createClient()

        // 認証状態確認
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          setError(`認証エラー: ${authError.message}`)
          setStatus('認証失敗')
          return
        }

        if (!user) {
          setStatus('ユーザー未ログイン - 匿名アクセステスト中')
        } else {
          setStatus(`ログイン済み: ${user.email}`)
        }

        // データベース接続テスト
        const { data, error: dbError } = await supabase
          .from('unified_tasks')
          .select('count')
          .limit(1)

        if (dbError) {
          setError(`データベースエラー: ${dbError.message}`)
          setStatus('DB接続失敗')
        } else {
          setStatus('Supabase接続成功！')
        }

      } catch (err) {
        setError(`予期しないエラー: ${err}`)
        setStatus('接続失敗')
      }
    }

    testConnection()
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Supabase 接続テスト</h1>
      <div style={{ marginBottom: '20px' }}>
        <strong>状態:</strong> {status}
      </div>
      {error && (
        <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '4px' }}>
          <strong>エラー:</strong> {error}
        </div>
      )}
      <div style={{ marginTop: '20px' }}>
        <a href="/today" style={{ color: 'blue', textDecoration: 'underline' }}>
          今日ページに戻る
        </a>
      </div>
    </div>
  )
}