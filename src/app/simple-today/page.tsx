'use client'

import { useState } from 'react'
import { formatDateForDisplay, getTodayJST } from '@/lib/utils/date-jst'

export default function SimpleTodayPage() {
  const [tasks, setTasks] = useState([
    { id: '1', title: 'サンプルタスク1', completed: false },
    { id: '2', title: 'サンプルタスク2', completed: false },
    { id: '3', title: 'サンプルタスク3（完了）', completed: true }
  ])

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
          今日 - {formatDateForDisplay(getTodayJST())}
        </h1>
        
        <div style={{
          background: '#dcfce7',
          border: '1px solid #16a34a',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px',
          fontSize: '14px',
          color: '#166534'
        }}>
          ✅ アプリケーションが正常に動作しています（データベースなし簡易版）
        </div>
      </header>

      <main>
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>
            今日のタスク
          </h2>
          
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            {tasks.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                タスクはありません
              </div>
            ) : (
              tasks.map((task, index) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    borderBottom: index < tasks.length - 1 ? '1px solid #f3f4f6' : 'none',
                    opacity: task.completed ? 0.6 : 1
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    style={{ marginRight: '12px', transform: 'scale(1.2)' }}
                  />
                  <span style={{ 
                    textDecoration: task.completed ? 'line-through' : 'none',
                    fontSize: '16px'
                  }}>
                    {task.title}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>
            近々の予定
          </h2>
          
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', margin: 0 }}>
              近々の予定を表示する機能は開発中です
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}