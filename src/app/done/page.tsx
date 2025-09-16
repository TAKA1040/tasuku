'use client'

import { useState, useEffect } from 'react'
import { useDatabase } from '@/hooks/useDatabase'
import { useTasks } from '@/hooks/useTasks'
import { useRecurringTasks } from '@/hooks/useRecurringTasks'
import { formatDateForDisplay } from '@/lib/utils/date-jst'
import { TaskTable } from '@/components/TaskTable'
import { TaskEditForm } from '@/components/TaskEditForm'
import type { Task } from '@/lib/db/schema'

// Dynamic import to prevent static generation
export const dynamic = 'force-dynamic'

export default function DonePage() {
  const { isInitialized, error } = useDatabase()
  const { loading: tasksLoading, getAllCompletedTasks, updateTask, uncompleteTask, deleteTask, reload: reloadTasks } = useTasks(isInitialized)
  const {
    loading: recurringLoading,
    getTodayCompletedRecurringTasks,
    reload: reloadRecurringTasks,
    recurringTasks,
    recurringLogs
  } = useRecurringTasks(isInitialized)

  // 期間フィルタリング
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today')

  // 編集状態管理
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)

  // 選択した毎日のタスクを記憶するためのstate
  const [selectedDailyTasks, setSelectedDailyTasks] = useState<string[]>([])

  // データベース初期化後にタスクを再読み込み
  useEffect(() => {
    if (isInitialized && reloadTasks && reloadRecurringTasks) {
      console.log('Database initialized, reloading tasks for done page')
      reloadTasks()
      reloadRecurringTasks()
    }
  }, [isInitialized, reloadTasks, reloadRecurringTasks])

  // 選択タスクをローカルストレージから復元
  useEffect(() => {
    const saved = localStorage.getItem('selectedDailyTasks')
    if (saved) {
      try {
        setSelectedDailyTasks(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse selected daily tasks:', e)
      }
    }
  }, [])

  // 選択タスクをローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('selectedDailyTasks', JSON.stringify(selectedDailyTasks))
  }, [selectedDailyTasks])
  
  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#dc2626' }}>データベースエラー</h1>
        <p>{error}</p>
      </div>
    )
  }
  
  if (!isInitialized || tasksLoading || recurringLoading || typeof getAllCompletedTasks !== 'function') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>読み込み中...</h1>
        <p>完了済みタスクを準備しています</p>
      </div>
    )
  }

  // 期間別完了タスク取得
  const getCompletedTasksByPeriod = () => {
    if (typeof getAllCompletedTasks !== 'function' || !isInitialized) {
      return []
    }

    const allCompleted = getAllCompletedTasks()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD形式に統一
    
    switch (period) {
      case 'today':
        return allCompleted.filter(item => item.task.completed_at === today)
      case 'week':
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weekAgoStr = weekAgo.toISOString().split('T')[0]
        return allCompleted.filter(item => 
          item.task.completed_at && item.task.completed_at >= weekAgoStr
        )
      case 'month':
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        const monthAgoStr = monthAgo.toISOString().split('T')[0]
        return allCompleted.filter(item => 
          item.task.completed_at && item.task.completed_at >= monthAgoStr
        )
      case 'all':
      default:
        return allCompleted
    }
  }

  const completedTasks = getCompletedTasksByPeriod()
  const completedRecurringTasks = isInitialized ? getTodayCompletedRecurringTasks() : []

  // 毎日のタスク達成度追跡システム
  const getDailyTasksAchievementData = (): Array<{
    taskId: string;
    taskTitle: string;
    taskStartDate: string;
    dates: string[];
    completions: boolean[];
    consecutiveDays: number;
    recentCompletedDays: number;
    recentTotalDays: number;
    recentAchievementRate: number;
    totalCompletedDays: number;
    totalDays: number;
    totalAchievementRate: number;
  }> => {
    if (!isInitialized || !recurringTasks || !recurringLogs) return []

    // 過去30日間の日付配列を生成
    const dates: string[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }

    // 選択された繰り返しタスクのデータを作成
    return selectedDailyTasks
      .map(taskId => {
        const task = recurringTasks.find(t => t.id === taskId)
        if (!task) return undefined

        // タスクの開始日を取得（created_atまたはstart_date）
        const taskStartDate = task.start_date || task.created_at?.split('T')[0] || dates[0]

        // すべての関連ログを取得（開始日以降）
        const allTaskLogs = recurringLogs.filter(log =>
          log.recurring_id === taskId && log.date >= taskStartDate
        )

        // 過去30日の完了状況
        const recentCompletions = dates.map(date => {
          return allTaskLogs.some(log => log.date === date)
        })

        // 直近の達成率計算（過去30日または開始日から）
        const recentStartIndex = dates.findIndex(date => date >= taskStartDate)
        const recentValidDates = recentStartIndex >= 0 ? dates.slice(recentStartIndex) : dates
        const recentValidCompletions = recentStartIndex >= 0 ? recentCompletions.slice(recentStartIndex) : recentCompletions
        const recentCompletedDays = recentValidCompletions.filter(Boolean).length
        const recentTotalDays = recentValidDates.length
        const recentAchievementRate = recentTotalDays > 0 ? Math.round((recentCompletedDays / recentTotalDays) * 100) : 0

        // 総達成率計算（開始日からすべて）
        const today = new Date().toISOString().split('T')[0]
        const totalDays = Math.ceil((new Date(today).getTime() - new Date(taskStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
        const totalCompletedDays = allTaskLogs.length
        const totalAchievementRate = totalDays > 0 ? Math.round((totalCompletedDays / totalDays) * 100) : 0

        // 連続達成日数を計算（今日から遡って計算）
        let consecutiveDays = 0
        for (let i = dates.length - 1; i >= 0; i--) {
          if (recentCompletions[i]) {
            consecutiveDays++
          } else {
            break
          }
        }

        return {
          taskId,
          taskTitle: task.title,
          taskStartDate,
          dates,
          completions: recentCompletions,
          consecutiveDays,
          // 直近の達成率
          recentCompletedDays,
          recentTotalDays,
          recentAchievementRate,
          // 総達成率
          totalCompletedDays,
          totalDays,
          totalAchievementRate
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== undefined)
  }

  // 毎日のタスク選択/選択解除
  const toggleDailyTaskSelection = (taskId: string) => {
    setSelectedDailyTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const dailyTasksData = getDailyTasksAchievementData()



  // 編集関数
  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowEditForm(true)
  }

  const handleUpdateTask = async (taskId: string, title: string, memo: string, dueDate: string, category?: string, importance?: 1 | 2 | 3 | 4 | 5, durationMin?: number, urls?: string[]) => {
    await updateTask(taskId, { title, memo, due_date: dueDate, category, importance, duration_min: durationMin, urls })
  }

  const handleCancelEdit = () => {
    setEditingTask(null)
    setShowEditForm(false)
  }

  return (
    <div style={{
      padding: '8px',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <header style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>
            🎉 Done リスト - 完了済みタスク
          </h1>
          <a
            href="/today"
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: '500',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ← 今日へ戻る
          </a>
        </div>

        {/* 期間フィルター */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            表示期間:
          </span>
          {(['today', 'week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                background: period === p ? '#3b82f6' : 'transparent',
                color: period === p ? 'white' : '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {p === 'today' ? '今日' : 
               p === 'week' ? '1週間' :
               p === 'month' ? '1ヶ月' : '全て'}
            </button>
          ))}
        </div>

        {/* 完了統計 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '12px',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #86efac'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#059669' }}>
              {completedTasks.length}
            </div>
            <div style={{ fontSize: '12px', color: '#065f46' }}>単発タスク</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#059669' }}>
              {completedRecurringTasks.length}
            </div>
            <div style={{ fontSize: '12px', color: '#065f46' }}>繰り返し</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#059669' }}>
              {completedTasks.length + completedRecurringTasks.length}
            </div>
            <div style={{ fontSize: '12px', color: '#065f46' }}>合計</div>
          </div>
        </div>

        {/* 毎日のタスク達成度追跡システム */}
        {isInitialized && recurringTasks && recurringTasks.length > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: '#fefce8',
            borderRadius: '8px',
            border: '1px solid #facc15'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#ca8a04'
            }}>
              📅 毎日のタスク達成度 (過去30日)
            </h3>

            {/* タスク選択セクション */}
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#ffffff',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                追跡するタスクを選択:
              </h4>


              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {recurringTasks && recurringTasks.length > 0 ? (
                  recurringTasks
                    .filter(task => task.active && (task.frequency === 'DAILY' || task.frequency === 'WEEKLY'))
                    .map(task => (
                      <label
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          backgroundColor: selectedDailyTasks.includes(task.id) ? '#dbeafe' : '#f9fafb',
                          border: `1px solid ${selectedDailyTasks.includes(task.id) ? '#3b82f6' : '#e5e7eb'}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: selectedDailyTasks.includes(task.id) ? '500' : '400'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDailyTasks.includes(task.id)}
                          onChange={() => toggleDailyTaskSelection(task.id)}
                          style={{ margin: 0 }}
                        />
                        {task.title}
                      </label>
                    ))
                ) : (
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>
                    利用可能な繰り返しタスクがありません
                  </div>
                )}
              </div>
            </div>

            {/* 達成度表 */}
            {dailyTasksData.length > 0 && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
              }}>
                {/* ヘッダー（日付） */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '150px repeat(30, 18px) 80px 90px 60px',
                  gap: '1px',
                  backgroundColor: '#f3f4f6',
                  fontSize: '10px',
                  fontWeight: '500'
                }}>
                  <div style={{ padding: '8px', borderRight: '1px solid #e5e7eb' }}>タスク</div>
                  {dailyTasksData[0]?.dates.map((date, index) => {
                    const day = new Date(date + 'T00:00:00').getDate()
                    return (
                      <div
                        key={date}
                        style={{
                          padding: '4px 1px',
                          textAlign: 'center',
                          color: '#6b7280',
                          transform: 'rotate(-45deg)',
                          fontSize: '8px'
                        }}
                      >
                        {day}
                      </div>
                    )
                  })}
                  <div style={{ padding: '8px', textAlign: 'center', borderLeft: '1px solid #e5e7eb' }}>直近達成率</div>
                  <div style={{ padding: '8px', textAlign: 'center', borderLeft: '1px solid #e5e7eb' }}>総達成率</div>
                  <div style={{ padding: '8px', textAlign: 'center', borderLeft: '1px solid #e5e7eb' }}>連続記録</div>
                </div>

                {/* タスク行 */}
                {dailyTasksData.map((taskData, taskIndex) => (
                  <div
                    key={taskData.taskId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '150px repeat(30, 18px) 80px 90px 60px',
                      gap: '1px',
                      backgroundColor: taskIndex % 2 === 0 ? '#ffffff' : '#f9fafb',
                      borderTop: '1px solid #e5e7eb'
                    }}
                  >
                    {/* タスク名 */}
                    <div style={{
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: '500',
                      borderRight: '1px solid #e5e7eb',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {taskData.taskTitle}
                    </div>

                    {/* 30日分のチェック */}
                    {taskData.completions.map((completed, dayIndex) => (
                      <div
                        key={dayIndex}
                        style={{
                          padding: '3px',
                          textAlign: 'center',
                          fontSize: '10px',
                          color: completed ? '#10b981' : '#e5e7eb'
                        }}
                      >
                        {completed ? '✓' : ''}
                      </div>
                    ))}

                    {/* 直近の達成率 */}
                    <div style={{
                      padding: '8px',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: taskData.recentAchievementRate >= 80 ? '#10b981' :
                             taskData.recentAchievementRate >= 60 ? '#f59e0b' : '#ef4444',
                      borderLeft: '1px solid #e5e7eb'
                    }}>
                      {taskData.recentAchievementRate}%
                    </div>

                    {/* 総達成率 */}
                    <div style={{
                      padding: '8px',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: taskData.totalAchievementRate >= 80 ? '#10b981' :
                             taskData.totalAchievementRate >= 60 ? '#f59e0b' : '#ef4444',
                      borderLeft: '1px solid #e5e7eb'
                    }}>
                      {taskData.totalAchievementRate}%（{taskData.totalCompletedDays}/{taskData.totalDays}）
                    </div>

                    {/* 連続達成日数 */}
                    <div style={{
                      padding: '8px',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: taskData.consecutiveDays >= 7 ? '#10b981' :
                             taskData.consecutiveDays >= 3 ? '#f59e0b' : '#6b7280',
                      borderLeft: '1px solid #e5e7eb'
                    }}>
                      {taskData.consecutiveDays}日
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedDailyTasks.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                上記から追跡したいタスクを選択してください
              </div>
            )}
          </div>
        )}

      </header>

      <main>
        {completedTasks.length === 0 && completedRecurringTasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>
              {period === 'today' ? '今日は' :
               period === 'week' ? '1週間以内に' :
               period === 'month' ? '1ヶ月以内に' : 'まだ'}完了したタスクがありません
            </h3>
            <p style={{ margin: '0', fontSize: '14px' }}>
              タスクを完了すると、ここに表示されます
            </p>
          </div>
        ) : (
          <TaskTable
            tasks={completedTasks}
            recurringTasks={completedRecurringTasks}
            completedTasks={[]}
            completedRecurringTasks={[]}
            onComplete={() => {}} // 完了済みなのでアクションなし
            onRecurringComplete={() => {}} // 完了済みなのでアクションなし
            onEdit={handleEditTask}
            onUncomplete={uncompleteTask}
            onDelete={deleteTask}
          />
        )}
      </main>

      {/* タスク編集フォーム */}
      <TaskEditForm
        task={editingTask}
        isVisible={showEditForm}
        onSubmit={handleUpdateTask}
        onCancel={handleCancelEdit}
        onUncomplete={uncompleteTask}
      />
    </div>
  )
}