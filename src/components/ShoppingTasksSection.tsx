'use client'

import { useTasks } from '@/hooks/useTasks'
import { useDatabase } from '@/hooks/useDatabase'
import { TASK_CATEGORIES } from '@/lib/db/schema'
import { subTaskService } from '@/lib/db/supabase-subtasks'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { SubTask, Task } from '@/lib/db/schema'
import { getTodayJST, getTomorrowJST, getDaysFromToday, getUrgencyLevel } from '@/lib/utils/date-jst'
import { ImportanceDot } from '@/components/ImportanceDot'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'

interface ShoppingTasksSectionProps {
  onEdit?: (taskId: string) => void
  onReorder?: (taskId: string, newOrderIndex: number) => void
  reorderedTasks?: {[key: string]: number}
}

interface SortableShoppingRowProps {
  item: { task: { id: string; title: string; category?: string; completed?: boolean; importance?: number; memo?: string; urls?: string[]; attachment?: { file_name: string; file_type: string; file_data: string } }; urgency: string; isCompleted?: boolean; importance?: number; title?: string; attachment?: { file_name: string; file_type: string; file_data: string }; urls?: string[]; dueDate?: string }
  index: number
  subTasks: { [taskId: string]: SubTask[] }
  showShoppingLists: { [taskId: string]: boolean }
  newItemInputs: { [taskId: string]: string }
  editingSubTask: { taskId: string; subTaskId: string; title: string } | null
  onCompleteTask: (taskId: string) => void
  onEdit: (taskId: string) => void
  onDelete: (taskId: string) => void
  onToggleShoppingList: (taskId: string) => void
  onToggleSubTask: (subTaskId: string, taskId: string) => void
  onDeleteSubTask: (subTaskId: string, taskId: string) => void
  onAddSubTask: (taskId: string) => void
  onInputChange: (taskId: string, value: string) => void
  onStartEditSubTask: (taskId: string, subTaskId: string, title: string) => void
  onCancelEditSubTask: () => void
  onSaveEditSubTask: () => void
  onEditInputChange: (value: string) => void
  renderFileIcon: (attachment?: { file_name: string; file_type: string; file_data: string }) => React.ReactNode
  renderUrlIcon: (urls?: string[]) => React.ReactNode
  formatDueDate: (dueDate?: string) => string
}

