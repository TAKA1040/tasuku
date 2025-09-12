'use client'

import { useState } from 'react'
import { useDatabase } from '@/hooks/useDatabase'
import { useRecurringTasks } from '@/hooks/useRecurringTasks'
import { useTasks } from '@/hooks/useTasks'
import { getRecurringDisplayName } from '@/lib/utils/recurring'
import { formatDateForDisplay, getTodayJST, getUrgencyLevel } from '@/lib/utils/date-jst'
import type { RecurringTask, Task } from '@/lib/db/schema'

export default function ManagePage() {
  const { isInitialized } = useDatabase()
  const { 
    recurringTasks, 
    createRecurringTask,
    updateRecurringTask,
    deleteRecurringTask,
    toggleRecurringTaskActive,
    loading: recurringLoading
  } = useRecurringTasks(isInitialized)
  const {
    allTasks,
    createTask,
    updateTask,
    deleteTask,
    loading: tasksLoading
  } = useTasks(isInitialized)
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'recurring'>('tasks')
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null)
  const [editingSingleTask, setEditingSingleTask] = useState<Task | null>(null)
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showSingleTaskForm, setShowSingleTaskForm] = useState(false)
  const [singleTaskFormData, setSingleTaskFormData] = useState<{
    title: string
    memo: string
    due_date: string
    category: string
    importance: 1 | 2 | 3 | 4 | 5
    duration_min: number
  }>({
    title: '',
    memo: '',
    due_date: getTodayJST(),
    category: '',
    importance: 3,
    duration_min: 0
  })
  const [formData, setFormData] = useState<{
    title: string
    memo: string
    frequency: 'DAILY' | 'INTERVAL_DAYS' | 'WEEKLY' | 'MONTHLY'
    interval_n: number
    weekdays: number[]
    month_day: number
    importance: 1 | 2 | 3 | 4 | 5
    duration_min: number
  }>({
    title: '',
    memo: '',
    frequency: 'DAILY',
    interval_n: 1,
    weekdays: [],
    month_day: 1,
    importance: 3,
    duration_min: 0
  })

  const handleEditTask = (task: RecurringTask) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      memo: task.memo || '',
      frequency: task.frequency,
      interval_n: task.interval_n,
      weekdays: task.weekdays || [],
      month_day: task.month_day || 1,
      importance: task.importance || 3,
      duration_min: task.duration_min || 0
    })
    setShowForm(true)
  }

  const handleSaveTask = async () => {
    if (!formData.title.trim()) return
    
    if (editingTask) {
      // 編集の場合
      await updateRecurringTask(editingTask.id, {
        title: formData.title.trim(),
        memo: formData.memo.trim() || undefined,
        frequency: formData.frequency,
        interval_n: formData.interval_n,
        weekdays: formData.frequency === 'WEEKLY' ? formData.weekdays : undefined,
        month_day: formData.frequency === 'MONTHLY' ? formData.month_day : undefined,
        importance: formData.importance || undefined,
        duration_min: formData.duration_min || undefined
      })
    } else {
      // 新規作成の場合
      await createRecurringTask(
        formData.title.trim(),
        formData.memo.trim() || undefined,
        formData.frequency,
        formData.interval_n,
        formData.frequency === 'WEEKLY' ? formData.weekdays : undefined,
        formData.frequency === 'MONTHLY' ? formData.month_day : undefined,
        undefined, // startDate (デフォルト今日)
        undefined, // endDate
        formData.importance || undefined,
        formData.duration_min || undefined
      )
    }
    
    setShowForm(false)
    setEditingTask(null)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('この繰り返しタスクを削除しますか？\n関連する完了記録も削除されます。')) {
      await deleteRecurringTask(taskId)
    }
  }

  const handleToggleActive = async (taskId: string) => {
    await toggleRecurringTaskActive(taskId)
  }

  const handleCancelEdit = () => {
    setShowForm(false)
    setEditingTask(null)
  }
  
  // 単発タスク管理関数
  const handleEditSingleTask = (task: Task) => {
    setEditingSingleTask(task)
    setSingleTaskFormData({
      title: task.title,
      memo: task.memo || '',
      due_date: task.due_date || getTodayJST(),
      category: task.category || '',
      importance: task.importance || 3,
      duration_min: task.duration_min || 0
    })
    setShowSingleTaskForm(true)
  }
  
  const handleSaveSingleTask = async () => {
    if (!singleTaskFormData.title.trim()) return
    
    if (editingSingleTask) {
      // 編集
      await updateTask(editingSingleTask.id, {
        title: singleTaskFormData.title.trim(),
        memo: singleTaskFormData.memo.trim() || undefined,
        due_date: singleTaskFormData.due_date,
        category: singleTaskFormData.category.trim() || undefined,
        importance: singleTaskFormData.importance || undefined,
        duration_min: singleTaskFormData.duration_min || undefined
      })
    } else {
      // 新規作成
      await createTask(
        singleTaskFormData.title.trim(),
        singleTaskFormData.memo.trim() || undefined,
        singleTaskFormData.due_date,
        singleTaskFormData.category.trim() || undefined,
        singleTaskFormData.importance || undefined,
        singleTaskFormData.duration_min || undefined
      )
    }
    
    handleCancelSingleTaskEdit()
  }
  
  const handleDeleteSingleTask = async (taskId: string) => {
    if (confirm('このタスクを削除しますか？')) {
      await deleteTask(taskId)
    }
  }
  
  const handleCancelSingleTaskEdit = () => {
    setShowSingleTaskForm(false)
    setEditingSingleTask(null)
    setShowCreateTaskForm(false)
    setSingleTaskFormData({
      title: '',
      memo: '',
      due_date: getTodayJST(),
      category: '',
      importance: 3,
      duration_min: 0
    })
  }
  
  const handleCreateNewTask = () => {
    setEditingSingleTask(null)
    setShowCreateTaskForm(true)
    setShowSingleTaskForm(true)
  }
  
  const handleCreateNewRecurringTask = () => {
    setEditingTask(null)
    setFormData({
      title: '',
      memo: '',
      frequency: 'DAILY',
      interval_n: 1,
      weekdays: [],
      month_day: 1,
      importance: 3,
      duration_min: 0
    })
    setShowForm(true)
  }

  if (tasksLoading || recurringLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>読み込み中...</h1>
      </div>
    )
  }
  
  // 完了していない単発タスクのみ表示
  const activeTasks = allTasks.filter(task => !task.completed && !task.archived)

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
              タスク管理
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              タスクと繰り返しタスクの管理
            </p>
          </div>
          <a
            href="/today"
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
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
      </header>

      <main>
        {/* タブ切り替え */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setActiveTab('tasks')}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderBottom: activeTab === 'tasks' ? '2px solid #3b82f6' : '2px solid transparent',
              background: 'none',
              color: activeTab === 'tasks' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'tasks' ? '600' : '500',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            単発タスク ({activeTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderBottom: activeTab === 'recurring' ? '2px solid #3b82f6' : '2px solid transparent',
              background: 'none',
              color: activeTab === 'recurring' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'recurring' ? '600' : '500',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            繰り返しタスク ({recurringTasks.length})
          </button>
        </div>
        {/* 単発タスク一覧 */}
        {activeTab === 'tasks' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '500', margin: 0 }}>
                単発タスク ({activeTasks.length}件)
              </h2>
              <button
                onClick={handleCreateNewTask}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                + 新しいタスク
              </button>
            </div>
            
            {activeTasks.length === 0 ? (
              <div style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                padding: '40px',
                backgroundColor: '#fff',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                タスクがありません
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeTasks.map((task, index) => {
                  const urgency = task.due_date ? getUrgencyLevel(task.due_date) : 'Normal'
                  const urgencyColor = {
                    'Overdue': '#dc2626',
                    'Soon': '#f59e0b',
                    'Next7': '#10b981',
                    'Next30': '#6b7280',
                    'Normal': '#9ca3af'
                  }[urgency] || '#9ca3af'
                  
                  return (
                    <div
                      key={task.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#fff',
                        marginBottom: index < activeTasks.length - 1 ? '12px' : '0'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <h3 style={{ 
                              fontSize: '16px', 
                              fontWeight: '500', 
                              margin: 0,
                              color: '#000'
                            }}>
                              {task.title}
                            </h3>
                            <span style={{
                              background: urgencyColor,
                              color: 'white',
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: '500'
                            }}>
                              {urgency === 'Normal' ? '通常' : urgency}
                            </span>
                          </div>
                          
                          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            期日: {task.due_date ? formatDateForDisplay(task.due_date) : '未設定'}
                          </div>
                          
                          {task.memo && (
                            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>
                              {task.memo}
                            </div>
                          )}
                          
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {task.category && `カテゴリ: ${task.category} | `}
                            {task.importance && `重要度: ${task.importance} | `}
                            {task.duration_min && `時間: ${task.duration_min}分 | `}
                            作成日: {formatDateForDisplay(task.created_at.split('T')[0])}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                          <button
                            onClick={() => handleEditSingleTask(task)}
                            style={{
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            編集
                          </button>
                          
                          <button
                            onClick={() => handleDeleteSingleTask(task.id)}
                            style={{
                              background: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}
        
        {/* 繰り返しタスク一覧 */}
        {activeTab === 'recurring' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '500', margin: 0 }}>
              繰り返しタスク ({recurringTasks.length}件)
            </h2>
            <button
              onClick={handleCreateNewRecurringTask}
              style={{
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              + 新しい繰り返しタスク
            </button>
          </div>
          
          {recurringTasks.length === 0 ? (
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              padding: '40px',
              backgroundColor: '#fff',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              繰り返しタスクがありません
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recurringTasks.map((task, index) => (
                <div
                  key={task.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: task.active ? '#fff' : '#f9fafb',
                    marginBottom: index < recurringTasks.length - 1 ? '12px' : '0',
                    opacity: task.active ? 1 : 0.7
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <h3 style={{ 
                          fontSize: '16px', 
                          fontWeight: '500', 
                          margin: 0,
                          color: task.active ? '#000' : '#6b7280'
                        }}>
                          {task.title}
                        </h3>
                        {!task.active && (
                          <span style={{
                            background: '#dc2626',
                            color: 'white',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: '500'
                          }}>
                            停止中
                          </span>
                        )}
                      </div>
                      
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                        パターン: {getRecurringDisplayName(task)}
                      </div>
                      
                      {task.memo && (
                        <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>
                          {task.memo}
                        </div>
                      )}
                      
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        開始日: {task.start_date}
                        {task.end_date && ` | 終了日: ${task.end_date}`}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                      <button
                        onClick={() => handleEditTask(task)}
                        style={{
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        編集
                      </button>
                      
                      <button
                        onClick={() => handleToggleActive(task.id)}
                        style={{
                          background: task.active ? '#dc2626' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        {task.active ? '停止' : '再開'}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        style={{
                          background: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        )}
      </main>

      {/* 単発タスク編集フォーム */}
      {showSingleTaskForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '400px',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              {editingSingleTask ? 'タスクを編集' : '新しいタスクを作成'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                タイトル
              </label>
              <input
                type="text"
                value={singleTaskFormData.title}
                onChange={(e) => setSingleTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="何をしますか？"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                メモ
              </label>
              <textarea
                value={singleTaskFormData.memo}
                onChange={(e) => setSingleTaskFormData(prev => ({ ...prev, memo: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '60px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
                placeholder="詳細があれば..."
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  期日
                </label>
                <input
                  type="date"
                  value={singleTaskFormData.due_date}
                  onChange={(e) => setSingleTaskFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  カテゴリ
                </label>
                <select
                  value={singleTaskFormData.category}
                  onChange={(e) => setSingleTaskFormData(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">カテゴリなし</option>
                  <option value="仕事">仕事</option>
                  <option value="プライベート">プライベート</option>
                  <option value="勉強">勉強</option>
                  <option value="健康">健康</option>
                  <option value="家事">家事</option>
                  <option value="買い物">買い物</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  重要度
                </label>
                <select
                  value={singleTaskFormData.importance}
                  onChange={(e) => setSingleTaskFormData(prev => ({ ...prev, importance: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value={1}>最低</option>
                  <option value={2}>低</option>
                  <option value={3}>普通</option>
                  <option value={4}>高</option>
                  <option value={5}>最高</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  時間（分）
                </label>
                <input
                  type="number"
                  value={singleTaskFormData.duration_min || ''}
                  onChange={(e) => setSingleTaskFormData(prev => ({ ...prev, duration_min: Number(e.target.value) || 0 }))}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={handleCancelSingleTaskEdit}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveSingleTask}
                disabled={!singleTaskFormData.title.trim()}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: singleTaskFormData.title.trim() ? '#3b82f6' : '#d1d5db',
                  color: 'white',
                  fontSize: '14px',
                  cursor: singleTaskFormData.title.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: '500'
                }}
              >
                {editingSingleTask ? '保存' : '作成'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 繰り返しタスク編集フォーム */}
      {showForm && editingTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '400px',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              {editingTask ? '繰り返しタスクを編集' : '新しい繰り返しタスクを作成'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                タイトル
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="タスクタイトル"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                メモ
              </label>
              <textarea
                value={formData.memo}
                onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '60px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
                placeholder="メモ（任意）"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                繰り返しパターン
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  frequency: e.target.value as 'DAILY' | 'INTERVAL_DAYS' | 'WEEKLY' | 'MONTHLY',
                  weekdays: e.target.value === 'WEEKLY' ? [1] : [],
                  month_day: e.target.value === 'MONTHLY' ? 1 : 1
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="DAILY">毎日</option>
                <option value="INTERVAL_DAYS">間隔日</option>
                <option value="WEEKLY">毎週</option>
                <option value="MONTHLY">毎月</option>
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  重要度
                </label>
                <select
                  value={formData.importance}
                  onChange={(e) => setFormData(prev => ({ ...prev, importance: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value={1}>最低</option>
                  <option value={2}>低</option>
                  <option value={3}>普通</option>
                  <option value={4}>高</option>
                  <option value={5}>最高</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  時間（分）
                </label>
                <input
                  type="number"
                  value={formData.duration_min || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_min: Number(e.target.value) || 0 }))}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            
            {formData.frequency === 'INTERVAL_DAYS' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  間隔（日数）
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.interval_n}
                  onChange={(e) => setFormData(prev => ({ ...prev, interval_n: parseInt(e.target.value) || 1 }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
            
            {formData.frequency === 'WEEKLY' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  曜日選択
                </label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const newWeekdays = formData.weekdays.includes(index)
                          ? formData.weekdays.filter(w => w !== index)
                          : [...formData.weekdays, index]
                        setFormData(prev => ({ ...prev, weekdays: newWeekdays }))
                      }}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        background: formData.weekdays.includes(index) ? '#3b82f6' : 'white',
                        color: formData.weekdays.includes(index) ? 'white' : '#374151',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {formData.frequency === 'MONTHLY' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  日付
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.month_day}
                  onChange={(e) => setFormData(prev => ({ ...prev, month_day: parseInt(e.target.value) || 1 }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveTask}
                disabled={!formData.title.trim()}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: formData.title.trim() ? '#3b82f6' : '#d1d5db',
                  color: 'white',
                  fontSize: '14px',
                  cursor: formData.title.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: '500'
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}