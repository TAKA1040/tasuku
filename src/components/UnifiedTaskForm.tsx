'use client'

import { useState } from 'react'
import { getTodayJST } from '@/lib/utils/date-jst'

interface UnifiedTaskFormProps {
  isVisible: boolean
  onSubmit: (
    title: string,
    memo: string,
    taskType: 'regular' | 'recurring',
    dueDate?: string,
    category?: string,
    importance?: number,
    recurringPattern?: string,
    dayOfWeek?: number,
    dayOfMonth?: number
  ) => void
  onCancel: () => void
}

export function UnifiedTaskForm({ isVisible, onSubmit, onCancel }: UnifiedTaskFormProps) {
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [taskType, setTaskType] = useState<'regular' | 'recurring'>('regular')
  const [dueDate, setDueDate] = useState(getTodayJST())
  const [category, setCategory] = useState('')
  const [importance, setImportance] = useState<number>(3)
  const [recurringPattern, setRecurringPattern] = useState('daily')
  const [dayOfWeek, setDayOfWeek] = useState<number>(1)
  const [dayOfMonth, setDayOfMonth] = useState<number>(1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (taskType === 'regular') {
      onSubmit(title, memo, 'regular', dueDate, category, importance)
    } else {
      onSubmit(title, memo, 'recurring', undefined, undefined, undefined, recurringPattern, dayOfWeek, dayOfMonth)
    }

    // Reset form
    setTitle('')
    setMemo('')
    setTaskType('regular')
    setDueDate(getTodayJST())
    setCategory('')
    setImportance(3)
    setRecurringPattern('daily')
    setDayOfWeek(1)
    setDayOfMonth(1)
  }

  if (!isVisible) return null

  const dayNames = ['月', '火', '水', '木', '金', '土', '日']

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '8px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '16px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '12px',
          color: '#1f2937'
        }}>
          タスク作成
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px', display: 'block' }}>
              タイトル *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              placeholder="タスクのタイトルを入力"
            />
          </div>

          {/* Memo */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px', display: 'block' }}>
              メモ
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                minHeight: '60px',
                resize: 'vertical'
              }}
              placeholder="詳細やメモ（任意）"
            />
          </div>

          {/* Task Type Selection */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px', display: 'block' }}>
              このタスクは？
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setTaskType('regular')}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: taskType === 'regular' ? '#3b82f6' : '#f9fafb',
                  color: taskType === 'regular' ? 'white' : '#374151',
                  cursor: 'pointer'
                }}
              >
                一回だけ
              </button>
              <button
                type="button"
                onClick={() => setTaskType('recurring')}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: taskType === 'recurring' ? '#059669' : '#f9fafb',
                  color: taskType === 'recurring' ? 'white' : '#374151',
                  cursor: 'pointer'
                }}
              >
                繰り返し
              </button>
            </div>
          </div>

          {/* Regular Task Fields */}
          {taskType === 'regular' && (
            <>
              {/* Due Date */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px', display: 'block' }}>
                  期日
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Category */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px', display: 'block' }}>
                  カテゴリ
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">カテゴリを選択</option>
                  <option value="仕事">仕事</option>
                  <option value="プライベート">プライベート</option>
                  <option value="勉強">勉強</option>
                  <option value="健康">健康</option>
                  <option value="家事">家事</option>
                  <option value="買い物">買い物</option>
                </select>
              </div>

              {/* Importance */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px', display: 'block' }}>
                  重要度
                </label>
                <select
                  value={importance}
                  onChange={(e) => setImportance(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value={1}>1 - 最低</option>
                  <option value={2}>2 - 低</option>
                  <option value={3}>3 - 普通</option>
                  <option value={4}>4 - 高</option>
                  <option value={5}>5 - 最高</option>
                </select>
              </div>
            </>
          )}

          {/* Recurring Task Fields */}
          {taskType === 'recurring' && (
            <>
              {/* Recurring Pattern */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px', display: 'block' }}>
                  どのくらいの頻度？
                </label>
                <select
                  value={recurringPattern}
                  onChange={(e) => setRecurringPattern(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="daily">毎日</option>
                  <option value="weekly">毎週</option>
                  <option value="monthly">毎月</option>
                </select>
              </div>

              {/* Day of Week for Weekly */}
              {recurringPattern === 'weekly' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px', display: 'block' }}>
                    何曜日？
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {dayNames.map((day, index) => {
                      const dayValue = index + 1
                      return (
                        <button
                          key={dayValue}
                          type="button"
                          onClick={() => setDayOfWeek(dayValue)}
                          style={{
                            padding: '8px 4px',
                            fontSize: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            backgroundColor: dayOfWeek === dayValue ? '#059669' : '#f9fafb',
                            color: dayOfWeek === dayValue ? 'white' : '#374151',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Day of Month for Monthly */}
              {recurringPattern === 'monthly' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px', display: 'block' }}>
                    何日？
                  </label>
                  <select
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}日</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '6px 16px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: '#f9fafb',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              style={{
                padding: '6px 16px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: taskType === 'regular' ? '#3b82f6' : '#059669',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              作成
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}