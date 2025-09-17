'use client'

import { useState, useCallback } from 'react'
import * as React from 'react'
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'
import type { TaskWithUrgency, Task } from '@/lib/db/schema'
// import { QuickMoves } from '@/lib/utils/date-jst' // 将来使用予定

interface UpcomingPreviewProps {
  upcomingTasks: TaskWithUrgency[]
  onComplete: (taskId: string) => void
  onEdit: (taskId: string) => void
  onDelete: (taskId: string) => void
  onReorder?: (taskId: string, newOrderIndex: number) => void
}

interface SortableUpcomingItemProps {
  item: TaskWithUrgency
  onComplete: (taskId: string) => void
  onEdit: (taskId: string) => void
  onDelete: (taskId: string) => void
}

function SortableUpcomingItem({ item, onComplete, onEdit, onDelete }: SortableUpcomingItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: isDragging ? '#f1f5f9' : 'transparent'
      }}
      {...attributes}
      {...listeners}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onComplete(item.task.id)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
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
            transition: 'all 0.15s ease',
            pointerEvents: 'auto'
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
        <div>
          <span style={{ fontWeight: '500' }}>{item.task.title}</span>
          <span style={{ color: '#6b7280', marginLeft: '8px' }}>
            {item.days_from_today === 1 ? '明日' : `${item.days_from_today}日後`}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {/* 編集ボタン */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onEdit(item.task.id)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
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
            transition: 'all 0.15s ease',
            pointerEvents: 'auto'
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
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (confirm('このタスクを削除しますか？')) {
              onDelete(item.task.id)
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
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
            transition: 'all 0.15s ease',
            pointerEvents: 'auto'
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
  )
}

export function UpcomingPreview({ upcomingTasks, onComplete, onEdit, onDelete, onReorder }: UpcomingPreviewProps) {
  // 表示期間フィルター状態
  const [showDays, setShowDays] = useState<number>(7)

  // ドラッグ&ドロップのセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 選択した日数でフィルタリング（全期間の場合は制限なし）
  const filteredTasks = showDays === 99999
    ? upcomingTasks
    : upcomingTasks.filter(task => task.days_from_today <= showDays)

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    console.log('UpcomingPreview drag end:', { active: active.id, over: over?.id })

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = upcomingTasks.findIndex(item => item.task.id === active.id)
    const newIndex = upcomingTasks.findIndex(item => item.task.id === over.id)

    console.log('UpcomingPreview indices:', { oldIndex, newIndex })

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // 並び替えの実行（バックエンドへの通知）
    if (onReorder) {
      onReorder(active.id as string, newIndex)
    }
  }, [upcomingTasks, onReorder])

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredTasks.map(item => item.task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            {filteredTasks.map((item) => (
              <SortableUpcomingItem
                key={item.task.id}
                item={item}
                onComplete={onComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  )
}