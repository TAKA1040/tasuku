'use client'

import { useState, useEffect } from 'react'
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'
import { formatDateForDisplay } from '@/lib/utils/date-jst'
import { TaskTable } from '@/components/TaskTable'
import { TaskEditForm } from '@/components/TaskEditForm'
import { ThemedContainer } from '@/components/ThemedContainer'
import type { Task } from '@/lib/db/schema'
import type { UnifiedTask } from '@/lib/types/unified-task'

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
    loadTasks
  } = useUnifiedTasks()

  // 期間フィルタリング
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today')

  // 編集状態管理
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)

  // 選択した毎日のタスクを記憶するためのstate
  const [selectedDailyTasks, setSelectedDailyTasks] = useState<string[]>([])

  // 完了タスクの状態
  const [completedTasks, setCompletedTasks] = useState<UnifiedTask[]>([])

  // 完了タスクを読み込み
  useEffect(() => {
    const loadCompletedTasks = async () => {
      try {
        const tasks = await getCompletedTasksWithHistory()
        setCompletedTasks(tasks)
      } catch (error) {
        console.error('Failed to load completed tasks:', error)
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

  // 毎日のタスク達成度追跡システム（簡易版）
  const getDailyTasksAchievementData = (): Array<{
    taskId: string;
    taskTitle: string;
    date: string;
    completed: boolean;
  }> => {
    const achievements: Array<{
      taskId: string;
      taskTitle: string;
      date: string;
      completed: boolean;
    }> = []

    // 過去30日間のデータを生成
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      // その日に完了したタスクを取得
      const dayCompletedTasks = completedTasks.filter(task => {
        const completedDate = task.completed_at?.split('T')[0] || task.updated_at?.split('T')[0]
        return completedDate === dateStr
      })

      // タスクごとに達成データを追加
      dayCompletedTasks.forEach(task => {
        achievements.push({
          taskId: task.id,
          taskTitle: task.title,
          date: dateStr,
          completed: true
        })
      })
    }

    return achievements
  }

  const achievementData = getDailyTasksAchievementData()

  // 編集ハンドラー
  const handleEditTask = (task: Task | UnifiedTask) => {
    setEditingTask(task as Task)
    setShowEditForm(true)
  }

  const handleUpdateTask = async (taskId: string, title: string, memo: string, dueDate: string, category?: string, importance?: 1 | 2 | 3 | 4 | 5, urls?: string[], startTime?: string, endTime?: string, attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }) => {
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
        <h1 style={{
          fontSize: 'clamp(24px, 4vw, 32px)',
          fontWeight: '700',
          margin: '0',
          color: '#1f2937',
          letterSpacing: '-0.025em'
        }}>
          📋 完了タスク
        </h1>

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

      {/* 達成追跡グリッド（簡易版）*/}
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(12px, 1fr))',
            gap: '2px',
            maxWidth: '100%'
          }}>
            {Array.from({ length: 30 }, (_, i) => {
              const date = new Date()
              date.setDate(date.getDate() - (29 - i))
              const dateStr = date.toISOString().split('T')[0]
              const dayAchievements = achievementData.filter(a => a.date === dateStr)
              const hasAchievement = dayAchievements.length > 0

              return (
                <div
                  key={dateStr}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '2px',
                    backgroundColor: hasAchievement ? '#16a34a' : '#e5e7eb',
                    cursor: 'pointer'
                  }}
                  title={`${date.getMonth() + 1}/${date.getDate()}: ${dayAchievements.length}件完了`}
                />
              )
            })}
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
              task: {
                ...task,
                memo: task.memo || undefined,
                urls: task.urls || undefined,
                attachment: task.attachment || undefined
              } as Task, // UnifiedTaskからTaskへの型変換
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