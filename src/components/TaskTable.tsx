'use client'

import React, { useMemo, useState, useEffect, useCallback, memo } from 'react'
import type { TaskWithUrgency, Task, RecurringTask, SubTask } from '@/lib/db/schema'
import type { UnifiedTask } from '@/lib/types/unified-task'
import type { UnifiedRecurringTaskWithStatus } from '@/hooks/useUnifiedRecurringTasks'
import { PRIORITY_SCORES } from '@/lib/constants'
import { ImportanceDot } from '@/components/ImportanceDot'
import { TASK_CATEGORIES } from '@/lib/db/schema'
import { subTaskService } from '@/lib/db/supabase-subtasks'

interface TaskTableProps {
  tasks: TaskWithUrgency[]
  recurringTasks: UnifiedRecurringTaskWithStatus[]
  completedTasks?: TaskWithUrgency[]
  completedRecurringTasks?: UnifiedRecurringTaskWithStatus[]
  onComplete: (taskId: string) => void
  onRecurringComplete: (taskId: string) => void
  onEdit?: (task: Task) => void
  onEditRecurring?: (task: UnifiedTask) => void
  onUncomplete?: (taskId: string) => void
  onRecurringUncomplete?: (taskId: string) => void
  onDelete?: (taskId: string) => void
  onDeleteRecurring?: (taskId: string) => void
}

