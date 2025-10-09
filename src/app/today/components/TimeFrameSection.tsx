'use client'

import { UnifiedTasksTable } from '@/components/UnifiedTasksTable'
import type { UnifiedTask, SubTask } from '@/lib/types/unified-task'
import type { UseUnifiedTasksReturn } from '@/hooks/useUnifiedTasks'

interface TimeFrameSectionProps {
  emoji: string
  title: string
  tasks: UnifiedTask[]
  deadline: string
  isOverdue: boolean
  isExpanded: boolean
  onToggleExpanded: (expanded: boolean) => void
  unifiedTasks: UseUnifiedTasksReturn
  handleEditTask: (task: UnifiedTask) => void
  shoppingSubTasks: { [taskId: string]: SubTask[] }
  expandedShoppingLists: { [taskId: string]: boolean }
  toggleShoppingList: (taskId: string) => void
  addShoppingSubTask: (taskId: string, text: string) => Promise<void>
  toggleShoppingSubTask: (taskId: string, subtaskId: string, completed: boolean) => Promise<void>
  deleteShoppingSubTask: (taskId: string, subtaskId: string) => Promise<void>
  updateShoppingSubTask: (taskId: string, subtaskId: string, text: string) => Promise<void>
}

export function TimeFrameSection({
  emoji,
  title,
  tasks,
  deadline,
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
        <UnifiedTasksTable
          title=""
          tasks={tasks}
          emptyMessage="タスクなし"
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
      )}
    </div>
  )
}
