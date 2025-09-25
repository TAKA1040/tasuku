'use client'

import { useState, useEffect, useMemo } from 'react'
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'
import { useDatabase } from '@/hooks/useDatabase'
import { ThemedContainer } from '@/components/ThemedContainer'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AuthStatus } from '@/components/AuthStatus'
import type { UnifiedTask } from '@/lib/types/unified-task'

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    tasks,
    loading: isLoading,
    loadTasks,
    completeTask,
    uncompleteTask,
    updateTask: updateUnifiedTask,
    deleteTask: deleteUnifiedTask
  } = useUnifiedTasks()

  // フィルタリングされたタスクを計算
  const filteredTasks = useMemo(() => {
    if (!tasks?.length) return []

    return tasks.filter(task => {
      // 検索語によるフィルタリング
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const titleMatch = task.title?.toLowerCase().includes(searchLower)
        const memoMatch = task.memo?.toLowerCase().includes(searchLower)
        const categoryMatch = task.category?.toLowerCase().includes(searchLower)

        if (!titleMatch && !memoMatch && !categoryMatch) {
          return false
        }
      }

      // カテゴリによるフィルタリング
      if (categoryFilter !== 'all' && task.category !== categoryFilter) {
        return false
      }

      // タイプによるフィルタリング（統一タスクではtask_typeフィールドを使用）
      if (typeFilter !== 'all') {
        let taskType = 'task' // デフォルト
        if (task.task_type === 'IDEA') taskType = 'idea'
        else if (task.task_type === 'RECURRING') taskType = 'recurring'

        if (taskType !== typeFilter) {
          return false
        }
      }

      // ステータスによるフィルタリング
      if (statusFilter === 'completed' && !task.completed) {
        return false
      }
      if (statusFilter === 'incomplete' && task.completed) {
        return false
      }

      return true
    })
  }, [tasks, searchTerm, categoryFilter, typeFilter, statusFilter])

  // ユニークなカテゴリを取得
  const categories = useMemo(() => {
    if (!tasks?.length) return []
    const categoriesSet = new Set(tasks.map(task => task.category).filter(Boolean) as string[])
    const uniqueCategories = Array.from(categoriesSet)
    return uniqueCategories.sort()
  }, [tasks])

  // タスクの完了状態を切り替える
  const toggleTaskCompletion = async (task: UnifiedTask) => {
    try {
      if (task.completed) {
        await uncompleteTask(task.id)
      } else {
        await completeTask(task.id)
      }
    } catch (error) {
      console.error('タスクの更新に失敗しました:', error)
    }
  }

  // 個別のタスクを削除
  const deleteTaskItem = async (task: UnifiedTask) => {
    if (!confirm(`「${task.title || '無題'}」を削除しますか？`)) return

    try {
      await deleteUnifiedTask(task.id)
    } catch (error) {
      console.error('タスクの削除に失敗しました:', error)
    }
  }

  // 選択されたアイテムをまとめて削除
  const deleteSelectedItems = async () => {
    if (selectedItems.size === 0) return

    if (!confirm(`選択した${selectedItems.size}件のアイテムを削除しますか？`)) return

    setIsDeleting(true)
    try {
      const selectedTasks = filteredTasks.filter(task => {
        const taskType = task.task_type === 'IDEA' ? 'idea' :
                        task.task_type === 'RECURRING' ? 'recurring' : 'task'
        return selectedItems.has(`${taskType}-${task.id}`)
      })

      for (const task of selectedTasks) {
        await deleteUnifiedTask(task.id)
      }

      setSelectedItems(new Set())
    } catch (error) {
      console.error('一括削除に失敗しました:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // 全選択/全解除の切り替え
  const toggleSelectAll = () => {
    if (selectedItems.size === filteredTasks.length) {
      setSelectedItems(new Set())
    } else {
      const allIds = new Set(filteredTasks.map(task => {
        const taskType = task.task_type === 'IDEA' ? 'idea' :
                        task.task_type === 'RECURRING' ? 'recurring' : 'task'
        return `${taskType}-${task.id}`
      }))
      setSelectedItems(allIds)
    }
  }

  // 個別の選択切り替え
  const toggleSelectItem = (task: UnifiedTask) => {
    const taskType = task.task_type === 'IDEA' ? 'idea' :
                    task.task_type === 'RECURRING' ? 'recurring' : 'task'
    const itemId = `${taskType}-${task.id}`
    const newSelected = new Set(selectedItems)

    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }

    setSelectedItems(newSelected)
  }

  return (
    <ThemedContainer>
      <div style={{ padding: '16px', minHeight: '100vh' }}>
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>
              🔍 検索
            </h1>
            <a
              href="/today"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              ← 今日に戻る
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle />
            <AuthStatus />
          </div>
        </div>

        {/* 検索・フィルターセクション */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          {/* 検索ボックス */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="タスク、メモ、カテゴリから検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '16px'
              }}
            />
          </div>

          {/* フィルター */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px'
          }}>
            {/* カテゴリフィルター */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">すべてのカテゴリ</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* タイプフィルター */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">すべてのタイプ</option>
              <option value="task">タスク</option>
              <option value="recurring">繰り返しタスク</option>
              <option value="idea">アイデア</option>
            </select>

            {/* ステータスフィルター */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">すべてのステータス</option>
              <option value="completed">完了済み</option>
              <option value="incomplete">未完了</option>
            </select>
          </div>
        </div>

        {/* 検索結果 */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0' }}>
                検索結果
              </h2>
              <span style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                background: 'var(--bg-secondary)',
                padding: '4px 8px',
                borderRadius: '12px'
              }}>
                {filteredTasks.length}件
              </span>
            </div>

            {/* 一括操作ボタン */}
            {filteredTasks.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={toggleSelectAll}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  {selectedItems.size === filteredTasks.length ? '全解除' : '全選択'}
                </button>

                {selectedItems.size > 0 && (
                  <button
                    onClick={deleteSelectedItems}
                    disabled={isDeleting}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#ef4444',
                      color: 'white',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      opacity: isDeleting ? 0.6 : 1
                    }}
                  >
                    {isDeleting ? '削除中...' : `${selectedItems.size}件を削除`}
                  </button>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              読み込み中...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
              borderRadius: '12px'
            }}>
              {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all'
                ? '条件に一致するアイテムが見つかりませんでした'
                : 'データが見つかりませんでした'
              }
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {/* テーブルヘッダー */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '40px 60px 80px 1fr 150px 100px 80px',
                gap: '8px',
                padding: '12px',
                background: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border)',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)'
              }}>
                <div>選択</div>
                <div>状態</div>
                <div>タイプ</div>
                <div>タイトル</div>
                <div>メモ</div>
                <div>期限</div>
                <div>操作</div>
              </div>

              {/* テーブルボディ */}
              {filteredTasks.map((task, index) => {
                const taskType = task.task_type === 'IDEA' ? 'idea' :
                                task.task_type === 'RECURRING' ? 'recurring' : 'task'
                const itemId = `${taskType}-${task.id}`
                const isSelected = selectedItems.has(itemId)

                return (
                  <div
                    key={itemId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 60px 80px 1fr 150px 100px 80px',
                      gap: '8px',
                      padding: '12px',
                      borderBottom: index < filteredTasks.length - 1 ? '1px solid var(--border)' : 'none',
                      background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      opacity: task.completed ? 0.7 : 1,
                      alignItems: 'center',
                      fontSize: '13px'
                    }}
                  >
                    {/* 選択チェックボックス */}
                    <div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(task)}
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer'
                        }}
                      />
                    </div>

                    {/* 状態 */}
                    <div>
                      {task.completed ? (
                        <span style={{
                          background: '#10b981',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '10px'
                        }}>
                          完了
                        </span>
                      ) : (
                        <span style={{
                          background: '#6b7280',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '10px'
                        }}>
                          未完
                        </span>
                      )}
                    </div>

                    {/* タイプ */}
                    <div>
                      <span style={{
                        background: taskType === 'idea' ? '#8b5cf6' :
                                   taskType === 'recurring' ? '#10b981' : '#3b82f6',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        {taskType === 'idea' ? 'アイデア' :
                         taskType === 'recurring' ? '繰返' : 'タスク'}
                      </span>
                    </div>

                    {/* タイトル */}
                    <div style={{
                      textDecoration: task.completed ? 'line-through' : 'none',
                      fontWeight: '500'
                    }}>
                      <div>{task.title || '無題'}</div>
                      {task.category && (
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          marginTop: '2px'
                        }}>
                          📁 {task.category}
                        </div>
                      )}
                    </div>

                    {/* メモ */}
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {task.memo || '-'}
                    </div>

                    {/* 期限 */}
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)'
                    }}>
                      {task.due_date && task.due_date !== '2999-12-31' ? task.due_date : '-'}
                    </div>

                    {/* 操作ボタン */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => toggleTaskCompletion(task)}
                        style={{
                          padding: '4px 6px',
                          fontSize: '11px',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          background: task.completed ? '#10b981' : 'var(--bg-primary)',
                          color: task.completed ? 'white' : 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                        title={task.completed ? '未完了に戻す' : '完了にする'}
                      >
                        {task.completed ? '↩️' : '✓'}
                      </button>

                      <button
                        onClick={() => deleteTaskItem(task)}
                        style={{
                          padding: '4px 6px',
                          fontSize: '11px',
                          border: 'none',
                          borderRadius: '4px',
                          background: '#ef4444',
                          color: 'white',
                          cursor: 'pointer'
                        }}
                        title="削除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </ThemedContainer>
  )
}