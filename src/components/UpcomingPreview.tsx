'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TaskWithUrgency, Task, SubTask } from '@/lib/db/schema'
import { subTaskService } from '@/lib/db/supabase-subtasks'
// import { QuickMoves } from '@/lib/utils/date-jst' // 将来使用予定

interface UpcomingPreviewProps {
  upcomingTasks: TaskWithUrgency[]
  onComplete: (taskId: string) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}

export function UpcomingPreview({ upcomingTasks, onComplete, onEdit, onDelete }: UpcomingPreviewProps) {
  // 表示期間フィルター状態
  const [showDays, setShowDays] = useState<number>(7)
  // サブタスク管理
  const [subTasks, setSubTasks] = useState<{ [taskId: string]: SubTask[] }>({})
  const [showShoppingLists, setShowShoppingLists] = useState<{ [taskId: string]: boolean }>({})

  // サブタスクを読み込み（買い物カテゴリーのタスクのみ）
  useEffect(() => {
    let isMounted = true

    const loadSubTasks = async () => {
      const newSubTasks: { [taskId: string]: SubTask[] } = {}

      for (const taskWithUrgency of upcomingTasks) {
        if (!isMounted) return
        if (taskWithUrgency.task.category === '買い物') {
          try {
            const taskSubTasks = await subTaskService.getSubTasksByParentId(taskWithUrgency.task.id)
            newSubTasks[taskWithUrgency.task.id] = taskSubTasks.sort((a, b) => a.sort_order - b.sort_order)
          } catch (error) {
            console.error('Failed to load subtasks for task:', taskWithUrgency.task.id, error)
          }
        }
      }

      if (isMounted) {
        setSubTasks(newSubTasks)
      }
    }

    if (upcomingTasks && upcomingTasks.length > 0) {
      loadSubTasks()
    }

    return () => {
      isMounted = false
    }
  }, [upcomingTasks.length])

  // 買い物リスト表示の切り替え
  const toggleShoppingList = (taskId: string) => {
    setShowShoppingLists(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
  }

  // 選択した日数でフィルタリング（全期間の場合は制限なし）
  const filteredTasks = showDays === 99999
    ? upcomingTasks
    : upcomingTasks.filter(task => task.days_from_today <= showDays)

  if (filteredTasks.length === 0) {
    return (
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', margin: '0' }}>
            近々の予告（{showDays === 99999 ? '全期間' : `${showDays}日以内`}）
          </h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: '#6b7280' }}>表示期間:</span>
            {[
              { value: 7, label: '7日' },
              { value: 30, label: '30日' },
              { value: 90, label: '3ヶ月' },
              { value: 99999, label: '全期間' }
            ].map(({ value, label }) => (
              <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#374151', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="showDays"
                  value={value}
                  checked={showDays === value}
                  onChange={() => setShowDays(value)}
                  style={{ margin: '0', cursor: 'pointer' }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div style={{
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          {showDays === 99999 ? '予告はありません' : `${showDays}日以内に予告はありません`}
        </div>
      </section>
    )
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '500', margin: '0' }}>
          近々の予告（{showDays === 99999 ? '全期間' : `${showDays}日以内`}・{filteredTasks.length}件）
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
          <span style={{ color: '#6b7280' }}>表示期間:</span>
          {[
            { value: 7, label: '7日' },
            { value: 30, label: '30日' },
            { value: 90, label: '3ヶ月' },
            { value: 99999, label: '全期間' }
          ].map(({ value, label }) => (
            <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#374151', cursor: 'pointer' }}>
              <input
                type="radio"
                name="showDays"
                value={value}
                checked={showDays === value}
                onChange={() => setShowDays(value)}
                style={{ margin: '0', cursor: 'pointer' }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div style={{
        background: '#f8fafc',
        padding: '16px',
        borderRadius: '6px',
        fontSize: '14px'
      }}>
        {filteredTasks.map(({ task, days_from_today }) => (
          <div key={task.id}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: filteredTasks[filteredTasks.length - 1].task.id !== task.id ? '1px solid #e2e8f0' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <button
                  onClick={() => onComplete(task.id)}
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6'
                    e.currentTarget.style.backgroundColor = '#eff6ff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db'
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  title="タスクを完了する"
                >
                </button>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: '500' }}>{task.title}</span>
                  <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                    {days_from_today === 1 ? '明日' : `${days_from_today}日後`}
                  </span>
                  {/* 買い物カテゴリーの場合は買い物リスト表示ボタンを追加 */}
                  {task.category === '買い物' && (
                    <button
                      onClick={() => toggleShoppingList(task.id)}
                      style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        backgroundColor: showShoppingLists[task.id] ? '#e0f2fe' : 'white',
                        color: showShoppingLists[task.id] ? '#0369a1' : '#6b7280',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="買い物リストを表示/非表示"
                    >
                      🛒 {subTasks[task.id]?.length || 0}品目
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {/* 編集ボタン */}
                <button
                  onClick={() => onEdit(task)}
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

                {/* 削除ボタン */}
                <button
                  onClick={() => {
                    if (confirm('このタスクを削除しますか？')) {
                      onDelete(task.id)
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
            </div>

            {/* 買い物リスト表示エリア */}
            {task.category === '買い物' && showShoppingLists[task.id] && (
              <div style={{
                marginLeft: '26px',
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#f8fffe',
                borderRadius: '4px',
                border: '1px solid #e6fffa'
              }}>
                {subTasks[task.id] && subTasks[task.id].length > 0 ? (
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                      買い物リスト ({subTasks[task.id].length}品目)
                    </div>
                    {subTasks[task.id].map((subTask) => (
                      <div
                        key={subTask.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '2px 0',
                          fontSize: '13px'
                        }}
                      >
                        <span style={{
                          width: '14px',
                          height: '14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '2px',
                          backgroundColor: subTask.completed ? '#10b981' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: 'white'
                        }}>
                          {subTask.completed ? '✓' : ''}
                        </span>
                        <span style={{
                          color: subTask.completed ? '#6b7280' : '#374151',
                          textDecoration: subTask.completed ? 'line-through' : 'none'
                        }}>
                          {subTask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    買い物リストはまだありません
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}