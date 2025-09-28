'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDatabase } from '@/hooks/useDatabase'
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'
import { useTaskGenerator } from '@/hooks/useTaskGenerator'
import { getTodayJST, formatDateForDisplay } from '@/lib/utils/date-jst'
import { IncompleteTasksToggle } from '@/components/IncompleteTasksToggle'
import { TaskEditForm } from '@/components/TaskEditForm'
import { TaskCreateForm2 } from '@/components/TaskCreateForm2'
import type { UnifiedTask } from '@/lib/types/unified-task'
import { ThemedContainer } from '@/components/ThemedContainer'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AuthStatus } from '@/components/AuthStatus'
import { UnifiedTasksTable } from '@/components/UnifiedTasksTable'
import { SubTask } from '@/lib/types/unified-task'
import { UnifiedTasksService } from '@/lib/db/unified-tasks'

export default function TodayPage() {
  const { isInitialized, error } = useDatabase()

  // 統一データベースフック
  const unifiedTasks = useUnifiedTasks(isInitialized)

  // 自動タスク生成フック（データベース初期化後に実行）
  const { isGenerating, lastError: generationError, generateMissingTasks } = useTaskGenerator(isInitialized)

  // ページタイトルを設定
  useEffect(() => {
    document.title = 'TASUKU - 今日のタスク'
  }, [])


  // 買い物リスト（サブタスク）管理 - データベース連携
  const [shoppingSubTasks, setShoppingSubTasks] = useState<{[taskId: string]: SubTask[]}>({})
  const [expandedShoppingLists, setExpandedShoppingLists] = useState<{[taskId: string]: boolean}>({})

  // ソート設定状態（今日のタスク用）
  const [sortMode, setSortMode] = useState<'priority' | 'time'>('priority')

  // まず生データを統一形式に変換
  const rawUnifiedData = useMemo(() => {
    console.log('🔧 rawUnifiedData useMemo 実行')
    if (!isInitialized || unifiedTasks.loading) return []

    const allTasks = unifiedTasks.tasks
    return allTasks.map((task) => ({
      ...task,
      // 統一ルール: due_date で種別を判断
      dataType: task.due_date === '2999-12-31' ? 'idea' as const :
                task.recurring_pattern ? 'recurring' as const : 'task' as const,
      displayTitle: task.recurring_pattern ? `🔄 ${task.title}` :
                    task.due_date === '2999-12-31' ? `💡 ${task.title}` : task.title,
      displayCategory: task.category || (task.recurring_pattern ? '繰り返し' : task.due_date === '2999-12-31' ? 'アイデア' : '未分類')
    }))
  }, [isInitialized, unifiedTasks.tasks, unifiedTasks.loading])

  // 次にソートを適用
  const allUnifiedData = useMemo(() => {
    console.log('🚀🚀🚀 allUnifiedData ソート処理実行！')
    console.log('🚀 sortMode:', sortMode)
    console.log('🚀 rawUnifiedData.length:', rawUnifiedData.length)

    if (rawUnifiedData.length === 0) return []

    console.log('🔄 ソート前の順番:', rawUnifiedData.map(t => `${t.display_number}:${t.title.substring(0,10)}(imp:${t.importance},start:${t.start_time})`))

    const sortedData = [...rawUnifiedData].sort((a, b) => {
      // 完了状態による優先度（未完了が上、完了が下）
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }

      // 同じ完了状態内でのソート
      // 時間軸ソートの場合
      if (sortMode === 'time') {
        const startTimeA = a.start_time || '99:99' // 未設定は最後
        const startTimeB = b.start_time || '99:99'

        // 両方とも時間設定がある場合は時間順
        if (startTimeA !== '99:99' && startTimeB !== '99:99') {
          return startTimeA.localeCompare(startTimeB)
        }

        // 一方のみ時間設定がある場合は設定済みを優先
        if (startTimeA !== '99:99' && startTimeB === '99:99') {
          return -1
        }
        if (startTimeA === '99:99' && startTimeB !== '99:99') {
          return 1
        }

        // 両方とも時間未設定の場合は優先度順
        const priorityA = a.importance || 0
        const priorityB = b.importance || 0
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }
        return (a.display_number || '').localeCompare(b.display_number || '')
      }

      // 優先度ソート（従来通り）
      const priorityA = a.importance || 0
      const priorityB = b.importance || 0

      // 優先度が異なる場合は優先度で比較（高い方が先）
      if (priorityA !== priorityB) {
        return priorityB - priorityA
      }

      // 優先度が同じ場合は統一番号順
      return (a.display_number || '').localeCompare(b.display_number || '')
    })

    console.log('🔄 ソート後の順番:', sortedData.map(t => `${t.display_number}:${t.title.substring(0,10)}(imp:${t.importance},start:${t.start_time})`))
    return sortedData
  }, [rawUnifiedData, sortMode])

  // 買い物タスクのサブタスクを自動で取得（データベース参照と同時に）
  useEffect(() => {
    const loadShoppingSubTasks = async () => {
      const shoppingTasks = allUnifiedData.filter(task => task.category === '買い物')

      for (const task of shoppingTasks) {
        if (!shoppingSubTasks[task.id]) {
          try {
            const subtasks = await unifiedTasks.getSubtasks(task.id)
            setShoppingSubTasks(prev => ({
              ...prev,
              [task.id]: subtasks
            }))
          } catch (error) {
            console.error(`サブタスク読み込みエラー (${task.id}):`, error)
          }
        }
      }
    }

    if (allUnifiedData.length > 0) {
      loadShoppingSubTasks()
    }
  }, [allUnifiedData, unifiedTasks, shoppingSubTasks])

  const loading = unifiedTasks.loading

  // サブタスク管理関数 - データベース連携
  const loadShoppingSubTasks = useCallback(async (taskId: string) => {
    try {
      const subtasks = await unifiedTasks.getSubtasks(taskId)
      setShoppingSubTasks(prev => ({
        ...prev,
        [taskId]: subtasks
      }))
    } catch (error) {
      console.error('サブタスク読み込みエラー:', error)
    }
  }, [unifiedTasks])

  const addShoppingSubTask = useCallback(async (taskId: string, itemName: string) => {
    try {
      await unifiedTasks.createSubtask(taskId, itemName)
      await loadShoppingSubTasks(taskId) // 再読み込み

      if (process.env.NODE_ENV === 'development') {
        console.log(`サブタスク追加: ${itemName} (Parent: ${taskId})`)
      }
    } catch (error) {
      console.error('サブタスク追加エラー:', error)
    }
  }, [unifiedTasks, loadShoppingSubTasks])

  const toggleShoppingSubTask = useCallback(async (taskId: string, subTaskId: string) => {
    try {
      await unifiedTasks.toggleSubtask(subTaskId)
      await loadShoppingSubTasks(taskId) // 再読み込み
    } catch (error) {
      console.error('サブタスク切り替えエラー:', error)
    }
  }, [unifiedTasks, loadShoppingSubTasks])

  const deleteShoppingSubTask = useCallback(async (taskId: string, subTaskId: string) => {
    try {
      await unifiedTasks.deleteSubtask(subTaskId)
      await loadShoppingSubTasks(taskId) // 再読み込み
    } catch (error) {
      console.error('サブタスク削除エラー:', error)
    }
  }, [unifiedTasks, loadShoppingSubTasks])

  // 展開時のみサブタスクを読み込み（ShoppingTasksSectionと同じシンプルな方式）
  const toggleShoppingList = async (taskId: string) => {
    const isCurrentlyExpanded = expandedShoppingLists[taskId]

    setExpandedShoppingLists(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))

    // 展開時にサブタスクを読み込み
    if (!isCurrentlyExpanded && !shoppingSubTasks[taskId]) {
      await loadShoppingSubTasks(taskId)
    }
  }

  // タスク作成フォーム表示制御
  const [showCreateForm, setShowCreateForm] = useState(false)

  // タスク編集フォーム表示制御
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingTask, setEditingTask] = useState<UnifiedTask | null>(null)

  // Timeout to show interface even if DB loading takes too long
  const [forceShow, setForceShow] = useState(false)

  // セクション表示切り替え状態
  const [showOverdueTasks, setShowOverdueTasks] = useState(false)
  const [showFutureTasks, setShowFutureTasks] = useState(false)
  const [showShoppingTasks, setShowShoppingTasks] = useState(false)
  const [showTodoList, setShowTodoList] = useState(false)

  const handleCreateRegular = useCallback(async (title: string, memo: string, dueDate: string, category?: string, importance?: number, urls?: string[], attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }, shoppingItems?: string[], startTime?: string, endTime?: string) => {
    try {
      console.log('統一タスク作成:', { title, memo, dueDate, category, importance, urls, attachment, shoppingItems })
      console.log('🛒 handleCreateRegular - 受け取った買い物リスト:', shoppingItems)

      // display_numberを正式に生成
      const displayNumber = await UnifiedTasksService.generateDisplayNumber()

      // 統一タスクとして作成
      const createdTask = await unifiedTasks.createTask({
        title: title.trim(),
        memo: memo.trim() || undefined,
        due_date: dueDate || getTodayJST(),
        category: category || undefined,
        importance: importance || undefined,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        urls: urls && urls.length > 0 ? urls : undefined,
        attachment: attachment || undefined,
        task_type: 'NORMAL',
        display_number: displayNumber,
        completed: false,
        archived: false
      })

      // 買い物リストがある場合、サブタスクとして並列追加
      if (category === '買い物' && shoppingItems && shoppingItems.length > 0) {
        const subtaskPromises = shoppingItems
          .filter(item => item.trim())
          .map(item => unifiedTasks.createSubtask(createdTask.id, item.trim()))

        await Promise.all(subtaskPromises)
        console.log(`🛒 買い物リスト ${shoppingItems.length} 件をサブタスクとして並列追加完了`)
      }

      console.log('✅ 通常タスク作成完了:', title)
      setShowCreateForm(false) // フォームを閉じる
    } catch (error) {
      console.error('❌ 通常タスク作成エラー:', error)
    }
  }, [unifiedTasks])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Forcing interface display after timeout')
        }
        setForceShow(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [isInitialized])

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#dc2626' }}>データベースエラー</h1>
        <p>{error}</p>
      </div>
    )
  }

  // Show loading only if database isn't initialized and timeout hasn't occurred
  if (!isInitialized && !forceShow && loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>読み込み中...</h1>
        <p>データを準備しています</p>
        {error && (
          <div style={{ marginTop: '20px', color: '#dc2626' }}>
            <p>データベースエラー: {error}</p>
            <p>3秒後にインターフェースを表示します...</p>
          </div>
        )}
      </div>
    )
  }

  const handleCreateRecurring = async (title: string, memo: string, settings: {
    pattern: string
    intervalDays: number
    selectedWeekdays: number[]
    dayOfMonth: number
    monthOfYear: number
    dayOfYear: number
  }, importance?: number, urls?: string[], category?: string, attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }, shoppingItems?: string[], startTime?: string, endTime?: string) => {
    try {
      console.log('統一繰り返しタスク作成:', { title, memo, settings, importance, urls, category, attachment })

      // display_numberを正式に生成
      const displayNumber = await UnifiedTasksService.generateDisplayNumber()

      // 統一タスクとして作成
      await unifiedTasks.createTask({
        title: title.trim(),
        memo: memo.trim() || undefined,
        due_date: getTodayJST(), // 明示的に今日の日付を設定
        category: category || undefined,
        importance: importance || undefined,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        urls: urls && urls.length > 0 ? urls : undefined,
        task_type: 'RECURRING',
        recurring_pattern: settings.pattern,
        display_number: displayNumber,
        completed: false,
        archived: false
      })

      console.log('✅ 繰り返しタスク作成完了:', title)
      setShowCreateForm(false) // フォームを閉じる
    } catch (error) {
      console.error('❌ 繰り返しタスク作成エラー:', error)
    }
  }

  const handleEditTask = (task: UnifiedTask) => {
    setEditingTask(task)
    setShowEditForm(true)
  }

  const handleUpdateTask = async (taskId: string, title: string, memo: string, dueDate: string, category?: string, importance?: 1 | 2 | 3 | 4 | 5, urls?: string[], startTime?: string, endTime?: string, attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }) => {
    await unifiedTasks.updateTask(taskId, { title, memo, due_date: dueDate, category, importance, urls, start_time: startTime, end_time: endTime, attachment })

    // フォームを閉じる
    setShowEditForm(false)
    setEditingTask(null)

    // タスクリストを再読み込み（買い物リストの変更を反映）
    await unifiedTasks.loadTasks(true)
  }

  const handleCancelEdit = () => {
    setShowEditForm(false)
    setEditingTask(null)
  }

  return (
    <ThemedContainer>
      <div style={{
        padding: '8px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <header style={{ marginBottom: '8px' }}>
          {/* ツールタイトル */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              margin: '0',
              color: '#1f2937',
              letterSpacing: '0.1em'
            }}>
              TASUKU
            </h1>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }} className="today-header">
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0' }} className="today-title">
              今日 - {formatDateForDisplay(getTodayJST())}
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} className="today-buttons">
              {/* デバッグ: 繰り返しタスク生成ボタン */}
              <button
                onClick={() => {
                  console.log('🔥 手動でタスク生成を実行...')
                  generateMissingTasks(true) // 手動フラグをtrueに
                }}
                disabled={isGenerating}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.5 : 1
                }}
              >
                {isGenerating ? '生成中...' : '🔄 タスク生成'}
              </button>
              <ThemeToggle />
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
              className="today-button"
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
              className="today-button"
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
              className="today-button"
            >
              ⚙️ テンプレート
            </a>
            <a
              href="/help"
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
              className="today-button"
            >
              📖 ヘルプ
            </a>
            <a
              href="/done"
              style={{
                background: '#10b981',
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
              className="today-button"
            >
              🎉 Done
            </a>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} className="today-actions">
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                className="task-add-button"
              >
                + タスク追加
              </button>
            </div>
          </div>
        </div>

        {/* Show database status if not fully initialized */}
        {!isInitialized && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px',
            fontSize: '14px',
            color: '#92400e'
          }}>
            ⚠️ データベースが初期化中です。一部機能が制限される場合があります。
          </div>
        )}

        {/* Show task generation status */}
        {isGenerating && (
          <div style={{
            background: '#e0f2fe',
            border: '1px solid #0ea5e9',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px',
            fontSize: '14px',
            color: '#0369a1'
          }}>
            🔄 繰り返しタスクを生成中...
          </div>
        )}

        {/* Show generation error if any */}
        {generationError && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px',
            fontSize: '14px',
            color: '#dc2626'
          }}>
            ❌ タスク生成エラー: {generationError}
          </div>
        )}


        {/* 認証状態表示 */}
        <div style={{ marginBottom: '12px' }}>
          <AuthStatus />
        </div>
      </header>

      <main>
        {/* 今日のメインタスク表示（大本） */}
        <div style={{ marginBottom: '12px' }}>
          {/* タイトルとソート切り替えUI */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            gap: '12px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              margin: '0',
              color: '#1f2937'
            }}>
              📅 今日のタスク
            </h3>

            {/* ソート切り替えボタン */}
            <div style={{
              display: 'flex',
              background: '#f3f4f6',
              borderRadius: '6px',
              padding: '2px',
              gap: '2px',
              position: 'relative',
              zIndex: 9999,
              pointerEvents: 'auto'
            }}>
              <button
                onClick={(e) => {
                  console.log('🔥🔥🔥 重要度ボタンクリック検出！')
                  console.log('🔥 Event:', e)
                  console.log('🔥 Current sortMode:', sortMode)
                  setSortMode('priority')
                  console.log('🔥 setSortMode(priority) 実行完了')
                }}
                style={{
                  background: sortMode === 'priority' ? '#3b82f6' : 'transparent',
                  color: sortMode === 'priority' ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  pointerEvents: 'auto',
                  zIndex: 10000
                }}
              >
                重要度
              </button>
              <button
                onClick={(e) => {
                  console.log('⏰⏰⏰ 時間軸ボタンクリック検出！')
                  console.log('⏰ Event:', e)
                  console.log('⏰ Current sortMode:', sortMode)
                  setSortMode('time')
                  console.log('⏰ setSortMode(time) 実行完了')
                }}
                style={{
                  background: sortMode === 'time' ? '#3b82f6' : 'transparent',
                  color: sortMode === 'time' ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  pointerEvents: 'auto',
                  zIndex: 10000
                }}
              >
                時間軸
              </button>
            </div>
          </div>

          <UnifiedTasksTable
            title=""
            tasks={allUnifiedData
              .filter(task => task.due_date === getTodayJST())
            }
            emptyMessage="今日のタスクはありません"
            unifiedTasks={unifiedTasks}
            handleEditTask={handleEditTask}
            shoppingSubTasks={shoppingSubTasks}
            expandedShoppingLists={expandedShoppingLists}
            toggleShoppingList={toggleShoppingList}
            addShoppingSubTask={addShoppingSubTask}
            toggleShoppingSubTask={toggleShoppingSubTask}
            deleteShoppingSubTask={deleteShoppingSubTask}
            showTitle={false}
          />
        </div>

        {/* 期限切れタスクセクション */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
            gap: '8px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              cursor: 'pointer'
            }}>
              🚨 期限切れタスク ({allUnifiedData.filter(task => !task.completed && task.due_date && task.due_date < getTodayJST()).length}件) {showOverdueTasks ? '☑️' : '☐'} 表示する
              <input
                type="checkbox"
                checked={showOverdueTasks}
                onChange={(e) => setShowOverdueTasks(e.target.checked)}
                style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
              />
            </label>
          </div>
          {showOverdueTasks && (
            <UnifiedTasksTable
              title="🚨 期限切れタスク"
              tasks={allUnifiedData.filter(task =>
                !task.completed && task.due_date && task.due_date < getTodayJST()
              )}
              emptyMessage=""
              urgent={true}
              showTitle={false}
              unifiedTasks={unifiedTasks}
              handleEditTask={handleEditTask}
              shoppingSubTasks={shoppingSubTasks}
              expandedShoppingLists={expandedShoppingLists}
              toggleShoppingList={toggleShoppingList}
              addShoppingSubTask={addShoppingSubTask}
              toggleShoppingSubTask={toggleShoppingSubTask}
              deleteShoppingSubTask={deleteShoppingSubTask}
            />
          )}
        </div>

        {/* 明日以降のタスクセクション */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
            gap: '8px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              cursor: 'pointer'
            }}>
              📆 明日以降のタスク ({allUnifiedData.filter(task => !task.completed && task.due_date && task.due_date > getTodayJST() && task.due_date !== '2999-12-31').length}件) {showFutureTasks ? '☑️' : '☐'} 表示する
              <input
                type="checkbox"
                checked={showFutureTasks}
                onChange={(e) => setShowFutureTasks(e.target.checked)}
                style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
              />
            </label>
          </div>
          {showFutureTasks && (
            <UnifiedTasksTable
              title="📆 明日以降のタスク"
              tasks={allUnifiedData.filter(task =>
                !task.completed && task.due_date && task.due_date > getTodayJST() && task.due_date !== '2999-12-31'
              )}
              emptyMessage=""
              showTitle={false}
              unifiedTasks={unifiedTasks}
              handleEditTask={handleEditTask}
              shoppingSubTasks={shoppingSubTasks}
              expandedShoppingLists={expandedShoppingLists}
              toggleShoppingList={toggleShoppingList}
              addShoppingSubTask={addShoppingSubTask}
              toggleShoppingSubTask={toggleShoppingSubTask}
              deleteShoppingSubTask={deleteShoppingSubTask}
            />
          )}
        </div>

        {/* 買い物タスクセクション */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
            gap: '8px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              cursor: 'pointer'
            }}>
              🛒 買い物タスク ({allUnifiedData.filter(task => !task.completed && task.category === '買い物').length}件) {showShoppingTasks ? '☑️' : '☐'} 表示する
              <input
                type="checkbox"
                checked={showShoppingTasks}
                onChange={(e) => setShowShoppingTasks(e.target.checked)}
                style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
              />
            </label>
          </div>
          {showShoppingTasks && (
            <UnifiedTasksTable
              title="🛒 買い物タスク"
              tasks={allUnifiedData.filter(task =>
                !task.completed && task.category === '買い物'
              )}
              emptyMessage=""
              showTitle={false}
              unifiedTasks={unifiedTasks}
              handleEditTask={handleEditTask}
              shoppingSubTasks={shoppingSubTasks}
              expandedShoppingLists={expandedShoppingLists}
              toggleShoppingList={toggleShoppingList}
              addShoppingSubTask={addShoppingSubTask}
              toggleShoppingSubTask={toggleShoppingSubTask}
              deleteShoppingSubTask={deleteShoppingSubTask}
            />
          )}
        </div>

        {/* やることリストセクション */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
            gap: '8px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              cursor: 'pointer'
            }}>
              💡 やることリスト ({allUnifiedData.filter(task => task.due_date === '2999-12-31').length}件) {showTodoList ? '☑️' : '☐'} 表示する
              <input
                type="checkbox"
                checked={showTodoList}
                onChange={(e) => setShowTodoList(e.target.checked)}
                style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
              />
            </label>
          </div>
          {showTodoList && (
            <UnifiedTasksTable
              title="💡 やることリスト"
              tasks={allUnifiedData.filter(task =>
                task.due_date === '2999-12-31' // 期限のないタスク
              )}
              emptyMessage=""
              showTitle={false}
              unifiedTasks={unifiedTasks}
              handleEditTask={handleEditTask}
              shoppingSubTasks={shoppingSubTasks}
              expandedShoppingLists={expandedShoppingLists}
              toggleShoppingList={toggleShoppingList}
              addShoppingSubTask={addShoppingSubTask}
              toggleShoppingSubTask={toggleShoppingSubTask}
              deleteShoppingSubTask={deleteShoppingSubTask}
            />
          )}
        </div>
      </main>

      {/* 未完了タスクの管理（最下部） */}
      <IncompleteTasksToggle
        rolloverData={{
          incompleteSingle: [],
          incompleteRecurring: []
        }}
        isRollingOver={false}
        onRollover={() => {}}
      />

      {/* タスク作成フォーム */}
      {showCreateForm && (
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
          zIndex: 100
        }}>
          <TaskCreateForm2
            isVisible={true}
            onSubmitRegular={handleCreateRegular}
            onSubmitRecurring={handleCreateRecurring}
            onAddToIdeas={async (text: string) => {
              try {
                console.log('アイデア作成:', text)

                // アイデア（期限なしタスク）として作成
                await unifiedTasks.createTask({
                  title: text.trim(),
                  due_date: '2999-12-31', // 期限なしタスクの特別日付
                  task_type: 'IDEA',
                  display_number: await UnifiedTasksService.generateDisplayNumber(), // 正式な番号生成
                  completed: false,
                  archived: false
                })

                console.log('✅ アイデア作成完了:', text)
              } catch (error) {
                console.error('❌ アイデア作成エラー:', error)
              }
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* タスク編集フォーム */}
      <TaskEditForm
        task={editingTask}
        isVisible={showEditForm}
        onSubmit={handleUpdateTask}
        onCancel={handleCancelEdit}
        onUncomplete={(id: string) => unifiedTasks.uncompleteTask(id)}
      />

      </div>
    </ThemedContainer>
  )
}