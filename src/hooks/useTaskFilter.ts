'use client'

import { useMemo } from 'react'
import type { TaskWithUrgency } from '@/lib/db/schema'
import type { RecurringTaskWithStatus } from '@/hooks/useRecurringTasks'
import type { SearchFilterOptions } from '@/components/TaskSearchFilter'

interface UseTaskFilterResult {
  filteredTasks: TaskWithUrgency[]
  filteredRecurringTasks: RecurringTaskWithStatus[]
  totalCount: number
  filteredCount: number
}

export function useTaskFilter(
  tasks: TaskWithUrgency[],
  recurringTasks: RecurringTaskWithStatus[],
  filters: SearchFilterOptions
): UseTaskFilterResult {
  return useMemo(() => {
    let filteredTasks = [...tasks]
    let filteredRecurringTasks = [...recurringTasks]
    
    // 検索クエリによるフィルタリング
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      
      filteredTasks = filteredTasks.filter(item => 
        item.task.title.toLowerCase().includes(query) ||
        (item.task.memo && item.task.memo.toLowerCase().includes(query))
      )
      
      filteredRecurringTasks = filteredRecurringTasks.filter(item =>
        item.task.title.toLowerCase().includes(query) ||
        (item.task.memo && item.task.memo.toLowerCase().includes(query))
      )
    }
    
    // ステータスによるフィルタリング
    if (filters.status) {
      if (filters.status === 'pending') {
        filteredTasks = filteredTasks.filter(item => !item.task.completed)
        filteredRecurringTasks = filteredRecurringTasks.filter(item => !item.completedToday)
      } else if (filters.status === 'completed') {
        filteredTasks = filteredTasks.filter(item => item.task.completed)
        filteredRecurringTasks = filteredRecurringTasks.filter(item => item.completedToday)
      }
    }
    
    // カテゴリによるフィルタリング
    if (filters.category) {
      if (filters.category === '未分類') {
        filteredTasks = filteredTasks.filter(item => !item.task.category)
      } else {
        filteredTasks = filteredTasks.filter(item => item.task.category === filters.category)
      }
      // 繰り返しタスクはカテゴリがないのでカテゴリフィルターが適用されると除外
      filteredRecurringTasks = []
    }
    
    // 重要度によるフィルタリング
    if (filters.importance) {
      const importance = Number(filters.importance)
      if (importance === 0) {
        filteredTasks = filteredTasks.filter(item => !item.task.importance)
      } else {
        filteredTasks = filteredTasks.filter(item => item.task.importance === importance)
      }
      // 繰り返しタスクは重要度がないので重要度フィルターが適用されると除外
      filteredRecurringTasks = []
    }
    
    // 緊急度によるフィルタリング
    if (filters.urgency) {
      filteredTasks = filteredTasks.filter(item => item.urgency === filters.urgency)
      // 繰り返しタスクの緊急度は常に'Normal'なので、Normal以外が選択されると除外
      if (filters.urgency !== 'Normal') {
        filteredRecurringTasks = []
      }
    }
    
    const totalCount = tasks.length + recurringTasks.length
    const filteredCount = filteredTasks.length + filteredRecurringTasks.length
    
    return {
      filteredTasks,
      filteredRecurringTasks,
      totalCount,
      filteredCount
    }
  }, [tasks, recurringTasks, filters])
}