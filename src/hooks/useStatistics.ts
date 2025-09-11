'use client'

import { useMemo } from 'react'
import type { Task } from '@/lib/db/schema'
import type { RecurringTaskWithStatus } from '@/hooks/useRecurringTasks'
import { getTodayJST, getDaysFromToday, getUrgencyLevel } from '@/lib/utils/date-jst'
import { TASK_CATEGORIES, TASK_IMPORTANCE_LABELS } from '@/lib/db/schema'

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

export function useStatistics(
  tasks: Task[] = [], 
  recurringTasks: RecurringTaskWithStatus[] = []
): StatisticsData {
  return useMemo(() => {
    const today = getTodayJST()
    
    // 基本統計の計算
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.completed).length
    const pendingTasks = totalTasks - completedTasks
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    // 今日のタスク統計
    const todayTasks = tasks.filter(task => 
      !task.archived && 
      (!task.snoozed_until || task.snoozed_until <= today) &&
      task.due_date === today
    )
    const todayTotal = todayTasks.length
    const todayCompleted = todayTasks.filter(task => task.completed).length
    const todayPending = todayTotal - todayCompleted
    const todayCompletionRate = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0
    
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