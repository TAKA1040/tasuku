'use client'

import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { UnifiedTask, SubTask } from '@/lib/types/unified-task'
import { DisplayNumberUtils } from '@/lib/types/unified-task'
import { getTodayJST, getTomorrowJST, getDaysFromToday, getUrgencyLevel } from '@/lib/utils/date-jst'
import { ImportanceDot } from '@/components/ImportanceDot'
import { UnifiedTasksService } from '@/lib/db/unified-tasks'

interface ShoppingTasksSectionProps {
  onEdit?: (task: UnifiedTask) => void
  onSubTaskUpdate?: (taskId: string) => void // サブタスク更新時のコールバック
}

export function ShoppingTasksSection({ onEdit, onSubTaskUpdate }: ShoppingTasksSectionProps) {
  const unifiedTasks = useUnifiedTasks()
  const [subTasks, setSubTasks] = useState<{ [taskId: string]: SubTask[] }>({})
  const [showShoppingLists, setShowShoppingLists] = useState<{ [taskId: string]: boolean }>({})
  const [newItemInputs, setNewItemInputs] = useState<{ [taskId: string]: string }>({})
  const [editingSubTask, setEditingSubTask] = useState<{ taskId: string; subTaskId: string; title: string } | null>(null)
  const [showFilePopup, setShowFilePopup] = useState(false)
  const [selectedFile, setSelectedFile] = useState<{ file_name: string; file_type: string; file_data: string } | null>(null)

  // ファイル表示機能
  const handleFileClick = (attachment: { file_name: string; file_type: string; file_data: string }) => {
    setSelectedFile(attachment)
    setShowFilePopup(true)
  }

  const closeFilePopup = () => {
    setShowFilePopup(false)
    setSelectedFile(null)
  }

  // ファイルアイコン表示機能
  const renderFileIcon = (attachment?: { file_name: string; file_type: string; file_data: string }) => {
    if (!attachment) return null

    const isImage = attachment.file_type.startsWith('image/')
    const isPDF = attachment.file_type === 'application/pdf'

    return (
      <button
        onClick={() => handleFileClick(attachment)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '2px',
          borderRadius: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title={`添付ファイル: ${attachment.file_name}`}
      >
        {isImage ? '📷' : isPDF ? '📄' : '📎'}
      </button>
    )
  }

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObject = new URL(url)
      return urlObject.protocol === 'http:' || urlObject.protocol === 'https:'
    } catch {
      return false
    }
  }

  const renderUrlIcon = (urls?: string[]) => {
    if (!urls || urls.length === 0) return '-'

    return (
      <button
        type="button"
        onClick={() => {
          const validUrls = urls.filter(isValidUrl)
          const invalidUrls = urls.filter(url => !isValidUrl(url))

          if (validUrls.length === 0) {
            alert('有効なURLが見つかりませんでした。')
            return
          }

          if (invalidUrls.length > 0) {
            alert(`無効なURL: ${invalidUrls.join(', ')}`)
          }

          const confirmMessage = `${validUrls.length}個の有効なURLを開きますか？`
          if (confirm(confirmMessage)) {
            validUrls.forEach((url) => {
              window.open(url, '_blank', 'noopener,noreferrer')
            })
          }
        }}
        style={{
          border: 'none',
          background: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '2px'
        }}
        title={`${urls.length}個のURLを一括で開く`}
      >
        🌍
      </button>
    )
  }

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return '期日なし'
    const date = new Date(dueDate + 'T00:00:00')
    return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
  }

  // 買い物リスト表示の切り替え
  const toggleShoppingList = (taskId: string) => {
    setShowShoppingLists(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
  }

  // 買い物カテゴリーのタスクを取得（フィルタリング修正版）
  const getShoppingTasks = useCallback(() => {
    if (unifiedTasks.loading) return []

    // 統一システムから買い物タスクを直接取得（すべての買い物タスク）
    const shoppingTasks = unifiedTasks.getShoppingTasks()


    // すべての買い物タスクを表示対象にする（期日に関係なく）
    const allTasks = shoppingTasks.map(task => ({
      task,
      urgency: 'none' as const,
      days_from_today: 999
    }))

    return allTasks
  }, [unifiedTasks.loading, unifiedTasks.getShoppingTasks])

  // サブタスクを読み込み
  const loadSubTasks = useCallback(async () => {
    if (unifiedTasks.loading) return

    const shoppingTasks = getShoppingTasks()
    const newSubTasks: { [taskId: string]: SubTask[] } = {}

    for (const taskWithUrgency of shoppingTasks) {
      const taskSubTasks = await unifiedTasks.getSubtasks(taskWithUrgency.task.id)
      newSubTasks[taskWithUrgency.task.id] = taskSubTasks.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    }

    setSubTasks(newSubTasks)
  }, [unifiedTasks.loading, getShoppingTasks, unifiedTasks.getSubtasks])

  useEffect(() => {
    loadSubTasks()
  }, [loadSubTasks])

  // サブタスクの完了状態を切り替え
  const handleToggleSubTask = async (subTaskId: string, taskId: string) => {
    try {
      await unifiedTasks.toggleSubtask(subTaskId)
      await loadSubTasks()

      // 親コンポーネントに更新を通知
      onSubTaskUpdate?.(taskId)
    } catch (error) {
      console.error('Failed to toggle subtask:', error)
    }
  }

  // サブタスクを削除
  const handleDeleteSubTask = async (subTaskId: string, taskId: string) => {
    try {
      await unifiedTasks.deleteSubtask(subTaskId)
      await loadSubTasks()

      // 親コンポーネントに更新を通知
      onSubTaskUpdate?.(taskId)
    } catch (error) {
      console.error('Failed to delete subtask:', error)
    }
  }

  // サブタスクを追加
  const handleAddSubTask = async (taskId: string) => {
    const newItemText = newItemInputs[taskId]?.trim()
    if (!newItemText) return

    try {
      await unifiedTasks.createSubtask(taskId, newItemText)

      // 入力フィールドをクリア
      setNewItemInputs(prev => ({
        ...prev,
        [taskId]: ''
      }))

      await loadSubTasks()

      // 親コンポーネントに更新を通知
      onSubTaskUpdate?.(taskId)
    } catch (error) {
      console.error('Failed to add subtask:', error)
    }
  }

  // 入力フィールドの値を更新
  const handleInputChange = (taskId: string, value: string) => {
    setNewItemInputs(prev => ({
      ...prev,
      [taskId]: value
    }))
  }

  // サブタスクの編集を開始
  const handleStartEditSubTask = (taskId: string, subTaskId: string, title: string) => {
    setEditingSubTask({ taskId, subTaskId, title })
  }

  // サブタスクの編集をキャンセル
  const handleCancelEditSubTask = () => {
    setEditingSubTask(null)
  }

  // サブタスクの編集を保存
  const handleSaveEditSubTask = async () => {
    if (!editingSubTask) return

    try {
      // 統一システムではサブタスクの編集機能は未実装なので、削除して再作成
      await unifiedTasks.deleteSubtask(editingSubTask.subTaskId)
      await unifiedTasks.createSubtask(editingSubTask.taskId, editingSubTask.title)
      await loadSubTasks()
      setEditingSubTask(null)

      // 親コンポーネントに更新を通知
      onSubTaskUpdate?.(editingSubTask.taskId)
    } catch (error) {
      console.error('Failed to update subtask:', error)
    }
  }

  // 編集中のサブタスクのタイトルを更新
  const handleEditInputChange = (value: string) => {
    if (!editingSubTask) return
    setEditingSubTask({ ...editingSubTask, title: value })
  }

  // タスク完了（統一システムの子タスク処理を使用）
  const handleCompleteTask = async (taskId: string) => {
    try {
      // 統一システムのcompleteTaskが買い物タスクの子タスク処理を自動実行
      await unifiedTasks.completeTask(taskId)

      // サブタスクリストを再読み込み
      await loadSubTasks()
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const shoppingTasks = getShoppingTasks()


  // 買い物タスクをテーブル形式のデータに変換
  const shoppingTableItems = useMemo(() => {
    const items = shoppingTasks.map(taskWithUrgency => ({
      id: taskWithUrgency.task.id,
      title: taskWithUrgency.task.title,
      memo: taskWithUrgency.task.memo,
      dueDate: taskWithUrgency.task.due_date,
      category: taskWithUrgency.task.category,
      importance: taskWithUrgency.task.importance,
      urls: taskWithUrgency.task.urls,
      urgency: taskWithUrgency.urgency,
      days: taskWithUrgency.days_from_today,
      isCompleted: taskWithUrgency.task.completed,
      task: taskWithUrgency.task,
      attachment: taskWithUrgency.task.attachment,
      display_number: taskWithUrgency.task.display_number
    }))


    return items
  }, [shoppingTasks])

  // 編集機能
  const handleEdit = (task: UnifiedTask) => {
    if (onEdit) {
      onEdit(task)
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('編集:', task)
      }
      alert(`タスク「${task.title}」の編集機能は今日のページで利用できます`)
    }
  }

  if (shoppingTableItems.length === 0) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#6b7280',
            margin: 0
          }}>
            🛒 買い物
          </h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>✓</th>
              <th style={{ padding: '2px 4px', textAlign: 'left', fontSize: '11px' }}>タイトル</th>
              <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>📷</th>
              <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>🌍</th>
              <th style={{ padding: '2px 4px', textAlign: 'left', width: '100px', fontSize: '11px', display: 'none' }} className="date-type-desktop-only">期日</th>
              <th style={{ padding: '2px 4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: '1px solid #e5e7eb' }}>
              <td colSpan={6} style={{
                padding: '16px',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '12px',
                fontStyle: 'italic'
              }}>
                買い物カテゴリーのタスクなし
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#6b7280',
          margin: 0
        }}>
          🛒 買い物
        </h3>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '60px' }}>番号</th>
            <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '40px' }}>完了</th>
            <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '60px' }}>種別</th>
            <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>タイトル</th>
            <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '80px' }}>カテゴリ</th>
            <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '90px' }}>期限</th>
            <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '80px' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {shoppingTableItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <tr
                style={{
                  borderTop: index > 0 ? '1px solid #f3f4f6' : 'none',
                  backgroundColor: '#f0fdf4' // 買い物タスクは薄い緑
                }}
              >
                {/* 統一番号表示 */}
                <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px', fontFamily: 'monospace' }}>
                  <span style={{
                    padding: '2px 4px',
                    borderRadius: '3px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    fontWeight: '600'
                  }}>
                    {item.display_number ? DisplayNumberUtils.formatCompact(item.display_number) : '-'}
                  </span>
                </td>

                {/* 完了チェックボックス */}
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleCompleteTask(item.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      border: item.isCompleted ? '2px solid #10b981' : '2px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: item.isCompleted ? '#10b981' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      transition: 'all 0.15s ease'
                    }}
                    title="タスクを完了する"
                  >
                    {item.isCompleted && '✓'}
                  </button>
                </td>

                {/* 種別 */}
                <td style={{ padding: '8px', fontSize: '11px', color: '#6b7280' }}>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    fontSize: '9px',
                    fontWeight: '500'
                  }}>
                    買い物
                  </span>
                </td>

                {/* タイトル */}
                <td style={{ padding: '8px', fontSize: '14px', fontWeight: '500' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* 重要度インディケーター */}
                    {item.importance && (
                      <ImportanceDot importance={item.importance} />
                    )}
                    <span style={{
                      textDecoration: item.isCompleted ? 'line-through' : 'none',
                      color: item.isCompleted ? '#9ca3af' : 'inherit'
                    }}>
                      {item.title}
                    </span>
                    <span
                      onClick={() => toggleShoppingList(item.id)}
                      style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        cursor: 'pointer',
                        backgroundColor: '#f0f9ff',
                        padding: '1px 4px',
                        borderRadius: '3px'
                      }}
                    >
                      リスト({subTasks[item.id]?.length || 0})
                    </span>
                  </div>
                </td>

                {/* カテゴリ */}
                <td style={{ padding: '8px', fontSize: '12px', color: '#6b7280' }}>
                  買い物
                </td>

                {/* 期限 */}
                <td style={{ padding: '8px', fontSize: '11px', color: '#374151', textAlign: 'center' }}>
                  {item.dueDate && item.dueDate !== '2999-12-31' ? (
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      fontSize: '10px',
                      fontWeight: '500'
                    }}>
                      {item.dueDate}
                    </span>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '10px' }}>なし</span>
                  )}
                </td>

                {/* 操作 */}
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                    {/* 編集ボタン */}
                    <button
                      onClick={() => handleEdit(item.task)}
                      style={{
                        padding: '4px',
                        fontSize: '12px',
                        border: 'none',
                        borderRadius: '3px',
                        backgroundColor: 'transparent',
                        color: '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        transition: 'all 0.15s ease'
                      }}
                      title="タスクを編集"
                    >
                      ✏️
                    </button>

                    {/* 削除ボタン */}
                    <button
                      onClick={() => {
                        if (confirm('このタスクを削除しますか？')) {
                          unifiedTasks.deleteTask(item.id)
                        }
                      }}
                      style={{
                        padding: '4px',
                        fontSize: '12px',
                        border: 'none',
                        borderRadius: '3px',
                        backgroundColor: 'transparent',
                        color: '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        transition: 'all 0.15s ease'
                      }}
                      title="タスクを削除"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>

              {/* 買い物リスト表示行 */}
              {showShoppingLists[item.id] && (
                <tr style={{ backgroundColor: '#f8fffe' }}>
                  <td colSpan={7} style={{ padding: '8px 16px' }}>
                    <div style={{ marginLeft: '24px' }}>
                      {/* 既存のサブタスク */}
                      {subTasks[item.id] && subTasks[item.id].length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          {subTasks[item.id].map((subTask) => (
                            <div
                              key={subTask.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '2px 0',
                                fontSize: '13px'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={subTask.completed}
                                onChange={() => handleToggleSubTask(subTask.id, item.id)}
                                style={{ cursor: 'pointer' }}
                              />

                              {editingSubTask?.subTaskId === subTask.id ? (
                                // 編集モード
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                                  <input
                                    type="text"
                                    value={editingSubTask?.title || ''}
                                    onChange={(e) => handleEditInputChange(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveEditSubTask()
                                      } else if (e.key === 'Escape') {
                                        handleCancelEditSubTask()
                                      }
                                    }}
                                    autoFocus
                                    style={{
                                      flex: 1,
                                      padding: '2px 4px',
                                      fontSize: '13px',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '3px'
                                    }}
                                  />
                                  <button
                                    onClick={handleSaveEditSubTask}
                                    style={{
                                      padding: '2px 6px',
                                      fontSize: '10px',
                                      backgroundColor: '#10b981',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={handleCancelEditSubTask}
                                    style={{
                                      padding: '2px 6px',
                                      fontSize: '10px',
                                      backgroundColor: '#6b7280',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                // 表示モード
                                <>
                                  <span
                                    onClick={() => handleStartEditSubTask(item.id, subTask.id, subTask.title)}
                                    style={{
                                      flex: 1,
                                      color: subTask.completed ? '#9ca3af' : '#6b7280',
                                      textDecoration: subTask.completed ? 'line-through' : 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {subTask.title}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteSubTask(subTask.id, item.id)}
                                    style={{
                                      padding: '2px 4px',
                                      fontSize: '10px',
                                      backgroundColor: 'transparent',
                                      color: '#ef4444',
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                    title="削除"
                                  >
                                    🗑️
                                  </button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* サブタスク追加フォーム */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                      }}>
                        <input
                          type="text"
                          placeholder="買うものを追加"
                          value={newItemInputs[item.id] || ''}
                          onChange={(e) => handleInputChange(item.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddSubTask(item.id)
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px'
                          }}
                        />
                        <button
                          onClick={() => handleAddSubTask(item.id)}
                          disabled={!newItemInputs[item.id]?.trim()}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: newItemInputs[item.id]?.trim() ? '#10b981' : '#d1d5db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: newItemInputs[item.id]?.trim() ? 'pointer' : 'not-allowed'
                          }}
                        >
                          追加
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* ファイルポップアップ */}
      {showFilePopup && selectedFile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '10px'
          }}
          onClick={closeFilePopup}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              maxWidth: '95vw',
              maxHeight: '95vh',
              width: 'fit-content',
              height: 'fit-content',
              overflow: 'auto',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              flexShrink: 0
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                wordBreak: 'break-all',
                lineHeight: '1.3',
                paddingRight: '8px'
              }}>
                {selectedFile.file_name}
              </h3>
              <button
                onClick={closeFilePopup}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {selectedFile.file_type.startsWith('image/') ? (
              <img
                src={`data:${selectedFile.file_type};base64,${selectedFile.file_data}`}
                alt={selectedFile.file_name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  height: 'auto',
                  width: 'auto',
                  borderRadius: '4px',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>このファイルはプレビューできません</p>
                <a
                  href={`data:${selectedFile.file_type};base64,${selectedFile.file_data}`}
                  download={selectedFile.file_name}
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px'
                  }}
                >
                  ダウンロード
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}