'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDatabase } from '@/hooks/useDatabase'
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'
import { useTaskGenerator } from '@/hooks/useTaskGenerator'
import { getTodayJST, formatDateForDisplay } from '@/lib/utils/date-jst'
import { UpcomingPreview } from '@/components/UpcomingPreview'
import { IncompleteTasksToggle } from '@/components/IncompleteTasksToggle'
import { TaskEditForm } from '@/components/TaskEditForm'
import { TaskCreateForm2 } from '@/components/TaskCreateForm2'
import { IdeaBox } from '@/components/IdeaBox'
import type { UnifiedTask } from '@/lib/types/unified-task'
import { ThemedContainer } from '@/components/ThemedContainer'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AuthStatus } from '@/components/AuthStatus'
import { ShoppingTasksSection } from '@/components/ShoppingTasksSection'
import { DisplayNumberUtils, TaskType } from '@/lib/types/unified-task'
import { UnifiedTasksService } from '@/lib/db/unified-tasks'

// 統一データ表示用の型定義
interface UnifiedDataItem {
  // 共通フィールド
  id: string
  dataType: 'task' | 'recurring' | 'idea'
  displayTitle: string
  displayCategory: string
  display_number: string
  task_type: TaskType
  completed: boolean
  created_at: string

  // タスク/繰り返しタスク固有フィールド
  title?: string
  memo?: string
  due_date?: string
  category?: string
  importance?: number
  urls?: string[]

  // アイデア固有フィールド
  text?: string

  // その他の可能なフィールド
  [key: string]: unknown
}

// サブタスク型定義
interface SubTaskItem {
  id: string
  parent_task_id: string
  title: string
  completed: boolean
  sort_order: number
  created_at: string
}

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

// 日付を日本語形式でフォーマットするヘルパー関数
const formatDueDateForDisplay = (dateString?: string | null): string => {
  if (!dateString) return '-'

  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  // 統一システム: 全て月/日形式で表示
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}

// 繰り返しタスクの次回実行日を計算するヘルパー関数
// 統一ルール: 繰り返しタスクも due_date ベースで管理
// 複雑な計算は不要 - due_dateをそのまま表示
const getTaskDateDisplay = (task: any): string => {
  if (!task.due_date) return '日付なし'

  // 期限なしタスク（アイデア等）
  if (task.due_date === '2999-12-31') {
    return 'アイデア'
  }

  // 通常の日付表示
  return formatDueDateForDisplay(task.due_date)
}

