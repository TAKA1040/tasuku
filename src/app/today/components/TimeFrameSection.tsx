'use client'

import { UnifiedTasksTable } from '@/components/UnifiedTasksTable'
import type { UnifiedTask, SubTask } from '@/lib/types/unified-task'
import type { UseUnifiedTasksResult } from '@/hooks/useUnifiedTasks'

interface TimeFrameSectionProps {
  emoji: string
  title: string
  tasks: UnifiedTask[]
  deadline: string
  isOverdue: boolean
  isExpanded: boolean
  onToggleExpanded: (expanded: boolean) => void
  unifiedTasks: UseUnifiedTasksResult
  handleEditTask: (task: UnifiedTask) => void
  shoppingSubTasks: { [taskId: string]: SubTask[] }
  expandedShoppingLists: { [taskId: string]: boolean }
  toggleShoppingList: (taskId: string) => void
  addShoppingSubTask: (taskId: string, itemName: string) => Promise<void>
  toggleShoppingSubTask: (taskId: string, subTaskId: string) => Promise<void>
  deleteShoppingSubTask: (taskId: string, subTaskId: string) => Promise<void>
  updateShoppingSubTask: (taskId: string, subTaskId: string, updates: { title?: string }) => Promise<void>
}

export function TimeFrameSection({
  emoji,
  title,
  tasks,
  deadline: _deadline,
  isOverdue,
  isExpanded,
  onToggleExpanded,
  unifiedTasks,
  handleEditTask,
  shoppingSubTasks,
  expandedShoppingLists,
  toggleShoppingList,
  addShoppingSubTask,
  toggleShoppingSubTask,
  deleteShoppingSubTask,
  updateShoppingSubTask
}: TimeFrameSectionProps) {
  return (
    <div style={{ marginLeft: '16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px',
        gap: '8px'
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: isOverdue ? '16px' : '14px',
          fontWeight: isOverdue ? '900' : '600',
          color: isOverdue ? '#dc2626' : '#1f2937',
          cursor: 'pointer'
        }}>
          　{emoji} {title} ({tasks.length}件) {isExpanded ? '☑️' : '☐'}
          <input
            type="checkbox"
            checked={isExpanded}
            onChange={(e) => onToggleExpanded(e.target.checked)}
            style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
          />
        </label>
      </div>
      {isExpanded && (
        <div style={{ marginLeft: '16px' }}>
          <UnifiedTasksTable
            title=""
            tasks={tasks}
            emptyMessage=""
            unifiedTasks={unifiedTasks}
            handleEditTask={handleEditTask}
            shoppingSubTasks={shoppingSubTasks}
            expandedShoppingLists={expandedShoppingLists}
            toggleShoppingList={toggleShoppingList}
            addShoppingSubTask={addShoppingSubTask}
            toggleShoppingSubTask={toggleShoppingSubTask}
            deleteShoppingSubTask={deleteShoppingSubTask}
            updateShoppingSubTask={updateShoppingSubTask}
            showTitle={false}
          />
        </div>
      )}
    </div>
  )
}
