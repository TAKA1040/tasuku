'use client'

import React, { memo, useState, useEffect } from 'react'
import type { RecurringTask } from '@/lib/db/schema'

interface DailyHabitsProps {
  recurringTasks: RecurringTask[]
  recurringLogs: Array<{ recurring_id: string; date: string }>
}

interface HabitCalendarEntry {
  taskId: string
  taskTitle: string
  isSelected: boolean
  completionDates: string[] // YYYY-MM-DD形式
  currentStreak: number // 現在の連続日数
  maxStreak: number // 最高連続記録
  weeklyCount: number // 今週の実施回数
  weeklyRate: number // 今週の達成率
  monthlyRate: number // 今月の達成率
  overallRate: number // 全期間の達成率
  totalDays: number // タスク開始からの総日数
}

function DailyHabits({ recurringTasks, recurringLogs }: DailyHabitsProps) {
  const [selectedHabits, setSelectedHabits] = useState<string[]>([])
  const [showHabitSelector, setShowHabitSelector] = useState(false)

  // デバッグログ追加
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 DailyHabits - 受け取ったrecurringTasks:', recurringTasks)
      console.log('🔧 DailyHabits - 受け取ったrecurringLogs:', recurringLogs)
    }
  }, [recurringTasks, recurringLogs])

  // データが渡されていない場合の処理
  if (!recurringTasks || !recurringLogs) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 DailyHabits - データが未初期化')
    }
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        marginBottom: '16px'
      }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1e293b',
          margin: '0 0 12px 0'
        }}>
          📊 毎日やるリスト
        </h2>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
          データを読み込み中...
        </p>
      </div>
    )
  }

  // 過去30日間の日付を生成
  const generateLast30Days = (): string[] => {
    const dates: string[] = []
    const today = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }

    return dates
  }

  const last30Days = generateLast30Days()

  // 連続記録と達成率計算関数
  const calculateStreaks = (completionDates: string[], taskId: string, task: RecurringTask | undefined) => {
    const today = new Date().toISOString().split('T')[0]
    const sortedDates = [...completionDates].sort()

    // 現在の連続日数を計算
    let currentStreak = 0
    const checkDate = new Date()

    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (completionDates.includes(dateStr)) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    // 最高連続記録を計算
    let maxStreak = 0
    let tempStreak = 0

    const allDatesSet = new Set(sortedDates)
    const currentDate = new Date(sortedDates[0] || today)
    const endDate = new Date(today)

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      if (allDatesSet.has(dateStr)) {
        tempStreak++
        maxStreak = Math.max(maxStreak, tempStreak)
      } else {
        tempStreak = 0
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // 今週の実施回数と達成率計算
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)) // 月曜日を週の開始に
    const thisWeekDates: string[] = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      thisWeekDates.push(date.toISOString().split('T')[0])
    }

    const weeklyCount = thisWeekDates.filter(date => completionDates.includes(date)).length
    const weeklyRate = Math.round((weeklyCount / 7) * 100)

    // 今月の達成率計算
    const monthStart = new Date()
    monthStart.setDate(1)
    const monthEnd = new Date()
    monthEnd.setMonth(monthEnd.getMonth() + 1, 0)

    const thisMonthDates: string[] = []
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      thisMonthDates.push(d.toISOString().split('T')[0])
    }

    const monthlyCount = thisMonthDates.filter(date => completionDates.includes(date)).length
    const monthlyRate = Math.round((monthlyCount / thisMonthDates.length) * 100)

    // 全期間の達成率計算
    const taskCreatedDate = task?.created_at ? new Date(task.created_at).toISOString().split('T')[0] : sortedDates[0] || today
    const createdDate = new Date(taskCreatedDate)
    const totalDays = Math.ceil((new Date(today).getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const overallRate = Math.round((completionDates.length / totalDays) * 100)

    return {
      currentStreak,
      maxStreak,
      weeklyCount,
      weeklyRate,
      monthlyRate,
      overallRate,
      totalDays
    }
  }

  // 毎日実行するタスク（すべての繰り返しタスクを含める）
  const dailyRecurringTasks = recurringTasks.filter(task => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 フィルタリング中のタスク:', task.title, 'frequency:', task.frequency, 'weekdays:', task.weekdays)
    }

    // より緩い条件でフィルタリング
    if (task.frequency === 'DAILY') return true
    if (task.frequency === 'WEEKLY') return true  // 毎週の場合は含める
    if (task.frequency === 'INTERVAL_DAYS') return true  // 間隔日数も含める
    return false
  })

  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 フィルタリング結果 - dailyRecurringTasks:', dailyRecurringTasks)
  }

  const handleHabitToggle = (taskId: string) => {
    setSelectedHabits(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  // 選択された習慣のカレンダーデータを生成
  const habitCalendarData: HabitCalendarEntry[] = selectedHabits.map(taskId => {
    const task = dailyRecurringTasks.find(t => t.id === taskId)
    if (!task) return null

    // この繰り返しタスクの完了記録を取得
    const taskLogs = recurringLogs.filter(log => log.recurring_id === taskId)
    const completionDates = taskLogs.map(log => log.date)

    const streakData = calculateStreaks(completionDates, taskId, task)

    return {
      taskId,
      taskTitle: task.title,
      isSelected: true,
      completionDates,
      ...streakData
    }
  }).filter(Boolean) as HabitCalendarEntry[]

  // 日付表示用のフォーマット関数
  const formatDateDisplay = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.getDate().toString()
  }

  // 曜日表示用の関数
  const getDayOfWeek = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00')
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return days[date.getDay()]
  }

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      marginBottom: '16px'
    }}>
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1e293b',
          margin: '0'
        }}>
          📊 毎日やるリスト
        </h2>

        <button
          onClick={() => setShowHabitSelector(!showHabitSelector)}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          {showHabitSelector ? '✕ 閉じる' : '⚙️ 習慣を選択'}
        </button>
      </div>

      {/* 習慣選択パネル */}
      {showHabitSelector && (
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          marginBottom: '16px'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#374151'
          }}>
            毎日実行する繰り返しタスクから選択:
          </h3>

          {dailyRecurringTasks.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: '12px', margin: '0' }}>
              <p>繰り返しタスクがありません。</p>
              <p>全体の繰り返しタスク数: {recurringTasks.length}</p>
              <p>繰り返しログ数: {recurringLogs.length}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {dailyRecurringTasks.map(task => (
                <label
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedHabits.includes(task.id)}
                    onChange={() => handleHabitToggle(task.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: '#374151' }}>
                    {task.title}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* カレンダー表示 */}
      {habitCalendarData.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '14px',
          padding: '32px'
        }}>
          習慣を選択して進捗を確認しましょう！
        </div>
      ) : (
        <div>
          {/* 日付ヘッダー */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(30, 1fr)',
            gap: '2px',
            marginBottom: '12px',
            alignItems: 'center',
            paddingLeft: '12px'
          }}>
            {last30Days.map(date => (
              <div
                key={date}
                style={{
                  fontSize: '9px',
                  color: '#6b7280',
                  textAlign: 'center',
                  padding: '2px 0'
                }}
              >
                <div>{formatDateDisplay(date)}</div>
                <div style={{ fontSize: '8px', color: '#9ca3af' }}>
                  {getDayOfWeek(date)}
                </div>
              </div>
            ))}
          </div>

          {/* 習慣ごとの完了状況 */}
          {habitCalendarData.map(habit => {
            const completionRate = Math.round((habit.completionDates.filter(date => last30Days.includes(date)).length / 30) * 100)

            return (
              <div key={habit.taskId} style={{ marginBottom: '8px' }}>
                {/* 習慣名と統計情報 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {habit.taskTitle}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* 現在の連続記録 */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: habit.currentStreak > 0 ? '#10b981' : '#6b7280'
                      }}>
                        {habit.currentStreak}日
                      </div>
                      <div style={{
                        fontSize: '9px',
                        color: '#6b7280'
                      }}>
                        現在の連続
                      </div>
                    </div>

                    {/* 最高記録 */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#f59e0b'
                      }}>
                        {habit.maxStreak}日
                      </div>
                      <div style={{
                        fontSize: '9px',
                        color: '#6b7280'
                      }}>
                        最高記録
                      </div>
                    </div>

                    {/* 今週の達成率 */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: habit.weeklyRate >= 100 ? '#10b981' : habit.weeklyRate >= 70 ? '#3b82f6' : '#ef4444'
                      }}>
                        {habit.weeklyRate}%
                      </div>
                      <div style={{
                        fontSize: '9px',
                        color: '#6b7280'
                      }}>
                        今週
                      </div>
                    </div>

                    {/* 今月の達成率 */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: habit.monthlyRate >= 100 ? '#10b981' : habit.monthlyRate >= 70 ? '#3b82f6' : '#ef4444'
                      }}>
                        {habit.monthlyRate}%
                      </div>
                      <div style={{
                        fontSize: '9px',
                        color: '#6b7280'
                      }}>
                        今月
                      </div>
                    </div>

                    {/* 全期間達成率 */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: habit.overallRate >= 100 ? '#10b981' : habit.overallRate >= 70 ? '#8b5cf6' : '#6b7280'
                      }}>
                        {habit.overallRate}%
                      </div>
                      <div style={{
                        fontSize: '9px',
                        color: '#6b7280'
                      }}>
                        全期間
                      </div>
                    </div>

                    {/* 30日間達成率 */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: completionRate >= 100 ? '#10b981' : completionRate >= 70 ? '#8b5cf6' : '#6b7280'
                      }}>
                        {completionRate}%
                      </div>
                      <div style={{
                        fontSize: '9px',
                        color: '#6b7280'
                      }}>
                        30日間
                      </div>
                    </div>
                  </div>
                </div>

                {/* カレンダー表示 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(30, 1fr)',
                  gap: '2px',
                  alignItems: 'center',
                  paddingLeft: '12px'
                }}>
                  {/* 30日分の完了状況 */}
                  {last30Days.map(date => {
                    const isCompleted = habit.completionDates.includes(date)
                    const isToday = date === new Date().toISOString().split('T')[0]

                    return (
                      <div
                        key={date}
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: isToday ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                          backgroundColor: isCompleted
                            ? '#10b981'
                            : isToday
                              ? '#eff6ff'
                              : 'white',
                          color: isCompleted
                            ? 'white'
                            : isToday
                              ? '#3b82f6'
                              : '#d1d5db'
                        }}
                        title={`${formatDateDisplay(date)} (${getDayOfWeek(date)}): ${isCompleted ? '完了' : '未完了'}`}
                      >
                        {isCompleted ? '○' : ''}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 説明テキスト */}
      <div style={{
        fontSize: '12px',
        color: '#6b7280',
        marginTop: '12px',
        textAlign: 'center'
      }}>
        🔥 毎日実行する繰り返しタスクを選択して、連続記録と多角的な達成率を確認できます。
        <br />
        <strong>現在の連続</strong>: 今日まで続けている日数 | <strong>最高記録</strong>: 過去の最高連続日数
        <br />
        <strong>今週</strong>: 今週の達成率 (月〜日) | <strong>今月</strong>: 今月の達成率 | <strong>全期間</strong>: タスク開始からの総合達成率
        <br />
        色で成績判定: <span style={{color: '#10b981', fontWeight: 'bold'}}>100%</span> <span style={{color: '#3b82f6', fontWeight: 'bold'}}>70%+</span> <span style={{color: '#ef4444', fontWeight: 'bold'}}>70%未満</span> | ○印は完了した日、青枠は今日
      </div>
    </div>
  )
}

export default memo(DailyHabits)
export { DailyHabits }