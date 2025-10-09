'use client'

import { useState } from 'react'
import { logger } from '@/lib/utils/logger'

interface AdminApprovalButtonProps {
  userId: string
  userEmail: string
}

export function AdminApprovalButton({ userId, userEmail }: AdminApprovalButtonProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleApprove = async () => {
    try {
      setLoading(true)
      setMessage('')
      
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, userEmail }),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage('承認完了！ページをリロードしてください。')
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setMessage(`エラー: ${result.error}`)
      }
    } catch (error) {
      setMessage('予期しないエラーが発生しました')
      logger.error('Approval error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleApprove}
        disabled={loading}
        style={{
          padding: '12px 24px',
          background: loading ? '#9ca3af' : '#10b981',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: '500',
          marginTop: '16px'
        }}
      >
        {loading ? '承認処理中...' : '管理者として承認する'}
      </button>
      
      {message && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '14px',
          background: message.includes('エラー') ? '#fef2f2' : '#dcfce7',
          color: message.includes('エラー') ? '#dc2626' : '#166534',
        }}>
          {message}
        </div>
      )}
    </div>
  )
}