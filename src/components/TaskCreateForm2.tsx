'use client'

import React, { memo, useState } from 'react'
import { getTodayJST } from '@/lib/utils/date-jst'
import { URL_LIMITS } from '@/lib/db/schema'
import { ImportanceDot } from '@/components/ImportanceDot'

interface RecurringSettings {
  pattern: string
  intervalDays: number
  selectedWeekdays: number[]
  dayOfMonth: number
  monthOfYear: number
  dayOfYear: number
}

interface TaskCreateForm2Props {
  isVisible: boolean
  onSubmitRegular: (title: string, memo: string, dueDate: string, category?: string, importance?: number, durationMin?: number, urls?: string[], attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }) => void
  onSubmitRecurring: (title: string, memo: string, settings: RecurringSettings, importance?: number, durationMin?: number, urls?: string[], category?: string, attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }) => void
  onAddToIdeas: (text: string) => void
  onCancel: () => void
}

function TaskCreateForm2({ isVisible, onSubmitRegular, onSubmitRecurring, onAddToIdeas, onCancel }: TaskCreateForm2Props) {
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [dueDate, setDueDate] = useState(getTodayJST())
  const [category, setCategory] = useState('')
  const [importance, setImportance] = useState<number>(3)
  const [durationMin, setDurationMin] = useState<number>(0)
  const [recurringPattern, setRecurringPattern] = useState('daily')
  const [taskType, setTaskType] = useState<'once' | 'recurring' | 'deadline'>('once')
  const [intervalDays, setIntervalDays] = useState<number>(1)
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1]) // 月曜日がデフォルト
  const [dayOfMonth, setDayOfMonth] = useState<number>(1)
  const [monthOfYear, setMonthOfYear] = useState<number>(1)
  const [dayOfYear, setDayOfYear] = useState<number>(1)
  const [urls, setUrls] = useState<string[]>([])
  const [newUrl, setNewUrl] = useState('')
  const [saveAsIdea, setSaveAsIdea] = useState(false)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [attachedFileUrl, setAttachedFileUrl] = useState<string>('')

  // ファイル添付処理
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // ファイルサイズチェック（10MB制限）
      if (file.size > 10 * 1024 * 1024) {
        alert('ファイルサイズは10MB以下にしてください')
        return
      }

      // 画像ファイルかPDFのみ許可
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        alert('対応しているファイル形式: JPG, PNG, GIF, WebP, PDF')
        return
      }

      setAttachedFile(file)

      // ファイルのプレビューURL作成（画像の場合）
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setAttachedFileUrl(url)
      } else {
        setAttachedFileUrl('')
      }
    }
  }

  // ファイル削除
  const removeFile = () => {
    if (attachedFileUrl) {
      URL.revokeObjectURL(attachedFileUrl)
    }
    setAttachedFile(null)
    setAttachedFileUrl('')
  }

  const handleSubmit = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('TaskCreateForm2: handleSubmit called')
      console.log('TaskCreateForm2: title:', title)
      console.log('TaskCreateForm2: taskType:', taskType)
      console.log('TaskCreateForm2: saveAsIdea:', saveAsIdea)
      console.log('TaskCreateForm2: category:', category)
    }

    if (!title.trim()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('TaskCreateForm2: No title, returning early')
      }
      return
    }

    // ファイル添付がある場合はBase64に変換
    let attachment: { file_name: string; file_type: string; file_size: number; file_data: string } | undefined = undefined
    if (attachedFile) {
      try {
        const fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            // data:image/jpeg;base64, の部分を削除してBase64のみ取得
            const base64Data = result.split(',')[1]
            resolve(base64Data)
          }
          reader.onerror = reject
          reader.readAsDataURL(attachedFile)
        })

        attachment = {
          file_name: attachedFile.name,
          file_type: attachedFile.type,
          file_size: attachedFile.size,
          file_data: fileBase64
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('TaskCreateForm2: File converted to base64, size:', attachment.file_data.length)
        }
      } catch (error) {
        console.error('TaskCreateForm2: File conversion failed:', error)
        alert('ファイルの変換に失敗しました')
        return
      }
    }

    if (saveAsIdea) {
      if (process.env.NODE_ENV === 'development') {
        console.log('TaskCreateForm2: Saving as idea')
      }
      handleAddToIdeas()
    } else if (taskType === 'once' || taskType === 'deadline') {
      if (process.env.NODE_ENV === 'development') {
        console.log('TaskCreateForm2: Submitting regular task with category:', category)
      }
      onSubmitRegular(title, memo, dueDate, category, importance, durationMin || undefined, urls.length > 0 ? urls : undefined, attachment)
      resetForm()
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('TaskCreateForm2: Submitting recurring task')
      }
      onSubmitRecurring(title, memo, {
        pattern: recurringPattern,
        intervalDays,
        selectedWeekdays,
        dayOfMonth,
        monthOfYear,
        dayOfYear
      }, importance, durationMin || undefined, urls.length > 0 ? urls : undefined, category, attachment)
      resetForm()
    }
  }

  const handleAddToIdeas = () => {
    if (!title.trim()) return
    const ideaText = memo ? `${title}\n${memo}` : title
    onAddToIdeas(ideaText)
    resetForm()
  }

  const resetForm = () => {
    setTitle('')
    setMemo('')
    setDueDate(getTodayJST())
    setCategory('')
    setImportance(3)
    setDurationMin(0)
    setRecurringPattern('daily')
    setIntervalDays(1)
    setSelectedWeekdays([1])
    setDayOfMonth(1)
    setMonthOfYear(1)
    setDayOfYear(1)
    setUrls([])
    setNewUrl('')
    setSaveAsIdea(false)
    setTaskType('once')

    // ファイル添付のリセット
    if (attachedFileUrl) {
      URL.revokeObjectURL(attachedFileUrl)
    }
    setAttachedFile(null)
    setAttachedFileUrl('')
  }

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    )
  }

  const handleCancel = () => {
    resetForm()
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
        padding: '12px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '95vh',
        overflow: 'auto'
      }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '10px',
          color: '#1f2937',
          textAlign: 'center'
        }}>
          新しいタスク
        </h2>

        {/* 共通フィールド */}
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="何をしますか？"
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '6px'
            }}
          />
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="詳細があれば..."
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '13px',
              minHeight: '40px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* 共通設定項目 */}
        <div style={{ marginBottom: '10px' }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '6px'
          }}>
            タスク設定
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '90px 80px 110px', gap: '4px', marginBottom: '6px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '2px',
                fontSize: '11px',
                fontWeight: '500',
                color: '#6b7280'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ImportanceDot importance={importance} size={10} />
                  重要度
                </div>
              </label>
              <select
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '4px 2px',
                  border: '1px solid #d1d5db',
                  borderRadius: '3px',
                  fontSize: '13px'
                }}
              >
                <option value={1}>🔵 最低</option>
                <option value={2}>🟡 低</option>
                <option value={3}>🟡 普通</option>
                <option value={4}>🟠 高</option>
                <option value={5}>🔴 最高</option>
              </select>
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '2px',
                fontSize: '11px',
                fontWeight: '500',
                color: '#6b7280'
              }}>
                所要時間
              </label>
              <input
                type="number"
                placeholder="分"
                value={durationMin || ''}
                onChange={(e) => setDurationMin(Number(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '4px 4px',
                  border: '1px solid #d1d5db',
                  borderRadius: '3px',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '2px',
                fontSize: '11px',
                fontWeight: '500',
                color: '#6b7280'
              }}>
                カテゴリ
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px 2px',
                  border: '1px solid #d1d5db',
                  borderRadius: '3px',
                  fontSize: '13px'
                }}
              >
                <option value="">カテゴリ</option>
                <option value="仕事">仕事</option>
                <option value="プライベート">プライベート</option>
                <option value="勉強">勉強</option>
                <option value="健康">健康</option>
                <option value="家事">家事</option>
                <option value="買い物">買い物</option>
              </select>
            </div>
          </div>
        </div>

        {/* URL管理セクション */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{
            display: 'block',
            marginBottom: '4px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151'
          }}>
            関連URL（最大5個）
            {urls.length > URL_LIMITS.RECOMMENDED && (
              <span style={{ color: '#f59e0b', fontSize: '10px', marginLeft: '6px' }}>
                推奨数（{URL_LIMITS.RECOMMENDED}個）を超えています
              </span>
            )}
          </label>
          
          {/* URL入力エリア */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com"
              style={{
                flex: 1,
                padding: '4px 6px',
                border: '1px solid #d1d5db',
                borderRadius: '3px',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
            />
            <button
              type="button"
              onClick={handleAddUrl}
              disabled={!newUrl.trim() || urls.length >= URL_LIMITS.MAX_ALLOWED}
              style={{
                padding: '4px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '3px',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '12px',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>
                  {urls.length}個のURL
                </span>
                <button
                  type="button"
                  onClick={handleOpenAllUrls}
                  style={{
                    padding: '2px 4px',
                    border: '1px solid #3b82f6',
                    borderRadius: '3px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  🚀 全て開く
                </button>
              </div>
              <div style={{ 
                border: '1px solid #e5e7eb',
                borderRadius: '3px',
                maxHeight: '80px',
                overflowY: 'auto'
              }}>
                {urls.map((url, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px 6px',
                      borderBottom: index < urls.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        fontSize: '10px',
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
                        marginLeft: '4px',
                        padding: '2px',
                        border: 'none',
                        borderRadius: '2px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        fontSize: '10px',
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

        {/* ファイル添付セクション */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{
            display: 'block',
            marginBottom: '4px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151'
          }}>
            ファイル添付（画像・PDF 1枚）
          </label>

          {!attachedFile ? (
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '6px',
              padding: '16px',
              textAlign: 'center',
              backgroundColor: '#f9fafb'
            }}>
              <input
                type="file"
                id="file-upload"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="file-upload"
                style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                📎 ファイルを選択
              </label>
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                JPG, PNG, GIF, WebP, PDF（10MB以下）
              </div>
            </div>
          ) : (
            <div style={{
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '8px',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                    📎 {attachedFile.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>
                    {(attachedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #dc2626',
                    borderRadius: '4px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  削除
                </button>
              </div>

              {/* 画像プレビュー */}
              {attachedFileUrl && (
                <div style={{ marginTop: '8px', textAlign: 'center' }}>
                  <img
                    src={attachedFileUrl}
                    alt="プレビュー"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100px',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb'
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 期限なしメモ オプション */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#374151'
          }}>
            <input
              type="checkbox"
              checked={saveAsIdea}
              onChange={(e) => setSaveAsIdea(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer'
              }}
            />
            <span>期限なしでメモとして保存</span>
          </label>
        </div>

        {/* タスクタイプ選択 */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setTaskType('once')}
              style={{
                flex: 1,
                padding: '6px',
                border: `2px solid ${taskType === 'once' ? '#3b82f6' : '#e5e7eb'}`,
                borderRadius: '6px',
                backgroundColor: taskType === 'once' ? '#eff6ff' : 'white',
                color: taskType === 'once' ? '#3b82f6' : '#6b7280',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              指定日にやる
            </button>
            <button
              type="button"
              onClick={() => setTaskType('deadline')}
              style={{
                flex: 1,
                padding: '6px',
                border: `2px solid ${taskType === 'deadline' ? '#f59e0b' : '#e5e7eb'}`,
                borderRadius: '6px',
                backgroundColor: taskType === 'deadline' ? '#fffbeb' : 'white',
                color: taskType === 'deadline' ? '#f59e0b' : '#6b7280',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              期限を決める
            </button>
            <button
              type="button"
              onClick={() => setTaskType('recurring')}
              style={{
                flex: 1,
                padding: '6px',
                border: `2px solid ${taskType === 'recurring' ? '#059669' : '#e5e7eb'}`,
                borderRadius: '6px',
                backgroundColor: taskType === 'recurring' ? '#ecfdf5' : 'white',
                color: taskType === 'recurring' ? '#059669' : '#6b7280',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              繰り返しやる
            </button>
          </div>

          {/* 指定日タスク設定 */}
          {taskType === 'once' && (
            <div style={{ marginBottom: '6px' }}>
              <label style={{
                display: 'block',
                marginBottom: '2px',
                fontSize: '11px',
                fontWeight: '500',
                color: '#6b7280'
              }}>
                実行日
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '3px',
                  fontSize: '13px'
                }}
              />
            </div>
          )}

          {/* 期限設定 */}
          {taskType === 'deadline' && (
            <div style={{ marginBottom: '6px' }}>
              <label style={{
                display: 'block',
                marginBottom: '2px',
                fontSize: '11px',
                fontWeight: '500',
                color: '#6b7280'
              }}>
                期限日
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  border: '1px solid #d1d5db',
                  borderRadius: '3px',
                  fontSize: '13px'
                }}
              />
            </div>
          )}

          {/* 繰り返しタスク設定 */}
          {taskType === 'recurring' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '4px', marginBottom: '8px' }}>
                <div>
                  <select
                    value={recurringPattern}
                    onChange={(e) => setRecurringPattern(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px 2px',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="daily">毎日</option>
                    <option value="interval">X日おき</option>
                    <option value="weekly">毎週</option>
                    <option value="monthly">毎月</option>
                    <option value="yearly">毎年</option>
                  </select>
                </div>
                <div>
                  {/* 動的設定エリア */}
                  {recurringPattern === 'interval' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={intervalDays}
                        onChange={(e) => setIntervalDays(Number(e.target.value))}
                        style={{
                          width: '60px',
                          padding: '6px 4px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>日おき</span>
                    </div>
                  )}
                  {recurringPattern === 'monthly' && (
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
                        <option key={day} value={day}>毎月{day}日</option>
                      ))}
                      <option value={32}>毎月末日</option>
                    </select>
                  )}
                  {recurringPattern === 'yearly' && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <select
                        value={monthOfYear}
                        onChange={(e) => setMonthOfYear(Number(e.target.value))}
                        style={{
                          width: '70px',
                          padding: '6px 4px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month}>{month}月</option>
                        ))}
                      </select>
                      <select
                        value={dayOfYear}
                        onChange={(e) => setDayOfYear(Number(e.target.value))}
                        style={{
                          width: '70px',
                          padding: '6px 4px',
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
                </div>
              </div>

              {/* 曜日選択（複数可能） */}
              {recurringPattern === 'weekly' && (
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '3px' }}>
                    曜日（複数選択可）
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                    {dayNames.map((day, index) => {
                      const dayValue = index + 1
                      const isSelected = selectedWeekdays.includes(dayValue)
                      return (
                        <button
                          key={dayValue}
                          type="button"
                          onClick={() => toggleWeekday(dayValue)}
                          style={{
                            padding: '4px 2px',
                            fontSize: '10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '3px',
                            backgroundColor: isSelected ? '#059669' : '#f9fafb',
                            borderColor: isSelected ? '#059669' : '#d1d5db',
                            color: isSelected ? 'white' : '#374151',
                            cursor: 'pointer',
                            fontWeight: isSelected ? '600' : '400'
                          }}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
                    {selectedWeekdays.length === 0 ? '曜日を選択' :
                     selectedWeekdays.length === 7 ? '毎日' :
                     `${selectedWeekdays.map(d => dayNames[d-1]).join('、')}曜日`}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 実行ボタン */}
        <div style={{ marginBottom: '8px' }}>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || (!saveAsIdea && taskType === 'recurring' && recurringPattern === 'weekly' && selectedWeekdays.length === 0)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: (() => {
                if (!title.trim()) return '#9ca3af'
                if (saveAsIdea) return '#6b7280'
                if (taskType === 'once') return '#3b82f6'
                if (taskType === 'deadline') return '#f59e0b'
                return '#059669'
              })(),
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (title.trim() && !(!saveAsIdea && taskType === 'recurring' && recurringPattern === 'weekly' && selectedWeekdays.length === 0)) ? 'pointer' : 'not-allowed'
            }}
          >
            {saveAsIdea ? '📝 やることリストに追加' :
             taskType === 'once' ? '指定日のタスクを作成' :
             taskType === 'deadline' ? '期限付きタスクを作成' : '繰り返しタスクを作成'}
          </button>
        </div>

        {/* 閉じるボタン */}
        <button
          onClick={handleCancel}
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '3px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  )
}

export default memo(TaskCreateForm2)
export { TaskCreateForm2 }