'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useDatabase } from '@/hooks/useDatabase'
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks'
import { useRollover } from '@/hooks/useRollover'
import { formatDateForDisplay, getTodayJST } from '@/lib/utils/date-jst'
import { TaskTable } from '@/components/TaskTable'
import { UpcomingPreview } from '@/components/UpcomingPreview'
import { IncompleteTasksToggle } from '@/components/IncompleteTasksToggle'
import { TaskEditForm } from '@/components/TaskEditForm'
import { RecurringTaskEditForm } from '@/components/RecurringTaskEditForm'
import { TaskCreateForm2 } from '@/components/TaskCreateForm2'
import { IdeaBox } from '@/components/IdeaBox'
import { Task, RecurringTask, SubTask } from '@/lib/db/schema'
import { ThemedContainer } from '@/components/ThemedContainer'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AuthStatus } from '@/components/AuthStatus'
import { ShoppingTasksSection } from '@/components/ShoppingTasksSection'
import { subTaskService } from '@/lib/db/supabase-subtasks'

export default function TodayPage() {
  const { isInitialized, error } = useDatabase()

  // ページタイトルを設定
  useEffect(() => {
    document.title = 'TASUKU - 今日のタスク'
  }, [])

  const {
    loading,
    getTodayTasks,
    getTodayCompletedTasks,
    getUpcomingTasks,
    getOverdueTasks,
    completeTask,
    createTask,
    updateTask,
    uncompleteTask,
    deleteTask,
    allTasks,
    getTodayRecurringTasks,
    getTodayCompletedRecurringTasks,
    getUpcomingRecurringTasks,
    completeRecurringTask,
    createRecurringTask,
    uncompleteRecurringTask,
    updateRecurringTask,
    deleteRecurringTask,
    allRecurringTasks,
    ideas,
    addIdea,
    toggleIdea,
    editIdea,
    deleteIdea
  } = useUnifiedTasks(isInitialized)

  // 繰り越し機能
  const {
    rolloverData,
    isRollingOver,
    executeRollover
  } = useRollover(allTasks, allRecurringTasks, isInitialized, true)
  
  
  // タスク作成フォーム表示制御
  const [showCreateForm, setShowCreateForm] = useState(false)

  // タスク編集フォーム表示制御
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // 繰り返しタスク編集フォーム表示制御
  const [showRecurringEditForm, setShowRecurringEditForm] = useState(false)
  const [editingRecurringTask, setEditingRecurringTask] = useState<RecurringTask | null>(null)

  // 期日切れタスク表示制御
  const [showOverdueTasks, setShowOverdueTasks] = useState(false)

  // 期限切れタスクのサブタスク機能
  const [overdueSubTasks, setOverdueSubTasks] = useState<{ [taskId: string]: SubTask[] }>({})
  const [showOverdueShoppingLists, setShowOverdueShoppingLists] = useState<{ [taskId: string]: boolean }>({})
  const [overdueNewItemInputs, setOverdueNewItemInputs] = useState<{ [taskId: string]: string }>({})
  const [overdueEditingSubTask, setOverdueEditingSubTask] = useState<{ taskId: string; subTaskId: string; title: string } | null>(null)


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

  // Safe data fetching - fallback to empty arrays if not initialized
  const todayTasks = useMemo(() => isInitialized ? getTodayTasks() : [], [isInitialized, getTodayTasks])
  const todayCompletedTasks = useMemo(() => isInitialized ? getTodayCompletedTasks() : [], [isInitialized, getTodayCompletedTasks])
  const overdueTasks = useMemo(() => isInitialized ? getOverdueTasks() : [], [isInitialized, getOverdueTasks])
  const todayRecurringTasks = useMemo(() => isInitialized ? getTodayRecurringTasks() : [], [isInitialized, getTodayRecurringTasks])
  const todayCompletedRecurringTasks = useMemo(() => isInitialized ? getTodayCompletedRecurringTasks() : [], [isInitialized, getTodayCompletedRecurringTasks])
  const upcomingTasks = useMemo(() => isInitialized ? getUpcomingTasks() : [], [isInitialized, getUpcomingTasks])
  const upcomingRecurringTasks = useMemo(() => isInitialized ? getUpcomingRecurringTasks() : [], [isInitialized, getUpcomingRecurringTasks])
  
  // Combine upcoming tasks for preview (7日以上も含めてすべて渡す)
  const allUpcoming = [
    ...upcomingTasks,
    ...upcomingRecurringTasks
      .filter(item => item && item.task && item.nextDate !== undefined && item.daysFromToday !== undefined)
      .map(item => ({
        task: {
          id: item.task.id,
          title: item.task.title,
          due_date: item.nextDate
        } as Task,
        urgency: 'Normal' as const,
        days_from_today: item.daysFromToday
      }))
  ].sort((a, b) => a.days_from_today - b.days_from_today)


  const handleCreateRegular = async (title: string, memo: string, dueDate: string, category?: string, importance?: number, durationMin?: number, urls?: string[], attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }) => {
    await createTask(title, memo, dueDate, category, importance, durationMin, urls, attachment)
  }

  const handleCreateRecurring = async (title: string, memo: string, settings: {
    pattern: string
    intervalDays: number
    selectedWeekdays: number[]
    dayOfMonth: number
    monthOfYear: number
    dayOfYear: number
  }, importance?: number, durationMin?: number, urls?: string[], category?: string, attachment?: { file_name: string; file_type: string; file_size: number; file_data: string }) => {
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
    
    await createRecurringTask(title, memo, frequency, intervalN, weekdays, monthDay, undefined, undefined, importance, durationMin, urls, category, attachment)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowEditForm(true)
  }

  const handleUpdateTask = async (taskId: string, title: string, memo: string, dueDate: string, category?: string, importance?: 1 | 2 | 3 | 4 | 5, durationMin?: number, urls?: string[]) => {
    // 元のタスクの情報を取得して、IDEAかどうか判定
    const originalTask = allTasks.find(t => t.id === taskId)
    const isOriginalIdea = originalTask?.task_type === 'IDEA'

    const updateData: any = {
      title,
      memo,
      due_date: dueDate && dueDate.trim() ? dueDate.trim() : undefined,
      category,
      importance,
      duration_min: durationMin,
      urls
    }

    // IDEAから通常タスクへの変換判定
    if (isOriginalIdea) {
      if (dueDate && dueDate.trim()) {
        // 期限が設定された場合、通常タスクに変換
        updateData.task_type = 'NORMAL'
      } else {
        // 期限がない場合、IDEAタイプのまま更新
        updateData.task_type = 'IDEA'
      }
    }

    await updateTask(taskId, updateData)
  }

  const handleCancelEdit = () => {
    setShowEditForm(false)
    setEditingTask(null)
  }

  // Helper functions for recurring task completion with fixed signatures
  const handleCompleteRecurringTask = (taskId: string) => {
    const today = getTodayJST()
    return completeRecurringTask(taskId, today)
  }

  const handleUncompleteRecurringTask = (taskId: string) => {
    const today = getTodayJST()
    return uncompleteRecurringTask(taskId, today)
  }

  const handleEditRecurringTask = (task: RecurringTask) => {
    setEditingRecurringTask(task)
    setShowRecurringEditForm(true)
  }

  const handleUpdateRecurringTask = async (
    taskId: string,
    title: string,
    memo: string,
    frequency: 'DAILY' | 'INTERVAL_DAYS' | 'WEEKLY' | 'MONTHLY',
    intervalN: number,
    weekdays?: number[],
    monthDay?: number,
    importance?: 1 | 2 | 3 | 4 | 5,
    durationMin?: number,
    urls?: string[],
    category?: string
  ) => {
    await updateRecurringTask(taskId, {
      title,
      memo,
      frequency,
      interval_n: intervalN,
      weekdays,
      month_day: monthDay,
      importance,
      duration_min: durationMin,
      urls,
      category
    })
    setShowRecurringEditForm(false)
    setEditingRecurringTask(null)
  }

  const handleCancelRecurringEdit = () => {
    setShowRecurringEditForm(false)
    setEditingRecurringTask(null)
  }


  const handleMoveToIdeas = async (taskId: string) => {
    try {
      const task = overdueTasks.find(t => t.task.id === taskId)
      if (!task) return

      // タスクをIdeasに追加
      await addIdea(task.task.title)

      // 元のタスクを削除
      await deleteTask(taskId)

      console.log(`タスク「${task.task.title}」をやることリストに移動しました`)
    } catch (error) {
      console.error('やることリストへの移動エラー:', error)
    }
  }

  // 期限切れタスクのサブタスク機能
  const loadOverdueSubTasks = useCallback(async () => {
    if (!isInitialized) return

    const newSubTasks: { [taskId: string]: SubTask[] } = {}
    const shoppingOverdueTasks = overdueTasks.filter(task => task.task.category === '買い物')

    for (const taskWithUrgency of shoppingOverdueTasks) {
      const taskSubTasks = await subTaskService.getSubTasksByParentId(taskWithUrgency.task.id)
      newSubTasks[taskWithUrgency.task.id] = taskSubTasks.sort((a, b) => a.sort_order - b.sort_order)
    }

    setOverdueSubTasks(newSubTasks)
  }, [isInitialized, overdueTasks])

  useEffect(() => {
    loadOverdueSubTasks()
  }, [loadOverdueSubTasks])

  const toggleOverdueShoppingList = (taskId: string) => {
    setShowOverdueShoppingLists(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
  }

  const handleOverdueAddSubTask = async (taskId: string) => {
    const newItemText = overdueNewItemInputs[taskId]?.trim()
    if (!newItemText) return

    try {
      const existingSubTasks = overdueSubTasks[taskId] || []
      const nextSortOrder = existingSubTasks.length

      await subTaskService.createSubTask(taskId, newItemText, nextSortOrder)

      setOverdueNewItemInputs(prev => ({
        ...prev,
        [taskId]: ''
      }))

      await loadOverdueSubTasks()
    } catch (error) {
      console.error('Failed to add subtask:', error)
    }
  }

  const handleOverdueToggleSubTask = async (subTaskId: string, taskId: string) => {
    try {
      await subTaskService.toggleSubTaskCompletion(subTaskId)
      await loadOverdueSubTasks()
    } catch (error) {
      console.error('Failed to toggle subtask:', error)
    }
  }

  const handleOverdueDeleteSubTask = async (subTaskId: string, taskId: string) => {
    try {
      await subTaskService.deleteSubTask(subTaskId)
      await loadOverdueSubTasks()
    } catch (error) {
      console.error('Failed to delete subtask:', error)
    }
  }

  const handleEditIdea = async (idea: { id: string; text: string; completed: boolean; createdAt: string; category?: string; importance?: number }) => {
    // 元のタスクデータを統合タスクから取得
    const originalTask = allTasks.find(t => t.id === idea.id)

    if (process.env.NODE_ENV === 'development') {
      console.log('handleEditIdea: idea object:', idea)
      console.log('handleEditIdea: found originalTask:', originalTask)
      console.log('handleEditIdea: originalTask category:', originalTask?.category)
    }

    // アイデアを本格的なタスクとして編集（期限・重要度など設定可能）
    setEditingTask({
      id: idea.id, // 元のアイデアIDを保持
      title: idea.text,
      memo: originalTask?.memo || '',
      due_date: originalTask?.due_date || undefined,
      category: idea.category || originalTask?.category || '',
      importance: idea.importance || originalTask?.importance || 1,
      duration_min: originalTask?.duration_min || undefined,
      urls: originalTask?.urls || undefined,
      attachment: originalTask?.attachment || undefined,
      completed: originalTask?.completed || false,
      archived: originalTask?.archived || false,
      snoozed_until: originalTask?.snoozed_until || undefined,
      created_at: idea.createdAt,
      updated_at: originalTask?.updated_at || '',
      completed_at: originalTask?.completed_at || undefined
    })
    setShowEditForm(true)
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
        

        {/* 認証状態表示 */}
        <div style={{ marginBottom: '12px' }}>
          <AuthStatus />
        </div>
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
            onRecurringComplete={handleCompleteRecurringTask}
            onEdit={handleEditTask}
            onEditRecurring={handleEditRecurringTask}
            onUncomplete={uncompleteTask}
            onRecurringUncomplete={handleUncompleteRecurringTask}
            onDelete={deleteTask}
            onDeleteRecurring={deleteRecurringTask}
          />
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
                      <th style={{ padding: '2px 4px', textAlign: 'left', width: '100px', fontSize: '11px', display: 'none' }} className="date-type-desktop-only">期日</th>
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
                          backgroundColor: '#fef2f2',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '2px', textAlign: 'center' }}>
                          <button
                            onClick={() => completeTask(item.task.id)}
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
                            <span style={{ fontWeight: '500' }}>
                              {item.task.title}
                            </span>
                            {item.task.category === '買い物' && (
                              <span
                                onClick={() => toggleOverdueShoppingList(item.task.id)}
                                style={{
                                  fontSize: '12px',
                                  color: '#6b7280',
                                  cursor: 'pointer',
                                  textDecoration: 'underline'
                                }}
                                title="買い物リストを表示"
                              >
                                タスク（{overdueSubTasks[item.task.id]?.length || 0}件）
                              </span>
                            )}
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
                        <td style={{ padding: '2px 4px', fontSize: '13px', display: 'none' }} className="date-type-desktop-only">
                          {item.task.due_date}
                        </td>
                        <td style={{ padding: '2px' }}>
                          <div style={{
                            display: 'flex',
                            gap: '4px',
                            alignItems: 'center',
                            flexWrap: 'nowrap'
                          }}>
                            <button
                              onClick={() => handleEditTask(item.task)}
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
                                  deleteTask(item.task.id)
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
          onComplete={completeTask}
          onEdit={handleEditTask}
          onDelete={deleteTask}
        />

        {/* 買い物タスク */}
        <ShoppingTasksSection
          onEdit={handleEditTask}
        />

        {/* やることリスト */}
        <section style={{ marginBottom: '12px' }}>
          <IdeaBox
            ideas={ideas}
            onAdd={addIdea}
            onToggle={toggleIdea}
            onEdit={editIdea}
            onDelete={deleteIdea}
            onEditIdea={handleEditIdea}
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
        onUncomplete={uncompleteTask}
      />

      {/* 繰り返しタスク編集フォーム */}
      <RecurringTaskEditForm
        task={editingRecurringTask}
        isVisible={showRecurringEditForm}
        onSubmit={handleUpdateRecurringTask}
        onCancel={handleCancelRecurringEdit}
      />

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