'use client'

import { useState } from 'react'
import { migrateToUnifiedTasks } from '@/lib/db/migrate-to-unified'

export default function MigrateUnifiedPage() {
  const [migrating, setMigrating] = useState(false)
  const [result, setResult] = useState<string>('')

  const handleMigrate = async () => {
    try {
      setMigrating(true)
      setResult('移行中...')

      await migrateToUnifiedTasks()
      setResult('✅ データ移行が完了しました！')
    } catch (error) {
      setResult(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>統一データベース移行</h1>
      <p>既存のタスク、繰り返しタスク、アイデアをunified_tasksテーブルに移行します。</p>

      <button
        onClick={handleMigrate}
        disabled={migrating}
        style={{
          padding: '12px 24px',
          backgroundColor: migrating ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: migrating ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginBottom: '20px'
        }}
      >
        {migrating ? '移行中...' : 'データ移行を開始'}
      </button>

      {result && (
        <div style={{
          padding: '12px',
          backgroundColor: result.includes('❌') ? '#fee2e2' : '#f0f9ff',
          border: `1px solid ${result.includes('❌') ? '#fecaca' : '#bae6fd'}`,
          borderRadius: '4px',
          whiteSpace: 'pre-wrap'
        }}>
          {result}
        </div>
      )}
    </div>
  )
}