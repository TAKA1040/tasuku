'use client'

import { useMemo } from 'react'
import type { Task, RecurringTask } from '@/lib/db/schema'
import type { UnifiedRecurringTaskWithStatus } from '@/hooks/useUnifiedRecurringTasks'
import { getTodayJST, getWeekStartJST, getMonthStartJST, getMonthEndJST, getUrgencyLevel } from '@/lib/utils/date-jst'
import { TASK_CATEGORIES, TASK_IMPORTANCE_LABELS } from '@/lib/db/schema'
import { UI_CONSTANTS } from '@/lib/constants'

// 設計書準拠の統計データ
export interface MVPStatistics {
  // 今日の統計
  today: {
    completed: number
    total: number
    rate: number
  }
  
  // 今週の統計（月曜開始）
  thisWeek: {
    completed: number
    total: number
    rate: number
  }
  
  // 今月の統計（1日〜末日）
  thisMonth: {
    completed: number
    total: number
    rate: number
  }
  
  // 繰り返しタスクの連続達成日数
  streaks: Array<{
    taskId: string
    title: string
    currentStreak: number
    maxStreak: number
  }>
}

// レガシー統計データ（既存コンポーネント用）
export interface StatisticsData {
  // 基本統計
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  completionRate: number
  
  // 今日の統計
  todayTotal: number
  todayCompleted: number
  todayPending: number
  todayCompletionRate: number
  
  // 緊急度別統計
  urgencyStats: {
    [key: string]: {
      total: number
      completed: number
      pending: number
    }
  }
  
  // カテゴリ別統計
  categoryStats: {
    [key: string]: {
      total: number
      completed: number
      pending: number
    }
  }
  
  // 重要度別統計
  importanceStats: {
    [key: number]: {
      total: number
      completed: number
      pending: number
      label: string
    }
  }
  
  // 週間統計（過去7日間）
  weeklyStats: {
    [key: string]: {
      date: string
      completed: number
      created: number
    }
  }
  
  // 繰り返しタスク統計
  recurringStats: {
    total: number
    completedToday: number
    pendingToday: number
  }
}

