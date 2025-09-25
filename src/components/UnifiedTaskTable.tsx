'use client'

import type { UnifiedTask } from '@/lib/types/unified-task'
import { getTodayJST } from '@/lib/utils/date-jst'

interface UnifiedTaskTableProps {
  title: string
  tasks: UnifiedTask[]
  emptyMessage?: string
  urgent?: boolean
  onToggleComplete: (task: UnifiedTask) => void
  onEdit: (task: UnifiedTask) => void
  onDelete: (task: UnifiedTask) => void
  showBulkActions?: boolean
}

export function UnifiedTaskTable({
  title,
  tasks,
  emptyMessage = '',
  urgent = false,
  onToggleComplete,
  onEdit,
  onDelete,
  showBulkActions = false
}: UnifiedTaskTableProps) {
  if (tasks.length === 0 && !emptyMessage) return null

  return (
    <section style={{ marginBottom: '12px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: '0',
          color: urgent ? '#ef4444' : 'var(--text-primary)'
        }}>
          {title}
        </h2>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {tasks.length}件
        </div>
      </div>

      {tasks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-secondary)',
          background: 'var(--bg-secondary)',
          borderRadius: '8px'
        }}>
          {emptyMessage}
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* テーブルヘッダー */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: showBulkActions ? '40px 60px 80px 1fr 150px 100px 80px' : '60px 80px 1fr 150px 100px 80px',
            gap: '8px',
            padding: '12px',
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border)',
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--text-secondary)'
          }}>
            {showBulkActions && <div>選択</div>}
            <div>状態</div>
            <div>タイプ</div>
            <div>タイトル</div>
            <div>メモ</div>
            <div>期限</div>
            <div>操作</div>
          </div>

          {/* テーブルボディ */}
          {tasks.map((task, index) => {
            const taskType = task.task_type === 'IDEA' ? 'idea' :
                            task.task_type === 'RECURRING' ? 'recurring' : 'task'
            const isOverdue = task.due_date && task.due_date < getTodayJST() && !task.completed
            const isToday = task.due_date === getTodayJST()

            return (
              <div
                key={task.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: showBulkActions ? '40px 60px 80px 1fr 150px 100px 80px' : '60px 80px 1fr 150px 100px 80px',
                  gap: '8px',
                  padding: '12px',
                  borderBottom: index < tasks.length - 1 ? '1px solid var(--border)' : 'none',
                  background: 'transparent',
                  opacity: task.completed ? 0.7 : 1,
                  alignItems: 'center',
                  fontSize: '13px'
                }}
              >
                {/* 選択チェックボックス（一括操作用） */}
                {showBulkActions && (
                  <div>
                    <input
                      type="checkbox"
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                )}

                {/* 状態 */}
                <div>
                  <button
                    onClick={() => onToggleComplete(task)}
                    style={{
                      background: task.completed ? '#10b981' : '#6b7280',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    title={task.completed ? '未完了に戻す' : '完了にする'}
                  >
                    {task.completed ? '完了' : '未完'}
                  </button>
                </div>

                {/* タイプ */}
                <div>
                  <span style={{
                    background: taskType === 'idea' ? '#8b5cf6' :
                               taskType === 'recurring' ? '#10b981' : '#3b82f6',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '500'
                  }}>
                    {taskType === 'idea' ? 'アイデア' :
                     taskType === 'recurring' ? '繰返' : 'タスク'}
                  </span>
                </div>

                {/* タイトル */}
                <div style={{
                  textDecoration: task.completed ? 'line-through' : 'none',
                  fontWeight: '500'
                }}>
                  <div>{task.title || '無題'}</div>
                  {task.category && (
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      marginTop: '2px'
                    }}>
                      📁 {task.category}
                    </div>
                  )}
                </div>

                {/* メモ */}
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {task.memo || '-'}
                </div>

                {/* 期限 */}
                <div style={{
                  fontSize: '11px',
                  color: isOverdue ? '#ef4444' : isToday ? '#f59e0b' : 'var(--text-secondary)'
                }}>
                  {task.due_date && task.due_date !== '2999-12-31' ? task.due_date : '-'}
                </div>

                {/* 操作ボタン */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => onEdit(task)}
                    style={{
                      padding: '4px 6px',
                      fontSize: '11px',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                    title="編集"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => onDelete(task)}
                    style={{
                      padding: '4px 6px',
                      fontSize: '11px',
                      border: 'none',
                      borderRadius: '4px',
                      background: '#ef4444',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                    title="削除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}