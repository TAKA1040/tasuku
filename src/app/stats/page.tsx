'use client'

import { useDatabase } from '@/hooks/useDatabase'
import { useTasks } from '@/hooks/useTasks'
import { useRecurringTasks } from '@/hooks/useRecurringTasks'
import { useMVPStatistics } from '@/hooks/useStatistics'
import { useState, useEffect } from 'react'

export default function StatsPage() {
  const { isInitialized } = useDatabase()
  const { allTasks } = useTasks(isInitialized)
  const { allRecurringTasks } = useRecurringTasks(isInitialized)
  const [recurringLogs, setRecurringLogs] = useState<Array<{ recurring_task_id: string; date: string }>>([])
  
  // 繰り返し完了記録を取得
  useEffect(() => {
    if (!isInitialized) return
    
    // TODO: 実際のRecurringLogデータを取得
    // 現在はモックデータ
    setRecurringLogs([])
  }, [isInitialized])
  
  const stats = useMVPStatistics(allTasks, allRecurringTasks, recurringLogs)
  
  if (!isInitialized) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>読み込み中...</h1>
      </div>
    )
  }
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
          統計
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          達成率と進捗の数値表示
        </p>
      </header>

      <main>
        {/* 期間別統計 */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>
            期間別達成率
          </h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            {[
              { label: '今日', ...stats.today },
              { label: '今週', ...stats.thisWeek },
              { label: '今月', ...stats.thisMonth }
            ].map(({ label, completed, total, rate }) => (
              <div key={label} style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: '500' }}>{label}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '600',
                    color: total > 0 ? '#059669' : '#6b7280'
                  }}>
                    {completed} / {total}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280'
                  }}>
                    {rate}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 連続達成 */}
        <section>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>
            連続達成日数（Streak）
          </h2>
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#fff'
          }}>
            {stats.streaks.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                繰り返しタスクがありません
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {stats.streaks.map(streak => (
                  <div
                    key={streak.taskId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      border: '1px solid #f3f4f6',
                      borderRadius: '6px',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>
                        {streak.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        最高記録: {streak.maxStreak}日
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: '700',
                        color: streak.currentStreak > 0 ? '#059669' : '#6b7280'
                      }}>
                        {streak.currentStreak}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        連続日数
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        
        {/* 戻るボタン */}
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <a
            href="/today"
            style={{
              display: 'inline-block',
              background: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← 今日へ戻る
          </a>
        </div>
      </main>
    </div>
  )
}