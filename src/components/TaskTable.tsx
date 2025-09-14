'use client'

import { QuickMoves } from '@/lib/utils/date-jst'
import type { TaskWithUrgency, Task } from '@/lib/db/schema'
import type { RecurringTaskWithStatus } from '@/hooks/useRecurringTasks'
import { TASK_IMPORTANCE_LABELS } from '@/lib/db/schema'

interface TaskTableProps {
  tasks: TaskWithUrgency[]
  recurringTasks: RecurringTaskWithStatus[]
  completedTasks?: TaskWithUrgency[]
  completedRecurringTasks?: RecurringTaskWithStatus[]
  onComplete: (taskId: string) => void
  onRecurringComplete: (taskId: string) => void
  onQuickMove: (taskId: string, newDueDate: string) => void
  onEdit?: (task: Task) => void
}

export function TaskTable({ tasks, recurringTasks, completedTasks = [], completedRecurringTasks = [], onComplete, onRecurringComplete, onQuickMove, onEdit }: TaskTableProps) {
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

  // Swingdo風スマート優先度計算
  const getSmartPriority = (item: { isRecurring?: boolean; urgency?: string; importance?: number; days?: number }) => {
    if (item.isRecurring) return '習慣'
    
    const urgencyScores: Record<string, number> = {
      'Overdue': 100,
      'Soon': 80,
      'Next7': 60,
      'Next30': 40,
      'Normal': 20
    }
    const urgencyScore = urgencyScores[item.urgency || 'Normal'] || 20
    
    const importanceBonus = (item.importance || 1) * 8
    const daysBonus = Math.max(0, 30 - Math.abs(item.days || 0)) / 2
    const totalScore = urgencyScore + importanceBonus + daysBonus
    
    if (totalScore >= 120) return '最優先'
    if (totalScore >= 100) return '優先'
    if (totalScore >= 70) return '普通'
    return '低'
  }

  const getPriorityStyle = (priority: string) => {
    const styles = {
      '最優先': { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' },
      '優先': { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d' },
      '普通': { backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #7dd3fc' },
      '低': { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' },
      '習慣': { backgroundColor: '#f0fdf4', color: '#059669', border: '1px solid #86efac' }
    }
    return { 
      ...styles[priority as keyof typeof styles], 
      padding: '1px 4px', 
      borderRadius: '4px', 
      fontSize: '11px',
      fontWeight: '500',
      display: 'inline-block',
      minWidth: '36px',
      textAlign: 'center' as const
    }
  }

  const getImportanceStyle = (importance?: number) => {
    if (!importance) return { backgroundColor: '#f9fafb', color: '#6b7280', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }
    
    switch (importance) {
      case 5: // Very High
        return { backgroundColor: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }
      case 4: // High
        return { backgroundColor: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }
      case 3: // Medium
        return { backgroundColor: '#dbeafe', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }
      case 2: // Low
        return { backgroundColor: '#f0f9ff', color: '#0ea5e9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }
      case 1: // Very Low
        return { backgroundColor: '#f9fafb', color: '#9ca3af', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }
      default:
        return { backgroundColor: '#f9fafb', color: '#6b7280', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }
    }
  }

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return '-'
    
    const date = new Date(dueDate + 'T00:00:00')
    return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
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
          // Validate URLs before opening
          const validUrls = urls.filter(isValidUrl)
          if (validUrls.length === 0) {
            alert('有効なURLが見つかりませんでした。')
            return
          }
          
          const confirmMessage = `${validUrls.length}個の有効なURLを開きますか？`
          if (confirm(confirmMessage)) {
            validUrls.forEach(url => {
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

  // Combine and sort all tasks
  const activeItems = [
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
      category: undefined, // Recurring tasks don't have categories yet
      importance: undefined, // Recurring tasks don't have importance yet
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
        const score = 0
        
        // 緊急度ベーススコア（高いほど優先）
        const urgencyScores: Record<string, number> = {
          'Overdue': 100,    // 期限切れは最優先
          'Soon': 80,        // 近日中
          'Next7': 60,       // 1週間以内
          'Next30': 40,      // 1ヶ月以内
          'Normal': 20       // 通常
        }
        const urgencyScore = urgencyScores[item.urgency || 'Normal'] || 20
        
        // 重要度ボーナス（1-5 → 0-40点）
        const importanceBonus = (item.importance || 1) * 8
        
        // 締切近接度ボーナス（日数が少ないほど高スコア）
        const daysBonus = Math.max(0, 30 - Math.abs(item.days || 0)) / 2
        
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
  })

  const completedItems = [
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
      category: undefined, // Recurring tasks don't have categories yet
      importance: undefined, // Recurring tasks don't have importance yet
      urls: item.task.urls,
      type: item.displayName,
      urgency: 'Normal' as const, // Recurring tasks are normal priority by default
      days: 0, // Today
      isRecurring: true,
      isCompleted: true,
      task: null, // Properly handle null task for completed recurring items
      recurringTask: item
    }))
  ]

  const allItems = [...activeItems, ...completedItems]

  if (allItems.length === 0) {
    return (
      <div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>✓</th>
              <th style={{ padding: '4px', textAlign: 'left', fontSize: '11px' }}>タイトル</th>
              <th style={{ padding: '4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>🌍</th>
              <th style={{ padding: '4px', textAlign: 'left', width: '80px', fontSize: '11px' }}>期日</th>
              <th style={{ padding: '4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>タイプ</th>
              <th style={{ padding: '4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>カテゴリ</th>
              <th style={{ padding: '4px', textAlign: 'left', width: '70px', fontSize: '11px' }}>緊急度</th>
              <th style={{ padding: '4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>重要度</th>
              <th style={{ padding: '4px', textAlign: 'left', width: '50px', fontSize: '11px' }}>優先度</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: '1px solid #e5e7eb' }}>
              <td colSpan={8} style={{ 
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
            <th style={{ padding: '4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>✓</th>
            <th style={{ padding: '4px', textAlign: 'left', fontSize: '11px' }}>タイトル</th>
            <th style={{ padding: '4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>🌍</th>
            <th style={{ padding: '4px', textAlign: 'left', width: '80px', fontSize: '11px' }}>期日</th>
            <th style={{ padding: '4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>タイプ</th>
            <th style={{ padding: '4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>カテゴリ</th>
            <th style={{ padding: '4px', textAlign: 'left', width: '70px', fontSize: '11px' }}>緊急度</th>
            <th style={{ padding: '4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>重要度</th>
            <th style={{ padding: '4px', textAlign: 'left', width: '50px', fontSize: '11px' }}>優先度</th>
            <th style={{ padding: '4px', textAlign: 'left', width: '120px', fontSize: '11px' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {allItems.map((item, index) => (
            <tr
              key={`${item.isRecurring ? 'recurring' : 'task'}-${item.id}`} 
              style={{ 
                borderTop: index > 0 ? '1px solid #e5e7eb' : 'none',
                minHeight: '32px',
                opacity: item.isCompleted ? 0.6 : 1,
                backgroundColor: item.isCompleted ? '#f9fafb' : 'transparent',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!item.isCompleted) {
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                }
              }}
              onMouseLeave={(e) => {
                if (!item.isCompleted) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <td style={{ padding: '4px', textAlign: 'center' }}>
                <button
                  onClick={() => {
                    if (!item.isCompleted) {
                      if (item.isRecurring) {
                        onRecurringComplete(item.id)
                      } else {
                        onComplete(item.id)
                      }
                    }
                  }}
                  disabled={item.isCompleted}
                  style={{
                    width: '20px',
                    height: '20px',
                    border: item.isCompleted ? '2px solid #10b981' : '2px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: item.isCompleted ? '#10b981' : 'transparent',
                    cursor: item.isCompleted ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!item.isCompleted) {
                      e.currentTarget.style.borderColor = '#3b82f6'
                      e.currentTarget.style.backgroundColor = '#eff6ff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.isCompleted) {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {item.isCompleted && '✓'}
                </button>
              </td>
              <td style={{ padding: '4px' }}>
                <div style={{ 
                  fontWeight: '500', 
                  textDecoration: item.isCompleted ? 'line-through' : 'none',
                  color: item.isCompleted ? '#9ca3af' : 'inherit'
                }}>
                  {item.title}
                </div>
                {item.memo && (
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#6b7280', 
                    marginTop: '2px',
                    textDecoration: item.isCompleted ? 'line-through' : 'none'
                  }}>
                    {item.memo}
                  </div>
                )}
              </td>
              <td style={{ padding: '4px', textAlign: 'center' }}>
                {renderUrlIcon(item.urls)}
              </td>
              <td style={{ padding: '4px' }}>
                {item.isRecurring ? '今日' : formatDueDate(item.dueDate)}
              </td>
              <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                {item.type}
              </td>
              <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                {item.category || '-'}
              </td>
              <td style={{ padding: '4px' }}>
                <span style={getUrgencyStyle(item.urgency)}>
                  {item.urgency}
                </span>
              </td>
              <td style={{ padding: '4px' }}>
                <span style={getImportanceStyle(item.importance)}>
                  {item.importance ? TASK_IMPORTANCE_LABELS[item.importance] || '-' : '-'}
                </span>
              </td>
              <td style={{ padding: '4px' }}>
                <span style={getPriorityStyle(getSmartPriority(item))}>
                  {getSmartPriority(item)}
                </span>
              </td>
              <td style={{ padding: '4px' }}>
                {item.isCompleted ? (
                  <span style={{ fontSize: '12px', color: '#10b981' }}>完了済み</span>
                ) : item.isRecurring ? (
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>繰り返し</span>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    gap: '4px', 
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    <a
                      href="/manage"
                      style={{
                        padding: '3px 8px',
                        fontSize: '16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        backgroundColor: 'white',
                        color: '#6b7280',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        display: 'inline-block',
                        lineHeight: '1'
                      }}
                      title="管理ページで編集"
                    >
                      …
                    </a>
                    <button
                      onClick={() => onQuickMove(item.id, QuickMoves.tomorrow())}
                      style={{
                        padding: '3px 6px',
                        fontSize: '11px',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        backgroundColor: '#fff',
                        color: '#374151',
                        cursor: 'pointer',
                        minWidth: '32px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6'
                        e.currentTarget.style.borderColor = '#9ca3af'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                      title="明日に移動"
                    >
                      明日
                    </button>
                    <button
                      onClick={() => onQuickMove(item.id, QuickMoves.plus3Days())}
                      style={{
                        padding: '3px 6px',
                        fontSize: '11px',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        backgroundColor: '#fff',
                        color: '#374151',
                        cursor: 'pointer',
                        minWidth: '36px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6'
                        e.currentTarget.style.borderColor = '#9ca3af'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                      title="3日後に移動"
                    >
                      +3日
                    </button>
                    <button
                      onClick={() => onQuickMove(item.id, QuickMoves.endOfMonth())}
                      style={{
                        padding: '3px 6px',
                        fontSize: '11px',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        backgroundColor: '#fff',
                        color: '#374151',
                        cursor: 'pointer',
                        minWidth: '42px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6'
                        e.currentTarget.style.borderColor = '#9ca3af'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                      title="今月末に移動"
                    >
                      月末
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}