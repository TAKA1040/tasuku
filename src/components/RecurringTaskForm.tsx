'use client'

import { useState } from 'react'

interface RecurringTaskFormProps {
  onSubmit: (title: string, memo: string, pattern: string, dayOfWeek?: number, dayOfMonth?: number) => Promise<void>
  onCancel: () => void
  isVisible: boolean
}

export function RecurringTaskForm({ onSubmit, onCancel, isVisible }: RecurringTaskFormProps) {
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [pattern, setPattern] = useState('DAILY')
  const [dayOfWeek, setDayOfWeek] = useState<number>(1) // 月曜日
  const [dayOfMonth, setDayOfMonth] = useState<number>(1) // 1日
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(
        title,
        memo,
        pattern,
        pattern === 'WEEKLY' ? dayOfWeek : undefined,
        pattern === 'MONTHLY' ? dayOfMonth : undefined
      )
      // Reset form
      setTitle('')
      setMemo('')
      setPattern('DAILY')
      setDayOfWeek(1)
      setDayOfMonth(1)
      onCancel()
    } catch (error) {
      console.error('Failed to create recurring task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setTitle('')
    setMemo('')
    setPattern('DAILY')
    setDayOfWeek(1)
    setDayOfMonth(1)
    onCancel()
  }

  const weekdays = [
    { value: 1, label: '月曜日' },
    { value: 2, label: '火曜日' },
    { value: 3, label: '水曜日' },
    { value: 4, label: '木曜日' },
    { value: 5, label: '金曜日' },
    { value: 6, label: '土曜日' },
    { value: 0, label: '日曜日' }
  ]

  if (!isVisible) return null

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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#1f2937'
        }}>
          新しい繰り返しタスク
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              タイトル <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="繰り返しタスクのタイトルを入力"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              メモ
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモ（任意）"
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              繰り返しパターン
            </label>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#fff',
                boxSizing: 'border-box'
              }}
            >
              <option value="DAILY">毎日</option>
              <option value="WEEKLY">毎週</option>
              <option value="MONTHLY">毎月</option>
            </select>
          </div>

          {/* 週次の場合の曜日選択 */}
          {pattern === 'WEEKLY' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '4px',
                color: '#374151'
              }}>
                曜日
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  boxSizing: 'border-box'
                }}
              >
                {weekdays.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* 月次の場合の日付選択 */}
          {pattern === 'MONTHLY' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '4px',
                color: '#374151'
              }}>
                日付
              </label>
              <select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  boxSizing: 'border-box'
                }}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>{day}日</option>
                ))}
              </select>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '4px'
              }}>
                ※ 31日がない月は月末日になります
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            marginTop: '24px'
          }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '14px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: title.trim() && !isSubmitting ? '#059669' : '#9ca3af',
                color: 'white',
                fontSize: '14px',
                cursor: title.trim() && !isSubmitting ? 'pointer' : 'not-allowed'
              }}
            >
              {isSubmitting ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}