'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'
import { TaskTable } from '@/components/TaskTable'
import { TaskEditForm } from '@/components/TaskEditForm'
import { ThemedContainer } from '@/components/ThemedContainer'
import type { Task } from '@/lib/db/schema'
import type { UnifiedTask } from '@/lib/types/unified-task'
import { unifiedTaskToTask, taskToUnifiedTask } from '@/lib/utils/type-converters'

// Dynamic import to prevent static generation
export const dynamic = 'force-dynamic'

export default function DonePage() {
  const {
    loading,
    error,
    getCompletedTasksWithHistory,
    updateTask,
    uncompleteTask,
    deleteTask,
  } = useUnifiedTasks()

  // 期間フィルタリング
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today')

  // 編集状態管理
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)

  // 選択した毎日のタスクを記憶するためのstate（テンプレートIDで管理）
  const [selectedDailyTasks, setSelectedDailyTasks] = useState<string[]>([])

  // 完了タスクの状態
  const [completedTasks, setCompletedTasks] = useState<UnifiedTask[]>([])

  // タスク選択ハンドラー
  const handleTaskSelect = (taskId: string) => {
    setSelectedDailyTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId)
      } else {
        return [...prev, taskId]
      }
    })
  }

  // 完了タスクを読み込み
  useEffect(() => {
    const loadCompletedTasks = async () => {
      try {
        console.log('📥 Loading completed tasks...')
        const tasks = await getCompletedTasksWithHistory()
        console.log('✅ Loaded completed tasks:', tasks.length)
        console.log('📋 Tasks:', tasks)
        setCompletedTasks(tasks)
      } catch (error) {
        console.error('❌ Failed to load completed tasks:', error)
      }
    }
    loadCompletedTasks()
  }, [getCompletedTasksWithHistory])

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

  // ローディング中の表示
  if (loading) {
    return (
      <ThemedContainer>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          fontSize: '18px',
          color: '#666'
        }}>
          読み込み中...
        </div>
      </ThemedContainer>
    )
  }

  // エラー時の表示
  if (error) {
    return (
      <ThemedContainer>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          fontSize: '18px',
          color: '#dc2626'
        }}>
          エラー: {error}
        </div>
      </ThemedContainer>
    )
  }

  // 期間別完了タスク取得
  const getCompletedTasksByPeriod = () => {
    if (!completedTasks.length) {
      return []
    }

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD形式に統一

    switch (period) {
      case 'today':
        return completedTasks.filter(task => {
          const completedDate = task.completed_at?.split('T')[0] || task.updated_at?.split('T')[0]
          return completedDate === today
        })
      case 'week':
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weekAgoStr = weekAgo.toISOString().split('T')[0]
        return completedTasks.filter(task => {
          const completedDate = task.completed_at?.split('T')[0] || task.updated_at?.split('T')[0]
          return completedDate && completedDate >= weekAgoStr
        })
      case 'month':
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        const monthAgoStr = monthAgo.toISOString().split('T')[0]
        return completedTasks.filter(task => {
          const completedDate = task.completed_at?.split('T')[0] || task.updated_at?.split('T')[0]
          return completedDate && completedDate >= monthAgoStr
        })
      case 'all':
      default:
        return completedTasks
    }
  }

  const filteredCompletedTasks = getCompletedTasksByPeriod()

  // 繰り返しタスクの達成度追跡データ生成（unified_tasks対応版）
  const getDailyTasksAchievementData = (): Array<{
    taskId: string;
    taskTitle: string;
    taskStartDate: string;
    dates: string[];
    completions: boolean[];
    consecutiveDays: number;
    recentCompletedDays: number;
    recentTotalDays: number;
    recentAchievementRate: number;
    totalCompletedDays: number;
    totalDays: number;
    totalAchievementRate: number;
  }> => {
    // 過去30日間の日付配列を生成
    const dates: string[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }

    // 選択された繰り返しタスクのデータを作成
    return selectedDailyTasks.map(taskId => {
      // このタスクIDのテンプレートを持つ完了タスクを全て取得
      const taskCompletions = completedTasks.filter(task =>
        task.recurring_template_id === taskId && task.completed
      )

      // タスク情報を取得（最初の完了タスクから）
      const firstTask = taskCompletions[0]
      const taskTitle = firstTask?.title || '不明なタスク'
      const taskStartDate = firstTask?.created_at?.split('T')[0] || dates[0]

      // 各日付の完了状態を判定
      const completions = dates.map(date => {
        return taskCompletions.some(task => {
          const completedDate = task.completed_at?.split('T')[0] || task.updated_at?.split('T')[0]
          return completedDate === date
        })
      })

      // 統計計算
      const totalCompletedDays = completions.filter(c => c).length
      const totalDays = dates.length

      // 直近7日間の達成率
      const recentCompletions = completions.slice(-7)
      const recentCompletedDays = recentCompletions.filter(c => c).length
      const recentTotalDays = 7

      // 連続達成日数（後ろから数える）
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

  // 繰り返しタスクの一覧を取得（選択用）
  const recurringTasks = completedTasks.filter(task =>
    task.recurring_template_id && task.completed
  ).reduce((acc, task) => {
    // テンプレートIDでグループ化
    if (!acc.some(t => t.recurring_template_id === task.recurring_template_id)) {
      acc.push(task)
    }
    return acc
  }, [] as UnifiedTask[])

  // 編集ハンドラー
  const handleEditTask = (task: Task | UnifiedTask) => {
    // 型安全な変換: UnifiedTaskの場合のみ変換
    if ('task_type' in task) {
      setEditingTask(unifiedTaskToTask(task))
    } else {
      // Taskの場合はそのまま（型は既に互換性あり）
      setEditingTask(task as Task)
    }
    setShowEditForm(true)
  }

  const handleUpdateTask = async (taskId: string, title: string, memo: string, dueDate: string, category?: string, importance?: 1 | 2 | 3 | 4 | 5, urls?: string[], _startTime?: string, _endTime?: string, _attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }) => {
    await updateTask(taskId, { title, memo, due_date: dueDate, category, importance, urls })
    setEditingTask(null)
    setShowEditForm(false)
    // 完了タスクを再読み込み
    const tasks = await getCompletedTasksWithHistory()
    setCompletedTasks(tasks)
  }

  const handleCancelEdit = () => {
    setEditingTask(null)
    setShowEditForm(false)
  }

  const handleUncomplete = async (taskId: string) => {
    await uncompleteTask(taskId)
    // 完了タスクを再読み込み
    const tasks = await getCompletedTasksWithHistory()
    setCompletedTasks(tasks)
  }

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId)
    // 完了タスクを再読み込み
    const tasks = await getCompletedTasksWithHistory()
    setCompletedTasks(tasks)
  }

  return (
    <ThemedContainer>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>

      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '15px'
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
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: '700',
            margin: '0',
            color: '#1f2937',
            letterSpacing: '-0.025em'
          }}>
            📋 完了タスク
          </h1>
        </div>

        {/* 期間フィルター */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {(['today', 'week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: period === p ? '#3b82f6' : '#f3f4f6',
                color: period === p ? 'white' : '#374151'
              }}
            >
              {p === 'today' ? '今日' : p === 'week' ? '今週' : p === 'month' ? '今月' : '全て'}
            </button>
          ))}
        </div>
      </div>

      {/* 統計情報 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#16a34a', marginBottom: '5px' }}>
            {filteredCompletedTasks.length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            完了タスク数
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6', marginBottom: '5px' }}>
            {achievementData.length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            総達成回数
          </div>
        </div>
      </div>

      {/* 繰り返しタスク選択 */}
      {recurringTasks.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginTop: '0', marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>
            📋 繰り返しタスク選択
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {recurringTasks.map(task => (
              <label
                key={task.recurring_template_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  backgroundColor: selectedDailyTasks.includes(task.recurring_template_id || '') ? '#eff6ff' : 'white',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedDailyTasks.includes(task.recurring_template_id || '')}
                  onChange={() => handleTaskSelect(task.recurring_template_id || '')}
                  style={{
                    marginRight: '12px',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '15px', fontWeight: '500' }}>
                  {task.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 達成度追跡グリッド（30日カレンダー）*/}
      {achievementData.length > 0 && (
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

          {/* デスクトップ表示（30日を1行で）*/}
          <div style={{
            display: 'block',
            '@media (max-width: 768px)': {
              display: 'none'
            }
          } as React.CSSProperties}>
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
                  {achievementData[0]?.dates.map((date, index) => {
                    const d = new Date(date)
                    return (
                      <th
                        key={`date-${index}-${date}`}
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

          {/* モバイル表示（30日を2行で：前半15日 + 後半15日）*/}
          <div style={{
            display: 'none',
            '@media (max-width: 768px)': {
              display: 'block'
            }
          } as React.CSSProperties}>
            {achievementData.map((taskData) => (
              <div
                key={taskData.taskId}
                style={{
                  marginBottom: '20px',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '10px', fontSize: '14px' }}>
                  {taskData.taskTitle}
                </div>

                {/* 前半15日 */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                    前半15日
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(15, 1fr)',
                    gap: '2px'
                  }}>
                    {taskData.completions.slice(0, 15).map((completed, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: completed ? '#16a34a' : '#f3f4f6',
                          color: completed ? 'white' : '#9ca3af',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}
                      >
                        {new Date(taskData.dates[idx]).getDate()}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 後半15日 */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                    後半15日
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(15, 1fr)',
                    gap: '2px'
                  }}>
                    {taskData.completions.slice(15).map((completed, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: completed ? '#16a34a' : '#f3f4f6',
                          color: completed ? 'white' : '#9ca3af',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}
                      >
                        {new Date(taskData.dates[15 + idx]).getDate()}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 統計情報 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  fontSize: '12px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#6b7280', marginBottom: '2px' }}>直近達成率</div>
                    <div style={{
                      fontWeight: '700',
                      color: taskData.recentAchievementRate >= 80 ? '#16a34a' : taskData.recentAchievementRate >= 50 ? '#f59e0b' : '#dc2626'
                    }}>
                      {taskData.recentAchievementRate.toFixed(0)}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#6b7280', marginBottom: '2px' }}>総達成率</div>
                    <div style={{
                      fontWeight: '700',
                      color: taskData.totalAchievementRate >= 80 ? '#16a34a' : taskData.totalAchievementRate >= 50 ? '#f59e0b' : '#dc2626'
                    }}>
                      {taskData.totalAchievementRate.toFixed(0)}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#6b7280', marginBottom: '2px' }}>連続記録</div>
                    <div style={{ fontWeight: '700', color: '#3b82f6' }}>
                      {taskData.consecutiveDays}日
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <main>
        {/* 完了済みタスク */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          overflow: 'hidden'
        }}>
          <TaskTable
            tasks={[]}
            recurringTasks={[]}
            completedTasks={filteredCompletedTasks.map(task => ({
              task: unifiedTaskToTask(task), // 型安全な変換
              urgency: 'Normal' as const,
              days_from_today: 0
            }))}
            completedRecurringTasks={[]}
            onComplete={() => {}}
            onRecurringComplete={() => {}}
            onEdit={handleEditTask}
            onUncomplete={handleUncomplete}
            onDelete={handleDelete}
          />
        </div>

        {/* 編集フォーム */}
        {showEditForm && editingTask && (
          <TaskEditForm
            task={editingTask}
            isVisible={showEditForm}
            onSubmit={handleUpdateTask}
            onCancel={handleCancelEdit}
            onUncomplete={handleUncomplete}
          />
        )}
      </main>
      </div>
    </ThemedContainer>
  )
}