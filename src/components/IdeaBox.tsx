'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SubTask } from '@/lib/db/schema'
import { subTaskService } from '@/lib/db/supabase-subtasks'

interface IdeaItem {
  id: string
  text: string
  completed: boolean
  createdAt: string
  category?: string
  importance?: number
}

interface IdeaBoxProps {
  ideas: IdeaItem[]
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onEdit: (id: string, text: string) => void
  onDelete: (id: string) => void
  onUpgradeToTask?: (idea: IdeaItem) => void
  onEditIdea?: (idea: IdeaItem) => void
  relatedTasks?: { [ideaText: string]: { taskId: string; subTasks: SubTask[] } }
}

export function IdeaBox({ ideas, onAdd, onToggle, onEdit, onDelete, onUpgradeToTask, onEditIdea, relatedTasks }: IdeaBoxProps) {
  const [newIdea, setNewIdea] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showIdeaBox, setShowIdeaBox] = useState(true) // デフォルトは表示
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [showShoppingLists, setShowShoppingLists] = useState<{ [ideaId: string]: boolean }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIdea.trim()) return

    onAdd(newIdea.trim())
    setNewIdea('')
    setIsAdding(false)
  }

  const handleEditStart = (idea: IdeaItem) => {
    setEditingId(idea.id)
    setEditingText(idea.text)
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingText('')
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingText.trim() || !editingId) return

    onEdit(editingId, editingText.trim())
    setEditingId(null)
    setEditingText('')
  }

  // 買い物リスト表示の切り替え
  const toggleShoppingList = (ideaId: string) => {
    setShowShoppingLists(prev => ({
      ...prev,
      [ideaId]: !prev[ideaId]
    }))
  }

  // 関連タスクのサブタスクを取得
  const getRelatedSubTasks = (ideaText: string): SubTask[] => {
    console.log('getRelatedSubTasks called for:', ideaText)
    console.log('relatedTasks available:', relatedTasks)
    if (!relatedTasks || !relatedTasks[ideaText]) {
      console.log('No related tasks found for:', ideaText)
      return []
    }
    console.log('Found subtasks for', ideaText, ':', relatedTasks[ideaText].subTasks.length)
    return relatedTasks[ideaText].subTasks
  }


  const pendingIdeas = ideas.filter(idea => !idea.completed)
  const completedIdeas = ideas.filter(idea => idea.completed)

  console.log('IdeaBox: received', ideas.length, 'ideas, pending:', pendingIdeas.length, 'completed:', completedIdeas.length)
  console.log('IdeaBox: relatedTasks:', relatedTasks)
  if (ideas.length > 0) {
    console.log('Sample idea in IdeaBox:', ideas[0])
    // 買い物カテゴリのアイデアのサブタスクチェック
    const shoppingIdeas = ideas.filter(idea => idea.category === '買い物')
    if (shoppingIdeas.length > 0) {
      console.log('Shopping ideas:', shoppingIdeas.length, 'first one:', shoppingIdeas[0])
      console.log('Related subtasks for first shopping idea:', getRelatedSubTasks(shoppingIdeas[0].text))
    }
  }

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
            <div key={idea.id}>
              <div
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

              {editingId === idea.id ? (
                <form onSubmit={handleEditSubmit} style={{ flex: 1, display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    style={{
                      flex: 1,
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '2px 6px'
                    }}
                    autoFocus
                  />
                  <button
                    type="submit"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#10b981',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '2px'
                    }}
                    title="保存"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '2px'
                    }}
                    title="キャンセル"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <span
                  style={{
                    flex: 1,
                    fontSize: '14px',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEditStart(idea)}
                  title="クリックして編集"
                >
                  {idea.text}
                  {/* 買い物カテゴリーの場合は買い物リストボタンを表示 */}
                  {idea.category === '買い物' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleShoppingList(idea.id)
                      }}
                      style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        backgroundColor: showShoppingLists[idea.id] ? '#e0f2fe' : 'white',
                        color: showShoppingLists[idea.id] ? '#0369a1' : '#6b7280',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="買い物リストを表示/非表示"
                    >
                      🛒 {getRelatedSubTasks(idea.text).length || 0}品目
                    </button>
                  )}
                </span>
              )}
              <button
                onClick={() => onEditIdea && onEditIdea(idea)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px'
                }}
                title="編集"
              >
                ✏️
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

              {/* 買い物リスト表示エリア */}
              {idea.category === '買い物' && showShoppingLists[idea.id] && (
                <div style={{
                  marginLeft: '24px',
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#f8fffe',
                  borderRadius: '4px',
                  border: '1px solid #e6fffa'
                }}>
                  {getRelatedSubTasks(idea.text).length > 0 ? (
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                        買い物リスト ({getRelatedSubTasks(idea.text).length}品目)
                      </div>
                      {getRelatedSubTasks(idea.text).map((subTask) => (
                        <div
                          key={subTask.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '2px 0',
                            fontSize: '13px'
                          }}
                        >
                          <span style={{
                            width: '14px',
                            height: '14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '2px',
                            backgroundColor: subTask.completed ? '#10b981' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: 'white'
                          }}>
                            {subTask.completed ? '✓' : ''}
                          </span>
                          <span style={{
                            color: subTask.completed ? '#6b7280' : '#374151',
                            textDecoration: subTask.completed ? 'line-through' : 'none'
                          }}>
                            {subTask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      関連する買い物リストはまだありません
                    </div>
                  )}
                </div>
              )}
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

export type { IdeaItem }