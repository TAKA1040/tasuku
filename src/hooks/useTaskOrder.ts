import { useState, useEffect, useCallback } from 'react'

interface TaskOrderState {
  [taskId: string]: number
}

const STORAGE_KEY = 'tasuku-task-order'

export const useTaskOrder = () => {
  const [taskOrder, setTaskOrder] = useState<TaskOrderState>({})

  // ローカルストレージから順序を読み込み
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setTaskOrder(parsed)
        console.log('Task order loaded from localStorage:', Object.keys(parsed).length, 'items')
      }
    } catch (error) {
      console.error('Failed to load task order from localStorage:', error)
    }
  }, [])

  // 順序をローカルストレージに保存
  const saveTaskOrder = useCallback((newOrder: TaskOrderState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder))
      setTaskOrder(newOrder)
      console.log('Task order saved to localStorage:', Object.keys(newOrder).length, 'items')
    } catch (error) {
      console.error('Failed to save task order to localStorage:', error)
    }
  }, [])

  // 単一タスクの順序を更新
  const updateTaskOrder = useCallback((taskId: string, newOrderIndex: number) => {
    const newOrder = {
      ...taskOrder,
      [taskId]: newOrderIndex
    }
    saveTaskOrder(newOrder)
    console.log(`Updated order for task ${taskId}: ${newOrderIndex}`)
  }, [taskOrder, saveTaskOrder])

  // タスクの順序をリセット
  const resetTaskOrder = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setTaskOrder({})
      console.log('Task order reset')
    } catch (error) {
      console.error('Failed to reset task order:', error)
    }
  }, [])

  // 複数タスクの順序を一括更新
  const updateMultipleTaskOrder = useCallback((updates: { [taskId: string]: number }) => {
    const newOrder = {
      ...taskOrder,
      ...updates
    }
    saveTaskOrder(newOrder)
    console.log('Updated order for multiple tasks:', Object.keys(updates))
  }, [taskOrder, saveTaskOrder])

  // タスクの表示順序を取得（順序が設定されていない場合はundefined）
  const getTaskOrder = useCallback((taskId: string): number | undefined => {
    return taskOrder[taskId]
  }, [taskOrder])

  // タスクリストを指定された順序でソート
  const sortTasksByOrder = useCallback(<T extends { id: string }>(tasks: T[]): T[] => {
    return [...tasks].sort((a, b) => {
      const aOrder = taskOrder[a.id]
      const bOrder = taskOrder[b.id]

      // 両方とも順序が設定されている場合
      if (aOrder !== undefined && bOrder !== undefined) {
        return aOrder - bOrder
      }
      // どちらかまたは両方が未設定の場合は元の順序を保持
      return 0
    })
  }, [taskOrder])

  return {
    taskOrder,
    updateTaskOrder,
    resetTaskOrder,
    updateMultipleTaskOrder,
    getTaskOrder,
    sortTasksByOrder
  }
}