// MVP統計フック（設計書準拠）
export function useMVPStatistics(
  tasks: Task[] = [],
  recurringTasks: RecurringTask[] = [],
  recurringLogs: Array<{ recurring_task_id: string; date: string }> = []
): MVPStatistics {
  return useMemo(() => {
    const today = getTodayJST()
    const weekStart = getWeekStartJST()
    const monthStart = getMonthStartJST()
    const monthEnd = getMonthEndJST()
    
    // 今日の統計
    const todayTasks = tasks.filter(task => 
      !task.archived && task.due_date === today
    )
    // TODO: 繰り返しタスクのスケジュール計算を実装
    const todayRecurringTasks: RecurringTask[] = []
    const todayRecurringCompleted = recurringLogs.filter(log => 
      log.date === today
    ).length
    
    const todayTotal = todayTasks.length + todayRecurringTasks.length
    const todayCompleted = todayTasks.filter(t => t.completed).length + todayRecurringCompleted
    
    // 今週の統計
    const thisWeekTasks = tasks.filter(task => 
      !task.archived && 
      task.due_date && 
      task.due_date >= weekStart && 
      task.due_date <= today
    )
    let thisWeekRecurringTotal = 0
    let thisWeekRecurringCompleted = 0
    
    // TODO: 繰り返しタスクのスケジュール計算を実装
    // 現在は簡易版
    thisWeekRecurringTotal = 0
    thisWeekRecurringCompleted = 0
    
    const thisWeekTotal = thisWeekTasks.length + thisWeekRecurringTotal
    const thisWeekCompleted = thisWeekTasks.filter(t => t.completed).length + thisWeekRecurringCompleted
    
    // 今月の統計
    const thisMonthTasks = tasks.filter(task => 
      !task.archived && 
      task.due_date && 
      task.due_date >= monthStart && 
      task.due_date <= monthEnd
    )
    let thisMonthRecurringTotal = 0
    let thisMonthRecurringCompleted = 0
    
    // TODO: 繰り返しタスクのスケジュール計算を実装
    // 現在は簡易版
    thisMonthRecurringTotal = 0
    thisMonthRecurringCompleted = 0
    
    const thisMonthTotal = thisMonthTasks.length + thisMonthRecurringTotal
    const thisMonthCompleted = thisMonthTasks.filter(t => t.completed).length + thisMonthRecurringCompleted
    
    // 連続達成日数の計算
    const streaks = recurringTasks.map(rt => {
      let currentStreak = 0
      let maxStreak = 0
      let tempStreak = 0
      
      // 今日から遡って連続達成日数を計算
      for (let i = 0; i < 365; i++) { // 最大1年分チェック
        const checkDate = getDateDaysAgo(today, i)
        
        // TODO: 繰り返しスケジュールチェックを実装
        // 現在は簡易版
        if (true) {
          const hasLog = recurringLogs.some(log => 
            log.recurring_task_id === rt.id && log.date === checkDate
          )
          
          if (hasLog) {
            tempStreak++
            if (i === 0) currentStreak = tempStreak // 今日から連続している場合のみ
          } else {
            maxStreak = Math.max(maxStreak, tempStreak)
            tempStreak = 0
            if (currentStreak === 0) break // 今日から連続でない場合は終了
          }
        }
      }
      maxStreak = Math.max(maxStreak, tempStreak)
      
      return {
        taskId: rt.id,
        title: rt.title,
        currentStreak,
        maxStreak
      }
    })
    
    return {
      today: {
        completed: todayCompleted,
        total: todayTotal,
        rate: todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * UI_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0
      },
      thisWeek: {
        completed: thisWeekCompleted,
        total: thisWeekTotal,
        rate: thisWeekTotal > 0 ? Math.round((thisWeekCompleted / thisWeekTotal) * UI_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0
      },
      thisMonth: {
        completed: thisMonthCompleted,
        total: thisMonthTotal,
        rate: thisMonthTotal > 0 ? Math.round((thisMonthCompleted / thisMonthTotal) * UI_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0
      },
      streaks
    }
  }, [tasks, recurringTasks, recurringLogs])
}

// ヘルパー関数
function getNextDate(dateStr: string): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
}

function getDateDaysAgo(fromDate: string, daysAgo: number): string {
  const date = new Date(fromDate)
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}


// レガシー統計フック（既存コンポーネント用）
export function useStatistics(
  tasks: Task[] = [], 
  recurringTasks: UnifiedRecurringTaskWithStatus[] = []
): StatisticsData {
  return useMemo(() => {
    const today = getTodayJST()
    
    // 基本統計の計算
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.completed).length
    const pendingTasks = totalTasks - completedTasks
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * UI_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0

    // 今日のタスク統計
    const todayTasks = tasks.filter(task =>
      !task.archived &&
      (!task.snoozed_until || task.snoozed_until <= today) &&
      task.due_date === today
    )
    const todayTotal = todayTasks.length
    const todayCompleted = todayTasks.filter(task => task.completed).length
    const todayPending = todayTotal - todayCompleted
    const todayCompletionRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * UI_CONSTANTS.PERCENTAGE_MULTIPLIER) : 0
    
    // 緊急度別統計
    const urgencyStats: StatisticsData['urgencyStats'] = {}
    const urgencyOrder = ['Overdue', 'Soon', 'Next7', 'Next30', 'Normal']
    
    urgencyOrder.forEach(urgency => {
      urgencyStats[urgency] = { total: 0, completed: 0, pending: 0 }
    })
    
    tasks.forEach(task => {
      if (task.archived) return
      
      const urgency = task.due_date ? getUrgencyLevel(task.due_date) : 'Normal'
      if (!urgencyStats[urgency]) {
        urgencyStats[urgency] = { total: 0, completed: 0, pending: 0 }
      }
      
      urgencyStats[urgency].total++
      if (task.completed) {
        urgencyStats[urgency].completed++
      } else {
        urgencyStats[urgency].pending++
      }
    })
    
    // カテゴリ別統計
    const categoryStats: StatisticsData['categoryStats'] = {}
    
    // すべてのカテゴリを初期化
    Object.values(TASK_CATEGORIES).forEach(category => {
      categoryStats[category] = { total: 0, completed: 0, pending: 0 }
    })
    categoryStats['未分類'] = { total: 0, completed: 0, pending: 0 }
    
    tasks.forEach(task => {
      if (task.archived) return
      
      const category = task.category || '未分類'
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, completed: 0, pending: 0 }
      }
      
      categoryStats[category].total++
      if (task.completed) {
        categoryStats[category].completed++
      } else {
        categoryStats[category].pending++
      }
    })
    
    // 重要度別統計
    const importanceStats: StatisticsData['importanceStats'] = {}
    
    // 重要度レベル1-5を初期化
    for (let i = 1; i <= 5; i++) {
      importanceStats[i] = {
        total: 0,
        completed: 0,
        pending: 0,
        label: TASK_IMPORTANCE_LABELS[i as keyof typeof TASK_IMPORTANCE_LABELS] || `レベル${i}`
      }
    }
    // 未設定も追加
    importanceStats[0] = {
      total: 0,
      completed: 0,
      pending: 0,
      label: '未設定'
    }
    
    tasks.forEach(task => {
      if (task.archived) return
      
      const importance = task.importance || 0
      importanceStats[importance].total++
      if (task.completed) {
        importanceStats[importance].completed++
      } else {
        importanceStats[importance].pending++
      }
    })
    
    // 週間統計（過去7日間）
    const weeklyStats: StatisticsData['weeklyStats'] = {}
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      weeklyStats[dateStr] = {
        date: dateStr,
        completed: 0,
        created: 0
      }
    }
    
    tasks.forEach(task => {
      // 完了統計
      if (task.completed && task.completed_at) {
        if (weeklyStats[task.completed_at]) {
          weeklyStats[task.completed_at].completed++
        }
      }
      
      // 作成統計
      const createdDate = task.created_at.split('T')[0]
      if (weeklyStats[createdDate]) {
        weeklyStats[createdDate].created++
      }
    })
    
    // 繰り返しタスク統計
    const recurringStats = {
      total: recurringTasks.length,
      completedToday: recurringTasks.filter(rt => rt.completedToday).length,
      pendingToday: recurringTasks.filter(rt => !rt.completedToday).length
    }

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      todayTotal,
      todayCompleted,
      todayPending,
      todayCompletionRate,
      urgencyStats,
      categoryStats,
      importanceStats,
      weeklyStats,
      recurringStats
    }
  }, [tasks, recurringTasks])
}