export function TaskTable({ tasks, recurringTasks, completedTasks = [], completedRecurringTasks = [], onComplete, onRecurringComplete, onEdit, onEditRecurring, onUncomplete, onRecurringUncomplete, onDelete, onDeleteRecurring }: TaskTableProps) {
  const [showFilePopup, setShowFilePopup] = useState(false)
  const [selectedFile, setSelectedFile] = useState<{ file_name: string; file_type: string; file_data: string } | null>(null)

  // 買い物リスト機能の状態
  const [subTasks, setSubTasks] = useState<{ [taskId: string]: SubTask[] }>({})
  const [showShoppingLists, setShowShoppingLists] = useState<{ [taskId: string]: boolean }>({})
  const [newItemInputs, setNewItemInputs] = useState<{ [taskId: string]: string }>({})
  const [editingSubTask, setEditingSubTask] = useState<{ taskId: string; subTaskId: string; title: string } | null>(null)

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

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'Overdue':
        return { backgroundColor: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }
      case 'Soon':
        return { backgroundColor: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }
      case 'Next7':
        return { backgroundColor: '#dbeafe', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }
      case 'Next30':
        return { backgroundColor: '#f0f9ff', color: '#0ea5e9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }
      default:
        return { backgroundColor: '#f9fafb', color: '#6b7280', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }
    }
  }



  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return '-'

    const date = new Date(dueDate + 'T00:00:00')
    return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
  }

  // 期日とタイプを統合した表示
  const getDateTypeDisplay = (item: { isRecurring?: boolean; type?: string; dueDate?: string }) => {
    if (item.isRecurring) {
      // 繰り返しタスクの場合はパターンを表示
      return item.type // 「毎日」「毎週金曜日」など
    } else {
      // 単発タスクの場合は期日を表示
      return item.dueDate ? formatDueDate(item.dueDate) : '今日'
    }
  }

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObject = new URL(url)
      // Only allow http and https protocols
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

  // 買い物リスト機能
  const loadSubTasks = useCallback(async () => {
    const shoppingTaskIds = [...tasks, ...completedTasks]
      .filter(taskWithUrgency => taskWithUrgency.task.category === TASK_CATEGORIES.SHOPPING)
      .map(taskWithUrgency => taskWithUrgency.task.id)

    const newSubTasks: { [taskId: string]: SubTask[] } = {}

    for (const taskId of shoppingTaskIds) {
      try {
        const taskSubTasks = await subTaskService.getSubTasksByParentId(taskId)
        newSubTasks[taskId] = taskSubTasks.sort((a, b) => a.sort_order - b.sort_order)
      } catch (error) {
        console.error('Failed to load subtasks for task:', taskId, error)
      }
    }

    setSubTasks(newSubTasks)
  }, [tasks, completedTasks])

  useEffect(() => {
    loadSubTasks()
  }, [loadSubTasks])

  const toggleShoppingList = (taskId: string) => {
    setShowShoppingLists(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
  }

  const handleToggleSubTask = async (subTaskId: string, taskId: string) => {
    try {
      await subTaskService.toggleSubTaskCompletion(subTaskId)
      await loadSubTasks()
    } catch (error) {
      console.error('Failed to toggle subtask:', error)
    }
  }

  const handleDeleteSubTask = async (subTaskId: string, taskId: string) => {
    try {
      await subTaskService.deleteSubTask(subTaskId)
      await loadSubTasks()
    } catch (error) {
      console.error('Failed to delete subtask:', error)
    }
  }

  const handleAddSubTask = async (taskId: string) => {
    const newItemText = newItemInputs[taskId]?.trim()
    if (!newItemText) return

    try {
      const existingSubTasks = subTasks[taskId] || []
      const nextSortOrder = existingSubTasks.length

      await subTaskService.createSubTask(taskId, newItemText, nextSortOrder)

      setNewItemInputs(prev => ({
        ...prev,
        [taskId]: ''
      }))

      await loadSubTasks()
    } catch (error) {
      console.error('Failed to add subtask:', error)
    }
  }

  const handleInputChange = (taskId: string, value: string) => {
    setNewItemInputs(prev => ({
      ...prev,
      [taskId]: value
    }))
  }

  const handleStartEditSubTask = (taskId: string, subTaskId: string, title: string) => {
    setEditingSubTask({ taskId, subTaskId, title })
  }

  const handleCancelEditSubTask = () => {
    setEditingSubTask(null)
  }

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

  const handleEditInputChange = (value: string) => {
    if (!editingSubTask) return
    setEditingSubTask({ ...editingSubTask, title: value })
  }

  // Combine and sort all tasks - memoized for performance
  const activeItems = useMemo(() => [
    ...tasks.map(item => ({
      id: item.task.id,
      title: item.task.title,
      memo: item.task.memo,
      dueDate: item.task.due_date,
      category: item.task.category,
      importance: item.task.importance,
      urls: item.task.urls,
      type: '単発' as const,
      urgency: item.urgency,
      days: item.days_from_today,
      isRecurring: false,
      isCompleted: false,
      task: item.task,
      recurringTask: null as UnifiedRecurringTaskWithStatus | null
    })),
    ...recurringTasks.filter(item => item.task).map(item => ({
      id: item.task.id,
      title: item.task.title,
      memo: item.task.memo,
      dueDate: undefined, // Recurring tasks don't have due dates
      category: item.task.category,
      importance: item.task.importance,
      urls: item.task.urls,
      type: item.displayName,
      urgency: 'Normal' as const, // Recurring tasks are normal priority by default
      days: 0, // Today
      isRecurring: true,
      isCompleted: false,
      task: null, // Properly handle null task for recurring items
      recurringTask: item
    }))
  ].sort((a, b) => {
    // Swingdo風インテリジェント優先順位ソート
    // 1. 繰り返しタスク優先
    if (a.isRecurring && !b.isRecurring) return -1
    if (!a.isRecurring && b.isRecurring) return 1
    
    if (!a.isRecurring && !b.isRecurring) {
      // 2. 期限切れ・重要度の複合スコア算出
      const getSmartPriorityScore = (item: { urgency?: string; importance?: number | null; days?: number }) => {
        // 緊急度ベーススコア（高いほど優先）
        const urgencyScore = PRIORITY_SCORES.URGENCY[item.urgency as keyof typeof PRIORITY_SCORES.URGENCY] || PRIORITY_SCORES.URGENCY.NORMAL
        
        // 重要度ボーナス（1-5 → 0-40点）
        const importanceBonus = (item.importance || 1) * PRIORITY_SCORES.IMPORTANCE_MULTIPLIER
        
        // 締切近接度ボーナス（日数が少ないほど高スコア）
        const daysBonus = Math.max(0, PRIORITY_SCORES.MAX_DAYS_BONUS - Math.abs(item.days || 0)) / PRIORITY_SCORES.DAYS_BONUS_DIVISOR
        
        return urgencyScore + importanceBonus + daysBonus
      }
      
      const scoreA = getSmartPriorityScore(a)
      const scoreB = getSmartPriorityScore(b)
      
      // 3. スコア順にソート（降順）
      if (scoreA !== scoreB) return scoreB - scoreA
      
      // 4. 同スコアなら期日順
      return a.days - b.days
    }
    
    return 0
  }), [tasks, recurringTasks])

  // 緊急度に応じた行の背景色を取得
  const getUrgencyRowColor = (urgency: string, isCompleted: boolean, isRecurring: boolean = false) => {
    if (isCompleted) return '#f9fafb' // 完了済みは薄いグレー
    if (isRecurring) return '#f0fdf4' // 繰り返しタスクは薄い緑

    switch (urgency) {
      case 'Overdue':
        return '#fef2f2' // 薄い赤 - 期限切れ
      case 'Soon':
        return '#fef3c7' // 薄い黄 - まもなく期限
      case 'Next7':
        return '#eff6ff' // 薄い青 - 今日すべき作業
      case 'Next30':
        return '#f0f9ff' // より薄い青
      default:
        return 'transparent' // 通常は背景色なし
    }
  }

  const completedItems = useMemo(() => [
    ...completedTasks.map(item => ({
      id: item.task.id,
      title: item.task.title,
      memo: item.task.memo,
      dueDate: item.task.due_date,
      category: item.task.category,
      importance: item.task.importance,
      urls: item.task.urls,
      type: '単発' as const,
      urgency: item.urgency,
      days: item.days_from_today,
      isRecurring: false,
      isCompleted: true,
      task: item.task,
      recurringTask: null as UnifiedRecurringTaskWithStatus | null
    })),
    ...completedRecurringTasks.filter(item => item.task).map(item => ({
      id: item.task.id,
      title: item.task.title,
      memo: item.task.memo,
      dueDate: undefined, // Recurring tasks don't have due dates
      category: item.task.category,
      importance: item.task.importance,
      urls: item.task.urls,
      type: item.displayName,
      urgency: 'Normal' as const, // Recurring tasks are normal priority by default
      days: 0, // Today
      isRecurring: true,
      isCompleted: true,
      task: null, // Properly handle null task for completed recurring items
      recurringTask: item
    }))
  ], [completedTasks, completedRecurringTasks])

  const allItems = useMemo(() => [...activeItems, ...completedItems], [activeItems, completedItems])

  if (allItems.length === 0) {
    return (
      <div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>✓</th>
              <th style={{ padding: '2px 4px', textAlign: 'left', fontSize: '11px' }}>タイトル</th>
              <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>🌍</th>
              <th style={{ padding: '2px 4px', textAlign: 'left', width: '100px', fontSize: '11px', display: 'none' }} className="date-type-desktop-only">期日/タイプ</th>
              <th style={{ padding: '2px 4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: '1px solid #e5e7eb' }}>
              <td colSpan={4} className="mobile-colspan" style={{
                padding: '16px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                今日のタスクはありません
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>✓</th>
            <th style={{ padding: '2px 4px', textAlign: 'left', fontSize: '11px' }}>タイトル</th>
            <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>🌍</th>
            <th style={{ padding: '2px 4px', textAlign: 'left', width: '100px', fontSize: '11px', display: 'none' }} className="date-type-desktop-only">期日/タイプ</th>
            <th style={{ padding: '2px 4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {allItems.map((item, index) => (
            <React.Fragment key={`${item.isRecurring ? 'recurring' : 'task'}-${item.id}`}>
              <tr
                style={{
                  borderTop: index > 0 ? '1px solid #e5e7eb' : 'none',
                  height: '28px',
                  opacity: item.isCompleted ? 0.6 : 1,
                  backgroundColor: getUrgencyRowColor(item.urgency, item.isCompleted, item.isRecurring),
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!item.isCompleted) {
                    // ホバー時は元の色より少し濃くする
                    const baseColor = getUrgencyRowColor(item.urgency, false, item.isRecurring)
                    if (baseColor === 'transparent') {
                      e.currentTarget.style.backgroundColor = '#f8fafc'
                    } else {
                      e.currentTarget.style.backgroundColor = baseColor
                      e.currentTarget.style.filter = 'brightness(0.95)'
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.isCompleted) {
                    e.currentTarget.style.backgroundColor = getUrgencyRowColor(item.urgency, false, item.isRecurring)
                    e.currentTarget.style.filter = 'none'
                  }
                }}
              >
              <td style={{ padding: '2px', textAlign: 'center' }}>
                <button
                  onClick={() => {
                    if (item.isCompleted) {
                      // チェック解除
                      if (item.isRecurring && onRecurringUncomplete) {
                        onRecurringUncomplete(item.id)
                      } else if (!item.isRecurring && onUncomplete) {
                        onUncomplete(item.id)
                      }
                    } else {
                      // チェック
                      if (item.isRecurring) {
                        onRecurringComplete(item.id)
                      } else {
                        onComplete(item.id)
                      }
                    }
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
                  onMouseEnter={(e) => {
                    if (item.isCompleted) {
                      e.currentTarget.style.borderColor = '#ef4444'
                      e.currentTarget.style.backgroundColor = '#fef2f2'
                      e.currentTarget.style.color = '#ef4444'
                    } else {
                      e.currentTarget.style.borderColor = '#3b82f6'
                      e.currentTarget.style.backgroundColor = '#eff6ff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (item.isCompleted) {
                      e.currentTarget.style.borderColor = '#10b981'
                      e.currentTarget.style.backgroundColor = '#10b981'
                      e.currentTarget.style.color = 'white'
                    } else {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
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
                  <ImportanceDot importance={item.importance || undefined} size={10} showTooltip />
                  <span className="task-title" style={{ fontWeight: '500' }}>
                    {item.title}
                  </span>
                  {(() => {
                    const attachment = item.task?.attachment || item.recurringTask?.task?.attachment;
                    return attachment && renderFileIcon(attachment);
                  })()}

                  {/* 買い物カテゴリーの場合は買い物リストの件数を表示 */}
                  {item.category === TASK_CATEGORIES.SHOPPING ? (
                    <span
                      onClick={() => toggleShoppingList(item.id)}
                      style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      タスク（{subTasks[item.id]?.length || 0}件）
                    </span>
                  ) : (
                    /* 通常のタスクはメモを表示 */
                    item.memo && (
                      <span style={{
                        color: '#6b7280',
                        fontSize: '13px',
                        display: 'none'
                      }}
                      className="memo-desktop-only">
                        - {item.memo}
                      </span>
                    )
                  )}
                </div>
              </td>
              <td style={{ padding: '2px', textAlign: 'center' }}>
                {renderUrlIcon(item.urls || undefined)}
              </td>
              <td style={{ padding: '2px 4px', fontSize: '13px', display: 'none' }} className="date-type-desktop-only">
                {getDateTypeDisplay(item)}
              </td>
              <td style={{ padding: '2px' }}>
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}>
                  {/* 編集ボタン（アイコン） */}
                  {item.isRecurring && item.recurringTask && onEditRecurring ? (
                    <button
                      onClick={() => item.recurringTask && onEditRecurring(item.recurringTask.task)}
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
                        e.currentTarget.style.color = '#059669'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#6b7280'
                      }}
                      title="繰り返しタスクを編集"
                    >
                      ✏️
                    </button>
                  ) : item.task && onEdit && (
                    <button
                      onClick={() => onEdit(item.task)}
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
                  )}

                  {/* 削除ボタン（ゴミ箱アイコン） */}
                  {item.isRecurring && item.recurringTask && onDeleteRecurring ? (
                    <button
                      onClick={() => {
                        if (confirm('この繰り返しタスクを削除しますか？')) {
                          onDeleteRecurring(item.id)
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
                      title="繰り返しタスクを削除"
                    >
                      🗑️
                    </button>
                  ) : item.task && onDelete && (
                    <button
                      onClick={() => {
                        if (confirm('このタスクを削除しますか？')) {
                          onDelete(item.id)
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
                  )}

                  {/* 状態表示 */}
                  {item.isCompleted ? (
                    <span style={{ fontSize: '12px', color: '#10b981' }}>完了済み</span>
                  ) : !item.isRecurring && (
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>-</span>
                  )}
                </div>
              </td>
            </tr>

            {/* 買い物リスト表示行 */}
            {item.category === TASK_CATEGORIES.SHOPPING && showShoppingLists[item.id] && (
              <tr style={{ backgroundColor: '#f8fffe' }}>
                <td colSpan={5} style={{ padding: '8px 16px' }}>
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
                                  value={editingSubTask.title}
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
                  padding: '4px',
                  minWidth: '32px',
                  minHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                ×
              </button>
            </div>

            {/* ファイル内容表示 */}
            {selectedFile.file_type.startsWith('image/') ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px',
                maxHeight: 'calc(95vh - 80px)',
                overflow: 'hidden'
              }}>
                <img
                  src={`data:${selectedFile.file_type};base64,${selectedFile.file_data}`}
                  alt={selectedFile.file_name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    height: 'auto',
                    width: 'auto',
                    borderRadius: '4px',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </div>
            ) : selectedFile.file_type === 'application/pdf' ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                  PDFファイルはブラウザで開くことができます
                </p>
                <a
                  href={`data:${selectedFile.file_type};base64,${selectedFile.file_data}`}
                  download={selectedFile.file_name}
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  ダウンロード
                </a>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📎</div>
                <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                  このファイルはプレビューできません
                </p>
                <a
                  href={`data:${selectedFile.file_type};base64,${selectedFile.file_data}`}
                  download={selectedFile.file_name}
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '14px'
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

export default memo(TaskTable)