'use client'

import Link from 'next/link'
import { useDatabase } from '@/hooks/useDatabase'
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'
import { useStatistics } from '@/hooks/useStatistics'
import type { Task } from '@/lib/db/schema'
import type { UnifiedRecurringTaskWithStatus } from '@/hooks/useUnifiedRecurringTasks'
import { StatisticsCards } from '@/components/StatisticsCards'
import { useMemo } from 'react'

export default function StatisticsPage() {
  const { isInitialized, error } = useDatabase()
  const unifiedTasks = useUnifiedTasks(isInitialized)

  // 統一タスクを古いTask形式に変換
  const allTasks = useMemo(() => {
    return unifiedTasks.tasks.map(task => ({
      ...task,
      memo: task.memo || undefined, // nullをundefinedに変換
      category: task.category || undefined, // nullをundefinedに変換
      completed_at: task.completed_at || (task.completed ? task.updated_at?.split('T')[0] : undefined)
    }))
  }, [unifiedTasks.tasks])

  // 繰り返しタスクをUnifiedRecurringTaskWithStatusに変換
  const recurringTasksWithStatus = useMemo(() => {
    return unifiedTasks.tasks
      .filter(task => task.task_type === 'RECURRING')
      .map(task => ({
        task: {
          id: task.id,
          title: task.title,
          memo: task.memo,
          frequency: (task.recurring_pattern || 'DAILY') as 'DAILY' | 'INTERVAL_DAYS' | 'WEEKLY' | 'MONTHLY',
          interval_n: 1,
          start_date: task.due_date || task.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          active: !task.completed,
          created_at: task.created_at || '',
          updated_at: task.updated_at || '',
          display_number: task.display_number,
          duration_min: task.duration_min,
          importance: task.importance,
          category: task.category,
          urls: task.urls,
          attachment: task.attachment,
          user_id: '',
          due_date: task.due_date
        },
        occursToday: false,
        completedToday: task.completed,
        displayName: task.title,
        currentStreak: 0,
        totalCompletions: 0
      }))
  }, [unifiedTasks.tasks])

  const stats = useStatistics(allTasks as Task[], recurringTasksWithStatus as UnifiedRecurringTaskWithStatus[])
  const loading = unifiedTasks.loading

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#dc2626' }}>データベースエラー</h1>
        <p>{error}</p>
      </div>
    )
  }

  // Check if user is authenticated
  if (!isInitialized && !error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#f59e0b' }}>認証が必要です</h1>
        <p>統計を確認するにはログインしてください。</p>
        <a href="/login" style={{
          display: 'inline-block',
          marginTop: '16px',
          padding: '12px 24px',
          background: '#2563eb',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: '500'
        }}>
          ログイン
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>読み込み中...</h1>
        <p>統計データを準備しています</p>
      </div>
    )
  }

  return (
    <div style={{
      padding: '8px',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <header style={{ marginBottom: '12px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/today" style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: '#3b82f6',
              textDecoration: 'none',
              fontSize: '14px',
              padding: '8px 16px',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              transition: 'all 0.2s'
            }}>
              ← ホームに戻る
            </Link>
            <h1 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0
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