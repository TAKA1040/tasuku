'use client'

import { useState } from 'react'
import type { Task, RecurringTask } from '@/lib/db/schema'
import { ImportanceDot } from '@/components/ImportanceDot'

interface IncompleteTasksToggleProps {
  rolloverData: {
    incompleteSingle: Task[]
    incompleteRecurring: Array<{ task: RecurringTask; missedDates: string[] }>
  } | null
  isRollingOver: boolean
  onRollover: (options: {
    rolloverSingle?: boolean
    rolloverRecurring?: boolean
    selectedSingleTasks?: string[]
    selectedRecurringTasks?: string[]
  }) => void
}

export function IncompleteTasksToggle({
  rolloverData,
  isRollingOver,
  onRollover
}: IncompleteTasksToggleProps) {
  const [showIncompleteTasks, setShowIncompleteTasks] = useState(false)
  const [selectedSingleTasks, setSelectedSingleTasks] = useState<string[]>([])
  const [selectedRecurringTasks, setSelectedRecurringTasks] = useState<string[]>([])

  if (!rolloverData || (rolloverData.incompleteSingle.length === 0 && rolloverData.incompleteRecurring.length === 0)) {
    return null
  }

  const { incompleteSingle, incompleteRecurring } = rolloverData
  const totalSingle = incompleteSingle.length
  const totalRecurring = incompleteRecurring.reduce((sum, item) => sum + item.missedDates.length, 0)
  const totalCount = totalSingle + totalRecurring

  const handleAutoRollover = () => {
    onRollover({})
    setShowIncompleteTasks(false)
  }

  const handleSelectiveRollover = () => {
    onRollover({
      rolloverSingle: selectedSingleTasks.length > 0,
      rolloverRecurring: selectedRecurringTasks.length > 0,
      selectedSingleTasks,
      selectedRecurringTasks
    })
    setShowIncompleteTasks(false)
  }

  return (
    <div style={{
      padding: '12px',
      backgroundColor: '#fef3c7',
      borderTop: '1px solid #f59e0b',
      borderRadius: '8px 8px 0 0'
    }}>
      {/* トグルボタン */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: showIncompleteTasks ? '12px' : '0'
      }}>
        <span style={{
          fontSize: '14px',
          color: '#92400e',
          fontWeight: '500'
        }}>
          未完了タスク: {totalCount}件
        </span>
        <button
          onClick={() => setShowIncompleteTasks(!showIncompleteTasks)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
        >
          {showIncompleteTasks ? '非表示' : '表示・管理'}
        </button>
      </div>

      {/* 詳細表示エリア */}
      {showIncompleteTasks && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '12px'
        }}>
          {/* 自動繰り越しボタン */}
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={handleAutoRollover}
              disabled={isRollingOver}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: isRollingOver ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: isRollingOver ? 0.6 : 1,
                marginRight: '8px'
              }}
            >
              {isRollingOver ? '繰り越し中...' : 'すべて自動繰り越し'}
            </button>

            <span style={{
              fontSize: '12px',
              color: '#6b7280'
            }}>
              または下記から選択して繰り越し
            </span>
          </div>

          {/* タスク一覧 */}
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            marginBottom: '12px'
          }}>
            {/* 単発タスク */}
            {incompleteSingle.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  単発タスク ({totalSingle}件)
                </h4>
                {incompleteSingle.map(task => (
                  <label
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '6px',
                      padding: '4px',
                      backgroundColor: selectedSingleTasks.includes(task.id) ? '#eff6ff' : 'transparent',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSingleTasks.includes(task.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSingleTasks(prev => [...prev, task.id])
                        } else {
                          setSelectedSingleTasks(prev => prev.filter(id => id !== task.id))
                        }
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    <ImportanceDot importance={task.importance} size={8} />
                    <span style={{
                      fontSize: '13px',
                      color: '#374151'
                    }}>
                      {task.title} ({task.due_date})
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* 繰り返しタスク */}
            {incompleteRecurring.length > 0 && (
              <div>
                <h4 style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  繰り返しタスク ({totalRecurring}件)
                </h4>
                {incompleteRecurring.map(({ task, missedDates }) => (
                  <label
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '6px',
                      padding: '4px',
                      backgroundColor: selectedRecurringTasks.includes(task.id) ? '#f0fdf4' : 'transparent',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecurringTasks.includes(task.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRecurringTasks(prev => [...prev, task.id])
                        } else {
                          setSelectedRecurringTasks(prev => prev.filter(id => id !== task.id))
                        }
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    <ImportanceDot importance={task.importance} size={8} />
                    <span style={{
                      fontSize: '13px',
                      color: '#374151'
                    }}>
                      {task.title} ({missedDates.length}日分)
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 選択繰り越しボタン */}
          {(selectedSingleTasks.length > 0 || selectedRecurringTasks.length > 0) && (
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={handleSelectiveRollover}
                disabled={isRollingOver}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: isRollingOver ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: isRollingOver ? 0.6 : 1
                }}
              >
                選択したタスクを繰り越し ({selectedSingleTasks.length + selectedRecurringTasks.length}件)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}