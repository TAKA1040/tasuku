'use client'

import { useState } from 'react'
import { useDatabase } from '@/hooks/useDatabase'
import { useTasks } from '@/hooks/useTasks'
import { useRecurringTasks } from '@/hooks/useRecurringTasks'
import { useTaskFilter } from '@/hooks/useTaskFilter'
import { TaskSearchFilter, type SearchFilterOptions } from '@/components/TaskSearchFilter'
import { TaskTable } from '@/components/TaskTable'
import { TaskEditForm } from '@/components/TaskEditForm'
import { Task } from '@/lib/db/schema'

export default function SearchPage() {
  const { isInitialized, error } = useDatabase()
  const {
    allTasks,
    loading: tasksLoading,
    completeTask,
    updateTask,
    uncompleteTask
  } = useTasks(isInitialized)
  const { 
    allRecurringTasks, 
    loading: recurringLoading,
    completeRecurringTask 
  } = useRecurringTasks(isInitialized)

  // フィルター状態
  const [filters, setFilters] = useState<SearchFilterOptions>({
    searchQuery: '',
    category: '',
    importance: '',
    urgency: '',
    status: ''
  })

  // タスク編集用の状態
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // TaskWithUrgencyに変換
  const tasksWithUrgency = allTasks.map(task => ({
    task,
    urgency: task.due_date ? 'Normal' as const : 'Normal' as const,
    days_from_today: 0
  }))

  // RecurringTaskWithStatusに変換
  const recurringTasksWithStatus = allRecurringTasks.map(task => ({
    task,
    occursToday: false, // For search we don't need today-specific logic
    completedToday: false,
    displayName: task.title
  }))

  // フィルタリング
  const {
    filteredTasks,
    filteredRecurringTasks,
    totalCount,
    filteredCount
  } = useTaskFilter(tasksWithUrgency, recurringTasksWithStatus, filters)

  const handleFiltersChange = (newFilters: SearchFilterOptions) => {
    setFilters(newFilters)
  }

  const handleFiltersClear = () => {
    setFilters({
      searchQuery: '',
      category: '',
      importance: '',
      urgency: '',
      status: ''
    })
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowEditForm(true)
  }

  const handleUpdateTask = async (taskId: string, title: string, memo: string, dueDate: string, category?: string, importance?: 1 | 2 | 3 | 4 | 5, durationMin?: number, urls?: string[]) => {
    await updateTask(taskId, { title, memo, due_date: dueDate, category, importance, duration_min: durationMin, urls })
  }

  const handleCancelEdit = () => {
    setShowEditForm(false)
    setEditingTask(null)
  }

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
        <p>タスクデータを準備しています</p>
      </div>
    )
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <header style={{ marginBottom: '24px' }}>
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
                href="/statistics"
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
                📊 統計
              </a>
            </div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: '600',
              margin: '0'
            }}>
              🔍 タスク検索・一覧
            </h1>
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            textAlign: 'right'
          }}>
            <div>表示中: {filteredCount} / {totalCount} 件</div>
            <div>データベース: {isInitialized ? '✅ 接続中' : '⚠️ 未接続'}</div>
          </div>
        </div>
        <p style={{ 
          color: '#6b7280',
          fontSize: '14px',
          margin: '0'
        }}>
          すべてのタスクを検索・フィルタリングして管理できます
        </p>
      </header>

      <main>
        {/* 検索・フィルター */}
        <TaskSearchFilter
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClear={handleFiltersClear}
        />

        {/* 結果の表示 */}
        {totalCount === 0 ? (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '500',
              color: '#92400e',
              marginBottom: '8px'
            }}>
              タスクがありません
            </div>
            <div style={{
              fontSize: '14px',
              color: '#92400e'
            }}>
              「今日」ページから新しいタスクを作成してください。
            </div>
          </div>
        ) : filteredCount === 0 ? (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '500',
              color: '#0c4a6e',
              marginBottom: '8px'
            }}>
              条件に一致するタスクがありません
            </div>
            <div style={{
              fontSize: '14px',
              color: '#0c4a6e'
            }}>
              検索条件やフィルターを変更してみてください。
            </div>
          </div>
        ) : (
          <section>
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>
                {totalCount}件中 <strong style={{ color: '#1e293b' }}>{filteredCount}件</strong> を表示
              </span>
            </div>
            
            <TaskTable
              tasks={filteredTasks}
              recurringTasks={filteredRecurringTasks}
              completedTasks={[]}
              completedRecurringTasks={[]}
              onComplete={completeTask}
              onRecurringComplete={completeRecurringTask}
              onEdit={handleEditTask}
            />
          </section>
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