export default function TodayPage() {
  const { isInitialized, error } = useDatabase()

  // 統一データベースフック
  const unifiedTasks = useUnifiedTasks(isInitialized)

  // 自動タスク生成フック（データベース初期化後に実行）
  const { isGenerating, lastError: generationError } = useTaskGenerator(isInitialized)

  // ページタイトルを設定
  useEffect(() => {
    document.title = 'TASUKU - 今日のタスク'
  }, [])

  // 買い物リスト（サブタスク）管理 - データベース連携
  const [shoppingSubTasks, setShoppingSubTasks] = useState<{[taskId: string]: any[]}>({})
  const [expandedShoppingLists, setExpandedShoppingLists] = useState<{[taskId: string]: boolean}>({})

  // 統一システムのみを使用

  // 統一データベースから直接データを取得
  const allUnifiedData = useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 allUnifiedData計算中:', { isInitialized, loading: unifiedTasks.loading, tasksLength: unifiedTasks.tasks.length })
    }
    if (!isInitialized || unifiedTasks.loading) return []

    const allTasks = unifiedTasks.tasks
    const unifiedData = allTasks.map((task) => ({
      ...task,
      // 統一ルール: due_date で種別を判断
      dataType: task.due_date === '2999-12-31' ? 'idea' as const :
                task.recurring_pattern ? 'recurring' as const : 'task' as const,
      displayTitle: task.recurring_pattern ? `🔄 ${task.title}` :
                    task.due_date === '2999-12-31' ? `💡 ${task.title}` : task.title,
      displayCategory: task.category || (task.recurring_pattern ? '繰り返し' : task.due_date === '2999-12-31' ? 'アイデア' : '未分類')
    }))

    // 優先度順でソート（高い優先度が上位）、同じ優先度の場合は統一番号順
    unifiedData.sort((a, b) => {
      const priorityA = a.importance || 0
      const priorityB = b.importance || 0

      // 優先度が異なる場合は優先度で比較（高い方が先）
      if (priorityA !== priorityB) {
        return priorityB - priorityA
      }

      // 優先度が同じ場合は統一番号順
      return (a.display_number || '').localeCompare(b.display_number || '')
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 統一データ取得完了: ${unifiedData.length}件`)
      console.log(`📊 unifiedTasks.tasks:`, unifiedTasks.tasks)
    }

    return unifiedData
  }, [isInitialized, unifiedTasks.tasks, unifiedTasks.loading])

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

  
  // 繰り越し機能は統一システムで後日実装
  const rolloverData = {
    incompleteSingle: [],
    incompleteRecurring: [],
    overdueTasks: [],
    incompleteTasks: []
  }
  const isRollingOver = false
  const executeRollover = () => {}
  
  
  // タスク作成フォーム表示制御
  const [showCreateForm, setShowCreateForm] = useState(false)

  // タスク編集フォーム表示制御
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingTask, setEditingTask] = useState<UnifiedTask | null>(null)

  // 期日切れタスク表示制御
  const [showOverdueTasks, setShowOverdueTasks] = useState(false)

  // Timeout to show interface even if DB loading takes too long
  const [forceShow, setForceShow] = useState(false)

  // 統一データベースからフィルター済みデータを取得
  const todayTasks = useMemo(() => isInitialized ? unifiedTasks.getTodayTasks() : [], [isInitialized, unifiedTasks.getTodayTasks])
  const todayCompletedTasks = useMemo(() => isInitialized ? unifiedTasks.getCompletedTasks().filter(task => {
    const today = new Date().toISOString().split('T')[0]
    return task.due_date === today && (task.task_type === 'NORMAL' || task.task_type === 'RECURRING')
  }) : [], [isInitialized, unifiedTasks.getCompletedTasks])
  const overdueTasks = useMemo(() => {
    if (!isInitialized) return []
    const today = new Date().toISOString().split('T')[0]
    return unifiedTasks.tasks
      .filter(task => !task.completed && task.due_date && task.due_date < today && task.task_type === 'NORMAL')
      .sort((a, b) => {
        const priorityA = a.importance || 0
        const priorityB = b.importance || 0

        // 優先度が異なる場合は優先度で比較（高い方が先）
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }

        // 優先度が同じ場合は統一番号順
        return (a.display_number || '').localeCompare(b.display_number || '')
      })
      .map(task => ({ task, urgency: 'High' as const, days_from_today: -1 }))
  }, [isInitialized, unifiedTasks.tasks])
  const todayRecurringTasks = useMemo(() => isInitialized ? unifiedTasks.getRecurringTasks() : [], [isInitialized, unifiedTasks.getRecurringTasks])
  const todayCompletedRecurringTasks = useMemo(() => isInitialized ? unifiedTasks.getCompletedTasks().filter(task => task.task_type === 'RECURRING') : [], [isInitialized, unifiedTasks.getCompletedTasks])
  const upcomingTasks = useMemo(() => {
    if (!isInitialized) return []
    const today = new Date().toISOString().split('T')[0]
    return unifiedTasks.tasks
      .filter(task => !task.completed && task.due_date && task.due_date > today && task.task_type === 'NORMAL')
      .sort((a, b) => {
        const priorityA = a.importance || 0
        const priorityB = b.importance || 0

        // 優先度が異なる場合は優先度で比較（高い方が先）
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }

        // 優先度が同じ場合は統一番号順
        return (a.display_number || '').localeCompare(b.display_number || '')
      })
      .map(task => {
        const dueDate = new Date(task.due_date!)
        const todayDate = new Date(today)
        const diffTime = dueDate.getTime() - todayDate.getTime()
        const days_from_today = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return { task, urgency: 'Normal' as const, days_from_today }
      })
  }, [isInitialized, unifiedTasks.tasks])
  const upcomingRecurringTasks = useMemo(() => [], []) // TODO: Implement recurring task upcoming logic

  // Combine upcoming tasks for preview (7日以上も含めてすべて渡す)
  const allUpcoming = useMemo(() => [
    ...upcomingTasks.map(item => ({
      ...item,
      task: {
        ...item.task,
        memo: item.task.memo || undefined,
        due_date: item.task.due_date || undefined,
        category: item.task.category || undefined,
        importance: (item.task.importance && item.task.importance >= 1 && item.task.importance <= 5) ? item.task.importance as 1|2|3|4|5 : undefined,
        duration_min: item.task.duration_min || undefined,
        urls: item.task.urls || undefined,
        attachment: item.task.attachment || undefined,
        completed: item.task.completed || false,
        created_at: item.task.created_at || new Date().toISOString(),
        updated_at: item.task.updated_at || new Date().toISOString(),
        completed_at: item.task.completed_at || undefined,
        archived: item.task.archived || false,
        snoozed_until: item.task.snoozed_until || undefined
      }
    }))
  ].sort((a, b) => a.days_from_today - b.days_from_today), [upcomingTasks])

  const handleCreateRegular = useCallback(async (title: string, memo: string, dueDate: string, category?: string, importance?: number, durationMin?: number, urls?: string[], attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }, shoppingItems?: string[]) => {
    try {
      console.log('統一タスク作成:', { title, memo, dueDate, category, importance, durationMin, urls, attachment, shoppingItems })
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
        duration_min: durationMin || undefined,
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
  }, importance?: number, durationMin?: number, urls?: string[], category?: string, attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }) => {
    try {
      console.log('統一繰り返しタスク作成:', { title, memo, settings, importance, durationMin, urls, category, attachment })

      // シンプルに統一タスクとして作成（recurring_patternは一時的に除外）
      await unifiedTasks.createTask({
        title: title.trim(),
        memo: memo.trim() || undefined,
        due_date: getTodayJST(), // 明示的に今日の日付を設定
        category: category || undefined,
        importance: importance || undefined,
        duration_min: durationMin || undefined,
        urls: urls && urls.length > 0 ? urls : undefined,
        task_type: 'RECURRING',
        recurring_pattern: settings.pattern,
        display_number: `T${Date.now()}-${Math.random().toString(36).substring(2, 8)}`, // ユニーク番号生成
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

  const handleUpdateTask = async (taskId: string, title: string, memo: string, dueDate: string, category?: string, importance?: 1 | 2 | 3 | 4 | 5, durationMin?: number, urls?: string[]) => {
    await unifiedTasks.updateTask(taskId, { title, memo, due_date: dueDate, category, importance, duration_min: durationMin, urls })
  }

  const handleCancelEdit = () => {
    setShowEditForm(false)
    setEditingTask(null)
  }

  // 繰り返しタスクは統一システムで編集
  const handleEditRecurringTask = (task: UnifiedTask) => {
    setEditingTask(task)
    setShowEditForm(true)
  }


  const handleMoveToIdeas = async (taskId: string) => {
    try {
      const task = overdueTasks.find(t => t.task.id === taskId)
      if (!task) return

      // タスクをIdeasに追加
      // TODO: 統一システムでのアイデア追加機能を実装
      // await addIdea(task.task.title)

      // 元のタスクを削除
      // TODO: 統一システムでのタスク削除機能を実装
      // await unifiedTasks.deleteTask(taskId)

      if (process.env.NODE_ENV === 'development') {
        console.log(`タスク「${task.task.title}」をやることリストに移動しました`)
      }
    } catch (error) {
      console.error('やることリストへの移動エラー:', error)
    }
  }

  const handleUpgradeToTask = async (idea: { id: string; text: string; completed: boolean; created_at: string }) => {
    // アイデアをタスクに昇格させる場合、編集フォームを開いてタイトルを事前入力
    setEditingTask({
      id: '', // 新規タスク
      user_id: '',
      title: idea.text,
      memo: '',
      display_number: '',
      category: '',
      importance: 1,
      due_date: '2999-12-31',
      urls: undefined,
      attachment: undefined,
      completed: false,
      completed_at: undefined,
      created_at: '',
      updated_at: '',
      archived: false,
      snoozed_until: undefined,
      duration_min: undefined,
      task_type: 'NORMAL',
      recurring_pattern: undefined,
      recurring_interval: undefined,
      recurring_weekdays: undefined,
      recurring_day: undefined
    })
    setShowEditForm(true)

    // アイデアは削除
    // TODO: 統一システムでのアイデア削除機能を実装
    // await unifiedTasks.deleteTask(idea.id)
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
        {/* 統一データ表示テーブル（全データ確認用） */}
        <section style={{ marginBottom: '12px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 全体タスク ({allUnifiedData.length}件)
          </h3>

          {/* デバッグ情報 */}
          <div style={{
            padding: '8px',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            marginBottom: '8px',
            fontSize: '12px',
            color: '#374151'
          }}>
            <strong>📊 データ詳細:</strong>
            タスク: {unifiedTasks.tasks.filter(t => t.task_type === 'NORMAL').length}件 |
            繰り返し: {unifiedTasks.tasks.filter(t => t.task_type === 'RECURRING').length}件 |
            アイデア: {unifiedTasks.tasks.filter(t => t.task_type === 'IDEA').length}件 |
            買い物カテゴリ: {unifiedTasks.tasks.filter(t => t.category === '買い物').length}件
          </div>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
              統一データを読み込み中...
            </div>
          ) : (
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              overflow: 'hidden'
            }}>
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
                  {allUnifiedData.map((item, index) => (
                    <tr key={`${item.dataType}-${item.id}`}
                        style={{
                          borderTop: index > 0 ? '1px solid #f3f4f6' : 'none',
                          backgroundColor: item.completed ? '#f0fdf4' : 'transparent'
                        }}>
                      {/* 統一番号表示 */}
                      <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px', fontFamily: 'monospace' }}>
                        <span style={{
                          padding: '2px 4px',
                          borderRadius: '3px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          fontWeight: '600'
                        }}>
                          {DisplayNumberUtils.formatCompact(item.display_number)}
                        </span>
                      </td>

                      {/* 完了チェックボックス */}
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            if (item.completed) {
                              unifiedTasks.uncompleteTask(item.id)
                            } else {
                              unifiedTasks.completeTask(item.id)
                            }
                          }}
                          style={{
                            width: '18px',
                            height: '18px',
                            border: `2px solid ${item.completed ? '#10b981' : '#d1d5db'}`,
                            borderRadius: '4px',
                            backgroundColor: item.completed ? '#10b981' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: 'white'
                          }}
                        >
                          {item.completed ? '✓' : ''}
                        </button>
                      </td>

                      {/* 種別 */}
                      <td style={{ padding: '8px', fontSize: '12px', fontWeight: '500' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          backgroundColor:
                            item.dataType === 'task' ? '#dbeafe' :
                            item.dataType === 'recurring' ? '#f0fdf4' : '#fef3c7',
                          color:
                            item.dataType === 'task' ? '#1e40af' :
                            item.dataType === 'recurring' ? '#166534' : '#92400e'
                        }}>
                          {item.dataType === 'task' ? 'タスク' :
                           item.dataType === 'recurring' ? '繰り返し' : 'アイデア'}
                        </span>
                      </td>

                      {/* タイトル + メモ（1段表示） */}
                      <td style={{ padding: '8px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* 重要度インディケーター */}
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: getImportanceColor(item.importance),
                              flexShrink: 0
                            }}
                            title={`重要度: ${item.importance || '未設定'}`}
                          />

                          {/* タイトル */}
                          <span style={{ fontWeight: '500' }}>
                            {item.displayTitle}
                          </span>

                          {/* 買い物カテゴリの場合、「リスト」リンクを右に表示 */}
                          {item.dataType === 'task' && item.category === '買い物' && (
                            <button
                              onClick={() => toggleShoppingList(item.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#3b82f6',
                                cursor: 'pointer',
                                fontSize: '11px',
                                textDecoration: 'underline',
                                padding: '0'
                              }}
                              title="買い物リストを表示/非表示"
                            >
                              🛒 リスト ({(shoppingSubTasks[item.id] || []).length})
                            </button>
                          )}

                          {/* 買い物カテゴリ以外のメモを右に表示 */}
                          {((item.dataType === 'task' && item.category !== '買い物') || item.dataType === 'recurring') && item.memo && (
                            <span style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              fontStyle: 'italic'
                            }}>
                              - {item.memo}
                            </span>
                          )}
                        </div>

                        {/* サブタスクリスト（展開時） */}
                        {item.dataType === 'task' && item.category === '買い物' && expandedShoppingLists[item.id] && (
                          <div style={{
                            marginTop: '8px',
                            paddingLeft: '12px',
                            borderLeft: '2px solid #e5e7eb'
                          }}>
                            <div style={{ marginBottom: '4px' }}>
                              <button
                                onClick={() => {
                                  const newItem = prompt('買い物アイテムを追加:')
                                  if (newItem && newItem.trim()) {
                                    addShoppingSubTask(item.id, newItem.trim())
                                  }
                                }}
                                style={{
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  cursor: 'pointer'
                                }}
                                title="買い物アイテムを追加"
                              >
                                + 追加
                              </button>
                            </div>
                            {(shoppingSubTasks[item.id] || []).map((subTask) => (
                              <div key={subTask.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '4px',
                                fontSize: '11px'
                              }}>
                                <button
                                  onClick={() => toggleShoppingSubTask(item.id, subTask.id)}
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                    border: `1px solid ${subTask.completed ? '#10b981' : '#d1d5db'}`,
                                    borderRadius: '2px',
                                    backgroundColor: subTask.completed ? '#10b981' : 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '8px',
                                    color: 'white'
                                  }}
                                >
                                  {subTask.completed ? '✓' : ''}
                                </button>
                                <span style={{
                                  flex: 1,
                                  textDecoration: subTask.completed ? 'line-through' : 'none',
                                  color: subTask.completed ? '#9ca3af' : '#374151'
                                }}>
                                  {subTask.title}
                                </span>
                                <button
                                  onClick={() => {
                                    if (confirm(`「${subTask.title}」を削除しますか？`)) {
                                      deleteShoppingSubTask(item.id, subTask.id)
                                    }
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    fontSize: '8px',
                                    padding: '0'
                                  }}
                                  title="削除"
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                            {(shoppingSubTasks[item.id] || []).length === 0 && (
                              <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                                リストが空です
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* カテゴリ */}
                      <td style={{ padding: '8px', fontSize: '12px', color: '#6b7280' }}>
                        {item.displayCategory}
                      </td>

                      {/* 期限 */}
                      <td style={{ padding: '8px', fontSize: '11px', color: '#374151', textAlign: 'center' }}>
                        {item.due_date ? (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            fontSize: '10px',
                            fontWeight: '500'
                          }}>
                            {formatDueDateForDisplay(item.due_date)}
                          </span>
                        ) : item.dataType === 'recurring' ? (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#f0f9ff',
                            color: '#1e40af',
                            fontSize: '10px',
                            fontWeight: '500'
                          }}
                          title={`デバッグ - タイトル: ${item.title}, パターン: ${item.recurring_pattern}, 曜日配列: ${JSON.stringify(item.recurring_weekdays)}, 今日JS: ${new Date().getDay()} (${['日', '月', '火', '水', '木', '金', '土'][new Date().getDay()]}), 今日ISO: ${new Date().getDay() === 0 ? 7 : new Date().getDay()}, 配列に含む: ${item.recurring_weekdays?.includes(new Date().getDay() === 0 ? 7 : new Date().getDay())}`}
                          >
                            {getTaskDateDisplay(item)}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '10px' }}>-</span>
                        )}
                      </td>

                      {/* 操作ボタン */}
                      <td style={{ padding: '8px' }}>
                        <div style={{
                          display: 'flex',
                          gap: '4px',
                          alignItems: 'center'
                        }}>
                          {/* 編集ボタン */}
                          <button
                            onClick={() => {
                              if (item.dataType === 'task') {
                                // Use UnifiedTask directly
                                const taskForEdit: UnifiedTask = {
                                  id: item.id,
                                  user_id: item.user_id || '',
                                  title: item.title || '',
                                  memo: item.memo || undefined,
                                  display_number: item.display_number || '',
                                  due_date: item.due_date || '2999-12-31',
                                  category: item.category || undefined,
                                  importance: (item.importance && item.importance >= 1 && item.importance <= 5) ? item.importance as 1|2|3|4|5 : undefined,
                                  duration_min: item.duration_min || undefined,
                                  urls: item.urls || undefined,
                                  attachment: item.attachment || undefined,
                                  completed: item.completed || false,
                                  archived: item.archived || false,
                                  snoozed_until: item.snoozed_until || undefined,
                                  created_at: item.created_at || new Date().toISOString(),
                                  updated_at: item.updated_at || new Date().toISOString(),
                                  completed_at: item.completed_at || undefined,
                                  task_type: item.task_type || 'NORMAL',
                                  recurring_pattern: item.recurring_pattern || undefined,
                                  recurring_interval: item.recurring_interval || undefined,
                                  recurring_weekdays: item.recurring_weekdays || undefined,
                                  recurring_day: item.recurring_day || undefined
                                }
                                handleEditTask(taskForEdit)
                              } else if (item.dataType === 'recurring') {
                                handleEditRecurringTask(item as unknown as UnifiedTask)
                              } else if (item.dataType === 'idea') {
                                // アイデア編集機能（今後実装）
                                if (process.env.NODE_ENV === 'development') {
                                  console.log('アイデア編集:', item.title)
                                }
                              }
                            }}
                            style={{
                              padding: '4px',
                              fontSize: '12px',
                              border: 'none',
                              borderRadius: '3px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              cursor: 'pointer',
                              width: '24px',
                              height: '24px'
                            }}
                            title="編集"
                          >
                            ✏️
                          </button>

                          {/* 削除ボタン */}
                          <button
                            onClick={() => {
                              if (confirm(`この${item.dataType === 'task' ? 'タスク' : item.dataType === 'recurring' ? '繰り返しタスク' : 'アイデア'}を削除しますか？`)) {
                                unifiedTasks.deleteTask(item.id)
                              }
                            }}
                            style={{
                              padding: '4px',
                              fontSize: '12px',
                              border: 'none',
                              borderRadius: '3px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              cursor: 'pointer',
                              width: '24px',
                              height: '24px'
                            }}
                            title="削除"
                          >
                            🗑️
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                  {allUnifiedData.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#9ca3af',
                        fontStyle: 'italic'
                      }}>
                        データがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 期日切れタスク表 */}
        {overdueTasks.length > 0 && (
          <section style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#dc2626',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                ⚠️ 期日切れ ({overdueTasks.length}件)
              </h3>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: '#6b7280',
                cursor: 'pointer',
                marginLeft: '12px'
              }}>
                <input
                  type="checkbox"
                  checked={showOverdueTasks}
                  onChange={(e) => setShowOverdueTasks(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                表示
              </label>
            </div>
            {showOverdueTasks && (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>✓</th>
                      <th style={{ padding: '2px 4px', textAlign: 'left', fontSize: '11px' }}>タイトル</th>
                      <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>📷</th>
                      <th style={{ padding: '2px 4px', textAlign: 'left', width: '30px', fontSize: '11px' }}>🌍</th>
                      <th style={{ padding: '2px 4px', textAlign: 'left', width: '100px', fontSize: '11px' }}>期日</th>
                      <th style={{ padding: '2px 4px', textAlign: 'left', width: '100px', fontSize: '11px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueTasks.map((item, index) => (
                      <tr
                        key={item.task.id}
                        style={{
                          borderTop: index > 0 ? '1px solid #e5e7eb' : 'none',
                          height: '28px',
                          backgroundColor: '#fef2f2', // 期日切れは薄い赤
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '2px', textAlign: 'center' }}>
                          <button
                            onClick={() => unifiedTasks.completeTask(item.task.id)}
                            style={{
                              width: '18px',
                              height: '18px',
                              border: '2px solid #d1d5db',
                              borderRadius: '4px',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                          </button>
                        </td>
                        <td style={{ padding: '2px 4px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            lineHeight: '1.2'
                          }}>
                            {/* 重要度インディケーター */}
                            <div
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: getImportanceColor(item.task.importance),
                                flexShrink: 0
                              }}
                              title={`重要度: ${item.task.importance || '未設定'}`}
                            />

                            <span style={{ fontWeight: '500' }}>
                              {item.task.title}
                            </span>
                            {item.task.memo && (
                              <span style={{
                                color: '#6b7280',
                                fontSize: '13px',
                                display: 'none'
                              }}
                              className="memo-desktop-only">
                                - {item.task.memo}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '2px', textAlign: 'center' }}>
                          {item.task.attachment ? '📷' : '-'}
                        </td>
                        <td style={{ padding: '2px', textAlign: 'center' }}>
                          {item.task.urls && item.task.urls.length > 0 ? '🌍' : '-'}
                        </td>
                        <td style={{ padding: '2px 4px', fontSize: '11px', color: '#374151', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            fontSize: '10px',
                            fontWeight: '500'
                          }}>
                            {formatDueDateForDisplay(item.task.due_date)}
                          </span>
                        </td>
                        <td style={{ padding: '2px' }}>
                          <div style={{
                            display: 'flex',
                            gap: '4px',
                            alignItems: 'center',
                            flexWrap: 'nowrap'
                          }}>
                            <button
                              onClick={() => {
                                const taskForEdit: UnifiedTask = {
                                  ...item.task,
                                  memo: item.task.memo || undefined,
                                  due_date: item.task.due_date || '2999-12-31',
                                  category: item.task.category || undefined,
                                  importance: (item.task.importance && item.task.importance >= 1 && item.task.importance <= 5) ? item.task.importance as 1|2|3|4|5 : undefined,
                                  duration_min: item.task.duration_min || undefined,
                                  urls: item.task.urls || undefined,
                                  attachment: item.task.attachment || undefined,
                                  completed: item.task.completed || false,
                                  created_at: item.task.created_at || new Date().toISOString(),
                                  updated_at: item.task.updated_at || new Date().toISOString(),
                                  completed_at: item.task.completed_at || undefined,
                                  archived: item.task.archived || false,
                                  snoozed_until: item.task.snoozed_until || undefined
                                }
                                handleEditTask(taskForEdit)
                              }}
                              style={{
                                padding: '4px',
                                fontSize: '14px',
                                border: 'none',
                                borderRadius: '3px',
                                backgroundColor: 'transparent',
                                color: '#6b7280',
                                cursor: 'pointer',
                                width: '24px',
                                height: '24px',
                                transition: 'all 0.15s ease'
                              }}
                              title="タスクを編集"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('このタスクを削除しますか？')) {
                                  unifiedTasks.deleteTask(item.task.id)
                                }
                              }}
                              style={{
                                padding: '4px',
                                fontSize: '14px',
                                border: 'none',
                                borderRadius: '3px',
                                backgroundColor: 'transparent',
                                color: '#6b7280',
                                cursor: 'pointer',
                                width: '24px',
                                height: '24px',
                                transition: 'all 0.15s ease'
                              }}
                              title="タスクを削除"
                            >
                              🗑️
                            </button>
                            <button
                              onClick={() => handleMoveToIdeas(item.task.id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                              title="期日を削除してやることリストに移動"
                            >
                              やることリストへ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* 近々の予告 */}
        <UpcomingPreview
          upcomingTasks={allUpcoming}
          onComplete={unifiedTasks.completeTask}
          onEdit={handleEditTask}
          onDelete={unifiedTasks.deleteTask}
        />

        {/* 買い物タスク */}
        <ShoppingTasksSection
          onEdit={handleEditTask}
        />

        {/* やることリスト */}
        <section style={{ marginBottom: '12px' }}>
          <IdeaBox
            ideas={unifiedTasks.getIdeaTasks().map(task => ({
              id: task.id,
              text: task.title || '',
              completed: task.completed || false,
              created_at: task.created_at || new Date().toISOString(),
              display_number: task.display_number
            }))}
            allNoDateTasks={unifiedTasks.getIdeaTasks()}
            onAdd={async (text: string) => {
              try {
                console.log('アイデア作成:', text)

                // アイデア（期限なしタスク）として作成
                await unifiedTasks.createTask({
                  title: text.trim(),
                  due_date: '2999-12-31', // 期限なしタスクの特別日付
                  task_type: 'IDEA',
                  display_number: `T${Date.now()}-${Math.random().toString(36).substring(2, 8)}`, // ユニーク番号生成
                  completed: false,
                  archived: false
                })

                console.log('✅ アイデア作成完了:', text)
              } catch (error) {
                console.error('❌ アイデア作成エラー:', error)
              }
            }}
            onToggle={(id) => {
              const task = unifiedTasks.tasks.find(t => t.id === id)
              if (task?.completed) {
                unifiedTasks.uncompleteTask(id)
              } else {
                unifiedTasks.completeTask(id)
              }
            }}
            onEdit={async (id: string, newText: string) => {
              await unifiedTasks.updateTask(id, { title: newText })
            }}
            onDelete={unifiedTasks.deleteTask}
            onUpgradeToTask={handleUpgradeToTask}
          />
        </section>
      </main>

      {/* 未完了タスクの管理（最下部） */}
      <IncompleteTasksToggle
        rolloverData={rolloverData}
        isRollingOver={isRollingOver}
        onRollover={executeRollover}
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
                  display_number: `T${Date.now()}-${Math.random().toString(36).substring(2, 8)}`, // ユニーク番号生成
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

      {/* 繰り返しタスクは統一タスク編集フォームで編集 */}

      {/* ヘルプ・使い方ガイド */}
      <div style={{
        marginTop: '40px',
        padding: '24px 16px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '2px dashed #d1d5db',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#374151',
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          📖 はじめての方へ
        </h3>
        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          lineHeight: 1.6,
          margin: '0 0 16px 0'
        }}>
          TASUKUの機能や使い方が分からない場合は、<br />
          詳しい使い方ガイドをご覧ください。
        </p>
        <a
          href="/help"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'background-color 0.2s ease',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6'
          }}
        >
          📚 詳しい使い方ガイドを見る
        </a>
        <div style={{
          marginTop: '12px',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          基本操作・買い物機能・毎日タスク・期日切れ管理など、<br />
          すべての機能を丁寧に解説しています
        </div>
      </div>

      </div>
    </ThemedContainer>
  )
}