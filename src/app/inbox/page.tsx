'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDatabase } from '@/hooks/useDatabase'
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'
import { ThemedContainer } from '@/components/ThemedContainer'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AuthStatus } from '@/components/AuthStatus'
import { InboxCard } from '@/components/InboxCard'
import { TaskCreateForm2 } from '@/components/TaskCreateForm2'
import { UnifiedTasksService } from '@/lib/db/unified-tasks'
import { parseInboxContent } from '@/lib/utils/parse-inbox-content'
import type { UnifiedTask } from '@/lib/types/unified-task'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TaskTabNavigation } from '@/components/TaskTabNavigation'

export default function InboxPage() {
  const { isInitialized } = useDatabase()
  const unifiedTasks = useUnifiedTasks(isInitialized)
  const router = useRouter()

  const [newContent, setNewContent] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingInbox, setEditingInbox] = useState<UnifiedTask | null>(null)
  const [activeTab, setActiveTab] = useState<'input' | 'manage'>('input') // タブ管理

  // ページタイトル
  useEffect(() => {
    document.title = 'TASUKU - Inbox'
  }, [])

  // Inboxアイテムをフィルタリング
  const inboxItems = unifiedTasks.tasks.filter(task => task.task_type === 'INBOX')
  const unprocessedItems = inboxItems.filter(task => !task.completed)
  const processedItems = inboxItems.filter(task => task.completed)

  // クイック追加
  const addToInbox = useCallback(async () => {
    if (!newContent.trim() || isAdding) return

    setIsAdding(true)
    try {
      const parsed = parseInboxContent(newContent)

      const displayNumber = await UnifiedTasksService.generateDisplayNumber()

      await unifiedTasks.createTask({
        title: parsed.title,
        memo: parsed.memo || undefined,
        urls: parsed.urls.length > 0 ? parsed.urls : undefined,
        task_type: 'INBOX',
        due_date: '2999-12-31', // 期限なし
        display_number: displayNumber,
        completed: false,
        archived: false
      })

      setNewContent('')
      console.log('✅ Inboxに追加しました:', parsed.title)

      // 追加後、管理タブに自動切り替え
      setActiveTab('manage')
    } catch (error) {
      console.error('❌ Inbox追加エラー:', error)
    } finally {
      setIsAdding(false)
    }
  }, [newContent, isAdding, unifiedTasks])

  // タスク化（編集フォームを開く）
  const convertToTask = useCallback((item: UnifiedTask) => {
    setEditingInbox(item)
    setShowTaskForm(true)
  }, [])

  // 削除
  const deleteItem = useCallback(async (id: string) => {
    try {
      await unifiedTasks.deleteTask(id)
      console.log('✅ Inboxアイテムを削除しました')
    } catch (error) {
      console.error('❌ 削除エラー:', error)
    }
  }, [unifiedTasks])

  // 処理済みトグル
  const toggleComplete = useCallback(async (id: string, completed: boolean) => {
    try {
      await unifiedTasks.updateTask(id, { completed })
      console.log(`✅ Inbox処理済み状態を更新: ${completed ? '処理済み' : '未処理'}`)
    } catch (error) {
      console.error('❌ 処理済み更新エラー:', error)
    }
  }, [unifiedTasks])

  // Inbox編集
  const editItem = useCallback(async (id: string, title: string, memo: string, urls: string[]) => {
    try {
      await unifiedTasks.updateTask(id, { title, memo, urls })
      console.log('✅ Inboxアイテムを更新しました')
    } catch (error) {
      console.error('❌ 更新エラー:', error)
    }
  }, [unifiedTasks])

  // タスク作成（Inbox → 通常タスク）
  const handleCreateTask = useCallback(async (
    title: string,
    memo: string,
    dueDate: string,
    category?: string,
    importance?: number,
    urls?: string[],
    attachment?: { file_name: string; file_type: string; file_size: number; file_data: string },
    shoppingItems?: string[],
    startTime?: string,
    endTime?: string
  ) => {
    if (!editingInbox) return

    try {
      // Inboxアイテムを通常タスクに変換
      await unifiedTasks.updateTask(editingInbox.id, {
        task_type: 'NORMAL',
        title,
        memo,
        due_date: dueDate,
        category,
        importance,
        urls,
        start_time: startTime,
        end_time: endTime,
        attachment,
        completed: false // タスク化時は未完了に
      })

      // 買い物リストがある場合、サブタスクとして追加
      if (category === '買い物' && shoppingItems && shoppingItems.length > 0) {
        const subtaskPromises = shoppingItems
          .filter(item => item.trim())
          .map(item => unifiedTasks.createSubtask(editingInbox.id, item.trim()))

        await Promise.all(subtaskPromises)
      }

      console.log('✅ Inbox → タスク変換完了')
      setShowTaskForm(false)
      setEditingInbox(null)
    } catch (error) {
      console.error('❌ タスク変換エラー:', error)
    }
  }, [editingInbox, unifiedTasks])

  // タブ切り替え時にクイック入力内容を自動保存
  const handleBeforeNavigate = useCallback(async () => {
    if (newContent.trim()) {
      console.log('📥 タブ切り替え前にクイック入力を自動保存します...')
      await addToInbox()
    }
  }, [newContent, addToInbox])

  return (
    <ThemedContainer>
      <div style={{
        padding: '8px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* ヘッダー */}
        <header style={{ marginBottom: '8px' }}>
          {/* ツールタイトル */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              margin: '0',
              color: '#1f2937',
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              TASUKU
              <span style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                padding: '2px 8px',
                borderRadius: '12px',
                letterSpacing: 'normal'
              }}>
                β版
              </span>
            </h1>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }} className="inbox-header">
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0' }} className="inbox-title">
              📥 Inbox
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} className="inbox-buttons">
              <ThemeToggle />
              <a
                href="/today"
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                className="inbox-button"
              >
                📅 今日
              </a>
              <a
                href="/search"
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                className="inbox-button"
              >
                🔍 検索
              </a>
              <a
                href="/statistics"
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                className="inbox-button"
              >
                📊 統計
              </a>
              <a
                href="/templates"
                style={{
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                className="inbox-button"
              >
                ⚙️ テンプレート
              </a>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              margin: '0'
            }}>
              思いついたこと、URL、メモなど何でも放り込んでください。後でタスクに整理できます。
            </p>
          </div>

          {/* タブナビゲーション */}
          <TaskTabNavigation onBeforeNavigate={handleBeforeNavigate} />

          {/* 認証状態表示 */}
          <div style={{ marginBottom: '12px' }}>
            <AuthStatus />
          </div>
        </header>

        {/* タブ切り替え */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '2px solid var(--border)'
        }}>
          <button
            onClick={() => setActiveTab('input')}
            style={{
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: '600',
              background: 'transparent',
              color: activeTab === 'input' ? '#3b82f6' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === 'input' ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            📝 クイック入力
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            style={{
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: '600',
              background: 'transparent',
              color: activeTab === 'manage' ? '#3b82f6' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === 'manage' ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px',
              position: 'relative'
            }}
          >
            📋 管理
            {unprocessedItems.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: '#ef4444',
                color: 'white',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '10px',
                minWidth: '18px',
                textAlign: 'center'
              }}>
                {unprocessedItems.length}
              </span>
            )}
          </button>
        </div>

        {/* タブコンテンツ: クイック入力 */}
        {activeTab === 'input' && (
          <div style={{
            background: 'var(--bg-primary)',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  addToInbox()
                }
              }}
              placeholder="思いついたことをメモ...&#10;&#10;例:&#10;・YouTube動画を見る https://youtube.com/watch?v=...&#10;・記事を読む https://example.com/article&#10;・買い物リスト確認"
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                fontSize: '14px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: '1.5',
                boxSizing: 'border-box'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '12px'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Ctrl+Enter で追加 | Chrome拡張でさらに便利に
              </div>
              <button
                onClick={addToInbox}
                disabled={!newContent.trim() || isAdding}
                style={{
                  padding: '10px 20px',
                  fontSize: '15px',
                  fontWeight: '600',
                  background: newContent.trim() ? '#3b82f6' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: newContent.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
              >
                {isAdding ? '追加中...' : '📥 Inboxに追加'}
              </button>
            </div>
          </div>
        )}

        {/* タブコンテンツ: 管理 */}
        {activeTab === 'manage' && (
          <div>
            {/* 未処理アイテム */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 16px 0',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📬 未処理
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  background: '#3b82f6',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {unprocessedItems.length}
                </span>
              </h2>

              {unprocessedItems.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  fontSize: '14px'
                }}>
                  Inboxは空です。思いついたことを追加してみましょう！
                  <div style={{ marginTop: '16px' }}>
                    <button
                      onClick={() => setActiveTab('input')}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      📝 クイック入力へ
                    </button>
                  </div>
                </div>
              ) : (
                unprocessedItems.map(item => (
                  <InboxCard
                    key={item.id}
                    item={item}
                    onConvertToTask={convertToTask}
                    onDelete={deleteItem}
                    onToggleComplete={toggleComplete}
                    onEdit={editItem}
                  />
                ))
              )}
            </div>

            {/* 処理済みアイテム */}
            {processedItems.length > 0 && (
              <div>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ✅ 処理済み
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    background: '#6b7280',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {processedItems.length}
                  </span>
                </h2>

                {processedItems.map(item => (
                  <InboxCard
                    key={item.id}
                    item={item}
                    onConvertToTask={convertToTask}
                    onDelete={deleteItem}
                    onToggleComplete={toggleComplete}
                    onEdit={editItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* タスク作成フォーム - Inboxの詳細情報を表示 */}
        {showTaskForm && editingInbox && (
          <div style={{
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px 8px 0 0',
            padding: '16px',
            boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 100,
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f3f4f6', borderRadius: '6px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Inboxアイテムをタスクに変換</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                タイトル: {editingInbox.title}
                {editingInbox.urls && editingInbox.urls.length > 0 && (
                  <div style={{ marginTop: '4px' }}>URL: {editingInbox.urls.length}件</div>
                )}
              </div>
            </div>
            <TaskCreateForm2
              isVisible={true}
              initialTitle={editingInbox.title}
              initialMemo={editingInbox.memo || ''}
              initialUrls={editingInbox.urls || []}
              onSubmitRegular={(title, memo, dueDate, category, importance, urls, attachment, shoppingItems, startTime, endTime) => {
                handleCreateTask(
                  title,
                  memo,
                  dueDate,
                  category,
                  importance,
                  urls,
                  attachment,
                  shoppingItems,
                  startTime,
                  endTime
                )
              }}
              onSubmitRecurring={async () => {
                // 繰り返しタスクには対応しない（必要なら後で実装）
                console.log('繰り返しタスクは未対応')
              }}
              onAddToIdeas={async () => {
                // アイデアには対応しない
                console.log('アイデアは未対応')
              }}
              onCancel={() => {
                setShowTaskForm(false)
                setEditingInbox(null)
              }}
            />
          </div>
        )}
      </div>
    </ThemedContainer>
  )
}
