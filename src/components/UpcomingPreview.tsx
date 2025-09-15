'use client'

import type { TaskWithUrgency } from '@/lib/db/schema'
// import { QuickMoves } from '@/lib/utils/date-jst' // 将来使用予定

interface UpcomingPreviewProps {
  upcomingTasks: TaskWithUrgency[]
  onComplete: (taskId: string) => void
  onEdit: (task: { id: string; title: string; memo?: string; due_date?: string; category?: string; importance?: number; duration_min?: number; urls?: string[] }) => void
  onDelete: (taskId: string) => void
}

export function UpcomingPreview({ upcomingTasks, onComplete, onEdit, onDelete }: UpcomingPreviewProps) {
  if (upcomingTasks.length === 0) {
    return (
      <section>
        <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px' }}>
          近々の予告（7日以内）
        </h2>
        <div style={{ 
          background: '#f8fafc', 
          padding: '16px', 
          borderRadius: '6px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          予告はありません
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px' }}>
        近々の予告（7日以内）
      </h2>
      <div style={{ 
        background: '#f8fafc', 
        padding: '16px', 
        borderRadius: '6px',
        fontSize: '14px'
      }}>
        {upcomingTasks.map(({ task, days_from_today }) => (
          <div 
            key={task.id}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: upcomingTasks[upcomingTasks.length - 1].task.id !== task.id ? '1px solid #e2e8f0' : 'none'
            }}
          >
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
              <div>
                <span style={{ fontWeight: '500' }}>{task.title}</span>
                <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                  {days_from_today === 1 ? '明日' : `${days_from_today}日後`}
                </span>
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
        ))}
      </div>
    </section>
  )
}