function SortableShoppingRow({
  item,
  index,
  subTasks,
  showShoppingLists,
  newItemInputs,
  editingSubTask,
  onCompleteTask,
  onEdit,
  onDelete,
  onToggleShoppingList,
  onToggleSubTask,
  onDeleteSubTask,
  onAddSubTask,
  onInputChange,
  onStartEditSubTask,
  onCancelEditSubTask,
  onSaveEditSubTask,
  onEditInputChange,
  renderFileIcon,
  renderUrlIcon,
  formatDueDate
}: SortableShoppingRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <React.Fragment>
      <tr
        ref={setNodeRef}
        style={{
          ...style,
          borderTop: index > 0 ? '1px solid #e5e7eb' : 'none',
          height: '28px',
          opacity: item.isCompleted ? 0.6 : 1,
          backgroundColor: isDragging ? '#f1f5f9' : '#f0fdf4', // 買い物タスクは薄い緑
          transition: 'background-color 0.15s ease'
        }}
        {...attributes}
        {...listeners}
        onMouseEnter={(e) => {
          if (!item.isCompleted && !isDragging) {
            e.currentTarget.style.backgroundColor = '#dcfce7'
            e.currentTarget.style.filter = 'brightness(0.95)'
          }
        }}
        onMouseLeave={(e) => {
          if (!item.isCompleted && !isDragging) {
            e.currentTarget.style.backgroundColor = '#f0fdf4'
            e.currentTarget.style.filter = 'none'
          }
        }}
      >
        <td style={{ padding: '2px', textAlign: 'center' }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCompleteTask(item.task.id)
            }}
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
          >
            {item.isCompleted && '✓'}
          </button>
        </td>
        <td style={{ padding: '2px 4px' }}>
          <div className="task-content" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            lineHeight: '1.2',
            textDecoration: item.isCompleted ? 'line-through' : 'none',
            color: item.isCompleted ? '#9ca3af' : 'inherit'
          }}>
            <ImportanceDot importance={item.task.importance} size={10} showTooltip />
            <span className="task-title" style={{ fontWeight: '500' }}>
              {item.task.title}
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation()
                onToggleShoppingList(item.task.id)
              }}
              style={{
                fontSize: '12px',
                color: '#6b7280',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              タスク（{subTasks[item.task.id]?.length || 0}件）
            </span>
            {item.task.memo && (
              <span style={{
                color: '#6b7280',
                fontSize: '13px',
                display: 'none'
              }}
              className="memo-desktop-only">
                - {item.task.memo}
              </span>
            )}
          </div>
        </td>
        <td style={{ padding: '2px', textAlign: 'center' }}>
          {renderFileIcon(item.task.attachment)}
        </td>
        <td style={{ padding: '2px', textAlign: 'center' }}>
          {renderUrlIcon(item.task.urls)}
        </td>
        <td style={{ padding: '2px 4px', fontSize: '13px', display: 'none' }} className="date-type-desktop-only">
          {formatDueDate(item.dueDate)}
        </td>
        <td style={{ padding: '2px' }}>
          <div style={{
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(item.task.id)
              }}
              style={{
                padding: '4px',
                fontSize: '14px',
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
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.color = '#3b82f6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#6b7280'
              }}
              title="タスクを編集"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('このタスクを削除しますか？')) {
                  onDelete(item.task.id)
                }
              }}
              style={{
                padding: '4px',
                fontSize: '14px',
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
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2'
                e.currentTarget.style.color = '#ef4444'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#6b7280'
              }}
              title="タスクを削除"
            >
              🗑️
            </button>
          </div>
        </td>
      </tr>

      {/* 買い物リスト表示行 */}
      {showShoppingLists[item.task.id] && (
        <tr style={{ backgroundColor: '#f8fffe' }}>
          <td colSpan={6} style={{ padding: '8px 16px' }}>
            <div style={{ marginLeft: '24px' }}>
              {/* 既存のサブタスク */}
              {subTasks[item.task.id] && subTasks[item.task.id].length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  {subTasks[item.task.id].map((subTask) => (
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
                        onChange={() => onToggleSubTask(subTask.id, item.task.id)}
                        style={{ cursor: 'pointer' }}
                      />

                      {editingSubTask?.subTaskId === subTask.id ? (
                        // 編集モード
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                          <input
                            type="text"
                            value={editingSubTask.title}
                            onChange={(e) => onEditInputChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                onSaveEditSubTask()
                              } else if (e.key === 'Escape') {
                                onCancelEditSubTask()
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
                            onClick={onSaveEditSubTask}
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
                            onClick={onCancelEditSubTask}
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
                            onClick={() => onStartEditSubTask(item.task.id, subTask.id, subTask.title)}
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
                            onClick={() => onDeleteSubTask(subTask.id, item.task.id)}
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
                  value={newItemInputs[item.task.id] || ''}
                  onChange={(e) => onInputChange(item.task.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onAddSubTask(item.task.id)
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
                  onClick={() => onAddSubTask(item.task.id)}
                  disabled={!newItemInputs[item.task.id]?.trim()}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: newItemInputs[item.task.id]?.trim() ? '#10b981' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: newItemInputs[item.task.id]?.trim() ? 'pointer' : 'not-allowed'
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
  )
}

export function ShoppingTasksSection({ onEdit, onReorder, reorderedTasks = {} }: ShoppingTasksSectionProps) {
  const { isInitialized } = useDatabase()
  const { getTodayTasks, getUpcomingTasks, completeTask, updateTask, deleteTask, createTask, allTasks } = useTasks(isInitialized)
  const [subTasks, setSubTasks] = useState<{ [taskId: string]: SubTask[] }>({})
  const [showShoppingLists, setShowShoppingLists] = useState<{ [taskId: string]: boolean }>({})
  const [newItemInputs, setNewItemInputs] = useState<{ [taskId: string]: string }>({})
  const [editingSubTask, setEditingSubTask] = useState<{ taskId: string; subTaskId: string; title: string } | null>(null)
  const [showFilePopup, setShowFilePopup] = useState(false)
  const [selectedFile, setSelectedFile] = useState<{ file_name: string; file_type: string; file_data: string } | null>(null)

  // ドラッグ&ドロップのセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  // 買い物カテゴリーの今日以降のタスクを取得
  const getShoppingTasks = useCallback(() => {
    if (!isInitialized) return []

    const today = getTodayJST()

    // 今日以降の未完了タスクを取得
    const allUpcomingTasks = allTasks
      .filter(task =>
        !task.completed &&
        !task.archived &&
        (!task.snoozed_until || task.snoozed_until <= today) &&
        task.due_date &&
        getDaysFromToday(task.due_date) >= 0
      )
      .map(task => {
        const days_from_today = getDaysFromToday(task.due_date!)
        const urgency = getUrgencyLevel(task.due_date!)

        return {
          task,
          urgency,
          days_from_today
        }
      })
      .sort((a, b) => a.days_from_today - b.days_from_today)

    // 期日なしの未完了タスクも取得
    const noDueDateTasks = allTasks
      .filter(task =>
        !task.completed &&
        !task.archived &&
        (!task.snoozed_until || task.snoozed_until <= today) &&
        !task.due_date
      )
      .map(task => ({
        task,
        urgency: 'none' as const,
        days_from_today: 999 // 期日なしは最後に表示
      }))

    // 今日以降 + 期日なしの買い物カテゴリーのみフィルタ
    const allTasksWithUrgency = [...allUpcomingTasks, ...noDueDateTasks]
    return allTasksWithUrgency.filter(taskWithUrgency =>
      taskWithUrgency.task.category === TASK_CATEGORIES.SHOPPING
    )
  }, [isInitialized, allTasks])

  // サブタスクを読み込み
  const loadSubTasks = useCallback(async () => {
    if (!isInitialized) return

    const shoppingTasks = getShoppingTasks()
    const newSubTasks: { [taskId: string]: SubTask[] } = {}

    for (const taskWithUrgency of shoppingTasks) {
      const taskSubTasks = await subTaskService.getSubTasksByParentId(taskWithUrgency.task.id)
      newSubTasks[taskWithUrgency.task.id] = taskSubTasks.sort((a, b) => a.sort_order - b.sort_order)
    }

    setSubTasks(newSubTasks)
  }, [isInitialized, getShoppingTasks])

  useEffect(() => {
    loadSubTasks()
  }, [isInitialized])

  // サブタスクの完了状態を切り替え
  const handleToggleSubTask = async (subTaskId: string, taskId: string) => {
    try {
      await subTaskService.toggleSubTaskCompletion(subTaskId)
      await loadSubTasks()
    } catch (error) {
      console.error('Failed to toggle subtask:', error)
    }
  }

  // サブタスクを削除
  const handleDeleteSubTask = async (subTaskId: string, taskId: string) => {
    try {
      await subTaskService.deleteSubTask(subTaskId)
      await loadSubTasks()
    } catch (error) {
      console.error('Failed to delete subtask:', error)
    }
  }

  // サブタスクを追加
  const handleAddSubTask = async (taskId: string) => {
    const newItemText = newItemInputs[taskId]?.trim()
    if (!newItemText) return

    try {
      const existingSubTasks = subTasks[taskId] || []
      const nextSortOrder = existingSubTasks.length

      await subTaskService.createSubTask(taskId, newItemText, nextSortOrder)

      // 入力フィールドをクリア
      setNewItemInputs(prev => ({
        ...prev,
        [taskId]: ''
      }))

      await loadSubTasks()
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
      await subTaskService.updateSubTaskTitle(editingSubTask.subTaskId, editingSubTask.title)
      await loadSubTasks()
      setEditingSubTask(null)
    } catch (error) {
      console.error('Failed to update subtask:', error)
    }
  }

  // 編集中のサブタスクのタイトルを更新
  const handleEditInputChange = (value: string) => {
    if (!editingSubTask) return
    setEditingSubTask({ ...editingSubTask, title: value })
  }

  // タスク完了（未完了サブタスクの自動繰り越し付き）
  const handleCompleteTask = async (taskId: string) => {
    try {
      // 完了前に未完了のサブタスクを確認
      const taskSubTasks = subTasks[taskId] || []
      const incompleteSubTasks = taskSubTasks.filter(subTask => !subTask.completed)

      // メインタスクを完了
      await completeTask(taskId)

      // 未完了のサブタスクがあれば新しいタスクを作成（期日なし）
      if (incompleteSubTasks.length > 0) {
        // 元のタスク情報を取得
        const shoppingTasks = getShoppingTasks()
        const originalTask = shoppingTasks.find(t => t.task.id === taskId)

        if (originalTask) {
          // 新しいタスクのタイトル（残り分であることを示さない、同じタイトル）
          const newTitle = originalTask.task.title

          // 期日なし（null）で新しいタスクを作成
          const newTaskId = await createTask(
            newTitle,
            originalTask.task.memo,
            undefined, // 期日なしに変更
            TASK_CATEGORIES.SHOPPING,
            originalTask.task.importance,
            originalTask.task.duration_min,
            originalTask.task.urls
          )

          // 少し待ってから新しいタスクのIDを取得し、サブタスクを作成
          setTimeout(async () => {
            try {
              // タスクリストを再読み込みして新しいタスクのIDを取得
              // 期日なしのタスクを検索
              const allTasksList = allTasks
              const newTask = allTasksList.find(t =>
                t.title === newTitle &&
                t.due_date === null &&
                !t.completed &&
                t.category === TASK_CATEGORIES.SHOPPING &&
                t.created_at > new Date(Date.now() - 5000).toISOString() // 5秒以内に作成されたもの
              )

              if (newTask) {
                // 未完了だったサブタスクのみを新しいタスクに移行
                for (let i = 0; i < incompleteSubTasks.length; i++) {
                  await subTaskService.createSubTask(
                    newTask.id,
                    incompleteSubTasks[i].title,
                    i
                  )
                }
                console.log(`未完了のサブタスク ${incompleteSubTasks.length} 個を期日なしタスクに繰り越しました`)
              }
            } catch (error) {
              console.error('Failed to create subtasks for carry-over task:', error)
            }
          }, 200) // 200ms待機してからサブタスク作成
        }
      }

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
      attachment: taskWithUrgency.task.attachment
    }))

    // カスタム順序を適用：order_index、reorderedTasks、daysの順で優先
    return items.sort((a, b) => {
      // 1. order_indexがある場合はそれを最優先
      const aOrderIndex = a.task.order_index
      const bOrderIndex = b.task.order_index

      if (aOrderIndex !== undefined && bOrderIndex !== undefined) {
        if (aOrderIndex !== bOrderIndex) return aOrderIndex - bOrderIndex
      } else if (aOrderIndex !== undefined) {
        return -1 // aのみorder_indexがある場合は前に
      } else if (bOrderIndex !== undefined) {
        return 1 // bのみorder_indexがある場合は後に
      }

      // 2. reorderedTasksでの順序
      const aReorder = reorderedTasks[a.id]
      const bReorder = reorderedTasks[b.id]

      if (aReorder !== undefined && bReorder !== undefined) {
        if (aReorder !== bReorder) return aReorder - bReorder
      } else if (aReorder !== undefined) {
        return -1
      } else if (bReorder !== undefined) {
        return 1
      }

      // 3. 最後にdaysで並び順決定
      return a.days - b.days
    })
  }, [shoppingTasks, reorderedTasks])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    console.log('ShoppingTasks drag end:', { active: active.id, over: over?.id })

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = shoppingTableItems.findIndex(item => item.task.id === active.id)
    const newIndex = shoppingTableItems.findIndex(item => item.task.id === over.id)

    console.log('ShoppingTasks indices:', { oldIndex, newIndex })

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // 並び替えの実行（バックエンドへの通知）
    if (onReorder) {
      onReorder(active.id as string, newIndex)
    }
  }, [shoppingTableItems, onReorder])

  // 編集機能
  const handleEdit = (taskId: string) => {
    if (onEdit) {
      onEdit(taskId)
    } else {
      const task = shoppingTableItems.find((t: { task: { id: string } }) => t.task.id === taskId)
      console.log('編集:', task)
      alert(`タスクの編集機能は今日のページで利用できます`)
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
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
            <SortableContext
              items={shoppingTableItems.map(item => item.task.id)}
              strategy={verticalListSortingStrategy}
            >
              {shoppingTableItems.map((item, index) => (
                <SortableShoppingRow
                  key={item.task.id}
                  item={item}
                  index={index}
                  subTasks={subTasks}
                  showShoppingLists={showShoppingLists}
                  newItemInputs={newItemInputs}
                  editingSubTask={editingSubTask}
                  onCompleteTask={handleCompleteTask}
                  onEdit={handleEdit}
                  onDelete={deleteTask}
                  onToggleShoppingList={toggleShoppingList}
                  onToggleSubTask={handleToggleSubTask}
                  onDeleteSubTask={handleDeleteSubTask}
                  onAddSubTask={handleAddSubTask}
                  onInputChange={handleInputChange}
                  onStartEditSubTask={handleStartEditSubTask}
                  onCancelEditSubTask={handleCancelEditSubTask}
                  onSaveEditSubTask={handleSaveEditSubTask}
                  onEditInputChange={handleEditInputChange}
                  renderFileIcon={renderFileIcon}
                  renderUrlIcon={renderUrlIcon}
                  formatDueDate={formatDueDate}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>

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