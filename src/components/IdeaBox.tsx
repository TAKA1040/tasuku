'use client'

import React, { memo, useState } from 'react'
import type { UnifiedTask } from '@/lib/types/unified-task'
import { DisplayNumberUtils } from '@/lib/types/unified-task'
import { ImportanceDot } from '@/components/ImportanceDot'

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

  // 統一ルール: カテゴリ分けせずに全て表示
  const allTasks = allNoDateTasks

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
          {/* 統一表示: すべての期限なしタスク */}
          {allTasks.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                📝 期限なしタスク
                <span style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: 'normal'
                }}>
                  {allTasks.length}件
                </span>
              </div>

              {/* 統一テーブル形式 */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '60px' }}>番号</th>
                    <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '40px' }}>完了</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '60px' }}>種別</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>タイトル</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '80px' }}>カテゴリ</th>
                    <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '90px' }}>期限</th>
                    <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '80px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {allTasks.map((task, index) => (
                    <tr
                      key={task.id}
                      style={{
                        borderTop: index > 0 ? '1px solid #f3f4f6' : 'none',
                        backgroundColor: task.category === '買い物' ? '#f0f9ff' : '#fef7ff'
                      }}
                    >
                      {/* 統一番号表示 */}
                      <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px', fontFamily: 'monospace' }}>
                        <span style={{
                          padding: '2px 4px',
                          borderRadius: '3px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          fontWeight: '600'
                        }}>
                          {task.display_number ? DisplayNumberUtils.formatCompact(task.display_number) : '-'}
                        </span>
                      </td>

                      {/* 完了チェックボックス */}
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          onClick={() => onToggle(task.id)}
                          style={{
                            width: '18px',
                            height: '18px',
                            border: task.completed ? '2px solid #8b5cf6' : '2px solid #d1d5db',
                            borderRadius: '4px',
                            backgroundColor: task.completed ? '#8b5cf6' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            transition: 'all 0.15s ease'
                          }}
                          title="アイデアを完了する"
                        >
                          {task.completed && '✓'}
                        </button>
                      </td>

                      {/* 種別 */}
                      <td style={{ padding: '8px', fontSize: '11px', color: '#6b7280' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#faf5ff',
                          color: '#7c3aed',
                          fontSize: '9px',
                          fontWeight: '500'
                        }}>
                          アイデア
                        </span>
                      </td>

                      {/* タイトル */}
                      <td style={{ padding: '8px', fontSize: '14px', fontWeight: '500' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* 重要度インディケーター */}
                          {task.importance && (
                            <ImportanceDot importance={task.importance} />
                          )}
                          <span style={{
                            textDecoration: task.completed ? 'line-through' : 'none',
                            color: task.completed ? '#9ca3af' : 'inherit'
                          }}>
                            {task.title}
                          </span>
                        </div>
                      </td>

                      {/* カテゴリ */}
                      <td style={{ padding: '8px', fontSize: '12px', color: '#6b7280' }}>
                        {task.category || '未分類'}
                      </td>

                      {/* 期限 */}
                      <td style={{ padding: '8px', fontSize: '11px', color: '#374151', textAlign: 'center' }}>
                        <span style={{ color: '#9ca3af', fontSize: '10px' }}>なし</span>
                      </td>

                      {/* 操作 */}
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                          {/* 編集ボタン */}
                          <button
                            onClick={() => {
                              const newText = prompt('アイデアを編集:', task.title);
                              if (newText && newText.trim()) {
                                onEdit(task.id, newText.trim());
                              }
                            }}
                            style={{
                              padding: '4px',
                              fontSize: '12px',
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
                            title="アイデアを編集"
                          >
                            ✏️
                          </button>

                          {/* 削除ボタン */}
                          <button
                            onClick={() => {
                              if (confirm('このアイデアを削除しますか？')) {
                                onDelete(task.id);
                              }
                            }}
                            style={{
                              padding: '4px',
                              fontSize: '12px',
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
                            title="アイデアを削除"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            📝 自由なアイデア帳
            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: 'normal'
            }}>
              {pendingIdeas.length}件
            </span>
          </div>

          {/* 自由なアイデアのテーブル */}
          {pendingIdeas.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '60px' }}>番号</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '40px' }}>完了</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '60px' }}>種別</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>タイトル</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '80px' }}>カテゴリ</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '90px' }}>期限</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '80px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {pendingIdeas.map((idea, index) => (
                  <tr
                    key={idea.id}
                    style={{
                      borderTop: index > 0 ? '1px solid #f3f4f6' : 'none',
                      backgroundColor: '#fef7ff'
                    }}
                  >
                    {/* 統一番号表示 */}
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px', fontFamily: 'monospace' }}>
                      <span style={{
                        padding: '2px 4px',
                        borderRadius: '3px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        fontWeight: '600'
                      }}>
                        {idea.display_number ? DisplayNumberUtils.formatCompact(idea.display_number) : '-'}
                      </span>
                    </td>

                    {/* 完了チェックボックス */}
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        onClick={() => onToggle(idea.id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          border: idea.completed ? '2px solid #8b5cf6' : '2px solid #d1d5db',
                          borderRadius: '4px',
                          backgroundColor: idea.completed ? '#8b5cf6' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          transition: 'all 0.15s ease'
                        }}
                        title="アイデアを完了する"
                      >
                        {idea.completed && '✓'}
                      </button>
                    </td>

                    {/* 種別 */}
                    <td style={{ padding: '8px', fontSize: '11px', color: '#6b7280' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#faf5ff',
                        color: '#7c3aed',
                        fontSize: '9px',
                        fontWeight: '500'
                      }}>
                        アイデア
                      </span>
                    </td>

                    {/* タイトル */}
                    <td style={{ padding: '8px', fontSize: '14px', fontWeight: '500' }}>
                      <span style={{
                        textDecoration: idea.completed ? 'line-through' : 'none',
                        color: idea.completed ? '#9ca3af' : 'inherit'
                      }}>
                        {idea.text}
                      </span>
                    </td>

                    {/* カテゴリ */}
                    <td style={{ padding: '8px', fontSize: '12px', color: '#6b7280' }}>
                      アイデア
                    </td>

                    {/* 期限 */}
                    <td style={{ padding: '8px', fontSize: '11px', color: '#374151', textAlign: 'center' }}>
                      <span style={{ color: '#9ca3af', fontSize: '10px' }}>なし</span>
                    </td>

                    {/* 操作 */}
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                        {/* タスクに昇格ボタン */}
                        <button
                          onClick={() => onUpgradeToTask && onUpgradeToTask(idea)}
                          style={{
                            padding: '4px',
                            fontSize: '12px',
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
                          title="タスクに昇格"
                        >
                          📋
                        </button>

                        {/* 削除ボタン */}
                        <button
                          onClick={() => {
                            if (confirm('このアイデアを削除しますか？')) {
                              onDelete(idea.id);
                            }
                          }}
                          style={{
                            padding: '4px',
                            fontSize: '12px',
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
                          title="アイデアを削除"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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