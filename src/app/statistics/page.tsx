'use client'

import Link from 'next/link'
import { useDatabase } from '@/hooks/useDatabase'
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'
import { useStatistics } from '@/hooks/useStatistics'
import type { Task } from '@/lib/db/schema'
import type { UnifiedRecurringTaskWithStatus } from '@/hooks/useUnifiedRecurringTasks'
import { StatisticsCards } from '@/components/StatisticsCards'
import { useMemo, useState, useEffect } from 'react'
import type { UnifiedTask } from '@/lib/types/unified-task'

export default function StatisticsPage() {
  const { isInitialized, error } = useDatabase()
  const unifiedTasks = useUnifiedTasks(isInitialized)
  const [activeTab, setActiveTab] = useState<'stats' | 'calendar'>('calendar')
  const [selectedDailyTasks, setSelectedDailyTasks] = useState<string[]>([])
  const [completedTasks, setCompletedTasks] = useState<UnifiedTask[]>([])

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

  // 完了タスクを読み込み
  useEffect(() => {
    const loadCompletedTasks = async () => {
      try {
        const tasks = unifiedTasks.tasks.filter(task => task.completed)
        setCompletedTasks(tasks)
      } catch (error) {
        console.error('Failed to load completed tasks:', error)
      }
    }
    if (isInitialized) {
      loadCompletedTasks()
    }
  }, [unifiedTasks.tasks, isInitialized])

  // 選択タスクをローカルストレージから復元
  useEffect(() => {
    const saved = localStorage.getItem('selectedDailyTasks')
    if (saved) {
      try {
        setSelectedDailyTasks(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to parse selected daily tasks:', error)
      }
    }
  }, [])

  // 選択タスクをローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('selectedDailyTasks', JSON.stringify(selectedDailyTasks))
  }, [selectedDailyTasks])

  // 30日カレンダーデータ生成
  const getDailyTasksAchievementData = () => {
    const dates: string[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }

    return selectedDailyTasks.map(taskId => {
      const taskCompletions = completedTasks.filter(task =>
        task.recurring_template_id === taskId && task.completed
      )

      // タスクのタイトルを取得（完了済みまたは未完了の繰り返しタスクから）
      const firstTask = taskCompletions[0]
      const allTasksWithThisTemplate = unifiedTasks.tasks.filter(task =>
        task.recurring_template_id === taskId
      )
      const taskTitle = firstTask?.title || allTasksWithThisTemplate[0]?.title || '不明なタスク'
      const taskStartDate = firstTask?.created_at?.split('T')[0] || allTasksWithThisTemplate[0]?.created_at?.split('T')[0] || dates[0]

      const completions = dates.map(date => {
        return taskCompletions.some(task => {
          const completedDate = task.completed_at?.split('T')[0] || task.updated_at?.split('T')[0]
          return completedDate === date
        })
      })

      const totalCompletedDays = completions.filter(c => c).length
      const totalDays = dates.length
      const recentCompletions = completions.slice(-7)
      const recentCompletedDays = recentCompletions.filter(c => c).length
      const recentTotalDays = 7

      let consecutiveDays = 0
      for (let i = completions.length - 1; i >= 0; i--) {
        if (completions[i]) {
          consecutiveDays++
        } else {
          break
        }
      }

      return {
        taskId,
        taskTitle,
        taskStartDate,
        dates,
        completions,
        consecutiveDays,
        recentCompletedDays,
        recentTotalDays,
        recentAchievementRate: recentTotalDays > 0 ? (recentCompletedDays / recentTotalDays) * 100 : 0,
        totalCompletedDays,
        totalDays,
        totalAchievementRate: totalDays > 0 ? (totalCompletedDays / totalDays) * 100 : 0
      }
    })
  }

  const achievementData = getDailyTasksAchievementData()

  // 繰り返しタスクの一覧を取得
  const recurringTasks = completedTasks.filter(task =>
    task.recurring_template_id && task.completed
  ).reduce((acc, task) => {
    if (!acc.some(t => t.recurring_template_id === task.recurring_template_id)) {
      acc.push(task)
    }
    return acc
  }, [] as UnifiedTask[])

  // タスク選択トグル
  const toggleTaskSelection = (taskId: string) => {
    setSelectedDailyTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId)
      } else {
        return [...prev, taskId]
      }
    })
  }

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
    <>
      <style>{`
        @media (max-width: 640px) {
          .stats-header { flex-direction: column; align-items: flex-start !important; }
          .stats-header-right {
            font-size: 11px !important;
            width: 100%;
            text-align: left !important;
          }
          .stats-tabs button {
            padding: 10px 12px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
      <div style={{
        padding: '8px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <header style={{ marginBottom: '12px' }}>
          <div className="stats-header" style={{
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
            <div className="stats-header-right" style={{
              fontSize: '14px',
              color: '#6b7280',
              textAlign: 'right'
            }}>
              <div>最終更新: {new Date().toLocaleString('ja-JP')}</div>
              <div>データベース: {isInitialized ? '✅ 接続中' : '⚠️ 未接続'}</div>
            </div>
          </div>

          {/* タブ切り替え */}
          <div className="stats-tabs" style={{
            display: 'flex',
            gap: '8px',
            marginTop: '16px',
            borderBottom: '2px solid #e5e7eb'
          }}>
            <button
              onClick={() => setActiveTab('calendar')}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: activeTab === 'calendar' ? '#3b82f6' : '#6b7280',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'calendar' ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-2px',
                transition: 'all 0.2s'
              }}
            >
              達成記録（30日カレンダー）
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: activeTab === 'stats' ? '#3b82f6' : '#6b7280',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'stats' ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-2px',
                transition: 'all 0.2s'
              }}
            >
              統計・分析
            </button>
          </div>
        </header>

        <main>
        {activeTab === 'calendar' ? (
          // 30日カレンダータブ
          <div style={{ marginTop: '20px' }}>
            {/* タスク選択 */}
            {recurringTasks.length > 0 && (
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                marginBottom: '20px'
              }}>
                <h3 style={{ marginTop: '0', marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>
                  📋 追跡するタスクを選択
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {recurringTasks.map((task) => (
                    <button
                      key={task.recurring_template_id}
                      onClick={() => toggleTaskSelection(task.recurring_template_id!)}
                      style={{
                        padding: '8px 16px',
                        border: selectedDailyTasks.includes(task.recurring_template_id!)
                          ? '2px solid #3b82f6'
                          : '2px solid #e5e7eb',
                        borderRadius: '8px',
                        background: selectedDailyTasks.includes(task.recurring_template_id!)
                          ? '#eff6ff'
                          : 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: selectedDailyTasks.includes(task.recurring_template_id!)
                          ? '#1e40af'
                          : '#374151',
                        transition: 'all 0.2s'
                      }}
                    >
                      {selectedDailyTasks.includes(task.recurring_template_id!) ? '✓ ' : ''}
                      {task.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 30日カレンダー */}
            {achievementData.length > 0 ? (
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                marginBottom: '30px'
              }}>
                <h3 style={{ marginTop: '0', marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>
                  📅 過去30日の達成状況
                </h3>

                <style>{`
                  @media (max-width: 640px) {
                    .desktop-calendar { display: none; }
                    .mobile-calendar { display: block; }
                  }
                  @media (min-width: 641px) {
                    .desktop-calendar { display: block; }
                    .mobile-calendar { display: none; }
                  }
                `}</style>

                {/* デスクトップ版カレンダー */}
                <div className="desktop-calendar" style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px'
                  }}>
                    <thead>
                      <tr>
                        <th style={{
                          padding: '8px',
                          textAlign: 'left',
                          borderBottom: '2px solid #e5e7eb',
                          position: 'sticky',
                          left: 0,
                          backgroundColor: 'white',
                          minWidth: '150px'
                        }}>
                          タスク
                        </th>
                        {achievementData[0]?.dates.map((date) => {
                          const d = new Date(date)
                          return (
                            <th
                              key={date}
                              style={{
                                padding: '4px 2px',
                                textAlign: 'center',
                                borderBottom: '2px solid #e5e7eb',
                                fontSize: '11px',
                                minWidth: '24px'
                              }}
                            >
                              {d.getDate()}
                            </th>
                          )
                        })}
                        <th style={{
                          padding: '8px',
                          textAlign: 'center',
                          borderBottom: '2px solid #e5e7eb',
                          minWidth: '80px'
                        }}>
                          直近達成率
                        </th>
                        <th style={{
                          padding: '8px',
                          textAlign: 'center',
                          borderBottom: '2px solid #e5e7eb',
                          minWidth: '80px'
                        }}>
                          総達成率
                        </th>
                        <th style={{
                          padding: '8px',
                          textAlign: 'center',
                          borderBottom: '2px solid #e5e7eb',
                          minWidth: '60px'
                        }}>
                          連続記録
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {achievementData.map((taskData) => (
                        <tr key={taskData.taskId}>
                          <td style={{
                            padding: '8px',
                            borderBottom: '1px solid #f3f4f6',
                            position: 'sticky',
                            left: 0,
                            backgroundColor: 'white',
                            fontWeight: '500'
                          }}>
                            {taskData.taskTitle}
                          </td>
                          {taskData.completions.map((completed, idx) => (
                            <td
                              key={idx}
                              style={{
                                padding: '4px 2px',
                                textAlign: 'center',
                                borderBottom: '1px solid #f3f4f6'
                              }}
                            >
                              {completed ? '✓' : ''}
                            </td>
                          ))}
                          <td style={{
                            padding: '8px',
                            textAlign: 'center',
                            borderBottom: '1px solid #f3f4f6',
                            fontWeight: '600',
                            color: taskData.recentAchievementRate >= 80 ? '#16a34a' : taskData.recentAchievementRate >= 50 ? '#f59e0b' : '#dc2626'
                          }}>
                            {taskData.recentAchievementRate.toFixed(0)}%
                          </td>
                          <td style={{
                            padding: '8px',
                            textAlign: 'center',
                            borderBottom: '1px solid #f3f4f6',
                            fontWeight: '600',
                            color: taskData.totalAchievementRate >= 80 ? '#16a34a' : taskData.totalAchievementRate >= 50 ? '#f59e0b' : '#dc2626'
                          }}>
                            {taskData.totalAchievementRate.toFixed(0)}%
                          </td>
                          <td style={{
                            padding: '8px',
                            textAlign: 'center',
                            borderBottom: '1px solid #f3f4f6',
                            fontWeight: '600',
                            color: '#3b82f6'
                          }}>
                            {taskData.consecutiveDays}日
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* モバイル版カレンダー */}
                <div className="mobile-calendar">
                  {achievementData.map((taskData) => (
                    <div key={taskData.taskId} style={{
                      marginBottom: '20px',
                      padding: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}>
                      {/* タスク名と統計（上段） */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          marginBottom: '8px',
                          color: '#1f2937'
                        }}>
                          {taskData.taskTitle}
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          fontSize: '13px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#f3f4f6'
                          }}>
                            <span style={{ color: '#6b7280' }}>直近: </span>
                            <span style={{
                              fontWeight: '600',
                              color: taskData.recentAchievementRate >= 80 ? '#16a34a' : taskData.recentAchievementRate >= 50 ? '#f59e0b' : '#dc2626'
                            }}>
                              {taskData.recentAchievementRate.toFixed(0)}%
                            </span>
                          </div>
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#f3f4f6'
                          }}>
                            <span style={{ color: '#6b7280' }}>総合: </span>
                            <span style={{
                              fontWeight: '600',
                              color: taskData.totalAchievementRate >= 80 ? '#16a34a' : taskData.totalAchievementRate >= 50 ? '#f59e0b' : '#dc2626'
                            }}>
                              {taskData.totalAchievementRate.toFixed(0)}%
                            </span>
                          </div>
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#f3f4f6'
                          }}>
                            <span style={{ color: '#6b7280' }}>連続: </span>
                            <span style={{ fontWeight: '600', color: '#3b82f6' }}>
                              {taskData.consecutiveDays}日
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* カレンダー表示（下段） */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(10, 1fr)',
                        gap: '4px',
                        marginBottom: '8px'
                      }}>
                        {taskData.dates.slice(0, 10).map((date, idx) => {
                          const d = new Date(date)
                          const completed = taskData.completions[idx]
                          return (
                            <div key={date} style={{
                              textAlign: 'center',
                              fontSize: '10px'
                            }}>
                              <div style={{ color: '#9ca3af', marginBottom: '2px' }}>
                                {d.getDate()}
                              </div>
                              <div style={{
                                width: '100%',
                                aspectRatio: '1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: completed ? '#dcfce7' : '#f3f4f6',
                                border: completed ? '1px solid #86efac' : '1px solid #e5e7eb',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                {completed ? '✓' : ''}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(10, 1fr)',
                        gap: '4px',
                        marginBottom: '8px'
                      }}>
                        {taskData.dates.slice(10, 20).map((date, idx) => {
                          const d = new Date(date)
                          const completed = taskData.completions[idx + 10]
                          return (
                            <div key={date} style={{
                              textAlign: 'center',
                              fontSize: '10px'
                            }}>
                              <div style={{ color: '#9ca3af', marginBottom: '2px' }}>
                                {d.getDate()}
                              </div>
                              <div style={{
                                width: '100%',
                                aspectRatio: '1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: completed ? '#dcfce7' : '#f3f4f6',
                                border: completed ? '1px solid #86efac' : '1px solid #e5e7eb',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                {completed ? '✓' : ''}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(10, 1fr)',
                        gap: '4px'
                      }}>
                        {taskData.dates.slice(20, 30).map((date, idx) => {
                          const d = new Date(date)
                          const completed = taskData.completions[idx + 20]
                          return (
                            <div key={date} style={{
                              textAlign: 'center',
                              fontSize: '10px'
                            }}>
                              <div style={{ color: '#9ca3af', marginBottom: '2px' }}>
                                {d.getDate()}
                              </div>
                              <div style={{
                                width: '100%',
                                aspectRatio: '1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: completed ? '#dcfce7' : '#f3f4f6',
                                border: completed ? '1px solid #86efac' : '1px solid #e5e7eb',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                {completed ? '✓' : ''}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#92400e', marginBottom: '8px' }}>
                  追跡するタスクを選択してください
                </div>
                <div style={{ fontSize: '14px', color: '#92400e' }}>
                  上記の「追跡するタスクを選択」から繰り返しタスクを選ぶと、30日間の達成状況が表示されます。
                </div>
              </div>
            )}
          </div>
        ) : (
          // 統計・分析タブ
          <>
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
          </>
        )}
        </main>
      </div>
    </>
  )
}