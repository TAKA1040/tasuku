'use client'

import { useState } from 'react'
import type { UnifiedTask } from '@/lib/types/unified-task'
import { SubTask } from '@/lib/types/unified-task'
import { getTodayJST } from '@/lib/utils/date-jst'

interface UnifiedTasksTableProps {
  title: string
  tasks: UnifiedTask[]
  emptyMessage?: string
  urgent?: boolean
  unifiedTasks: {
    completeTask: (id: string) => Promise<void>
    uncompleteTask: (id: string) => Promise<void>
    deleteTask: (id: string) => Promise<void>
    updateTask: (id: string, updates: Partial<UnifiedTask>) => Promise<void>
  }
  handleEditTask: (task: UnifiedTask) => void
  // サブタスク関連
  shoppingSubTasks?: {[taskId: string]: SubTask[]}
  expandedShoppingLists?: {[taskId: string]: boolean}
  toggleShoppingList?: (taskId: string) => void
  addShoppingSubTask?: (taskId: string, itemName: string) => void
  toggleShoppingSubTask?: (taskId: string, subTaskId: string) => void
  deleteShoppingSubTask?: (taskId: string, subTaskId: string) => void
  updateShoppingSubTask?: (taskId: string, subTaskId: string, updates: { title?: string }) => void
  showTitle?: boolean
}

// 重要度に応じた色を返すヘルパー関数
const getImportanceColor = (importance?: number | null): string => {
  switch (importance) {
    case 5: return '#dc2626' // 赤 - 最高重要度
    case 4: return '#ea580c' // オレンジ - 高重要度
    case 3: return '#ca8a04' // 黄 - 中重要度
    case 2: return '#16a34a' // 緑 - 低重要度
    case 1: return '#2563eb' // 青 - 最低重要度
    default: return '#9ca3af' // グレー - 重要度なし
  }
}

// memo形式の買い物リストは廃止し、subtasksテーブルに統一

// 日付を日本語形式でフォーマットするヘルパー関数
const formatDueDateForDisplay = (dateString?: string | null): string => {
  if (!dateString) return '-'

  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  // 統一システム: 全て月/日形式で表示
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}

// タスクの種別を判定するヘルパー関数
const getTaskDataType = (task: UnifiedTask): 'task' | 'recurring' | 'idea' => {
  if (task.task_type === 'IDEA') return 'idea'
  if (task.task_type === 'RECURRING') return 'recurring'
  return 'task'
}

// 繰り返しタスクの次回実行日を計算するヘルパー関数
const getTaskDateDisplay = (task: { due_date?: string | null }): string => {
  if (!task.due_date) return '日付なし'

  // 期限なしタスク（アイデア等）
  if (task.due_date === '2999-12-31') {
    return 'アイデア'
  }

  // 通常の日付表示
  return formatDueDateForDisplay(task.due_date)
}

// URL検証ヘルパー関数
const isValidUrl = (url: string): boolean => {
  try {
    const urlObject = new URL(url)
    // Only allow http and https protocols
    return urlObject.protocol === 'http:' || urlObject.protocol === 'https:'
  } catch {
    return false
  }
}

