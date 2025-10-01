'use client'

import { useState, useMemo } from 'react'
import type { UnifiedTask } from '@/lib/types/unified-task'
import { logger } from '@/lib/utils/logger'

interface RecurringTaskStatsProps {
  completedTasks: UnifiedTask[]
  selectedTaskIds: string[]
  onTaskSelect: (taskId: string) => void
}

interface TaskStats {
  taskId: string
  taskTitle: string
  templateId: string | null
  totalDays: number
  completedDays: number
  completionRate: number
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string | null
  completionDates: string[]
}

export function RecurringTaskStats({ completedTasks, selectedTaskIds, onTaskSelect }: RecurringTaskStatsProps) {
  console.log('🚀 RecurringTaskStats component mounted/rendered')
  console.log('Props:', { completedTasksLength: completedTasks.length, selectedTaskIdsLength: selectedTaskIds.length })

  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month')

  // 期間の開始日を計算（useMemoで依存関係を明確化）
  const startDate = useMemo(() => {
    const today = new Date()
    switch (period) {
      case 'week':
        const week = new Date(today)
        week.setDate(today.getDate() - 7)
        return week.toISOString().split('T')[0]
      case 'month':
        const month = new Date(today)
        month.setMonth(today.getMonth() - 1)
        return month.toISOString().split('T')[0]
      case 'all':
        return '1970-01-01'
    }
  }, [period])

  // 繰り返しタスクの統計を計算
  const recurringStats = useMemo(() => {
    logger.debug('⚡ useMemo is running!', { completedTasksCount: completedTasks.length, period })

    const today = new Date().toISOString().split('T')[0]

    logger.debug('🔍 All completed tasks:', completedTasks.length)
    logger.debug('🔍 Task types:', completedTasks.map(t => ({
      title: t.title,
      type: t.task_type,
      templateId: t.recurring_template_id
    })))

    // 繰り返しタスクのみをフィルタ
    const recurringTasks = completedTasks.filter(
      task => task.task_type === 'RECURRING' && task.recurring_template_id
    )

    logger.debug('🔍 Filtered recurring tasks:', { count: recurringTasks.length })
    logger.debug('🔍 Recurring tasks:', recurringTasks.map(t => ({ title: t.title, templateId: t.recurring_template_id })))

    // テンプレートIDごとにグループ化
    const tasksByTemplate = new Map<string, UnifiedTask[]>()
    recurringTasks.forEach(task => {
      const templateId = task.recurring_template_id!
      if (!tasksByTemplate.has(templateId)) {
        tasksByTemplate.set(templateId, [])
      }
      tasksByTemplate.get(templateId)!.push(task)
    })

    // 各テンプレートの統計を計算
    const stats: TaskStats[] = []
    tasksByTemplate.forEach((tasks, templateId) => {
      // 期間内の完了日を取得
      const completionDates = tasks
        .map(task => task.completed_at?.split('T')[0] || task.updated_at?.split('T')[0])
        .filter((date): date is string => date !== undefined && date >= startDate && date <= today)
        .sort()

      if (completionDates.length === 0) return

      // 期間内の総日数を計算
      const start = new Date(startDate)
      const end = new Date(today)
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

      // 連続達成日数を計算
      const calculateStreaks = (dates: string[]) => {
        let currentStreak = 0
        let longestStreak = 0
        let tempStreak = 0
        const today = new Date().toISOString().split('T')[0]

        // 重複を除去して昇順にソート
        const uniqueSet = new Set(dates)
        const sortedDates = Array.from(uniqueSet).sort()

        for (let i = sortedDates.length - 1; i >= 0; i--) {
          const date = sortedDates[i]
          const expectedDate = i === sortedDates.length - 1
            ? today
            : new Date(new Date(sortedDates[i + 1]).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

          if (date === expectedDate || i === sortedDates.length - 1) {
            tempStreak++
            if (i === sortedDates.length - 1) {
              currentStreak = tempStreak
            }
            longestStreak = Math.max(longestStreak, tempStreak)
          } else {
            tempStreak = 1
          }
        }

        return { currentStreak, longestStreak }
      }

      const { currentStreak, longestStreak } = calculateStreaks(completionDates)

      // 重複を除外した完了日の配列
      const uniqueSet = new Set(completionDates)
      const uniqueDates = Array.from(uniqueSet)

      stats.push({
        taskId: templateId,
        taskTitle: tasks[0].title,
        templateId: templateId,
        totalDays,
        completedDays: uniqueDates.length,
        completionRate: (uniqueDates.length / totalDays) * 100,
        currentStreak,
        longestStreak,
        lastCompletedDate: completionDates[completionDates.length - 1] || null,
        completionDates: uniqueDates
      })
    })

    return stats.sort((a, b) => b.completionRate - a.completionRate)
  }, [completedTasks, period, startDate])

  // 選択されたタスクのみ表示
  const displayStats = selectedTaskIds.length > 0
    ? recurringStats.filter(stat => selectedTaskIds.includes(stat.taskId))
    : recurringStats

  // デバッグ: レンダリング時の状態確認
  logger.debug('🎨 RecurringTaskStats rendered with:', {
    completedTasksCount: completedTasks.length,
    statsCount: recurringStats.length,
    displayStatsCount: displayStats.length,
    selectedTaskIds: selectedTaskIds.length,
    period
  })

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '30px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          margin: 0,
          color: '#1f2937'
        }}>
          📊 繰り返しタスク達成状況
        </h2>

        {/* 期間選択 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['week', 'month', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: period === p ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                backgroundColor: period === p ? '#eff6ff' : 'white',
                color: period === p ? '#3b82f6' : '#6b7280',
                fontSize: '14px',
                fontWeight: period === p ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              {p === 'week' ? '1週間' : p === 'month' ? '1ヶ月' : '全期間'}
            </button>
          ))}
        </div>
      </div>

      {displayStats.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#9ca3af'
        }}>
          繰り返しタスクの完了履歴がありません
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayStats.map(stat => (
            <div
              key={stat.taskId}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: selectedTaskIds.includes(stat.taskId) ? '#f0f9ff' : 'white'
              }}
              onClick={() => onTaskSelect(stat.taskId)}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 4px 0',
                    color: '#1f2937'
                  }}>
                    {stat.taskTitle}
                  </h3>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280'
                  }}>
                    最終完了: {stat.lastCompletedDate ? new Date(stat.lastCompletedDate).toLocaleDateString('ja-JP') : '未完了'}
                  </div>
                </div>

                {/* 達成率バッジ */}
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  backgroundColor: stat.completionRate >= 80 ? '#dcfce7' :
                    stat.completionRate >= 50 ? '#fef3c7' : '#fee2e2',
                  color: stat.completionRate >= 80 ? '#16a34a' :
                    stat.completionRate >= 50 ? '#d97706' : '#dc2626',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {stat.completionRate.toFixed(0)}%
                </div>
              </div>

              {/* 統計情報 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                    達成日数
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                    {stat.completedDays} / {stat.totalDays}日
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                    現在の連続
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#3b82f6' }}>
                    {stat.currentStreak}日
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                    最長連続
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#8b5cf6' }}>
                    {stat.longestStreak}日
                  </div>
                </div>
              </div>

              {/* 進捗バー */}
              <div style={{
                marginTop: '12px',
                height: '6px',
                backgroundColor: '#f3f4f6',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${stat.completionRate}%`,
                  height: '100%',
                  backgroundColor: stat.completionRate >= 80 ? '#22c55e' :
                    stat.completionRate >= 50 ? '#f59e0b' : '#ef4444',
                  transition: 'width 0.3s'
                }} />
              </div>

              {/* 30日カレンダー表示（選択時のみ） */}
              {selectedTaskIds.includes(stat.taskId) && (() => {
                // 過去30日の日付配列を生成
                const dates: string[] = []
                const dateLabels: number[] = []
                for (let i = 29; i >= 0; i--) {
                  const date = new Date()
                  date.setDate(date.getDate() - i)
                  const dateStr = date.toISOString().split('T')[0]
                  dates.push(dateStr)
                  dateLabels.push(date.getDate())
                }

                // 各日の完了状況を判定
                const completions = dates.map(date =>
                  stat.completionDates.includes(date)
                )

                return (
                  <div style={{ marginTop: '16px' }}>
                    {/* デスクトップ表示 */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(30, minmax(18px, 1fr))`,
                      gap: '4px'
                    }} className="desktop-calendar">
                      {dates.map((date, index) => (
                        <div
                          key={date}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <div style={{
                            fontSize: '10px',
                            color: '#9ca3af',
                            fontWeight: '500'
                          }}>
                            {dateLabels[index]}
                          </div>
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '3px',
                              backgroundColor: completions[index] ? '#10b981' : '#e5e7eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                            title={`${date}: ${completions[index] ? '完了' : '未完了'}`}
                          >
                            {completions[index] ? '✓' : ''}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* モバイル表示（2段） */}
                    <div style={{ display: 'none' }} className="mobile-calendar">
                      {/* 前半15日 */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(15, 1fr)',
                        gap: '3px',
                        marginBottom: '8px'
                      }}>
                        {dates.slice(0, 15).map((date, index) => (
                          <div
                            key={date}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            <div style={{
                              fontSize: '9px',
                              color: '#9ca3af',
                              fontWeight: '500'
                            }}>
                              {dateLabels[index]}
                            </div>
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '3px',
                                backgroundColor: completions[index] ? '#10b981' : '#e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            >
                              {completions[index] ? '✓' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* 後半15日 */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(15, 1fr)',
                        gap: '3px'
                      }}>
                        {dates.slice(15, 30).map((date, index) => (
                          <div
                            key={date}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            <div style={{
                              fontSize: '9px',
                              color: '#9ca3af',
                              fontWeight: '500'
                            }}>
                              {dateLabels[index + 15]}
                            </div>
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '3px',
                                backgroundColor: completions[index + 15] ? '#10b981' : '#e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            >
                              {completions[index + 15] ? '✓' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* レスポンシブCSS */}
                    <style jsx>{`
                      @media (max-width: 768px) {
                        .desktop-calendar {
                          display: none !important;
                        }
                        .mobile-calendar {
                          display: block !important;
                        }
                      }
                    `}</style>
                  </div>
                )
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}