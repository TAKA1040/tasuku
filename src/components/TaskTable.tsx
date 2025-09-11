'use client'

import { QuickMoves } from '@/lib/utils/date-jst'
import type { TaskWithUrgency } from '@/lib/db/schema'
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
  onEdit?: (task: any) => void
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

  // Combine and sort all tasks
  const activeItems = [
    ...tasks.map(item => ({
      id: item.task.id,
      title: item.task.title,
      memo: item.task.memo,
      dueDate: item.task.due_date,
      category: item.task.category,
      importance: item.task.importance,
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
      type: item.displayName,
      urgency: 'Normal' as const, // Recurring tasks are normal priority by default
      days: 0, // Today
      isRecurring: true,
      isCompleted: false,
      task: null as any,
      recurringTask: item
    }))
  ].sort((a, b) => {
    // Sort: recurring tasks first (today), then by urgency, then by days
    if (a.isRecurring && !b.isRecurring) return -1
    if (!a.isRecurring && b.isRecurring) return 1
    
    if (!a.isRecurring && !b.isRecurring) {
      const urgencyOrder = ['Overdue', 'Soon', 'Next7', 'Next30', 'Normal']
      const urgencyDiff = urgencyOrder.indexOf(a.urgency) - urgencyOrder.indexOf(b.urgency)
      if (urgencyDiff !== 0) return urgencyDiff
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
      type: item.displayName,
      urgency: 'Normal' as const, // Recurring tasks are normal priority by default
      days: 0, // Today
      isRecurring: true,
      isCompleted: true,
      task: null as any,
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
              <th style={{ padding: '4px', textAlign: 'left', width: '80px', fontSize: '11px' }}>期日</th>
              <th style={{ padding: '4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>タイプ</th>
              <th style={{ padding: '4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>カテゴリ</th>
              <th style={{ padding: '4px', textAlign: 'left', width: '70px', fontSize: '11px' }}>緊急度</th>
              <th style={{ padding: '4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>重要度</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: '1px solid #e5e7eb' }}>
              <td colSpan={7} style={{ 
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
            <th style={{ padding: '4px', textAlign: 'left', width: '80px', fontSize: '11px' }}>期日</th>
            <th style={{ padding: '4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>タイプ</th>
            <th style={{ padding: '4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>カテゴリ</th>
            <th style={{ padding: '4px', textAlign: 'left', width: '70px', fontSize: '11px' }}>緊急度</th>
            <th style={{ padding: '4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>重要度</th>
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
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item.task)}
                        style={{
                          padding: '3px 6px',
                          fontSize: '11px',
                          border: '1px solid #3b82f6',
                          borderRadius: '3px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          cursor: 'pointer',
                          minWidth: '32px',
                          fontWeight: '500'
                        }}
                        title="タスクを編集"
                      >
                        編集
                      </button>
                    )}
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