// URL一括開きアイコンのレンダリング関数
const renderUrlIcon = (urls?: string[] | null) => {
  if (!urls || urls.length === 0) return '-'

  return (
    <button
      type="button"
      onClick={() => {
        if (process.env.NODE_ENV === 'development') {
          console.log('All URLs:', urls)
        }

        // Validate URLs before opening
        const validUrls = urls.filter(isValidUrl)
        const invalidUrls = urls.filter(url => !isValidUrl(url))

        if (process.env.NODE_ENV === 'development') {
          console.log('Valid URLs:', validUrls)
          console.log('Invalid URLs:', invalidUrls)
        }

        if (validUrls.length === 0) {
          alert('有効なURLが見つかりませんでした。')
          return
        }

        // Show invalid URLs if any
        if (invalidUrls.length > 0) {
          alert(`無効なURL: ${invalidUrls.join(', ')}`)
        }

        const confirmMessage = `${validUrls.length}個の有効なURLを開きますか？`
        if (confirm(confirmMessage)) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Opening URLs:', validUrls)
          }

          let blockedCount = 0

          // ブラウザのポップアップブロッカー対策：順次開く
          validUrls.forEach((url, index) => {
            setTimeout(() => {
              if (process.env.NODE_ENV === 'development') {
                console.log(`Opening URL ${index + 1}:`, url)
              }
              const newWindow = window.open(url, '_blank', 'noopener,noreferrer')

              // ポップアップブロック検知
              if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                blockedCount++
                if (process.env.NODE_ENV === 'development') {
                  console.log(`URL ${index + 1} was blocked by popup blocker`)
                }
              }

              // 最後のURLを開いた後、ブロックされたURLがあれば通知
              if (index === validUrls.length - 1 && blockedCount > 0) {
                setTimeout(() => {
                  alert(`⚠️ ポップアップブロッカーにより ${blockedCount} 個のURLがブロックされました。\n\nブラウザのアドレスバー右側のアイコンをクリックして、このサイトのポップアップを「許可」してください。`)
                }, 200)
              }
            }, index * 100) // 100ms間隔で開く
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


export function UnifiedTasksTable({
  title,
  tasks,
  emptyMessage = '',
  urgent = false,
  unifiedTasks,
  handleEditTask,
  shoppingSubTasks = {},
  expandedShoppingLists = {},
  toggleShoppingList,
  addShoppingSubTask,
  toggleShoppingSubTask,
  deleteShoppingSubTask,
  updateShoppingSubTask,
  showTitle = true
}: UnifiedTasksTableProps) {
  // 画像表示機能
  const [showFilePopup, setShowFilePopup] = useState(false)
  const [selectedFile, setSelectedFile] = useState<{ file_name: string; file_type: string; file_data: string } | null>(null)

  // サブタスク編集状態
  const [editingSubTask, setEditingSubTask] = useState<{ taskId: string; subTaskId: string; title: string } | null>(null)

  const handleFileClick = (attachment: { file_name: string; file_type: string; file_data: string }) => {
    setSelectedFile(attachment)
    setShowFilePopup(true)
  }

  const closeFilePopup = () => {
    setShowFilePopup(false)
    setSelectedFile(null)
  }

  // ファイルアイコン表示機能
  const renderFileIcon = (attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }) => {
    if (!attachment) return null

    // Note: isImage, isPDF variables removed (not used - icon selection simplified)
    return (
      <button
        onClick={() => handleFileClick(attachment)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          marginLeft: '8px',
          padding: '2px'
        }}
        title={`画像: ${attachment.file_name}`}
      >
        📷
      </button>
    )
  }

  if (tasks.length === 0 && !emptyMessage) return null

  return (
    <section style={{ marginBottom: '12px' }}>
      {showTitle && (
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '8px',
          color: urgent ? '#ef4444' : '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {title} ({tasks.length}件)
        </h3>
      )}

      {tasks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280',
          background: 'var(--bg-secondary)',
          borderRadius: '8px'
        }}>
          {emptyMessage}
        </div>
      ) : (
        <>
        <style>{`
          @media (max-width: 640px) {
            .desktop-table { display: none; }
            .mobile-cards { display: block; }
          }
          @media (min-width: 641px) {
            .desktop-table { display: table; }
            .mobile-cards { display: none; }
          }
        `}</style>

        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          overflow: 'hidden'
        }}>
          <table className="desktop-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '40px' }}>完了</th>
                <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>タイトル</th>
                <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '80px' }}>カテゴリ</th>
                <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '30px' }}>🌍</th>
                <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '90px' }}>期限</th>
                <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '80px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((item, index) => {
                const dataType = getTaskDataType(item)
                return (
                <tr key={`${dataType}-${item.id}`}
                    style={{
                      borderTop: index > 0 ? '1px solid #f3f4f6' : 'none',
                      backgroundColor: item.completed ? '#f8f9fa' : 'transparent',
                      opacity: item.completed ? 0.6 : 1,
                      color: item.completed ? '#6b7280' : 'inherit'
                    }}>
                  {/* 完了チェックボックス */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        if (item.completed) {
                          unifiedTasks.uncompleteTask(item.id)
                        } else {
                          unifiedTasks.completeTask(item.id)
                        }
                      }}
                      style={{
                        width: '18px',
                        height: '18px',
                        border: `2px solid ${item.completed ? '#10b981' : '#d1d5db'}`,
                        borderRadius: '4px',
                        backgroundColor: item.completed ? '#10b981' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'white'
                      }}
                    >
                      {item.completed ? '✓' : ''}
                    </button>
                  </td>

                  {/* タイトル + メモ（1段表示） */}
                  <td style={{ padding: '8px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* 重要度インディケーター */}
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: getImportanceColor(item.importance),
                          flexShrink: 0
                        }}
                        title={`重要度: ${item.importance || '未設定'}`}
                      />

                      {/* タイトル */}
                      <span style={{
                        fontWeight: '500',
                        textDecoration: item.completed ? 'line-through' : 'none'
                      }}>
                        {item.title}
                      </span>

                      {/* 添付ファイルアイコン */}
                      {item.attachment && renderFileIcon(item.attachment)}

                      {/* 買い物カテゴリの場合、買い物リスト情報を表示 */}
                      {dataType === 'task' && item.category === '買い物' && (() => {
                        const subTasks = shoppingSubTasks?.[item.id] || []
                        const totalItems = subTasks.length

                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {totalItems > 0 && toggleShoppingList && (
                              <button
                                onClick={() => toggleShoppingList(item.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#3b82f6',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  textDecoration: 'underline',
                                  padding: '0'
                                }}
                                title="買い物リストを表示/非表示"
                              >
                                🛒 リスト ({totalItems})
                              </button>
                            )}
                            {item.memo && (
                              <span style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                fontStyle: 'italic'
                              }}>
                                - {item.memo}
                              </span>
                            )}
                          </div>
                        )
                      })()}

                      {/* 買い物カテゴリ以外のメモを右に表示 */}
                      {((dataType === 'task' && item.category !== '買い物') || dataType === 'recurring') && item.memo && (
                        <span style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          fontStyle: 'italic'
                        }}>
                          - {item.memo}
                        </span>
                      )}
                    </div>

                    {/* サブタスクリスト（展開時） */}
                    {dataType === 'task' && item.category === '買い物' && expandedShoppingLists && expandedShoppingLists[item.id] && (
                      <div style={{
                        marginTop: '8px',
                        paddingLeft: '12px',
                        borderLeft: '2px solid #e5e7eb'
                      }}>
                        <div style={{ marginBottom: '4px' }}>
                          <button
                            onClick={() => {
                              const newItem = prompt('買い物アイテムを追加:')
                              if (newItem && newItem.trim() && addShoppingSubTask) {
                                addShoppingSubTask(item.id, newItem.trim())
                              }
                            }}
                            style={{
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              padding: '2px 6px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                            title="買い物アイテムを追加"
                          >
                            + 追加
                          </button>
                        </div>
                        {/* サブタスクシステム（統一） */}
                        {(shoppingSubTasks[item.id] || []).map((subTask) => (
                          <div key={subTask.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '4px',
                            fontSize: '11px'
                          }}>
                            {editingSubTask?.subTaskId === subTask.id ? (
                              // 編集モード
                              <>
                                <input
                                  type="text"
                                  value={editingSubTask.title}
                                  onChange={(e) => setEditingSubTask({ ...editingSubTask, title: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && updateShoppingSubTask) {
                                      updateShoppingSubTask(item.id, subTask.id, { title: editingSubTask.title })
                                      setEditingSubTask(null)
                                    } else if (e.key === 'Escape') {
                                      setEditingSubTask(null)
                                    }
                                  }}
                                  autoFocus
                                  style={{
                                    flex: 1,
                                    padding: '2px 4px',
                                    fontSize: '11px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '2px'
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    if (updateShoppingSubTask) {
                                      updateShoppingSubTask(item.id, subTask.id, { title: editingSubTask.title })
                                      setEditingSubTask(null)
                                    }
                                  }}
                                  style={{
                                    padding: '2px 4px',
                                    fontSize: '8px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '2px',
                                    cursor: 'pointer'
                                  }}
                                  title="保存"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingSubTask(null)}
                                  style={{
                                    padding: '2px 4px',
                                    fontSize: '8px',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '2px',
                                    cursor: 'pointer'
                                  }}
                                  title="キャンセル"
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              // 表示モード
                              <>
                                <button
                                  onClick={() => toggleShoppingSubTask && toggleShoppingSubTask(item.id, subTask.id)}
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                    border: `1px solid ${subTask.completed ? '#10b981' : '#d1d5db'}`,
                                    borderRadius: '2px',
                                    backgroundColor: subTask.completed ? '#10b981' : 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '8px',
                                    color: 'white'
                                  }}
                                >
                                  {subTask.completed ? '✓' : ''}
                                </button>
                                <span
                                  style={{
                                    flex: 1,
                                    textDecoration: subTask.completed ? 'line-through' : 'none',
                                    color: subTask.completed ? '#9ca3af' : '#374151'
                                  }}
                                >
                                  {subTask.title}
                                </span>
                                <button
                                  onClick={() => setEditingSubTask({ taskId: item.id, subTaskId: subTask.id, title: subTask.title })}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#3b82f6',
                                    cursor: 'pointer',
                                    fontSize: '8px',
                                    padding: '0 2px'
                                  }}
                                  title="編集"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`「${subTask.title}」を削除しますか？`) && deleteShoppingSubTask) {
                                      deleteShoppingSubTask(item.id, subTask.id)
                                    }
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    fontSize: '8px',
                                    padding: '0'
                                  }}
                                  title="削除"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                        {(shoppingSubTasks[item.id] || []).length === 0 && (
                          <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                            リストが空です
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* カテゴリ */}
                  <td style={{ padding: '8px', fontSize: '12px', color: '#6b7280' }}>
                    {item.category || '-'}
                  </td>

                  {/* URL一括開きアイコン */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    {renderUrlIcon(item.urls)}
                  </td>

                  {/* 期限 */}
                  <td style={{ padding: '8px', fontSize: '11px', color: '#374151', textAlign: 'center' }}>
                    {item.due_date ? (
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        {formatDueDateForDisplay(item.due_date)}
                      </span>
                    ) : dataType === 'recurring' ? (
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#f0f9ff',
                        color: '#1e40af',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        {getTaskDateDisplay(item)}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '10px' }}>-</span>
                    )}
                  </td>

                  {/* 操作ボタン */}
                  <td style={{ padding: '8px' }}>
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      alignItems: 'center'
                    }}>
                      {/* 編集ボタン */}
                      <button
                        onClick={() => {
                          if (dataType === 'task') {
                            const taskForEdit: UnifiedTask = {
                              id: item.id,
                              user_id: item.user_id || '',
                              title: item.title || '',
                              memo: item.memo || undefined,
                              display_number: item.display_number || '',
                              due_date: item.due_date || '2999-12-31',
                              category: item.category || undefined,
                              importance: (item.importance && item.importance >= 1 && item.importance <= 5) ? item.importance as 1|2|3|4|5 : undefined,
                              duration_min: item.duration_min || undefined,
                              urls: item.urls || undefined,
                              attachment: item.attachment || undefined,
                              completed: item.completed || false,
                              archived: item.archived || false,
                              snoozed_until: item.snoozed_until || undefined,
                              created_at: item.created_at || new Date().toISOString(),
                              updated_at: item.updated_at || new Date().toISOString(),
                              completed_at: item.completed_at || undefined,
                              task_type: item.task_type || 'NORMAL',
                              recurring_pattern: item.recurring_pattern || undefined,
                              recurring_interval: item.recurring_interval || undefined,
                              recurring_weekdays: item.recurring_weekdays || undefined,
                              recurring_day: item.recurring_day || undefined
                            }
                            handleEditTask(taskForEdit)
                          } else if (dataType === 'recurring') {
                            handleEditTask(item)
                          } else if (dataType === 'idea') {
                            if (process.env.NODE_ENV === 'development') {
                              console.log('アイデア編集:', item.title)
                            }
                            handleEditTask(item)
                          }
                        }}
                        style={{
                          padding: '4px',
                          fontSize: '12px',
                          border: 'none',
                          borderRadius: '3px',
                          backgroundColor: 'transparent',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          width: '24px',
                          height: '24px',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        title="編集"
                      >
                        ✏️
                      </button>

                      {/* 削除ボタン */}
                      <button
                        onClick={() => {
                          if (confirm(`この${dataType === 'task' ? 'タスク' : dataType === 'recurring' ? '繰り返しタスク' : 'アイデア'}を削除しますか？`)) {
                            unifiedTasks.deleteTask(item.id)
                          }
                        }}
                        style={{
                          padding: '4px',
                          fontSize: '12px',
                          border: 'none',
                          borderRadius: '3px',
                          backgroundColor: 'transparent',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          width: '24px',
                          height: '24px',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        title="削除"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>

          {/* モバイル用カード表示 */}
          <div className="mobile-cards">
            {tasks.map((item, index) => {
              const dataType = getTaskDataType(item)
              const subTasks = shoppingSubTasks?.[item.id] || []
              const hasSubTasks = subTasks.length > 0
              const isExpanded = expandedShoppingLists ? expandedShoppingLists[item.id] === true : false

              return (
                <div key={`mobile-${dataType}-${item.id}`} style={{
                  padding: '12px',
                  borderBottom: index < tasks.length - 1 ? '1px solid #f3f4f6' : 'none',
                  backgroundColor: item.completed ? '#f8f9fa' : 'white',
                  opacity: item.completed ? 0.6 : 1
                }}>
                  {/* 上段：完了・タイトル・操作 */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    {/* 完了チェック */}
                    <button
                      onClick={() => {
                        if (item.completed) {
                          unifiedTasks.uncompleteTask(item.id)
                        } else {
                          unifiedTasks.completeTask(item.id)
                        }
                      }}
                      style={{
                        width: '20px',
                        height: '20px',
                        border: `2px solid ${item.completed ? '#10b981' : '#d1d5db'}`,
                        borderRadius: '4px',
                        backgroundColor: item.completed ? '#10b981' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'white',
                        flexShrink: 0
                      }}
                    >
                      {item.completed ? '✓' : ''}
                    </button>

                    {/* タイトル */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        textDecoration: item.completed ? 'line-through' : 'none',
                        wordBreak: 'break-word',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap'
                      }}>
                        {item.title || '無題'}
                        {hasSubTasks && (
                          <span style={{
                            fontSize: '11px',
                            color: '#6b7280',
                            backgroundColor: '#f3f4f6',
                            padding: '2px 6px',
                            borderRadius: '10px'
                          }}>
                            🛒 {subTasks.filter(st => st.completed).length}/{subTasks.length}
                          </span>
                        )}
                      </div>
                      {item.memo && (
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginTop: '4px'
                        }}>
                          {item.memo}
                        </div>
                      )}
                    </div>

                    {/* 操作ボタン */}
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleEditTask(item)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => unifiedTasks.deleteTask(item.id)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* 下段：カテゴリ・期限・URL */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
                    {item.category && (
                      <span style={{
                        backgroundColor: '#f3f4f6',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        📁 {item.category}
                      </span>
                    )}
                    {item.due_date && item.due_date !== '2999-12-31' && (
                      <span style={{
                        backgroundColor: item.due_date < getTodayJST() ? '#fee2e2' : '#f3f4f6',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        color: item.due_date < getTodayJST() ? '#dc2626' : '#6b7280'
                      }}>
                        📅 {item.due_date}
                      </span>
                    )}
                    {item.urls && item.urls.length > 0 && (
                      <span style={{
                        backgroundColor: '#dbeafe',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        color: '#1e40af'
                      }}>
                        🌍 {item.urls.length}
                      </span>
                    )}
                  </div>

                  {/* 買い物リスト */}
                  {hasSubTasks && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        onClick={() => toggleShoppingList && toggleShoppingList(item.id)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          fontSize: '12px',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        {isExpanded ? '▼' : '▶'} 買い物リスト ({subTasks.filter(st => st.completed).length}/{subTasks.length})
                      </button>
                      {isExpanded && (
                        <div style={{ marginTop: '8px', paddingLeft: '8px' }}>
                          {subTasks.map(subTask => (
                            <div key={subTask.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 0',
                              fontSize: '13px'
                            }}>
                              <input
                                type="checkbox"
                                checked={subTask.completed}
                                onChange={() => toggleShoppingSubTask && toggleShoppingSubTask(item.id, subTask.id)}
                                style={{ width: '16px', height: '16px' }}
                              />
                              <span style={{
                                textDecoration: subTask.completed ? 'line-through' : 'none',
                                color: subTask.completed ? '#6b7280' : 'inherit',
                                flex: 1
                              }}>
                                {subTask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        </>
      )}

      {/* ファイル表示ポップアップ */}
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
            zIndex: 1000
          }}
          onClick={closeFilePopup}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '0',
              maxWidth: '95vw',
              maxHeight: '95vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1 }}>
              <button
                onClick={closeFilePopup}
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {selectedFile.file_type.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:${selectedFile.file_type};base64,${selectedFile.file_data}`}
                alt={selectedFile.file_name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                padding: '40px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  {selectedFile.file_type === 'application/pdf' ? '📄' : '📎'}
                </div>
                <a
                  href={`data:${selectedFile.file_type};base64,${selectedFile.file_data}`}
                  download={selectedFile.file_name}
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  ダウンロード
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}