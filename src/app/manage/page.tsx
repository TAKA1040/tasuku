'use client'

import { useState } from 'react'
import { UnifiedTasksService } from '@/lib/db/unified-tasks'

export default function ManagePage() {
  const [cleanupStatus, setCleanupStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleCleanupOrphanedRecords = async () => {
    if (loading) return

    setLoading(true)
    setCleanupStatus('クリーンアップ中...')

    try {
      const result = await UnifiedTasksService.cleanupOrphanedDoneRecords()

      if (result.deletedCount === 0) {
        setCleanupStatus('クリーンアップする記録がありませんでした。')
      } else {
        setCleanupStatus(`${result.deletedCount}件の孤児化したdone記録を削除しました。`)
      }
    } catch (error: any) {
      console.error('Cleanup failed:', error)
      const errorMessage = error?.message || 'Unknown error'
      setCleanupStatus(`クリーンアップ中にエラーが発生しました: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '400px' }}>
        <h1>管理ページ</h1>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>データクリーンアップ</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>
            削除されたタスクに関連する不要な完了記録を削除します
          </p>

          <button
            onClick={handleCleanupOrphanedRecords}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#ccc' : '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px'
            }}
          >
            {loading ? 'クリーンアップ中...' : '孤児化した記録をクリーンアップ'}
          </button>

          {cleanupStatus && (
            <p style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#e3f2fd',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {cleanupStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}