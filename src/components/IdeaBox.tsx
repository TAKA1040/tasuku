'use client'

import { useState } from 'react'

interface IdeaItem {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

interface IdeaBoxProps {
  ideas: IdeaItem[]
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function IdeaBox({ ideas, onAdd, onToggle, onDelete }: IdeaBoxProps) {
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
              >
              </button>
              <span style={{ 
                flex: 1, 
                fontSize: '14px',
                color: '#374151'
              }}>
                {idea.text}
              </span>
              <button
                onClick={() => onDelete(idea.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px'
                }}
                title="削除"
              >
                ✕
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
              <span style={{ 
                flex: 1, 
                fontSize: '14px',
                color: '#6b7280',
                textDecoration: 'line-through'
              }}>
                {idea.text}
              </span>
              <button
                onClick={() => onDelete(idea.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px'
                }}
                title="削除"
              >
                ✕
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

export type { IdeaItem }