'use client'

import { useDatabase } from '@/hooks/useDatabase'
import { useTasks } from '@/hooks/useTasks'
import { useRecurringTasks } from '@/hooks/useRecurringTasks'
import { useStatistics } from '@/hooks/useStatistics'
import { StatisticsCards } from '@/components/StatisticsCards'

export default function StatisticsPage() {
  const { isInitialized, error } = useDatabase()
  const { allTasks, loading: tasksLoading } = useTasks(isInitialized)
  const { allRecurringTasks, loading: recurringLoading } = useRecurringTasks(isInitialized)
  
  // RecurringTaskWithStatusに変換
  const recurringTasksWithStatus = allRecurringTasks.map(task => ({
    task,
    occursToday: false,
    completedToday: false,
    displayName: task.title
  }))
  
  const stats = useStatistics(allTasks, recurringTasksWithStatus)

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#dc2626' }}>データベースエラー</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (!isInitialized || tasksLoading || recurringLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>読み込み中...</h1>
        <p>統計データを準備しています</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '12px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '8px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href="/today"
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                ← 今日
              </a>
              <a
                href="/search"
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                🔍 検索
              </a>
            </div>
            <h1 style={{ 
              fontSize: '20px', 
              fontWeight: '600',
              color: '#1f2937',
              margin: '0'
            }}>
              📊 統計・分析
            </h1>
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            textAlign: 'right'
          }}>
            <div>最終更新: {new Date().toLocaleString('ja-JP')}</div>
            <div>データベース: {isInitialized ? '✅ 接続中' : '⚠️ 未接続'}</div>
          </div>
        </div>
        <p style={{ 
          color: '#6b7280',
          fontSize: '12px',
          margin: '0'
        }}>
          タスク管理の進捗状況と傾向
        </p>
      </header>

      <main>
        <StatisticsCards stats={stats} />
        
        {/* データが少ない場合のメッセージ */}
        {stats.totalTasks === 0 && (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '500',
              color: '#92400e',
              marginBottom: '8px'
            }}>
              まだタスクがありません
            </div>
            <div style={{
              fontSize: '14px',
              color: '#92400e'
            }}>
              タスクを作成すると、ここに統計情報が表示されます。<br />
              「今日」ページから新しいタスクを追加してください。
            </div>
          </div>
        )}

        {stats.totalTasks > 0 && stats.totalTasks < 5 && (
          <div style={{
            backgroundColor: '#dbeafe',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#1e40af'
            }}>
              💡 <strong>ヒント:</strong> より詳細な統計を得るために、もっとタスクを作成してカテゴリや重要度を設定してみましょう！
            </div>
          </div>
        )}
      </main>
    </div>
  )
}