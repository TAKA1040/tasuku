'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
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
  const [sortOrder, setSortOrder] = useState('newest') // 新しい順をデフォルト

  const { isInitialized, error: _dbError } = useDatabase()

  const {
    tasks,
    loading: isLoading,
    loadTasks,
    completeTask,
    uncompleteTask,
    updateTask: _updateUnifiedTask,
    deleteTask: deleteUnifiedTask
  } = useUnifiedTasks(true) // autoLoadを明示的に有効化

  // データベース初期化後にタスクを明示的にリロード
  useEffect(() => {
    if (isInitialized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Database initialized, reloading tasks for search page')
      }
      loadTasks(true) // 強制リロード
    }
  }, [isInitialized, loadTasks])

  // フィルタリング＆ソートされたタスクを計算
  const filteredTasks = useMemo(() => {
    if (!tasks?.length) return []

    // フィルタリング処理
    const filtered = tasks.filter(task => {
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

    // ソート処理
    return filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          // 新しい順（作成日時降順）
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()

        case 'oldest':
          // 古い順（作成日時昇順）
          return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()

        case 'title':
          // タイトル順（あいうえお順）
          return (a.title || '').localeCompare(b.title || '', 'ja')

        case 'due_date':
          // 期限順（近い順、期限なしは最後）
          const aDueDate = a.due_date && a.due_date !== '2999-12-31' ? a.due_date : '9999-12-31'
          const bDueDate = b.due_date && b.due_date !== '2999-12-31' ? b.due_date : '9999-12-31'
          return aDueDate.localeCompare(bDueDate)

        case 'type':
          // タイプ順（タスク > 繰り返し > アイデア）
          const typeOrder = { 'NORMAL': 0, 'TASK': 0, 'RECURRING': 1, 'IDEA': 2 }
          const aType = typeOrder[a.task_type as keyof typeof typeOrder] ?? 3
          const bType = typeOrder[b.task_type as keyof typeof typeOrder] ?? 3
          return aType - bType

        default:
          return 0
      }
    })
  }, [tasks, searchTerm, categoryFilter, typeFilter, statusFilter, sortOrder])

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
      <div style={{
        padding: '16px',
        minHeight: '100vh',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '70%'
      }}>
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/today" style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: '#3b82f6',
              textDecoration: 'none',
              fontSize: '14px',
              padding: '8px 16px',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              transition: 'all 0.2s'
            }}>
              ← ホームに戻る
            </Link>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
              🔍 検索
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => loadTasks(true)}
              disabled={isLoading}
              style={{
                padding: '6px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
              title="最新データを読み込み"
            >
              {isLoading ? '🔄' : '🔄'} 更新
            </button>
            <ThemeToggle />
            <AuthStatus />
          </div>
        </div>

        {/* 絞り込み */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '2px solid #d1d5db',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            margin: '0 0 20px 0',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingBottom: '12px',
            borderBottom: '2px solid #e5e7eb'
          }}>
            🔍 絞り込み
          </h3>
          {/* 検索ボックス */}
          <div style={{
            marginBottom: '16px',
            background: 'var(--bg-primary)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '8px'
            }}>
              キーワード検索
            </label>
            <input
              type="text"
              placeholder="タスク、メモ、カテゴリから検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '16px'
              }}
            />
          </div>

          {/* フィルター */}
          <div style={{
            background: 'var(--bg-primary)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '12px'
            }}>
              詳細フィルター
            </label>
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
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  cursor: 'pointer'
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
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  cursor: 'pointer'
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
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="all">すべてのステータス</option>
                <option value="completed">完了済み</option>
                <option value="incomplete">未完了</option>
              </select>

              {/* ソート順フィルター */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="newest">📅 新しい順</option>
                <option value="oldest">📅 古い順</option>
                <option value="title">🔤 タイトル順</option>
                <option value="due_date">⏰ 期限順</option>
                <option value="type">📁 タイプ順</option>
              </select>
            </div>
          </div>
        </div>

        {/* 検索結果 */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '2px solid var(--border)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0' }}>
                検索結果
              </h3>
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
            <>
              <style>{`
                @media (max-width: 640px) {
                  .desktop-search-table { display: none; }
                  .mobile-search-cards { display: block; }
                }
                @media (min-width: 641px) {
                  .desktop-search-table { display: block; }
                  .mobile-search-cards { display: none; }
                }
              `}</style>

              {/* デスクトップ版テーブル */}
              <div className="desktop-search-table" style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {/* テーブルヘッダー */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 60px 80px 1fr 120px 80px 90px 80px',
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
                  <div>作成日時</div>
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
                        gridTemplateColumns: '40px 60px 80px 1fr 120px 80px 90px 80px',
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

                    {/* 作成日時 */}
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)'
                    }}>
                      {task.created_at ? new Date(task.created_at).toLocaleDateString('ja-JP', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
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

              {/* モバイル版カード表示 */}
              <div className="mobile-search-cards">
                {filteredTasks.map((task, index) => {
                  const taskType = task.task_type === 'IDEA' ? 'idea' :
                                  task.task_type === 'RECURRING' ? 'recurring' : 'task'
                  const itemId = `${taskType}-${task.id}`
                  const isSelected = selectedItems.has(itemId)

                  return (
                    <div
                      key={itemId}
                      style={{
                        padding: '12px',
                        borderBottom: index < filteredTasks.length - 1 ? '1px solid var(--border)' : 'none',
                        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)',
                        opacity: task.completed ? 0.7 : 1
                      }}
                    >
                      {/* 上段: チェックボックス・タイトル・操作ボタン */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        {/* チェックボックス */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItemSelection(itemId)}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            marginTop: '2px'
                          }}
                        />

                        {/* タイトル */}
                        <div style={{
                          flex: 1,
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'var(--text-primary)',
                          wordBreak: 'break-word'
                        }}>
                          {task.title}
                        </div>

                        {/* 操作ボタン */}
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                          <button
                            onClick={() => toggleTaskCompletion(task)}
                            style={{
                              padding: '6px 10px',
                              fontSize: '14px',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              background: task.completed ? '#10b981' : 'var(--bg-primary)',
                              color: task.completed ? 'white' : 'var(--text-primary)',
                              cursor: 'pointer'
                            }}
                          >
                            {task.completed ? '↩️' : '✓'}
                          </button>
                          <button
                            onClick={() => deleteTaskItem(task)}
                            style={{
                              padding: '6px 10px',
                              fontSize: '14px',
                              border: 'none',
                              borderRadius: '4px',
                              background: '#ef4444',
                              color: 'white',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* 下段: タイプ・メモ・期限・日時バッジ */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        fontSize: '11px',
                        paddingLeft: '26px'
                      }}>
                        {/* タイプ */}
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: task.task_type === 'IDEA' ? '#fef3c7' :
                                    task.task_type === 'RECURRING' ? '#dbeafe' : '#e0e7ff',
                          color: task.task_type === 'IDEA' ? '#92400e' :
                                task.task_type === 'RECURRING' ? '#1e40af' : '#3730a3',
                          fontWeight: '500'
                        }}>
                          {task.task_type === 'IDEA' ? 'アイデア' :
                           task.task_type === 'RECURRING' ? '繰り返し' : 'タスク'}
                        </span>

                        {/* 状態 */}
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: task.completed ? '#d1fae5' : '#fee2e2',
                          color: task.completed ? '#065f46' : '#991b1b',
                          fontWeight: '500'
                        }}>
                          {task.completed ? '完了' : '未完了'}
                        </span>

                        {/* メモ */}
                        {task.memo && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: '#f3f4f6',
                            color: '#6b7280',
                            maxWidth: '150px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            📝 {task.memo}
                          </span>
                        )}

                        {/* 期限 */}
                        {task.due_date && task.due_date !== '2999-12-31' && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: '#fef3c7',
                            color: '#92400e'
                          }}>
                            ⏰ {task.due_date}
                          </span>
                        )}

                        {/* 作成日時 */}
                        {task.created_at && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: '#f3f4f6',
                            color: '#6b7280'
                          }}>
                            📅 {new Date(task.created_at).toLocaleDateString('ja-JP', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </ThemedContainer>
  )
}