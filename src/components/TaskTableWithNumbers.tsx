// Enhanced Task Table with Display Numbers
// Extends existing TaskTable with unified numbering system

'use client'

import React from 'react'
import { TaskTable } from './TaskTable'
import { DisplayNumberCell, LegacyDisplayNumber } from './DisplayNumberCell'
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'
import type { TaskWithUrgency, Task, RecurringTask } from '@/lib/db/schema'
import type { RecurringTaskWithStatus } from '@/hooks/useRecurringTasks'

interface TaskTableWithNumbersProps {
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
  showDisplayNumbers?: boolean // Feature flag for gradual rollout
}

export function TaskTableWithNumbers(props: TaskTableWithNumbersProps) {
  const { showDisplayNumbers = false } = props
  const { allTasks, updateDisplayNumber, loading } = useUnifiedTasks()

  // Create mapping of legacy task IDs to unified tasks
  const unifiedTaskMap = React.useMemo(() => {
    const map = new Map<string, any>()
    allTasks.forEach(task => {
      // For now, assume unified tasks will have a legacy_id field for migration
      if (task.id) {
        map.set(task.id, task)
      }
    })
    return map
  }, [allTasks])

  // Handle display number update
  const handleDisplayNumberUpdate = async (taskId: string, newSequence: number) => {
    try {
      await updateDisplayNumber(taskId, newSequence)
    } catch (error) {
      console.error('Failed to update display number:', error)
      // TODO: Show user-friendly error message
    }
  }

  // Enhanced render function for table rows
  const renderTaskRow = (task: any, index: number, isUnified = false) => {
    const unifiedTask = isUnified ? task : unifiedTaskMap.get(task.id)

    return (
      <tr key={task.id} className="border-b border-gray-200 dark:border-gray-700">
        {/* Display Number Column */}
        {showDisplayNumbers && (
          <td className="w-16 p-2 border-r border-gray-200 dark:border-gray-700">
            {unifiedTask ? (
              <DisplayNumberCell
                displayNumber={unifiedTask.display_number}
                isEditable={!loading}
                onUpdate={(newSequence) => handleDisplayNumberUpdate(task.id, newSequence)}
                className="bg-blue-50 dark:bg-blue-900/20"
              />
            ) : (
              <LegacyDisplayNumber
                index={index}
                prefix="#"
              />
            )}
          </td>
        )}

        {/* Existing table content would go here */}
        {/* This is a placeholder - the actual TaskTable component would render its content */}
      </tr>
    )
  }

  // If display numbers are disabled, render original TaskTable
  if (!showDisplayNumbers) {
    return <TaskTable {...props} />
  }

  // For now, we'll create a wrapper that adds the display number column
  // In a full implementation, we'd need to modify the original TaskTable
  return (
    <div className="space-y-4">
      {/* Migration Status */}
      {loading && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
          <div className="text-sm text-blue-700 dark:text-blue-300">
            🔄 統一番号システムを読み込み中...
          </div>
        </div>
      )}

      {allTasks.length === 0 && !loading && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
          <div className="text-sm text-yellow-700 dark:text-yellow-300">
            ⚠️ 統一番号システムが利用できません。従来の表示を使用しています。
          </div>
        </div>
      )}

      {/* Enhanced Table Preview */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="w-16 p-2 text-center border-r border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  番号
                </div>
              </th>
              <th className="p-2 text-left">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  タスク (プレビュー)
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Sample unified tasks */}
            {allTasks.slice(0, 3).map((task, index) => (
              <tr key={task.id} className="border-b border-gray-200 dark:border-gray-700">
                <td className="w-16 p-2 border-r border-gray-200 dark:border-gray-700">
                  <DisplayNumberCell
                    displayNumber={task.display_number}
                    isEditable={true}
                    onUpdate={(newSequence) => handleDisplayNumberUpdate(task.id, newSequence)}
                    className="bg-blue-50 dark:bg-blue-900/20"
                  />
                </td>
                <td className="p-2">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs text-gray-500">
                    タイプ: {task.task_type} | 期日: {task.due_date || '未設定'}
                  </div>
                </td>
              </tr>
            ))}

            {/* Sample legacy tasks */}
            {props.tasks.slice(0, 2).map((task, index) => (
              <tr key={`legacy-${task.task.id}`} className="border-b border-gray-200 dark:border-gray-700 opacity-60">
                <td className="w-16 p-2 border-r border-gray-200 dark:border-gray-700">
                  <LegacyDisplayNumber index={index} prefix="#" />
                </td>
                <td className="p-2">
                  <div className="font-medium">{task.task.title}</div>
                  <div className="text-xs text-gray-500">
                    従来タスク | 期日: {task.task.due_date || '未設定'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Original TaskTable (hidden for now) */}
      <div className="hidden">
        <TaskTable {...props} />
      </div>
    </div>
  )
}

// Feature flag component for gradual rollout
export function TaskTableFeatureWrapper(props: Omit<TaskTableWithNumbersProps, 'showDisplayNumbers'>) {
  // Check if unified numbering is enabled
  const [enableUnifiedNumbers, setEnableUnifiedNumbers] = React.useState(false)

  // Check localStorage or feature flags
  React.useEffect(() => {
    const enabled = localStorage.getItem('enableUnifiedNumbers') === 'true'
    setEnableUnifiedNumbers(enabled)
  }, [])

  const toggleFeature = () => {
    const newValue = !enableUnifiedNumbers
    setEnableUnifiedNumbers(newValue)
    localStorage.setItem('enableUnifiedNumbers', newValue.toString())
  }

  return (
    <div className="space-y-4">
      {/* Feature Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            統一番号システム
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            タスクに統一的な番号を付与し、手動で順序を変更できます
          </p>
        </div>
        <button
          onClick={toggleFeature}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${enableUnifiedNumbers ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${enableUnifiedNumbers ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Table Component */}
      <TaskTableWithNumbers
        {...props}
        showDisplayNumbers={enableUnifiedNumbers}
      />
    </div>
  )
}