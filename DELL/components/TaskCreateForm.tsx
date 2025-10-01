'use client'

import { useState } from 'react'
import { getTodayJST } from '@/lib/utils/date-jst'
import { TASK_CATEGORIES, TASK_IMPORTANCE_LABELS, TASK_IMPORTANCE, URL_LIMITS } from '@/lib/db/schema'

interface TaskCreateFormProps {
  onSubmit: (title: string, memo: string, dueDate: string, category?: string, importance?: number, urls?: string[], durationMin?: number) => Promise<void>
  onCancel: () => void
  isVisible: boolean
}

export function TaskCreateForm({ onSubmit, onCancel, isVisible }: TaskCreateFormProps) {
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [dueDate, setDueDate] = useState(getTodayJST())
  const [category, setCategory] = useState('')
  const [importance, setImportance] = useState<number>(TASK_IMPORTANCE.MEDIUM)
  const [durationMin, setDurationMin] = useState<number | undefined>(undefined)
  const [urls, setUrls] = useState<string[]>([])
  const [newUrl, setNewUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(title, memo, dueDate, category || undefined, importance, urls.length > 0 ? urls : undefined, durationMin)
      // Reset form
      setTitle('')
      setMemo('')
      setDueDate(getTodayJST())
      setCategory('')
      setImportance(TASK_IMPORTANCE.MEDIUM)
      setDurationMin(undefined)
      setUrls([])
      setNewUrl('')
      onCancel()
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setTitle('')
    setMemo('')
    setDueDate(getTodayJST())
    setCategory('')
    setImportance(TASK_IMPORTANCE.MEDIUM)
    setDurationMin(undefined)
    setUrls([])
    setNewUrl('')
    onCancel()
  }

  const handleAddUrl = () => {
    if (newUrl.trim() && urls.length < URL_LIMITS.MAX_ALLOWED) {
      // 簡易URL検証
      try {
        new URL(newUrl.trim())
        setUrls([...urls, newUrl.trim()])
        setNewUrl('')
      } catch {
        alert('有効なURLを入力してください')
      }
    }
  }

  const handleRemoveUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index))
  }

  const handleOpenAllUrls = () => {
    if (urls.length === 0) return
    
    const confirmMessage = `${urls.length}個のURLを開きますか？`
    if (confirm(confirmMessage)) {
      urls.forEach(url => {
        window.open(url, '_blank', 'noopener,noreferrer')
      })
    }
  }

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
          新しいタスク
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
              placeholder="タスクのタイトルを入力"
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
              カテゴリ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
              <option value="">カテゴリを選択（任意）</option>
              {Object.values(TASK_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              優先度
            </label>
            <select
              value={importance}
              onChange={(e) => setImportance(Number(e.target.value))}
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
              {Object.entries(TASK_IMPORTANCE_LABELS).map(([value, label]) => (
                <option key={value} value={Number(value)}>{label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              期日
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              予想作業時間（分）
            </label>
            <input
              type="number"
              value={durationMin || ''}
              onChange={(e) => setDurationMin(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="例: 30"
              min="1"
              max="1440"
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

          {/* URL管理セクション */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              関連URL（最大5個）
              {urls.length > URL_LIMITS.RECOMMENDED && (
                <span style={{ color: '#f59e0b', fontSize: '12px', marginLeft: '8px' }}>
                  推奨数（{URL_LIMITS.RECOMMENDED}個）を超えています
                </span>
              )}
            </label>
            
            {/* URL入力エリア */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
              />
              <button
                type="button"
                onClick={handleAddUrl}
                disabled={!newUrl.trim() || urls.length >= URL_LIMITS.MAX_ALLOWED}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  cursor: 'pointer',
                  opacity: (!newUrl.trim() || urls.length >= URL_LIMITS.MAX_ALLOWED) ? 0.5 : 1
                }}
              >
                追加
              </button>
            </div>

            {/* URL一覧 */}
            {urls.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {urls.length}個のURL
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenAllUrls}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #3b82f6',
                      borderRadius: '4px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    🚀 全て開く
                  </button>
                </div>
                <div style={{ 
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}>
                  {urls.map((url, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderBottom: index < urls.length - 1 ? '1px solid #f3f4f6' : 'none'
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          fontSize: '12px',
                          color: '#374151',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {url}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUrl(index)}
                        style={{
                          marginLeft: '8px',
                          padding: '4px',
                          border: 'none',
                          borderRadius: '4px',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          fontSize: '12px',
                          cursor: 'pointer',
                          lineHeight: 1
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end'
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
                backgroundColor: title.trim() && !isSubmitting ? '#3b82f6' : '#9ca3af',
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