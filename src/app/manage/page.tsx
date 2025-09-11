'use client'

import { useState } from 'react'
import { useDatabase } from '@/hooks/useDatabase'
import { useRecurringTasks } from '@/hooks/useRecurringTasks'
import { getRecurringDisplayName } from '@/lib/utils/recurring'
import type { RecurringTask } from '@/lib/db/schema'

export default function ManagePage() {
  const { isInitialized } = useDatabase()
  const { 
    recurringTasks, 
    updateRecurringTask,
    deleteRecurringTask,
    toggleRecurringTaskActive,
    loading
  } = useRecurringTasks(isInitialized)
  
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null)
  const [showForm, setShowForm] = useState(false)
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
    if (!editingTask || !formData.title.trim()) return
    
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

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>読み込み中...</h1>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
              タスク管理
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              繰り返しタスクの編集・削除
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
        {/* 繰り返しタスク一覧 */}
        <section>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>
            繰り返しタスク ({recurringTasks.length}件)
          </h2>
          
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
      </main>

      {/* 編集フォーム */}
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
              繰り返しタスクを編集
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
                  frequency: e.target.value as any,
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