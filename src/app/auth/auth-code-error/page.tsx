'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthCodeErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'no_code':
        return '認証コードが見つかりませんでした。'
      case 'callback_failed':
        return 'コールバック処理でエラーが発生しました。'
      default:
        return error || '認証処理でエラーが発生しました。'
    }
  }

  return (
    <div style={{display:'flex',minHeight:'100vh',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',maxWidth:'400px',padding:'20px'}}>
        <div style={{fontSize:'48px',marginBottom:'16px'}}>🔐</div>
        <h1 style={{color:'#dc2626',marginBottom:'12px',fontSize:'24px'}}>ログインできませんでした</h1>
        <p style={{marginBottom:'8px',color:'#6b7280',fontSize:'14px'}}>
          エラー詳細: {getErrorMessage(error)}
        </p>
        <p style={{marginBottom:'24px',color:'#374151'}}>
          もう一度Googleでログインをお試しください。
        </p>
        <a 
          href="/login" 
          style={{
            display:'inline-block',
            padding:'12px 24px',
            background:'#2563eb',
            color:'#fff',
            textDecoration:'none',
            borderRadius:'8px',
            fontWeight:'500',
            transition:'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1d4ed8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb'
          }}
        >
          ログインページに戻る
        </a>
      </div>
    </div>
  )
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div style={{display:'flex',minHeight:'100vh',alignItems:'center',justifyContent:'center'}}>
        <div>読み込み中...</div>
      </div>
    }>
      <AuthCodeErrorContent />
    </Suspense>
  )
}