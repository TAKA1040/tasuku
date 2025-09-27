'use client'

import React, { useState, useEffect } from 'react'
import { RecurringTask } from '@/lib/db/schema'
import { ImportanceDot } from '@/components/ImportanceDot'
import { TimeInput } from '@/components/TimeInput'

interface RecurringTaskEditFormProps {
  task: RecurringTask | null
  isVisible: boolean
  onSubmit: (
    taskId: string,
    title: string,
    memo: string,
    frequency: 'DAILY' | 'INTERVAL_DAYS' | 'WEEKLY' | 'MONTHLY',
    intervalN: number,
    weekdays?: number[],
    monthDay?: number,
    importance?: 1 | 2 | 3 | 4 | 5,
    durationMin?: number,
    urls?: string[],
    category?: string
  ) => Promise<void>
  onCancel: () => void
}

export function RecurringTaskEditForm({ task, isVisible, onSubmit, onCancel }: RecurringTaskEditFormProps) {
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [frequency, setFrequency] = useState<'DAILY' | 'INTERVAL_DAYS' | 'WEEKLY' | 'MONTHLY'>('DAILY')
  const [intervalN, setIntervalN] = useState(1)
  const [weekdays, setWeekdays] = useState<number[]>([1])
  const [monthDay, setMonthDay] = useState(1)
  const [category, setCategory] = useState('')
  const [importance, setImportance] = useState<1 | 2 | 3 | 4 | 5 | undefined>(undefined)
  const [durationMin, setDurationMin] = useState<number | undefined>(undefined)
  const [durationTime, setDurationTime] = useState<string>('')
  const [urls, setUrls] = useState<string[]>([''])

  // 分数を時:分形式に変換
  const minutesToTimeString = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // 時:分形式を分数に変換
  const timeStringToMinutes = (timeString: string): number => {
    if (!timeString.includes(':')) return 0
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setMemo(task.memo || '')
      setFrequency(task.frequency)
      setIntervalN(task.interval_n)
      setWeekdays(task.weekdays || [1])
      setMonthDay(task.month_day || 1)
      setCategory(task.category || '')
      setImportance(task.importance)
      setDurationMin(task.duration_min)
      setDurationTime(task.duration_min ? minutesToTimeString(task.duration_min) : '')
      setUrls(task.urls || [''])
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task || !title.trim()) return

    const filteredUrls = urls.filter(url => url.trim() !== '')

    await onSubmit(
      task.id,
      title.trim(),
      memo.trim(),
      frequency,
      intervalN,
      frequency === 'WEEKLY' ? weekdays : undefined,
      frequency === 'MONTHLY' ? monthDay : undefined,
      importance,
      durationMin,
      filteredUrls.length > 0 ? filteredUrls : undefined,
      category.trim() || undefined
    )
  }

  const handleWeekdayToggle = (day: number) => {
    setWeekdays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    )
  }

  const addUrlField = () => {
    setUrls([...urls, ''])
  }

  const removeUrlField = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index))
  }

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  const handleDurationTimeChange = (value: string) => {
    setDurationTime(value)
    if (value) {
      const minutes = timeStringToMinutes(value)
      setDurationMin(minutes > 0 ? minutes : undefined)
    } else {
      setDurationMin(undefined)
    }
  }

  if (!isVisible || !task) return null

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
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}>
        <h2 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#1f2937'
        }}>
          繰り返しタスクを編集
        </h2>

        <form onSubmit={handleSubmit}>
          {/* タイトル */}
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1f2937',
              minWidth: '60px'
            }}>
              タイトル *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                flex: 1,
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                color: '#1f2937'
              }}
            />
          </div>

          {/* メモ */}
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1f2937',
              minWidth: '60px',
              paddingTop: '6px'
            }}>
              メモ
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              style={{
                flex: 1,
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                color: '#1f2937',
                resize: 'vertical'
              }}
            />
          </div>

          {/* カテゴリと重要度の行 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{
                display: 'inline-block',
                fontSize: '14px',
                fontWeight: '500',
                marginRight: '8px',
                color: '#1f2937'
              }}>
                カテゴリ
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: 'calc(100% - 70px)',
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '13px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="">選択</option>
                <option value="仕事">仕事</option>
                <option value="プライベート">プライベート</option>
                <option value="勉強">勉強</option>
                <option value="健康">健康</option>
                <option value="家事">家事</option>
                <option value="買い物">買い物</option>
              </select>
            </div>
            <div>
              <label style={{
                display: 'inline-block',
                fontSize: '14px',
                fontWeight: '500',
                marginRight: '8px',
                color: '#1f2937'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ImportanceDot importance={importance} size={10} />
                  重要度
                </div>
              </label>
              <select
                value={importance || ''}
                onChange={(e) => setImportance(e.target.value ? parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 : undefined)}
                style={{
                  width: 'calc(100% - 70px)',
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '13px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="">選択なし</option>
                <option value="1">🔵 1 (低)</option>
                <option value="2">🟦 2</option>
                <option value="3">🟡 3 (中)</option>
                <option value="4">🟠 4</option>
                <option value="5">🔴 5 (高)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1f2937'
            }}>
              繰り返しパターン
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'DAILY' | 'INTERVAL_DAYS' | 'WEEKLY' | 'MONTHLY')}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                color: '#1f2937',
                outline: 'none',
                cursor: 'text'
              }}
            >
              <option value="DAILY">毎日</option>
              <option value="INTERVAL_DAYS">間隔日数</option>
              <option value="WEEKLY">毎週</option>
              <option value="MONTHLY">毎月</option>
            </select>
          </div>

          {frequency === 'INTERVAL_DAYS' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1f2937'
              }}>
                間隔日数
              </label>
              <input
                type="number"
                value={intervalN}
                onChange={(e) => setIntervalN(parseInt(e.target.value) || 1)}
                min="1"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#f9fafb',
                  color: '#1f2937'
                }}
              />
            </div>
          )}

          {frequency === 'WEEKLY' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1f2937'
              }}>
                曜日選択
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { value: 1, label: '月' },
                  { value: 2, label: '火' },
                  { value: 3, label: '水' },
                  { value: 4, label: '木' },
                  { value: 5, label: '金' },
                  { value: 6, label: '土' },
                  { value: 0, label: '日' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleWeekdayToggle(value)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: weekdays.includes(value) ? '#3b82f6' : 'var(--bg-secondary)',
                      color: weekdays.includes(value) ? 'white' : 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {frequency === 'MONTHLY' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1f2937'
              }}>
                日にち
              </label>
              <select
                value={monthDay}
                onChange={(e) => setMonthDay(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#f9fafb',
                  color: '#1f2937'
                }}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}日</option>
                ))}
                <option value={-1}>月末</option>
              </select>
            </div>
          )}


          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1f2937'
            }}>
              予想時間
            </label>
            <TimeInput
              value={durationTime}
              onChange={handleDurationTimeChange}
              placeholder="HH:MM"
              style={{
                width: '100%'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1f2937'
            }}>
              関連URL
            </label>
            {urls.map((url, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  placeholder="https://example.com"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#f9fafb',
                    color: '#1f2937'
                  }}
                />
                {urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUrlField(index)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ef4444',
                      borderRadius: '4px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addUrlField}
              style={{
                padding: '6px 12px',
                border: '1px solid #10b981',
                borderRadius: '4px',
                backgroundColor: '#10b981',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              + URL追加
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                color: '#1f2937',
                outline: 'none',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: title.trim() ? '#3b82f6' : '#9ca3af',
                color: 'white',
                cursor: title.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              更新
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}