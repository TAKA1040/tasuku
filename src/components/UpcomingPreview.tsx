'use client'

import type { TaskWithUrgency } from '@/lib/db/schema'
import { QuickMoves } from '@/lib/utils/date-jst'

interface UpcomingPreviewProps {
  upcomingTasks: TaskWithUrgency[]
  onMoveToToday: (taskId: string) => void
}

export function UpcomingPreview({ upcomingTasks, onMoveToToday }: UpcomingPreviewProps) {
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
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: '500' }}>{task.title}</span>
              <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                {days_from_today === 1 ? '明日' : `${days_from_today}日後`}
              </span>
            </div>
            <button
              onClick={() => onMoveToToday(task.id)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              今日に
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}