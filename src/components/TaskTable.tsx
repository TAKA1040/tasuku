'use client'

import { useMemo } from 'react'
import type { TaskWithUrgency, Task, RecurringTask } from '@/lib/db/schema'
import type { RecurringTaskWithStatus } from '@/hooks/useRecurringTasks'
import { PRIORITY_SCORES } from '@/lib/constants'
import { ImportanceDot } from '@/components/ImportanceDot'

interface TaskTableProps {
  tasks: TaskWithUrgency[]
  recurringTasks: RecurringTaskWithStatus[]
  completedTasks?: TaskWithUrgency[]
  completedRecurringTasks?: RecurringTaskWithStatus[]
  onComplete: (taskId: string) => void
  onRecurringComplete: (taskId: string) => void
  onEdit?: (task: Task) => void
  onEditRecurring?: (task: RecurringTask) => void
  onUncomplete?: (taskId: string) => void
  onRecurringUncomplete?: (taskId: string) => void
  onDelete?: (taskId: string) => void
  onDeleteRecurring?: (taskId: string) => void
}

export function TaskTable({ tasks, recurringTasks, completedTasks = [], completedRecurringTasks = [], onComplete, onRecurringComplete, onEdit, onEditRecurring, onUncomplete, onRecurringUncomplete, onDelete, onDeleteRecurring }: TaskTableProps) {
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
          console.log('All URLs:', urls)

          // Validate URLs before opening
          const validUrls = urls.filter(isValidUrl)
          const invalidUrls = urls.filter(url => !isValidUrl(url))

          console.log('Valid URLs:', validUrls)
          console.log('Invalid URLs:', invalidUrls)

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
            console.log('Opening URLs:', validUrls)
            validUrls.forEach((url, index) => {
              console.log(`Opening URL ${index + 1}:`, url)
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
      recurringTask: null as RecurringTaskWithStatus | null
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
      const getSmartPriorityScore = (item: { urgency?: string; importance?: number; days?: number }) => {
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
      recurringTask: null as RecurringTaskWithStatus | null
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
            <tr
              key={`${item.isRecurring ? 'recurring' : 'task'}-${item.id}`}
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
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  lineHeight: '1.2',
                  textDecoration: item.isCompleted ? 'line-through' : 'none',
                  color: item.isCompleted ? '#9ca3af' : 'inherit'
                }}>
                  <ImportanceDot importance={item.importance} size={10} showTooltip />
                  <span style={{ fontWeight: '500' }}>
                    {item.title}
                  </span>
                  {item.memo && (
                    <span style={{
                      color: '#6b7280',
                      fontSize: '13px',
                      display: 'none'
                    }}
                    className="memo-desktop-only">
                      - {item.memo}
                    </span>
                  )}
                </div>
              </td>
              <td style={{ padding: '2px', textAlign: 'center' }}>
                {renderUrlIcon(item.urls)}
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
                  {(() => {
                    if (item.isRecurring) {
                      console.log('繰り返しタスクの削除ボタン表示判定:', {
                        itemId: item.id,
                        title: item.title,
                        isRecurring: item.isRecurring,
                        hasRecurringTask: !!item.recurringTask,
                        hasOnDeleteRecurring: !!onDeleteRecurring
                      })
                    } else {
                      console.log('通常タスクの削除ボタン表示判定:', {
                        itemId: item.id,
                        title: item.title,
                        hasTask: !!item.task,
                        hasOnDelete: !!onDelete
                      })
                    }
                    return null
                  })()}
                  {item.isRecurring && item.recurringTask && onDeleteRecurring ? (
                    <button
                      onClick={() => {
                        console.log('繰り返しタスク削除ボタンがクリックされました:', item.id, item.title)
                        if (confirm('この繰り返しタスクを削除しますか？')) {
                          console.log('繰り返しタスクの削除が確認されました:', item.id)
                          onDeleteRecurring(item.id)
                        } else {
                          console.log('繰り返しタスクの削除がキャンセルされました:', item.id)
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
                        console.log('削除ボタンがクリックされました:', item.id, item.title)
                        if (confirm('このタスクを削除しますか？')) {
                          console.log('削除が確認されました:', item.id)
                          onDelete(item.id)
                        } else {
                          console.log('削除がキャンセルされました:', item.id)
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
          ))}
        </tbody>
      </table>
    </div>
  )
}