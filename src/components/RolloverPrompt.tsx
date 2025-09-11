'use client'

// 未完了タスク繰り越し確認UI
// PHASE 1.2 実装

import { useState } from 'react'
import type { Task, RecurringTask } from '@/lib/db/schema'

interface RolloverPromptProps {
  rolloverData: {
    incompleteSingle: Task[]
    incompleteRecurring: Array<{ task: RecurringTask; missedDates: string[] }>
  }
  isRollingOver: boolean
  onRollover: (options: {
    rolloverSingle?: boolean
    rolloverRecurring?: boolean
    selectedSingleTasks?: string[]
    selectedRecurringTasks?: string[]
  }) => void
  onDismiss: () => void
}

export function RolloverPrompt({ 
  rolloverData, 
  isRollingOver, 
  onRollover, 
  onDismiss 
}: RolloverPromptProps) {
  const [selectedSingleTasks, setSelectedSingleTasks] = useState<string[]>([])
  const [selectedRecurringTasks, setSelectedRecurringTasks] = useState<string[]>([])
  const [rolloverMode, setRolloverMode] = useState<'all' | 'select'>('all')

  const { incompleteSingle, incompleteRecurring } = rolloverData
  const totalSingle = incompleteSingle.length
  const totalRecurring = incompleteRecurring.reduce((sum, item) => sum + item.missedDates.length, 0)

  const handleRollover = () => {
    if (rolloverMode === 'all') {
      onRollover({})
    } else {
      onRollover({
        rolloverSingle: selectedSingleTasks.length > 0,
        rolloverRecurring: selectedRecurringTasks.length > 0,
        selectedSingleTasks,
        selectedRecurringTasks
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">未完了タスクの繰り越し</h3>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            以下の未完了タスクを今日に繰り越しますか？
          </p>
          
          {totalSingle > 0 && (
            <div className="mb-2">
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                単発タスク {totalSingle}件
              </span>
            </div>
          )}
          
          {totalRecurring > 0 && (
            <div className="mb-2">
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                繰り返しタスク {totalRecurring}件
              </span>
            </div>
          )}
        </div>

        {/* 繰り越しモード選択 */}
        <div className="mb-4">
          <div className="flex gap-2 mb-3">
            <label className="flex items-center">
              <input
                type="radio"
                value="all"
                checked={rolloverMode === 'all'}
                onChange={(e) => setRolloverMode(e.target.value as 'all')}
                className="mr-2"
              />
              すべて繰り越し
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="select"
                checked={rolloverMode === 'select'}
                onChange={(e) => setRolloverMode(e.target.value as 'select')}
                className="mr-2"
              />
              選択して繰り越し
            </label>
          </div>

          {rolloverMode === 'select' && (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {/* 単発タスク一覧 */}
              {incompleteSingle.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">単発タスク</h4>
                  {incompleteSingle.map(task => (
                    <label key={task.id} className="flex items-center mb-1">
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
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {task.title} ({task.due_date})
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* 繰り返しタスク一覧 */}
              {incompleteRecurring.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">繰り返しタスク</h4>
                  {incompleteRecurring.map(({ task, missedDates }) => (
                    <label key={task.id} className="flex items-center mb-1">
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
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {task.title} ({missedDates.length}日分)
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ボタン */}
        <div className="flex gap-2">
          <button
            onClick={handleRollover}
            disabled={isRollingOver || (
              rolloverMode === 'select' && 
              selectedSingleTasks.length === 0 && 
              selectedRecurringTasks.length === 0
            )}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isRollingOver ? '繰り越し中...' : '繰り越し実行'}
          </button>
          <button
            onClick={onDismiss}
            disabled={isRollingOver}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            後で
          </button>
        </div>
      </div>
    </div>
  )
}