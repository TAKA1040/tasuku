'use client'

import { useState, useEffect } from 'react'
import type { Task } from '@/lib/db/schema'
import type { UnifiedTask, SubTask } from '@/lib/types/unified-task'
import { TASK_IMPORTANCE_LABELS, TASK_IMPORTANCE, URL_LIMITS } from '@/lib/db/schema'
import { QuickMoves } from '@/lib/utils/date-jst'
import { TimeInput } from '@/components/TimeInput'

interface TaskEditFormProps {
  task: Task | UnifiedTask | null
  onSubmit: (taskId: string, title: string, memo: string, dueDate: string, category?: string, importance?: 1 | 2 | 3 | 4 | 5, urls?: string[], startTime?: string, endTime?: string, attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }) => Promise<void>
  onCancel: () => void
  onUncomplete?: (taskId: string) => Promise<void>
  isVisible: boolean
  shoppingSubTasks?: {[taskId: string]: SubTask[]}
  onAddShoppingItem?: (taskId: string, title: string) => Promise<void>
  onUpdateShoppingItem?: (taskId: string, subTaskId: string, newTitle: string) => Promise<void>
  onDeleteShoppingItem?: (taskId: string, subTaskId: string) => Promise<void>
}

export function TaskEditForm({ task, onSubmit, onCancel, onUncomplete, isVisible, shoppingSubTasks, onAddShoppingItem, onUpdateShoppingItem, onDeleteShoppingItem }: TaskEditFormProps) {
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('')
  const [importance, setImportance] = useState<number>(TASK_IMPORTANCE.MEDIUM)
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [urls, setUrls] = useState<string[]>([])
  const [newUrl, setNewUrl] = useState('')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [attachedFileUrl, setAttachedFileUrl] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newShoppingItem, setNewShoppingItem] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemTitle, setEditingItemTitle] = useState('')
  const [isTyping, setIsTyping] = useState(false) // URL入力中フラグ
  const [isTypingShopping, setIsTypingShopping] = useState(false) // 買い物リスト入力中フラグ

  // 買い物リストの編集は一覧画面で行います（subtasksテーブルを使用）

  // memoから買い物リスト部分を除去する関数
  const removeLegacyShoppingListFromMemo = (memoText: string): string => {
    if (!memoText) return ''

    // 【買い物リスト】セクションを除去
    const lines = memoText.split('\n')
    const cleanLines: string[] = []
    let inShoppingList = false

    for (const line of lines) {
      if (line.trim() === '【買い物リスト】') {
        inShoppingList = true
        continue
      }
      if (inShoppingList && line.trim().startsWith('•')) {
        continue
      }
      if (inShoppingList && line.trim() === '') {
        continue
      }
      if (inShoppingList) {
        inShoppingList = false
      }
      cleanLines.push(line)
    }

    return cleanLines.join('\n').trim()
  }

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      // memoから買い物リスト部分を除去
      setMemo(removeLegacyShoppingListFromMemo(task.memo || ''))
      setDueDate(task.due_date || '')
      setCategory(task.category || '')
      setImportance(task.importance || TASK_IMPORTANCE.MEDIUM)
      setStartTime((task as UnifiedTask).start_time || '')
      setEndTime((task as UnifiedTask).end_time || '')
      setUrls(task.urls || [])
      // 既存の添付ファイルはクリア（新規添付のみ対応）
      setAttachedFile(null)
      setAttachedFileUrl('')
    }
  }, [task])

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

      // 前のファイルのURLをクリア
      if (attachedFileUrl) {
        URL.revokeObjectURL(attachedFileUrl)
      }

      setAttachedFile(file)

      // 画像ファイルの場合はプレビュー表示のためURL生成
      if (file.type.startsWith('image/')) {
        const fileUrl = URL.createObjectURL(file)
        setAttachedFileUrl(fileUrl)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !task) return

    // 未確定の入力があるかチェック
    const hasUnconfirmedUrl = newUrl.trim().length > 0
    const hasUnconfirmedShopping = category === '買い物' && newShoppingItem.trim().length > 0

    if (hasUnconfirmedUrl || hasUnconfirmedShopping) {
      const warnings = []
      if (hasUnconfirmedUrl) warnings.push('URL')
      if (hasUnconfirmedShopping) warnings.push('買い物リスト')

      const message = `${warnings.join('と')}に未追加の入力があります。\n\n※未追加の内容は破棄されます\n\nOK: 保存する\nキャンセル: 入力に戻る`

      if (!window.confirm(message)) {
        return // キャンセルされた場合は処理を中断
      }
    }

    setIsSubmitting(true)
    try {
      // ファイル添付がある場合はBase64に変換
      let attachment: { file_name: string; file_type: string; file_size: number; file_data: string } | undefined = undefined
      if (attachedFile) {
        try {
          const fileBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              const base64 = result.split(',')[1] // data:image/jpeg;base64,の部分を除去
              resolve(base64)
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
        } catch (error) {
          console.error('TaskEditForm: File conversion failed:', error)
          alert('ファイルの変換に失敗しました')
          return
        }
      }

      await onSubmit(task.id, title, memo, dueDate, category || undefined, importance as 1 | 2 | 3 | 4 | 5, urls.length > 0 ? urls : undefined, startTime || undefined, endTime || undefined, attachment)

      // onCancel() - today/page.tsxのhandleUpdateTaskで処理される
    } catch (error) {
      console.error('Failed to update task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (task) {
      setTitle(task.title)
      setMemo(task.memo || '')
      setDueDate(task.due_date || '')
      setCategory(task.category || '')
      setImportance(task.importance || TASK_IMPORTANCE.MEDIUM)
      setStartTime((task as UnifiedTask).start_time || '')
      setUrls(task.urls || [])
      // 既存の添付ファイルはクリア
      setAttachedFile(null)
      setAttachedFileUrl('')
    }
    onCancel()
  }

  const handleAddUrl = () => {
    if (newUrl.trim() && urls.length < URL_LIMITS.MAX_ALLOWED) {
      // 簡易URL検証
      try {
        new URL(newUrl.trim())
        setUrls([...urls, newUrl.trim()])
        setNewUrl('')
        setIsTyping(false) // 追加時にフラグをクリア
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

  const handleUncomplete = async () => {
    if (!task || !onUncomplete) return

    if (confirm('このタスクを未完了に戻しますか？')) {
      try {
        await onUncomplete(task.id)
        onCancel()
      } catch (error) {
        console.error('Failed to uncomplete task:', error)
      }
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
      padding: '0'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '16px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        margin: '0 10px',
        boxSizing: 'border-box'
      }}>
        <form onSubmit={handleSubmit}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
            color: '#1f2937'
          }}>
            タスクを編集
          </h2>

          {/* タイトル */}
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              minWidth: '60px'
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
                flex: 1,
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
          </div>

          {/* メモ */}
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              minWidth: '60px',
              paddingTop: '6px'
            }}>
              メモ
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモ（任意）"
              rows={2}
              style={{
                flex: 1,
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* カテゴリ */}
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              minWidth: '60px'
            }}>
              カテゴリ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '13px',
                backgroundColor: '#fff'
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

          {/* 買い物リスト（カテゴリが「買い物」の時のみ表示） */}
          {category === '買い物' && task && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                買い物リスト
              </label>

              {/* 買い物アイテムの追加フォーム */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={newShoppingItem}
                  onChange={(e) => {
                    setNewShoppingItem(e.target.value)
                    setIsTypingShopping(e.target.value.trim().length > 0)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newShoppingItem.trim() && onAddShoppingItem) {
                      e.preventDefault()
                      onAddShoppingItem(task.id, newShoppingItem.trim())
                      setNewShoppingItem('')
                      setIsTypingShopping(false)
                    }
                  }}
                  placeholder="アイテムを追加..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newShoppingItem.trim() && onAddShoppingItem) {
                      onAddShoppingItem(task.id, newShoppingItem.trim())
                      setNewShoppingItem('')
                      setIsTypingShopping(false)
                    }
                  }}
                  disabled={!newShoppingItem.trim()}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    backgroundColor: isTypingShopping && newShoppingItem.trim() ? '#ef4444' : (newShoppingItem.trim() ? '#3b82f6' : '#d1d5db'),
                    color: '#ffffff',
                    border: isTypingShopping && newShoppingItem.trim() ? '2px solid #ef4444' : 'none',
                    borderRadius: '4px',
                    cursor: newShoppingItem.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: isTypingShopping && newShoppingItem.trim() ? '600' : '500',
                    transition: 'all 0.2s ease',
                    boxShadow: isTypingShopping && newShoppingItem.trim() ? '0 0 8px rgba(239, 68, 68, 0.4)' : 'none'
                  }}
                >
                  追加
                </button>
              </div>

              {/* 買い物アイテムリスト */}
              {shoppingSubTasks?.[task.id] && shoppingSubTasks[task.id].length > 0 && (
                <div style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  padding: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  background: '#f9fafb'
                }}>
                  {shoppingSubTasks[task.id].map((subTask) => (
                    <div key={subTask.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px 8px',
                      margin: '2px 0',
                      background: '#ffffff',
                      borderRadius: '2px',
                      fontSize: '13px',
                      gap: '8px'
                    }}>
                      {editingItemId === subTask.id ? (
                        <>
                          <input
                            type="text"
                            value={editingItemTitle}
                            onChange={(e) => setEditingItemTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && editingItemTitle.trim()) {
                                if (onUpdateShoppingItem) {
                                  onUpdateShoppingItem(task.id, subTask.id, editingItemTitle.trim())
                                }
                                setEditingItemId(null)
                                setEditingItemTitle('')
                              } else if (e.key === 'Escape') {
                                setEditingItemId(null)
                                setEditingItemTitle('')
                              }
                            }}
                            autoFocus
                            style={{
                              flex: 1,
                              padding: '4px 8px',
                              fontSize: '13px',
                              border: '1px solid #3b82f6',
                              borderRadius: '2px',
                              outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (editingItemTitle.trim()) {
                                if (onUpdateShoppingItem) {
                                  onUpdateShoppingItem(task.id, subTask.id, editingItemTitle.trim())
                                }
                                setEditingItemId(null)
                                setEditingItemTitle('')
                              }
                            }}
                            style={{
                              background: '#3b82f6',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: '4px 8px',
                              fontWeight: '500'
                            }}
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemId(null)
                              setEditingItemTitle('')
                            }}
                            style={{
                              background: '#6b7280',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: '4px 8px'
                            }}
                          >
                            キャンセル
                          </button>
                        </>
                      ) : (
                        <>
                          <span
                            style={{
                              flex: 1,
                              cursor: 'pointer',
                              color: '#374151'
                            }}
                            onClick={() => {
                              setEditingItemId(subTask.id)
                              setEditingItemTitle(subTask.title)
                            }}
                          >
                            {subTask.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemId(subTask.id)
                              setEditingItemTitle(subTask.title)
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#3b82f6',
                              fontSize: '14px',
                              padding: '0 4px',
                              lineHeight: '1'
                            }}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteShoppingItem && onDeleteShoppingItem(task.id, subTask.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                              fontSize: '16px',
                              padding: '0 4px',
                              lineHeight: '1'
                            }}
                          >
                            ×
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 優先度 */}
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              minWidth: '60px'
            }}>
              優先度
            </label>
            <select
              value={importance}
              onChange={(e) => setImportance(Number(e.target.value))}
              style={{
                flex: 1,
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '13px',
                backgroundColor: '#fff'
              }}
            >
              {Object.entries(TASK_IMPORTANCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* 開始時間 */}
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              minWidth: '60px'
            }}>
              開始時間
            </label>
            <TimeInput
              value={startTime}
              onChange={setStartTime}
              placeholder="開始時間"
              style={{ flex: 1 }}
            />
          </div>

          {/* 終了時間 */}
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              minWidth: '60px'
            }}>
              終了時間
            </label>
            <TimeInput
              value={endTime}
              onChange={setEndTime}
              placeholder="終了時間"
              style={{ flex: 1 }}
            />
          </div>

          {/* ファイル添付セクション */}
          <div style={{ marginBottom: '16px' }}>
            <div>
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
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => document.getElementById('file-input-edit')?.click()}
                >
                  <input
                    id="file-input-edit"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📎</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    クリックして画像やPDFを添付
                  </div>
                </div>
              ) : (
                <div style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '500' }}>
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
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    削除
                  </button>
                </div>
              )}

              {attachedFileUrl && (
                <div style={{ marginTop: '8px', textAlign: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachedFileUrl}
                    alt="プレビュー"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100px',
                      borderRadius: '4px',
                      border: '1px solid #d1d5db'
                    }}
                  />
                </div>
              )}
            </div>

          </div>

          {/* 実行日 */}
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              minWidth: '60px'
            }}>
              実行日
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* クイック移動ボタン */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '60px' }}>日付設定:</span>
            <button
              type="button"
              onClick={() => setDueDate(QuickMoves.tomorrow())}
              style={{
                padding: '3px 6px',
                fontSize: '11px',
                border: '1px solid #d1d5db',
                borderRadius: '3px',
                backgroundColor: '#fff',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              明日
            </button>
            <button
              type="button"
              onClick={() => setDueDate(QuickMoves.plus3Days())}
              style={{
                padding: '3px 6px',
                fontSize: '11px',
                border: '1px solid #d1d5db',
                borderRadius: '3px',
                backgroundColor: '#fff',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              +3日
            </button>
            <button
              type="button"
              onClick={() => setDueDate(QuickMoves.endOfMonth())}
              style={{
                padding: '3px 6px',
                fontSize: '11px',
                border: '1px solid #d1d5db',
                borderRadius: '3px',
                backgroundColor: '#fff',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              月末
            </button>
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
                onChange={(e) => {
                  setNewUrl(e.target.value)
                  setIsTyping(e.target.value.trim().length > 0)
                }}
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
                  border: isTyping && newUrl.trim() ? '2px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: isTyping && newUrl.trim() ? '#ef4444' : 'white',
                  color: isTyping && newUrl.trim() ? 'white' : '#374151',
                  fontSize: '14px',
                  fontWeight: isTyping && newUrl.trim() ? '600' : '400',
                  cursor: 'pointer',
                  opacity: (!newUrl.trim() || urls.length >= URL_LIMITS.MAX_ALLOWED) ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: isTyping && newUrl.trim() ? '0 0 8px rgba(239, 68, 68, 0.4)' : 'none'
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
            justifyContent: task?.completed ? 'space-between' : 'flex-end'
          }}>
            {/* 未完了に戻すボタン（完了済みタスクのみ表示） */}
            {task?.completed && onUncomplete && (
              <button
                type="button"
                onClick={handleUncomplete}
                disabled={isSubmitting}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #f59e0b',
                  borderRadius: '6px',
                  backgroundColor: '#fffbeb',
                  color: '#f59e0b',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#f59e0b'
                    e.currentTarget.style.color = 'white'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#fffbeb'
                    e.currentTarget.style.color = '#f59e0b'
                  }
                }}
              >
                ↩️ 未完了に戻す
              </button>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
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
                  fontWeight: '500',
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
                  fontWeight: '500',
                  cursor: title.trim() && !isSubmitting ? 'pointer' : 'not-allowed'
                }}
              >
                {isSubmitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}