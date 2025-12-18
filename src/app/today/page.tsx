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
import { createClient } from '@/lib/supabase/client'
import { TaskTabNavigation } from '@/components/TaskTabNavigation'
import { logger } from '@/lib/utils/logger'
import { TimeFrameSection } from './components/TimeFrameSection'

export default function TodayPage() {
  const { isInitialized, error } = useDatabase()
  const supabase = createClient()

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
  const [sortMode, setSortMode] = useState<'priority' | 'time'>('time')

  // カテゴリフィルター状態（共通化）
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // 初回マウント時にlocalStorageから読み込み
  useEffect(() => {
    const saved = localStorage.getItem('tasuku_sortMode')
    if (saved === 'priority' || saved === 'time') {
      setSortMode(saved)
    }

    const savedCategories = localStorage.getItem('tasuku_selectedCategories')
    if (savedCategories) {
      try {
        setSelectedCategories(JSON.parse(savedCategories))
      } catch (e) {
        logger.error('カテゴリフィルター設定の読み込みエラー:', e)
      }
    }
  }, [])

  // sortMode変更時にlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('tasuku_sortMode', sortMode)
  }, [sortMode])

  // カテゴリフィルター変更時にlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('tasuku_selectedCategories', JSON.stringify(selectedCategories))
  }, [selectedCategories])

  // まず生データを統一形式に変換
  const rawUnifiedData = useMemo(() => {
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
    if (rawUnifiedData.length === 0) return []

    const sortedData = [...rawUnifiedData].sort((a, b) => {
      // 完了状態による優先度（未完了が上、完了が下）
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }

      // 同じ完了状態内でのソート
      if (sortMode === 'time') {
        // 時間軸ソート：時間設定済み → 時間未設定の順
        const startTimeA = a.start_time || '99:99'
        const startTimeB = b.start_time || '99:99'

        // 時間順で比較（未設定は最後）
        const timeResult = startTimeA.localeCompare(startTimeB)
        if (timeResult !== 0) return timeResult

        // 時間が同じ場合は重要度順
        const priorityA = a.importance || 0
        const priorityB = b.importance || 0
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }

        // 重要度も同じ場合は番号順
        return (a.display_number || '').localeCompare(b.display_number || '')
      } else {
        // 優先度ソート：重要度 → 番号順
        const priorityA = a.importance || 0
        const priorityB = b.importance || 0

        // 重要度が異なる場合は重要度順（高い方が先）
        if (priorityA !== priorityB) {
          return priorityB - priorityA
        }

        // 重要度が同じ場合は番号順
        return (a.display_number || '').localeCompare(b.display_number || '')
      }
    })

    return sortedData
  }, [rawUnifiedData, sortMode])

  // 現在時刻を取得（HH:mm形式）
  const getCurrentTime = useCallback(() => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }, [])

  // 全カテゴリ一覧を取得（今日のタスクとやることリストの両方から）
  const allCategories = useMemo(() => {
    const categories = new Set<string>()
    let hasUncategorized = false

    allUnifiedData
      .filter(task => task.due_date === getTodayJST() || task.due_date === '2999-12-31')
      .forEach(task => {
        if (task.category && task.category.trim() !== '') {
          categories.add(task.category)
        } else {
          hasUncategorized = true
        }
      })

    const result = Array.from(categories).sort()
    // 未分類のタスクがあれば最後に追加
    if (hasUncategorized) {
      result.push('未分類')
    }
    return result
  }, [allUnifiedData])

  // カテゴリフィルターを適用する関数
  const applyCategoryFilter = useCallback((tasks: typeof allUnifiedData, filterCategories: string[]) => {
    if (filterCategories.length === 0) {
      return tasks // フィルターなしの場合は全て表示
    }
    return tasks.filter(task => {
      const taskCategory = task.category || ''
      // 「未分類」が選択されている場合は空のカテゴリもマッチ
      if (filterCategories.includes('未分類') && taskCategory === '') {
        return true
      }
      return filterCategories.includes(taskCategory)
    })
  }, [])

  // 時間軸モード用：今日のタスクを時間枠別に分割（カテゴリフィルター適用）
  const timeFrameTasks = useMemo(() => {
    const todayTasks = allUnifiedData.filter(task => task.due_date === getTodayJST())
    const filteredTasks = applyCategoryFilter(todayTasks, selectedCategories)

    return {
      morning: filteredTasks.filter(task => {
        const startTime = task.start_time
        return startTime && startTime < '09:00'
      }),
      midday: filteredTasks.filter(task => {
        const startTime = task.start_time
        return startTime && startTime >= '09:00' && startTime < '13:00'
      }),
      afternoon: filteredTasks.filter(task => {
        const startTime = task.start_time
        return startTime && startTime >= '13:00' && startTime < '18:00'
      }),
      evening: filteredTasks.filter(task => {
        const startTime = task.start_time
        return !startTime || startTime >= '18:00'
      })
    }
  }, [allUnifiedData, selectedCategories, applyCategoryFilter])

  // 時間枠が期限切れで未完了タスクがあるかチェック
  const isTimeFrameOverdue = useCallback((deadline: string, tasks: typeof timeFrameTasks.morning) => {
    const currentTime = getCurrentTime()
    const hasIncompleteTasks = tasks.some(task => !task.completed)
    return currentTime >= deadline && hasIncompleteTasks
  }, [getCurrentTime])

  // 買い物タスクのサブタスクを自動で取得（データベース参照と同時に）
  useEffect(() => {
    const loadShoppingSubTasks = async () => {
      const shoppingTasks = allUnifiedData.filter(task => task.category === '買い物')
      const updates: {[taskId: string]: SubTask[]} = {}

      for (const task of shoppingTasks) {
        if (!shoppingSubTasks[task.id]) {
          try {
            const subtasks = await unifiedTasks.getSubtasks(task.id)
            updates[task.id] = subtasks
          } catch (error) {
            logger.error(`サブタスク読み込みエラー (${task.id}):`, error)
          }
        }
      }

      // 一度にまとめて更新（無限ループ防止）
      if (Object.keys(updates).length > 0) {
        setShoppingSubTasks(prev => ({ ...prev, ...updates }))
      }
    }

    if (allUnifiedData.length > 0) {
      loadShoppingSubTasks()
    }
    // Note: shoppingSubTasks and unifiedTasks intentionally excluded to prevent infinite loop
    // - shoppingSubTasks accessed via prev => no direct dependency
    // - unifiedTasks.getSubtasks is stable method
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUnifiedData])

  const loading = unifiedTasks.loading

  // 期限切れ繰り返しタスクを非表示にすべきか判定
  const shouldHideExpiredRecurringTask = useCallback((task: UnifiedTask): boolean => {
    if (!task.recurring_template_id || !task.recurring_pattern) return false

    const today = getTodayJST()
    const dueDate = new Date(task.due_date)
    const todayDate = new Date(today)
    const daysOverdue = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    // パターン別の非表示ルール
    if (task.recurring_pattern === 'DAILY' && daysOverdue >= 3) return true
    if (task.recurring_pattern === 'WEEKLY' && daysOverdue >= 7) return true
    if (task.recurring_pattern === 'MONTHLY' && daysOverdue >= 365) return true

    return false
  }, [])

  // サブタスク管理関数 - データベース連携
  const loadShoppingSubTasks = useCallback(async (taskId: string) => {
    try {
      const subtasks = await unifiedTasks.getSubtasks(taskId)
      setShoppingSubTasks(prev => ({
        ...prev,
        [taskId]: subtasks
      }))
    } catch (error) {
      logger.error('サブタスク読み込みエラー:', error)
    }
  }, [unifiedTasks])

  const addShoppingSubTask = useCallback(async (taskId: string, itemName: string) => {
    try {
      await unifiedTasks.createSubtask(taskId, itemName)
      await loadShoppingSubTasks(taskId) // 再読み込み

      if (process.env.NODE_ENV === 'development') {
        logger.info(`サブタスク追加: ${itemName} (Parent: ${taskId})`)
      }
    } catch (error) {
      logger.error('サブタスク追加エラー:', error)
    }
  }, [unifiedTasks, loadShoppingSubTasks])

  const toggleShoppingSubTask = useCallback(async (taskId: string, subTaskId: string) => {
    try {
      await unifiedTasks.toggleSubtask(subTaskId)
      await loadShoppingSubTasks(taskId) // 再読み込み
    } catch (error) {
      logger.error('サブタスク切り替えエラー:', error)
    }
  }, [unifiedTasks, loadShoppingSubTasks])

  const deleteShoppingSubTask = useCallback(async (taskId: string, subTaskId: string) => {
    try {
      await unifiedTasks.deleteSubtask(subTaskId)
      await loadShoppingSubTasks(taskId) // 再読み込み
    } catch (error) {
      logger.error('サブタスク削除エラー:', error)
    }
  }, [unifiedTasks, loadShoppingSubTasks])

  const updateShoppingSubTask = useCallback(async (taskId: string, subTaskId: string, updates: { title?: string }) => {
    try {
      await unifiedTasks.updateSubtask(subTaskId, updates)
      await loadShoppingSubTasks(taskId) // 再読み込み
    } catch (error) {
      logger.error('サブタスク更新エラー:', error)
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
  const [showOverdueRecurringTasks, setShowOverdueRecurringTasks] = useState(false)
  const [showFutureTasks, setShowFutureTasks] = useState(false)
  const [showShoppingTasks, setShowShoppingTasks] = useState(false)
  const [showTodoList, setShowTodoList] = useState(false)
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)

  // 時間枠セクション表示切り替え状態（localStorage保存）
  // 注意: SSR時はlocalStorageが存在しないため、デフォルト値で初期化してuseEffectで読み込む
  const [showMorningTasks, setShowMorningTasks] = useState(true)
  const [showMiddayTasks, setShowMiddayTasks] = useState(true)
  const [showAfternoonTasks, setShowAfternoonTasks] = useState(true)
  const [showEveningTasks, setShowEveningTasks] = useState(true)

  // 時間枠セクション開閉状態をlocalStorageから読み込み（クライアントサイドのみ）
  useEffect(() => {
    const savedMorning = localStorage.getItem('tasuku_showMorningTasks')
    const savedMidday = localStorage.getItem('tasuku_showMiddayTasks')
    const savedAfternoon = localStorage.getItem('tasuku_showAfternoonTasks')
    const savedEvening = localStorage.getItem('tasuku_showEveningTasks')

    if (savedMorning !== null) setShowMorningTasks(savedMorning === 'true')
    if (savedMidday !== null) setShowMiddayTasks(savedMidday === 'true')
    if (savedAfternoon !== null) setShowAfternoonTasks(savedAfternoon === 'true')
    if (savedEvening !== null) setShowEveningTasks(savedEvening === 'true')
  }, [])

  // 時間枠セクション開閉状態をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('tasuku_showMorningTasks', String(showMorningTasks))
  }, [showMorningTasks])

  useEffect(() => {
    localStorage.setItem('tasuku_showMiddayTasks', String(showMiddayTasks))
  }, [showMiddayTasks])

  useEffect(() => {
    localStorage.setItem('tasuku_showAfternoonTasks', String(showAfternoonTasks))
  }, [showAfternoonTasks])

  useEffect(() => {
    localStorage.setItem('tasuku_showEveningTasks', String(showEveningTasks))
  }, [showEveningTasks])

  const handleCreateRegular = useCallback(async (title: string, memo: string, dueDate: string, category?: string, importance?: number, urls?: string[], attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }, shoppingItems?: string[], startTime?: string, endTime?: string) => {
    try {
      logger.info('統一タスク作成:', { title, memo, dueDate, category, importance, urls, attachment, shoppingItems })
      logger.info('🛒 handleCreateRegular - 受け取った買い物リスト:', shoppingItems)

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
        logger.info(`🛒 買い物リスト ${shoppingItems.length} 件をサブタスクとして並列追加完了`)
      }

      logger.info('✅ 通常タスク作成完了:', title)
      setShowCreateForm(false) // フォームを閉じる
    } catch (error) {
      logger.error('❌ 通常タスク作成エラー:', error)
    }
  }, [unifiedTasks])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized) {
        if (process.env.NODE_ENV === 'development') {
          logger.info('Forcing interface display after timeout')
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
      logger.info('✨ 繰り返しタスクテンプレート作成開始:', { title, memo, settings, importance, urls, category, attachment, shoppingItems, startTime, endTime })

      // 1. recurring_templatesにテンプレートを保存
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ユーザー認証エラー')

      const templateData: Record<string, unknown> = {
        title: title.trim(),
        memo: memo.trim() || null,
        category: category || null,
        importance: importance || 3,
        pattern: settings.pattern,
        start_time: startTime || null,
        end_time: endTime || null,
        urls: urls && urls.length > 0 ? urls : [],
        active: true,
        user_id: user.id
      }

      // パターン別の設定
      if (settings.pattern === 'WEEKLY') {
        templateData.weekdays = settings.selectedWeekdays
      } else if (settings.pattern === 'MONTHLY') {
        templateData.day_of_month = settings.dayOfMonth
      } else if (settings.pattern === 'YEARLY') {
        templateData.month_of_year = settings.monthOfYear
        templateData.day_of_year = settings.dayOfYear
      }

      // 添付ファイルがあれば追加
      if (attachment) {
        templateData.attachment_file_name = attachment.file_name
        templateData.attachment_file_type = attachment.file_type
        templateData.attachment_file_size = attachment.file_size
        templateData.attachment_file_data = attachment.file_data
      }

      const { data: template, error: templateError } = await supabase
        .from('recurring_templates')
        .insert(templateData)
        .select()
        .single()

      if (templateError) {
        logger.error('❌ テンプレート保存エラー:', templateError)
        throw templateError
      }

      logger.info('✅ テンプレート保存完了:', template.id)

      // 2. 買い物リストがあればsubtasksに保存（parent_task_id = template.id）
      if (shoppingItems && shoppingItems.length > 0 && category === '買い物') {
        for (const item of shoppingItems) {
          await unifiedTasks.createSubtask(template.id, item)
        }
        logger.info(`✅ テンプレートの買い物リスト保存完了: ${shoppingItems.length}件`)
      }

      // 3. 今日の分のタスクを初回生成（自動生成システムに任せる）
      // generateMissingTasks を呼び出すことで、新しいテンプレートから自動生成される
      await generateMissingTasks(true)

      logger.info('✅ 繰り返しタスク作成完了:', title)
      setShowCreateForm(false)
    } catch (error) {
      logger.error('❌ 繰り返しタスク作成エラー:', error)
    }
  }

  const handleEditTask = async (task: UnifiedTask) => {
    // 買い物カテゴリの場合は先にsubtasksを読み込む
    if (task.category === '買い物') {
      await loadShoppingSubTasks(task.id)
    }
    setEditingTask(task)
    setShowEditForm(true)
  }

  const handleUpdateTask = async (taskId: string, title: string, memo: string, dueDate: string, category?: string, importance?: 1 | 2 | 3 | 4 | 5, urls?: string[], startTime?: string, endTime?: string, attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }) => {
    // タスクを更新
    await unifiedTasks.updateTask(taskId, { title, memo, due_date: dueDate, category, importance, urls, start_time: startTime, end_time: endTime, attachment })

    // 繰り返しタスクの場合、テンプレートも更新
    if (editingTask?.recurring_template_id) {
      logger.info(`🔄 繰り返しタスク ${editingTask.title} の編集→テンプレート ${editingTask.recurring_template_id} も更新`)

      try {
        const { error: templateError } = await supabase
          .from('recurring_templates')
          .update({
            title,
            memo,
            category,
            importance,
            urls: urls || [],
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTask.recurring_template_id)

        if (templateError) {
          logger.error('❌ テンプレート更新エラー:', templateError)
        } else {
          logger.info('✅ テンプレートも更新しました')
        }
      } catch (error) {
        logger.error('❌ テンプレート更新処理エラー:', error)
      }
    }

    // フォームを閉じる
    setShowEditForm(false)
    setEditingTask(null)

    // 注: 楽観的UI更新により、タスクリストの再読み込みは不要
    // updateTaskが既にローカル状態とキャッシュを更新している
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }} className="today-header">
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0' }} className="today-title">
              📅 今日 - {formatDateForDisplay(getTodayJST())}
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} className="today-buttons">
              {/* タスク更新ボタン */}
              <button
                onClick={() => {
                  logger.info('🔄 手動でタスク更新を実行...')
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
                  opacity: isGenerating ? 0.5 : 1,
                  minWidth: '100px'
                }}
              >
                {isGenerating ? '更新中...' : '🔄 タスク更新'}
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

        {/* データベース初期化メッセージは削除（通常は一瞬で完了するためチラつきの原因） */}

        {/* 繰り返しタスク生成メッセージは削除（通常は一瞬で完了するためチラつきの原因） */}

        {/* Show generation error if any */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            今日やるべきタスクを管理します。重要度や時刻で並び替えできます。
          </p>
        </div>

        <div style={{
          background: '#fef2f2',
          border: '1px solid #ef4444',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '12px',
          fontSize: '14px',
          color: '#dc2626',
          visibility: generationError ? 'visible' : 'hidden',
          height: generationError ? 'auto' : '0',
          minHeight: generationError ? '48px' : '0',
          overflow: 'hidden',
          transition: 'none'
        }}>
          ❌ タスク生成エラー: {generationError}
        </div>

        {/* タブナビゲーション */}
        <TaskTabNavigation />

        {/* 認証状態表示 */}
        <div style={{ marginBottom: '12px' }}>
          <AuthStatus />
        </div>
      </header>

      <main>
        {/* 今日のメインタスク表示（大本） */}
        <div style={{ marginBottom: '12px', position: 'relative' }}>
          {/* タイトルとソート切り替えUI */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: '0',
                color: '#1f2937'
              }}>
                📅 今日のタスク
              </h3>

              {/* カテゴリフィルターボタン */}
              <button
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  background: showCategoryFilter ? '#3b82f6' : '#f3f4f6',
                  color: showCategoryFilter ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  position: 'relative'
                }}
              >
                🏷️ フィルター
                {selectedCategories.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '6px',
                    height: '6px',
                    background: '#ef4444',
                    borderRadius: '50%',
                    border: '1px solid white'
                  }} />
                )}
              </button>
            </div>

            {/* ソート切り替えボタン */}
            <div style={{
              display: 'flex',
              background: '#f3f4f6',
              borderRadius: '6px',
              padding: '2px',
              gap: '2px'
            }}>
              <button
                onClick={() => {
                  setSortMode('priority')
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
                  transition: 'all 0.2s ease'
                }}
              >
                重要度
              </button>
              <button
                onClick={() => {
                  setSortMode('time')
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
                  transition: 'all 0.2s ease'
                }}
              >
                時間軸
              </button>
            </div>
          </div>

          {/* カテゴリフィルタードロップダウン（共通化） */}
          {showCategoryFilter && allCategories.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '40px',
              left: '140px',
              zIndex: 1000,
              padding: '12px',
              background: 'white',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              minWidth: '200px',
              maxWidth: '300px',
              marginBottom: '8px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#6b7280'
                }}>
                  カテゴリフィルター
                </div>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    style={{
                      padding: '2px 8px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    クリア
                  </button>
                )}
              </div>
              <div style={{
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {allCategories.map((category, index) => (
                  <label
                    key={category}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: index < allCategories.length - 1 ? '1px solid #f3f4f6' : 'none',
                      background: selectedCategories.includes(category) ? '#eff6ff' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedCategories.includes(category)) {
                        e.currentTarget.style.background = '#f9fafb'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedCategories.includes(category)) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category])
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category))
                        }
                      }}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                        accentColor: '#3b82f6'
                      }}
                    />
                    <span style={{
                      fontSize: '13px',
                      color: '#374151',
                      flex: 1
                    }}>
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ソートモードに応じて表示を切り替え */}
          {sortMode === 'priority' ? (
            // 重要度モード：カテゴリフィルター適用
            <div style={{ marginLeft: '16px' }}>
              <UnifiedTasksTable
                title=""
                tasks={applyCategoryFilter(
                  allUnifiedData.filter(task => task.due_date === getTodayJST()),
                  selectedCategories
                )}
                emptyMessage=""
                unifiedTasks={unifiedTasks}
                handleEditTask={handleEditTask}
                shoppingSubTasks={shoppingSubTasks}
                expandedShoppingLists={expandedShoppingLists}
                toggleShoppingList={toggleShoppingList}
                addShoppingSubTask={addShoppingSubTask}
                toggleShoppingSubTask={toggleShoppingSubTask}
                deleteShoppingSubTask={deleteShoppingSubTask}
                updateShoppingSubTask={updateShoppingSubTask}
                showTitle={false}
              />
            </div>
          ) : (
            // 時間軸モード：4つの時間枠で表示
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <TimeFrameSection
                emoji="🌅"
                title="9時まで"
                tasks={timeFrameTasks.morning}
                deadline="09:00"
                isOverdue={isTimeFrameOverdue('09:00', timeFrameTasks.morning)}
                isExpanded={showMorningTasks}
                onToggleExpanded={setShowMorningTasks}
                unifiedTasks={unifiedTasks}
                handleEditTask={handleEditTask}
                shoppingSubTasks={shoppingSubTasks}
                expandedShoppingLists={expandedShoppingLists}
                toggleShoppingList={toggleShoppingList}
                addShoppingSubTask={addShoppingSubTask}
                toggleShoppingSubTask={toggleShoppingSubTask}
                deleteShoppingSubTask={deleteShoppingSubTask}
                updateShoppingSubTask={updateShoppingSubTask}
              />

              <TimeFrameSection
                emoji="☀️"
                title="13時まで"
                tasks={timeFrameTasks.midday}
                deadline="13:00"
                isOverdue={isTimeFrameOverdue('13:00', timeFrameTasks.midday)}
                isExpanded={showMiddayTasks}
                onToggleExpanded={setShowMiddayTasks}
                unifiedTasks={unifiedTasks}
                handleEditTask={handleEditTask}
                shoppingSubTasks={shoppingSubTasks}
                expandedShoppingLists={expandedShoppingLists}
                toggleShoppingList={toggleShoppingList}
                addShoppingSubTask={addShoppingSubTask}
                toggleShoppingSubTask={toggleShoppingSubTask}
                deleteShoppingSubTask={deleteShoppingSubTask}
                updateShoppingSubTask={updateShoppingSubTask}
              />

              <TimeFrameSection
                emoji="🌤️"
                title="18時まで"
                tasks={timeFrameTasks.afternoon}
                deadline="18:00"
                isOverdue={isTimeFrameOverdue('18:00', timeFrameTasks.afternoon)}
                isExpanded={showAfternoonTasks}
                onToggleExpanded={setShowAfternoonTasks}
                unifiedTasks={unifiedTasks}
                handleEditTask={handleEditTask}
                shoppingSubTasks={shoppingSubTasks}
                expandedShoppingLists={expandedShoppingLists}
                toggleShoppingList={toggleShoppingList}
                addShoppingSubTask={addShoppingSubTask}
                toggleShoppingSubTask={toggleShoppingSubTask}
                deleteShoppingSubTask={deleteShoppingSubTask}
                updateShoppingSubTask={updateShoppingSubTask}
              />

              <TimeFrameSection
                emoji="🌙"
                title="24時まで"
                tasks={timeFrameTasks.evening}
                deadline="23:59"
                isOverdue={isTimeFrameOverdue('23:59', timeFrameTasks.evening)}
                isExpanded={showEveningTasks}
                onToggleExpanded={setShowEveningTasks}
                unifiedTasks={unifiedTasks}
                handleEditTask={handleEditTask}
                shoppingSubTasks={shoppingSubTasks}
                expandedShoppingLists={expandedShoppingLists}
                toggleShoppingList={toggleShoppingList}
                addShoppingSubTask={addShoppingSubTask}
                toggleShoppingSubTask={toggleShoppingSubTask}
                deleteShoppingSubTask={deleteShoppingSubTask}
                updateShoppingSubTask={updateShoppingSubTask}
              />
            </div>
          )}
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
            <>
              {/* 通常の期限切れタスク（繰り返しタスク以外） */}
              <div style={{ marginLeft: '16px' }}>
                <UnifiedTasksTable
                  title="🚨 期限切れタスク"
                  tasks={allUnifiedData.filter(task =>
                    !task.completed &&
                    task.due_date &&
                    task.due_date < getTodayJST() &&
                    (!task.recurring_template_id || task.recurring_template_id === '')
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
                  updateShoppingSubTask={updateShoppingSubTask}
                />
              </div>

              {/* 期限切れ繰り返しタスク（二重折りたたみ） */}
              {allUnifiedData.filter(task =>
                !task.completed &&
                task.due_date &&
                task.due_date < getTodayJST() &&
                task.recurring_template_id &&
                task.recurring_template_id !== '' &&
                !shouldHideExpiredRecurringTask(task)
              ).length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px',
                    gap: '8px',
                    marginLeft: '16px'
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#6b7280',
                      cursor: 'pointer'
                    }}>
                      ⚠️ 期限切れ繰り返しタスク ({allUnifiedData.filter(task =>
                        !task.completed &&
                        task.due_date &&
                        task.due_date < getTodayJST() &&
                        task.recurring_template_id &&
                        task.recurring_template_id !== '' &&
                        !shouldHideExpiredRecurringTask(task)
                      ).length}件) {showOverdueRecurringTasks ? '▼' : '▶'} 表示する
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '400',
                        color: '#9ca3af',
                        marginLeft: '8px'
                      }}>
                        (日次: 期限から3日経過で削除 / 週次: 期限から7日経過で削除)
                      </span>
                      <input
                        type="checkbox"
                        checked={showOverdueRecurringTasks}
                        onChange={(e) => setShowOverdueRecurringTasks(e.target.checked)}
                        style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
                      />
                    </label>
                  </div>
                  {showOverdueRecurringTasks && (
                    <div style={{ marginLeft: '32px' }}>
                      <UnifiedTasksTable
                        title=""
                        tasks={allUnifiedData.filter(task =>
                          !task.completed &&
                          task.due_date &&
                          task.due_date < getTodayJST() &&
                          task.recurring_template_id &&
                          task.recurring_template_id !== '' &&
                          !shouldHideExpiredRecurringTask(task)
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
                        updateShoppingSubTask={updateShoppingSubTask}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
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
              📆 明日以降のタスク ({allUnifiedData.filter(task => !task.completed && task.due_date && task.due_date > getTodayJST() && task.due_date !== '2999-12-31' && task.task_type !== 'RECURRING').length}件) {showFutureTasks ? '☑️' : '☐'} 表示する
              <input
                type="checkbox"
                checked={showFutureTasks}
                onChange={(e) => setShowFutureTasks(e.target.checked)}
                style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
              />
            </label>
          </div>
          {showFutureTasks && (
            <div style={{ marginLeft: '16px' }}>
              <UnifiedTasksTable
                title="📆 明日以降のタスク"
                tasks={allUnifiedData.filter(task =>
                  !task.completed && task.due_date && task.due_date > getTodayJST() && task.due_date !== '2999-12-31' && task.task_type !== 'RECURRING'
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
                updateShoppingSubTask={updateShoppingSubTask}
              />
            </div>
          )}
        </div>

        {/* 買い物タスクセクション */}
        <div style={{ marginBottom: '12px', marginTop: '20px' }}>
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
              🛒 買い物タスク ({allUnifiedData.filter(task =>
                task.category === '買い物' && !task.completed
              ).length}件) {showShoppingTasks ? '☑️' : '☐'} 表示する
              <input
                type="checkbox"
                checked={showShoppingTasks}
                onChange={(e) => setShowShoppingTasks(e.target.checked)}
                style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
              />
            </label>
          </div>
          {showShoppingTasks && (
            <div style={{ marginLeft: '16px' }}>
              <UnifiedTasksTable
                title="🛒 買い物タスク"
                tasks={allUnifiedData.filter(task => {
                  // 買い物カテゴリで未完了のタスクのみ
                  return task.category === '買い物' && !task.completed
                })}
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
                updateShoppingSubTask={updateShoppingSubTask}
              />
            </div>
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
            <div style={{ marginLeft: '16px' }}>
              <UnifiedTasksTable
                title="💡 やることリスト"
                tasks={applyCategoryFilter(
                  allUnifiedData.filter(task => task.due_date === '2999-12-31'),
                  selectedCategories
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
                updateShoppingSubTask={updateShoppingSubTask}
              />
            </div>
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
                logger.info('アイデア作成:', text)

                // アイデア（期限なしタスク）として作成
                await unifiedTasks.createTask({
                  title: text.trim(),
                  due_date: '2999-12-31', // 期限なしタスクの特別日付
                  task_type: 'IDEA',
                  display_number: await UnifiedTasksService.generateDisplayNumber(), // 正式な番号生成
                  completed: false,
                  archived: false
                })

                logger.info('✅ アイデア作成完了:', text)
              } catch (error) {
                logger.error('❌ アイデア作成エラー:', error)
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
        shoppingSubTasks={shoppingSubTasks}
        onAddShoppingItem={addShoppingSubTask}
        onUpdateShoppingItem={(taskId, subTaskId, newTitle) => updateShoppingSubTask(taskId, subTaskId, { title: newTitle })}
        onDeleteShoppingItem={deleteShoppingSubTask}
      />

      {/* マニュアル */}
      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '2px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <a
          href="/help"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #d1d5db',
            transition: 'all 0.2s'
          }}
        >
          📖 マニュアル
        </a>
        <p style={{
          marginTop: '12px',
          fontSize: '13px',
          color: '#6b7280'
        }}>
          TASUKUの使い方や機能の詳細を確認できます
        </p>
      </div>

      </div>
    </ThemedContainer>
  )
}