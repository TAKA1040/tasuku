'use client'

import { useState, useEffect } from 'react'
import { useDatabase } from '@/hooks/useDatabase'
import { useTasks } from '@/hooks/useTasks'
import { useRecurringTasks } from '@/hooks/useRecurringTasks'
import { useRollover } from '@/hooks/useRollover'
import { formatDateForDisplay, getTodayJST } from '@/lib/utils/date-jst'
import { TaskTable } from '@/components/TaskTable'
import { UpcomingPreview } from '@/components/UpcomingPreview'
import { RolloverPrompt } from '@/components/RolloverPrompt'
import { TaskEditForm } from '@/components/TaskEditForm'
import { TaskCreateForm2 } from '@/components/TaskCreateForm2'
import { IdeaBox } from '@/components/IdeaBox'
import { useIdeas } from '@/hooks/useIdeas'
import { Task } from '@/lib/db/schema'
import { ThemedContainer } from '@/components/ThemedContainer'
import { ThemeToggle } from '@/components/ThemeToggle'
import { VoiceInputButton } from '@/components/VoiceInputButton'

export default function TodayPage() {
  const { isInitialized, error } = useDatabase()
  const { loading: tasksLoading, getTodayTasks, getTodayCompletedTasks, getUpcomingTasks, completeTask, quickMoveTask, createTask, updateTask, allTasks } = useTasks(isInitialized)
  const { loading: recurringLoading, getTodayRecurringTasks, getTodayCompletedRecurringTasks, getUpcomingRecurringTasks, completeRecurringTask, createRecurringTask, allRecurringTasks } = useRecurringTasks(isInitialized)
  const { ideas, addIdea, toggleIdea, deleteIdea } = useIdeas()
  
  // 繰り越し機能
  const { 
    rolloverData, 
    hasRolloverCandidates, 
    rolloverDisplayText, 
    isRollingOver, 
    executeRollover 
  } = useRollover(allTasks, allRecurringTasks, isInitialized, true)
  
  // 繰り越しプロンプト表示制御
  const [showRolloverPrompt, setShowRolloverPrompt] = useState(false)
  
  // タスク作成フォーム表示制御
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // タスク編集フォーム表示制御
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  
  // Timeout to show interface even if DB loading takes too long
  const [forceShow, setForceShow] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized) {
        console.log('Forcing interface display after timeout')
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
  if (!isInitialized && !forceShow && (tasksLoading || recurringLoading)) {
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

  // Safe data fetching - fallback to empty arrays if not initialized
  const todayTasks = isInitialized ? getTodayTasks() : []
  const todayCompletedTasks = isInitialized ? getTodayCompletedTasks() : []
  const todayRecurringTasks = isInitialized ? getTodayRecurringTasks() : []
  const todayCompletedRecurringTasks = isInitialized ? getTodayCompletedRecurringTasks() : []
  const upcomingTasks = isInitialized ? getUpcomingTasks() : []
  const upcomingRecurringTasks = isInitialized ? getUpcomingRecurringTasks() : []
  
  // Combine upcoming tasks for preview
  const allUpcoming = [
    ...upcomingTasks,
    ...upcomingRecurringTasks.map(item => ({
      task: {
        id: item.task.id,
        title: item.task.title,
        due_date: item.nextDate
      } as Task,
      urgency: 'Normal' as const,
      days_from_today: item.daysFromToday
    }))
  ].sort((a, b) => a.days_from_today - b.days_from_today).slice(0, 3)

  const handleMoveToToday = (taskId: string) => {
    quickMoveTask(taskId, getTodayJST())
  }

  const handleCreateRegular = async (title: string, memo: string, dueDate: string, category?: string, importance?: number, durationMin?: number, urls?: string[]) => {
    await createTask(title, memo, dueDate, category, importance, durationMin, urls)
  }

  const handleCreateRecurring = async (title: string, memo: string, settings: {
    pattern: string
    intervalDays: number
    selectedWeekdays: number[]
    dayOfMonth: number
    monthOfYear: number
    dayOfYear: number
  }, importance?: number, durationMin?: number, urls?: string[]) => {
    const { pattern, intervalDays, selectedWeekdays, dayOfMonth } = settings
    
    // パターンをスキーマ形式に変換
    let frequency: 'DAILY' | 'INTERVAL_DAYS' | 'WEEKLY' | 'MONTHLY'
    let intervalN = 1
    let weekdays: number[] | undefined
    let monthDay: number | undefined
    
    switch (pattern) {
      case 'daily':
        frequency = 'DAILY'
        break
      case 'interval':
        frequency = 'INTERVAL_DAYS'
        intervalN = intervalDays
        break
      case 'weekly':
        frequency = 'WEEKLY'
        weekdays = selectedWeekdays.length > 0 ? selectedWeekdays : [1] // デフォルト月曜日
        break
      case 'monthly':
        frequency = 'MONTHLY'
        monthDay = dayOfMonth
        break
      default:
        frequency = 'DAILY'
    }
    
    await createRecurringTask(title, memo, frequency, intervalN, weekdays, monthDay, undefined, undefined, importance, durationMin, urls)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowEditForm(true)
  }

  const handleUpdateTask = async (taskId: string, title: string, memo: string, dueDate: string, category?: string, importance?: 1 | 2 | 3 | 4 | 5, durationMin?: number, urls?: string[]) => {
    await updateTask(taskId, { title, memo, due_date: dueDate, category, importance, duration_min: durationMin, urls })
  }

  const handleCancelEdit = () => {
    setShowEditForm(false)
    setEditingTask(null)
  }

  const handleVoiceInput = async (voiceText: string) => {
    // 音声からタスクを自動作成
    const today = getTodayJST()
    await createTask(voiceText, '', today) // タイトル=音声入力、メモ=空、期日=今日
    console.log('音声でタスクを作成:', voiceText)
  }

  return (
    <ThemedContainer>
      <div style={{ padding: '8px', maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>
              今日 - {formatDateForDisplay(getTodayJST())}
            </h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
            >
              🎉 Done
            </a>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <VoiceInputButton 
                onResult={handleVoiceInput}
                size="medium"
              />
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
        
        {/* 繰り越し候補通知 */}
        {hasRolloverCandidates && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '12px',
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: '#92400e' }}>
              {rolloverDisplayText}
            </span>
            <button
              onClick={() => setShowRolloverPrompt(true)}
              style={{
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer'
              }}
            >
              確認
            </button>
          </div>
        )}
      </header>

      <main>
        {/* 今日のタスク表 */}
        <section style={{ marginBottom: '12px' }}>
          <TaskTable
            tasks={todayTasks}
            recurringTasks={todayRecurringTasks}
            completedTasks={todayCompletedTasks}
            completedRecurringTasks={todayCompletedRecurringTasks}
            onComplete={completeTask}
            onRecurringComplete={completeRecurringTask}
            onQuickMove={quickMoveTask}
            onEdit={handleEditTask}
          />
        </section>

        {/* 近々の予告 */}
        <UpcomingPreview
          upcomingTasks={allUpcoming}
          onMoveToToday={handleMoveToToday}
        />

        {/* やることリスト */}
        <section style={{ marginBottom: '12px' }}>
          <IdeaBox
            ideas={ideas}
            onAdd={addIdea}
            onToggle={toggleIdea}
            onDelete={deleteIdea}
          />
        </section>
      </main>

      {/* 繰り越し確認ダイアログ */}
      {showRolloverPrompt && rolloverData && (
        <RolloverPrompt
          rolloverData={rolloverData}
          isRollingOver={isRollingOver}
          onRollover={executeRollover}
          onDismiss={() => setShowRolloverPrompt(false)}
        />
      )}

      {/* タスク作成フォーム */}
      <TaskCreateForm2
        isVisible={showCreateForm}
        onSubmitRegular={handleCreateRegular}
        onSubmitRecurring={handleCreateRecurring}
        onAddToIdeas={addIdea}
        onCancel={() => setShowCreateForm(false)}
      />

      {/* タスク編集フォーム */}
      <TaskEditForm
        task={editingTask}
        isVisible={showEditForm}
        onSubmit={handleUpdateTask}
        onCancel={handleCancelEdit}
      />
      </div>
    </ThemedContainer>
  )
}