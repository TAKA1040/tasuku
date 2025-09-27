'use client'

import { useState, useEffect } from 'react'
import { useDatabase } from '@/hooks/useDatabase'
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'
import { formatDateForDisplay } from '@/lib/utils/date-jst'
import { UnifiedTasksTable } from '@/components/UnifiedTasksTable'
import { TaskEditForm } from '@/components/TaskEditForm'
import { ThemedContainer } from '@/components/ThemedContainer'
import type { UnifiedTask } from '@/lib/types/unified-task'

// Dynamic import to prevent static generation
export const dynamic = 'force-dynamic'

export default function DonePage() {
  const { isInitialized, error } = useDatabase()
  const unifiedTasks = useUnifiedTasks(true)

  // 期間フィルタリング
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today')

  // 編集状態管理
  const [editingTask, setEditingTask] = useState<UnifiedTask | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)

  // データベース初期化後にタスクを再読み込み
  useEffect(() => {
    if (isInitialized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Database initialized, reloading tasks for done page')
      }
      unifiedTasks.loadTasks()
    }
  }, [isInitialized])

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#dc2626' }}>データベースエラー</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (!isInitialized || unifiedTasks.loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>読み込み中...</h1>
        <p>完了済みタスクを準備しています</p>
      </div>
    )
  }

  // 完了済みタスクを取得
  const completedTasks = unifiedTasks.getCompletedTasks()

  // 期間別フィルタリング
  const getCompletedTasksByPeriod = () => {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD形式

    switch (period) {
      case 'today':
        return completedTasks.filter(task => {
          // completed_atがあればそれを優先、なければupdated_atを使用
          const taskDate = task.completed_at?.split('T')[0] || task.updated_at?.split('T')[0] || ''
          return taskDate === today
        })
      case 'week':
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weekAgoStr = weekAgo.toISOString().split('T')[0]
        return completedTasks.filter(task => {
          const taskDate = task.completed_at?.split('T')[0] || task.updated_at?.split('T')[0] || ''
          return taskDate >= weekAgoStr
        })
      case 'month':
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        const monthAgoStr = monthAgo.toISOString().split('T')[0]
        return completedTasks.filter(task => {
          const taskDate = task.completed_at?.split('T')[0] || task.updated_at?.split('T')[0] || ''
          return taskDate >= monthAgoStr
        })
      case 'all':
      default:
        return completedTasks
    }
  }

  const filteredCompletedTasks = getCompletedTasksByPeriod()

  // 編集機能
  const handleEdit = (task: UnifiedTask) => {
    setEditingTask(task)
    setShowEditForm(true)
  }

  const handleCancelEdit = () => {
    setEditingTask(null)
    setShowEditForm(false)
  }

  const handleUpdateTask = async (
    taskId: string,
    title: string,
    memo: string,
    dueDate: string,
    category?: string,
    importance?: 1 | 2 | 3 | 4 | 5,
    urls?: string[],
    startTime?: string,
    endTime?: string,
    attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }
  ) => {
    if (!editingTask) return

    try {
      // done/page.tsxでは基本的な情報のみ更新（時間やattachmentは無視）
      const updateData: Partial<UnifiedTask> = {
        title,
        category,
        importance,
        due_date: dueDate,
        memo,
        urls
      }

      await unifiedTasks.updateTask(taskId, updateData)
      setShowEditForm(false)
      setEditingTask(null)
    } catch (error) {
      console.error('タスク更新エラー:', error)
    }
  }

  return (
    <ThemedContainer>
      <main style={{
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px'
        }}>
          {/* ヘッダー */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              margin: 0,
              color: '#1f2937'
            }}>
              🎉 Done リスト - 完了済みタスク
            </h1>

            {/* 期間フィルター */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'today' | 'week' | 'month' | 'all')}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="today">今日</option>
              <option value="week">過去1週間</option>
              <option value="month">過去1ヶ月</option>
              <option value="all">全期間</option>
            </select>
          </div>

          {/* 統計情報 */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600' }}>完了状況</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              {period === 'today' ? '今日' :
               period === 'week' ? '過去1週間' :
               period === 'month' ? '過去1ヶ月' : '全期間'}で
              <strong style={{ color: '#10b981' }}> {filteredCompletedTasks.length}件 </strong>
              のタスクを完了しました
            </p>
          </div>

          {/* 完了済みタスク一覧 */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}>
            {filteredCompletedTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <p>該当期間に完了したタスクがありません</p>
              </div>
            ) : (
              <UnifiedTasksTable
                title="完了済みタスク"
                tasks={filteredCompletedTasks.map(task => ({ task }))}
                unifiedTasks={unifiedTasks}
                handleEditTask={handleEdit}
                emptyMessage="該当期間に完了したタスクがありません"
              />
            )}
          </div>
        </div>

        {/* 編集フォーム */}
        <TaskEditForm
          task={editingTask}
          isVisible={showEditForm}
          onSubmit={handleUpdateTask}
          onCancel={handleCancelEdit}
          onUncomplete={(id: string) => unifiedTasks.uncompleteTask(id)}
        />
      </main>
    </ThemedContainer>
  )
}