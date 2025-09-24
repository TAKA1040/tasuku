'use client'

import React, { memo, useState } from 'react'
import type { UnifiedTask } from '@/lib/types/unified-task'

// 重要度に応じた色を返すヘルパー関数
const getImportanceColor = (importance?: number | null): string => {
  switch (importance) {
    case 5: return '#dc2626' // 赤 - 最高重要度
    case 4: return '#ea580c' // オレンジ - 高重要度
    case 3: return '#ca8a04' // 黄 - 中重要度
    case 2: return '#16a34a' // 緑 - 低重要度
    case 1: return '#2563eb' // 青 - 最低重要度
    default: return '#9ca3af' // グレー - 重要度なし
  }
}

interface IdeaItem {
  id: string
  text: string
  completed: boolean
  created_at: string
  display_number?: string
}

interface IdeaBoxProps {
  ideas: IdeaItem[]
  allNoDateTasks: UnifiedTask[] // 統一ルール: due_date='2999-12-31'の全タスク
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onEdit: (id: string, text: string) => void
  onDelete: (id: string) => void
  onUpgradeToTask?: (idea: IdeaItem) => void
}

function IdeaBox({ ideas, allNoDateTasks, onAdd, onToggle, onEdit, onDelete, onUpgradeToTask }: IdeaBoxProps) {
  const [newIdea, setNewIdea] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showIdeaBox, setShowIdeaBox] = useState(false) // デフォルトは非表示

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIdea.trim()) return

    onAdd(newIdea.trim())
    setNewIdea('')
    setIsAdding(false)
  }

  // 統一ルール: カテゴリー別にグループ化
  const tasksByCategory = allNoDateTasks.reduce((acc, task) => {
    const category = task.category || '未分類'
    if (!acc[category]) acc[category] = []
    acc[category].push(task)
    return acc
  }, {} as Record<string, UnifiedTask[]>)

  const pendingIdeas = ideas.filter(idea => !idea.completed)
  const completedIdeas = ideas.filter(idea => idea.completed)

  return (
    <div style={{ backgroundColor: '#f8fafc', padding: '12px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '600',
            margin: '0',
            color: '#1f2937'
          }}>
            💡 やることリスト
          </h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showIdeaBox}
              onChange={(e) => setShowIdeaBox(e.target.checked)}
              style={{ margin: '0', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              表示する
            </span>
          </label>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          style={{
            background: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          {isAdding ? '✕' : '+ 追加'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              placeholder="やりたいこと・アイデア..."
              style={{
                flex: 1,
                padding: '4px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={!newIdea.trim()}
              style={{
                background: newIdea.trim() ? '#059669' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '12px',
                cursor: newIdea.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              追加
            </button>
          </div>
        </form>
      )}

      {showIdeaBox && (
        <>
          {/* 統一表示: カテゴリー別期限なしタスク */}
          {Object.entries(tasksByCategory).map(([category, tasks]) => (
            <div key={category} style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {category === '買い物' ? '🛒' : '📝'} {category}
                <span style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: 'normal'
                }}>
                  {tasks.length}件
                </span>
              </div>
              <div style={{
                backgroundColor: category === '買い物' ? '#f0f9ff' : '#f9fafb',
                padding: '8px',
                borderRadius: '4px',
                border: `1px solid ${category === '買い物' ? '#e0f2fe' : '#f3f4f6'}`
              }}>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 0',
                      borderBottom: tasks.indexOf(task) < tasks.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}
                  >
                    <span style={{
                      fontSize: '12px',
                      color: '#3b82f6',
                      fontWeight: '500',
                      minWidth: '60px'
                    }}>
                      {task.display_number}
                    </span>

                    {/* 重要度インディケーター */}
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getImportanceColor(task.importance),
                        flexShrink: 0
                      }}
                      title={`重要度: ${task.importance || '未設定'}`}
                    />

                    <span
                      style={{
                        flex: 1,
                        fontSize: '14px',
                        color: '#374151'
                      }}
                    >
                      {task.title}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: '#6b7280'
                    }}>
                      {category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '8px'
          }}>
            期限なし・自由なアイデア帳
          </div>

          {/* 未完了のアイデア */}
          {pendingIdeas.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {pendingIdeas.map((idea) => (
            <div
              key={idea.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 0',
                borderBottom: '1px solid #f3f4f6'
              }}
            >
              <button
                onClick={() => onToggle(idea.id)}
                style={{
                  width: '16px',
                  height: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '3px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}
                title="完了にする"
              >
              </button>

              <span
                style={{
                  flex: 1,
                  fontSize: '14px',
                  color: '#374151'
                }}
              >
                {idea.text}
              </span>
              <button
                onClick={() => onUpgradeToTask && onUpgradeToTask(idea)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px'
                }}
                title="タスクに昇格"
              >
                📋
              </button>
              <button
                onClick={() => {
                  if (confirm('このアイデアを削除しますか？')) {
                    onDelete(idea.id)
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px'
                }}
                title="削除"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
          )}

          {/* 完了したアイデア */}
          {completedIdeas.length > 0 && (
        <details style={{ marginTop: '12px' }}>
          <summary style={{ 
            fontSize: '12px', 
            color: '#6b7280', 
            cursor: 'pointer',
            marginBottom: '4px'
          }}>
            完了したアイデア ({completedIdeas.length})
          </summary>
          {completedIdeas.map((idea) => (
            <div
              key={idea.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 0',
                opacity: 0.6
              }}
            >
              <button
                onClick={() => onToggle(idea.id)}
                style={{
                  width: '16px',
                  height: '16px',
                  border: '1px solid #10b981',
                  borderRadius: '3px',
                  backgroundColor: '#10b981',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'white'
                }}
              >
                ✓
              </button>

              <span
                style={{
                  flex: 1,
                  fontSize: '14px',
                  color: '#6b7280',
                  textDecoration: 'line-through'
                }}
              >
                {idea.text}
              </span>
              <button
                onClick={() => onUpgradeToTask && onUpgradeToTask(idea)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px'
                }}
                title="タスクに昇格"
              >
                📋
              </button>
              <button
                onClick={() => {
                  if (confirm('このアイデアを削除しますか？')) {
                    onDelete(idea.id)
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px'
                }}
                title="削除"
              >
                🗑️
              </button>
            </div>
          ))}
        </details>
          )}

          {ideas.length === 0 && !isAdding && (
            <div style={{
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '14px',
              padding: '16px'
            }}>
              まだアイデアがありません<br />
              「+ 追加」でやりたいことを追加しましょう！
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default memo(IdeaBox)
export { IdeaBox }
export type { IdeaItem }