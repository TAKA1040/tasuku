'use client'

import { useState, useEffect } from 'react'
import { useDatabase } from '@/hooks/useDatabase'
import { useTasks } from '@/hooks/useTasks'
import { useRecurringTasks } from '@/hooks/useRecurringTasks'
import { formatDateForDisplay } from '@/lib/utils/date-jst'
import { TaskTable } from '@/components/TaskTable'
import { TaskEditForm } from '@/components/TaskEditForm'
import type { Task } from '@/lib/db/schema'

// Dynamic import to prevent static generation
export const dynamic = 'force-dynamic'

export default function DonePage() {
  const { isInitialized, error } = useDatabase()
  const { loading: tasksLoading, getAllCompletedTasks, updateTask, uncompleteTask } = useTasks(isInitialized)
  const { loading: recurringLoading, getTodayCompletedRecurringTasks } = useRecurringTasks(isInitialized)

  // データ再読み込み用のeffect
  useEffect(() => {
    // データベース初期化後に再レンダリングを強制
    if (isInitialized && !tasksLoading && !recurringLoading) {
      console.log('Database initialized, forcing re-render for done page')
    }
  }, [isInitialized, tasksLoading, recurringLoading])
  
  // 期間フィルタリング
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today')

  // 編集状態管理
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  
  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#dc2626' }}>データベースエラー</h1>
        <p>{error}</p>
      </div>
    )
  }
  
  if (!isInitialized || tasksLoading || recurringLoading || typeof getAllCompletedTasks !== 'function') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>読み込み中...</h1>
        <p>完了済みタスクを準備しています</p>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
          状態: DB初期化{isInitialized ? '済' : '中'} /
          タスク読み込み{tasksLoading ? '中' : '完了'} /
          繰り返し読み込み{recurringLoading ? '中' : '完了'} /
          関数利用{typeof getAllCompletedTasks === 'function' ? '可' : '不可'}
        </div>
      </div>
    )
  }

  // 期間別完了タスク取得
  const getCompletedTasksByPeriod = () => {
    if (typeof getAllCompletedTasks !== 'function' || !isInitialized) {
      console.log('Done Page: getAllCompletedTasks not available yet')
      return []
    }

    const allCompleted = getAllCompletedTasks()
    console.log('Done Page Debug:', {
      isInitialized,
      getAllCompletedTasksExists: !!getAllCompletedTasks,
      allCompletedLength: allCompleted.length,
      period,
      sampleCompleted: allCompleted.slice(0, 2).map(t => ({
        id: t.task.id,
        title: t.task.title,
        completed_at: t.task.completed_at,
        completed: t.task.completed
      }))
    })
    const today = new Date().toLocaleDateString('ja-CA')
    
    switch (period) {
      case 'today':
        return allCompleted.filter(item => item.task.completed_at === today)
      case 'week':
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weekAgoStr = weekAgo.toLocaleDateString('ja-CA')
        return allCompleted.filter(item => 
          item.task.completed_at && item.task.completed_at >= weekAgoStr
        )
      case 'month':
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        const monthAgoStr = monthAgo.toLocaleDateString('ja-CA')
        return allCompleted.filter(item => 
          item.task.completed_at && item.task.completed_at >= monthAgoStr
        )
      case 'all':
      default:
        return allCompleted
    }
  }

  const completedTasks = getCompletedTasksByPeriod()
  const completedRecurringTasks = isInitialized ? getTodayCompletedRecurringTasks() : []

  // 編集関数
  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowEditForm(true)
  }

  const handleUpdateTask = async (taskId: string, title: string, memo: string, dueDate: string, category?: string, importance?: 1 | 2 | 3 | 4 | 5, durationMin?: number, urls?: string[]) => {
    await updateTask(taskId, { title, memo, due_date: dueDate, category, importance, duration_min: durationMin, urls })
  }

  const handleCancelEdit = () => {
    setEditingTask(null)
    setShowEditForm(false)
  }

  return (
    <div style={{
      padding: '8px',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <header style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>
            🎉 Done リスト - 完了済みタスク
          </h1>
          <a
            href="/today"
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: '500',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ← 今日へ戻る
          </a>
        </div>

        {/* 期間フィルター */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            表示期間:
          </span>
          {(['today', 'week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                background: period === p ? '#3b82f6' : 'transparent',
                color: period === p ? 'white' : '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {p === 'today' ? '今日' : 
               p === 'week' ? '1週間' :
               p === 'month' ? '1ヶ月' : '全て'}
            </button>
          ))}
        </div>

        {/* 完了統計 */}
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          padding: '12px',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #86efac'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#059669' }}>
              {completedTasks.length}
            </div>
            <div style={{ fontSize: '12px', color: '#065f46' }}>単発タスク</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#059669' }}>
              {completedRecurringTasks.length}
            </div>
            <div style={{ fontSize: '12px', color: '#065f46' }}>繰り返し</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#059669' }}>
              {completedTasks.length + completedRecurringTasks.length}
            </div>
            <div style={{ fontSize: '12px', color: '#065f46' }}>合計</div>
          </div>
        </div>
      </header>

      <main>
        {completedTasks.length === 0 && completedRecurringTasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>
              {period === 'today' ? '今日は' :
               period === 'week' ? '1週間以内に' :
               period === 'month' ? '1ヶ月以内に' : 'まだ'}完了したタスクがありません
            </h3>
            <p style={{ margin: '0', fontSize: '14px' }}>
              タスクを完了すると、ここに表示されます
            </p>
          </div>
        ) : (
          <TaskTable
            tasks={completedTasks}
            recurringTasks={completedRecurringTasks}
            completedTasks={[]}
            completedRecurringTasks={[]}
            onComplete={() => {}} // 完了済みなのでアクションなし
            onRecurringComplete={() => {}} // 完了済みなのでアクションなし
            onEdit={handleEditTask}
          />
        )}
      </main>

      {/* タスク編集フォーム */}
      <TaskEditForm
        task={editingTask}
        isVisible={showEditForm}
        onSubmit={handleUpdateTask}
        onCancel={handleCancelEdit}
        onUncomplete={uncompleteTask}
      />
    </div>
  )
}