'use client'

import React, { useMemo, useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'

import type { TaskWithUrgency } from '@/lib/db/schema'
import type { RecurringTaskWithStatus } from '@/hooks/useRecurringTasks'
import { ImportanceDot } from '@/components/ImportanceDot'
import { useTaskOrder } from '@/hooks/useTaskOrder'

interface DraggableTaskTableProps {
  tasks: TaskWithUrgency[]
  recurringTasks: RecurringTaskWithStatus[]
  completedTasks?: TaskWithUrgency[]
  completedRecurringTasks?: RecurringTaskWithStatus[]
  onComplete: (taskId: string) => void
  onRecurringComplete: (taskId: string) => void
  onEdit?: (taskId: string) => void
  onEditRecurring?: (taskId: string) => void
  onUncomplete?: (taskId: string) => void
  onRecurringUncomplete?: (taskId: string) => void
  onDelete?: (taskId: string) => void
  onDeleteRecurring?: (taskId: string) => void
  onReorder?: (taskId: string, newOrderIndex: number) => void
}

type TableItem = {
  id: string
  title: string
  memo?: string
  category?: string
  importance?: number
  urls?: string[]
  attachment?: { file_name: string; file_type: string; file_data: string }
  location_tag_id?: string
  due_date?: string
  order_index?: number
  urgency: string
  isCompleted: boolean
  isRecurring: boolean
  frequency?: string
}

interface SortableRowProps {
  item: TableItem
  index: number
  onComplete: (taskId: string) => void
  onRecurringComplete: (taskId: string) => void
  onEdit?: (taskId: string) => void
  onEditRecurring?: (taskId: string) => void
  onUncomplete?: (taskId: string) => void
  onRecurringUncomplete?: (taskId: string) => void
  onDelete?: (taskId: string) => void
  onDeleteRecurring?: (taskId: string) => void
  renderFileIcon: (attachment?: { file_name: string; file_type: string; file_data: string }) => React.ReactNode
  getUrgencyRowColor: (urgency: string, isCompleted: boolean, isRecurring: boolean) => string
}

const SortableRow = React.memo(function SortableRow({
  item,
  index,
  onComplete,
  onRecurringComplete,
  onEdit,
  onEditRecurring,
  onUncomplete,
  onRecurringUncomplete,
  onDelete,
  onDeleteRecurring,
  renderFileIcon,
  getUrgencyRowColor
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const { getTaskOrder, updateTaskOrder } = useTaskOrder()
  const [isEditingOrder, setIsEditingOrder] = useState(false)
  const [orderValue, setOrderValue] = useState('')

  const currentOrder = getTaskOrder(item.id)
  // シンプルに連番で表示（1から開始）
  const displayOrder = index + 1

  const handleOrderEdit = () => {
    console.log('Order edit clicked for task:', item.id, 'displayOrder:', displayOrder)
    setOrderValue(displayOrder.toString())
    setIsEditingOrder(true)
  }

  const handleOrderSave = () => {
    console.log('Order save clicked, orderValue:', orderValue)
    const newOrder = parseInt(orderValue)
    if (!isNaN(newOrder) && newOrder > 0) {
      console.log('Updating task order:', item.id, 'to:', newOrder)
      updateTaskOrder(item.id, newOrder)
    } else {
      console.log('Invalid order value:', orderValue)
    }
    setIsEditingOrder(false)
  }

  const handleOrderCancel = () => {
    setIsEditingOrder(false)
    setOrderValue('')
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={{
        ...style,
        borderTop: index > 0 ? '1px solid #e5e7eb' : 'none',
        height: '28px',
        opacity: item.isCompleted ? 0.6 : 1,
        backgroundColor: getUrgencyRowColor(item.urgency, item.isCompleted, item.isRecurring),
        transition: 'background-color 0.15s ease',
      }}
      {...attributes}
    >
      <td
        style={{
          padding: '2px 4px',
          fontSize: '12px',
          textAlign: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          color: '#9ca3af',
          userSelect: 'none'
        }}
        {...listeners}
      >
        ⋮⋮
      </td>
      <td style={{ padding: '2px 4px', fontSize: '12px', textAlign: 'center' }}>
        {isEditingOrder ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <input
              type="number"
              value={orderValue}
              onChange={(e) => setOrderValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleOrderSave()
                if (e.key === 'Escape') handleOrderCancel()
              }}
              style={{
                width: '30px',
                padding: '1px 2px',
                fontSize: '11px',
                border: '1px solid #d1d5db',
                borderRadius: '2px'
              }}
              autoFocus
            />
            <button
              onClick={handleOrderSave}
              style={{
                padding: '1px 3px',
                fontSize: '10px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              ✓
            </button>
            <button
              onClick={handleOrderCancel}
              style={{
                padding: '1px 3px',
                fontSize: '10px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={handleOrderEdit}
            style={{
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '2px',
              backgroundColor: currentOrder !== undefined ? '#fef3c7' : '#f3f4f6',
              fontWeight: currentOrder !== undefined ? 'bold' : 'normal',
              border: '1px solid #d1d5db',
              minWidth: '20px',
              textAlign: 'center'
            }}
            title={`クリックして順序を編集 (現在: ${displayOrder}${currentOrder !== undefined ? ', カスタム: ' + currentOrder : ', デフォルト'})`}
          >
            {displayOrder}
          </div>
        )}
      </td>
      <td style={{ padding: '2px 4px', fontSize: '12px', textAlign: 'center' }}>
        <input
          type="checkbox"
          checked={item.isCompleted}
          onChange={() => {
            if (item.isCompleted) {
              // 完了済みタスクを未完了に戻す
              if (item.isRecurring) {
                onRecurringUncomplete?.(item.id)
              } else {
                onUncomplete?.(item.id)
              }
            } else {
              // 未完了タスクを完了にする
              if (item.isRecurring) {
                onRecurringComplete(item.id)
              } else {
                onComplete(item.id)
              }
            }
          }}
          style={{ transform: 'scale(0.8)' }}
        />
      </td>
      <td style={{ padding: '2px 4px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ImportanceDot importance={item.importance} />
          <span className="task-title" style={{ fontWeight: '500' }}>
            {item.title}
          </span>

          {item.category && (
            <span style={{
              fontSize: '10px',
              padding: '1px 4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              color: '#6b7280'
            }}>
              {item.category}
            </span>
          )}

          {item.urls && item.urls.length > 0 && (
            <span style={{ fontSize: '10px', color: '#3b82f6' }}>🔗</span>
          )}

          {renderFileIcon(item.attachment)}
        </div>

        {item.memo && (
          <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }} className="memo-desktop-only">
            {item.memo}
          </div>
        )}
      </td>
      <td style={{ padding: '2px 4px', fontSize: '10px', textAlign: 'center' }}>
        {item.location_tag_id ? '📍' : ''}
      </td>
      <td style={{ padding: '2px 4px', fontSize: '10px', display: 'none' }} className="date-type-desktop-only">
        <div>
          {item.due_date || (item.isRecurring ? `${item.frequency}` : '-')}
        </div>
      </td>
      <td style={{ padding: '2px 4px', fontSize: '10px' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (item.isRecurring) {
                onEditRecurring?.(item.id)
              } else {
                onEdit?.(item.id)
              }
            }}
            style={{
              padding: '1px 4px',
              fontSize: '9px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            編集
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('このタスクを削除しますか？')) {
                if (item.isRecurring) {
                  onDeleteRecurring?.(item.id)
                } else {
                  onDelete?.(item.id)
                }
              }
            }}
            style={{
              padding: '1px 4px',
              fontSize: '9px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            削除
          </button>
        </div>
      </td>
    </tr>
  )
})

export function DraggableTaskTable({
  tasks,
  recurringTasks,
  completedTasks = [],
  onComplete,
  onRecurringComplete,
  onEdit,
  onEditRecurring,
  onUncomplete,
  onRecurringUncomplete,
  onDelete,
  onDeleteRecurring,
  onReorder
}: DraggableTaskTableProps) {
  const [showFilePopup, setShowFilePopup] = useState(false)
  const [selectedFile, setSelectedFile] = useState<{ file_name: string; file_type: string; file_data: string } | null>(null)

  // 買い物リスト機能の状態 (今後のショッピング機能のために保持)
  // const [subTasks, setSubTasks] = useState<{ [taskId: string]: SubTask[] }>({})
  // const [showShoppingLists, setShowShoppingLists] = useState<{ [taskId: string]: boolean }>({})

  // ドラッグ&ドロップのセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleFileClick = (attachment: { file_name: string; file_type: string; file_data: string }) => {
    setSelectedFile(attachment)
    setShowFilePopup(true)
  }

  const closeFilePopup = () => {
    setShowFilePopup(false)
    setSelectedFile(null)
  }

  const renderFileIcon = (attachment?: { file_name: string; file_type: string; file_data: string }) => {
    if (!attachment) return null

    return (
      <span
        onClick={(e) => {
          e.stopPropagation()
          handleFileClick(attachment)
        }}
        style={{
          fontSize: '12px',
          cursor: 'pointer',
          color: '#3b82f6'
        }}
        title={attachment.file_name}
      >
        📎
      </span>
    )
  }

  const getUrgencyRowColor = (urgency: string, isCompleted: boolean, isRecurring: boolean) => {
    if (isCompleted) return '#f3f4f6'
    if (isRecurring) return '#fef3c7'

    switch (urgency) {
      case 'Overdue': return '#fee2e2'
      case 'Soon': return '#fef3c7'
      case 'Next7': return '#ecfdf5'
      case 'Next30': return '#eff6ff'
      default: return '#ffffff'
    }
  }

  // サブタスク機能は今後のショッピング機能で実装予定
  // const loadSubTasks = useCallback(async () => { ... }, [tasks, completedTasks])
  // const toggleShoppingList = (taskId: string) => { ... }

  // タスクを並び順に応じてソート
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aOrder = a.task.order_index ?? 999999
      const bOrder = b.task.order_index ?? 999999
      return aOrder - bOrder
    })
  }, [tasks])

  // タスクアイテムをメモ化
  const taskItems = useMemo(() =>
    sortedTasks.map(taskWithUrgency => ({
      id: taskWithUrgency.task.id,
      title: taskWithUrgency.task.title,
      memo: taskWithUrgency.task.memo,
      category: taskWithUrgency.task.category,
      importance: taskWithUrgency.task.importance,
      urls: taskWithUrgency.task.urls,
      attachment: taskWithUrgency.task.attachment,
      location_tag_id: taskWithUrgency.task.location_tag_id,
      due_date: taskWithUrgency.task.due_date,
      order_index: taskWithUrgency.task.order_index, // order_indexを追加
      urgency: taskWithUrgency.urgency,
      isRecurring: false,
      isCompleted: taskWithUrgency.task.completed
    })), [sortedTasks]);

  // 繰り返しタスクアイテムをメモ化
  const recurringItems = useMemo(() =>
    recurringTasks.map(recurringTask => ({
      id: recurringTask.task.id,
      title: recurringTask.task.title,
      memo: recurringTask.task.memo,
      category: recurringTask.task.category,
      importance: recurringTask.task.importance,
      urls: recurringTask.task.urls,
      attachment: recurringTask.task.attachment,
      location_tag_id: undefined, // RecurringTaskにはlocation_tag_idがないのでundefinedを設定
      due_date: undefined,
      order_index: 999999, // 繰り返しタスクは最後に表示
      urgency: 'Normal' as const,
      isRecurring: true,
      isCompleted: recurringTask.completedToday || false,
      frequency: recurringTask.task.frequency
    })), [recurringTasks]);

  // 全アイテムをメモ化
  const allItems = useMemo(() =>
    [...taskItems, ...recurringItems], [taskItems, recurringItems]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = allItems.findIndex(item => item.id === active.id)
    const newIndex = allItems.findIndex(item => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      console.warn('Invalid drag operation: item not found', { activeId: active.id, overId: over.id, oldIndex, newIndex })
      return
    }

    // 削除されたタスクかどうかをチェック
    const activeTask = allItems[oldIndex]
    if (!activeTask || !activeTask.id) {
      console.warn('Attempted to reorder deleted or invalid task:', active.id)
      return
    }

    // order_indexを更新
    if (onReorder) {
      // 適切なorder_index値を計算
      const getNewOrderIndex = (newIndex: number, allItems: TableItem[]): number => {
        if (newIndex === 0) {
          // 最初に移動する場合
          const firstItem = allItems[0];
          const firstOrder = firstItem?.order_index ?? 1000;
          return Math.max(1, firstOrder - 1000);
        }

        if (newIndex >= allItems.length - 1) {
          // 最後に移動する場合
          const lastItem = allItems[allItems.length - 1];
          const lastOrder = lastItem?.order_index ?? 0;
          return lastOrder + 1000;
        }

        // 中間に移動する場合：前後のorder_indexの中間値
        const prevItem = allItems[newIndex - 1];
        const nextItem = allItems[newIndex];
        const prevOrder = prevItem?.order_index ?? 0;
        const nextOrder = nextItem?.order_index ?? prevOrder + 2000;

        return Math.floor((prevOrder + nextOrder) / 2);
      };

      // 型安全性を確保
      if (typeof active.id !== 'string') {
        console.error('Invalid active.id type:', typeof active.id);
        return;
      }

      const newOrderIndex = getNewOrderIndex(newIndex, allItems);
      console.log('Reordering task:', { id: active.id, oldIndex, newIndex, newOrderIndex });
      onReorder(active.id, newOrderIndex);
    }
  }, [allItems, onReorder])

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div style={{ overflowX: 'auto' }}>
          {allItems.length === 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '2px 4px', textAlign: 'left', width: '20px', fontSize: '11px' }}>⋮⋮</th>
                  <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>番号</th>
                  <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>✓</th>
                  <th style={{ padding: '2px 4px', textAlign: 'left', fontSize: '11px' }}>タイトル</th>
                  <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>🌍</th>
                  <th style={{ padding: '2px 4px', textAlign: 'left', width: '100px', fontSize: '11px', display: 'none' }} className="date-type-desktop-only">期日/タイプ</th>
                  <th style={{ padding: '2px 4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td colSpan={6} className="mobile-colspan" style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    今日のタスクはありません
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '2px 4px', textAlign: 'left', width: '20px', fontSize: '11px' }}>⋮⋮</th>
                  <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>番号</th>
                  <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>✓</th>
                  <th style={{ padding: '2px 4px', textAlign: 'left', fontSize: '11px' }}>タイトル</th>
                  <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>🌍</th>
                  <th style={{ padding: '2px 4px', textAlign: 'left', width: '100px', fontSize: '11px', display: 'none' }} className="date-type-desktop-only">期日/タイプ</th>
                  <th style={{ padding: '2px 4px', textAlign: 'left', width: '60px', fontSize: '11px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                <SortableContext
                  items={allItems.map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {allItems.map((item, index) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      index={index}
                      onComplete={onComplete}
                      onRecurringComplete={onRecurringComplete}
                      onEdit={onEdit}
                      onEditRecurring={onEditRecurring}
                      onUncomplete={onUncomplete}
                      onRecurringUncomplete={onRecurringUncomplete}
                      onDelete={onDelete}
                      onDeleteRecurring={onDeleteRecurring}
                      renderFileIcon={renderFileIcon}
                      getUrgencyRowColor={getUrgencyRowColor}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          )}
        </div>
      </DndContext>

      {/* ファイル表示ポップアップ */}
      {showFilePopup && selectedFile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '90%',
            maxHeight: '90%',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <h3 style={{ margin: 0 }}>{selectedFile.file_name}</h3>
              <button
                onClick={closeFilePopup}
                style={{
                  padding: '5px 10px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                閉じる
              </button>
            </div>

            {selectedFile.file_type.startsWith('image/') ? (
              <img
                src={selectedFile.file_data}
                alt={selectedFile.file_name}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            ) : (
              <div style={{
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <p>ファイル: {selectedFile.file_name}</p>
                <p>タイプ: {selectedFile.file_type}</p>
                <a
                  href={selectedFile.file_data}
                  download={selectedFile.file_name}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}
                >
                  ダウンロード
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}