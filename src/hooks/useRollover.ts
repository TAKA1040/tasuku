// 未完了タスク繰り越し機能のカスタムフック
// PHASE 1.2 実装

import { useState, useEffect } from 'react'
import { 
  findIncompleTasks, 
  rolloverSingleTask, 
  rolloverRecurringTask,
  getRolloverDisplayText
} from '@/lib/utils/rollover'
import type { Task, RecurringTask, RecurringLog } from '@/lib/db/schema'
import { supabaseDb as db } from '@/lib/db/supabase-database'

export function useRollover(
  singleTasks: Task[],
  recurringTasks: RecurringTask[],
  isDbInitialized: boolean,
  autoRollover: boolean = false
) {
  const [rolloverData, setRolloverData] = useState<{
    incompleteSingle: Task[]
    incompleteRecurring: Array<{ task: RecurringTask; missedDates: string[] }>
  } | null>(null)
  const [isRollingOver, setIsRollingOver] = useState(false)

  // 未完了タスクの検出
  useEffect(() => {
    if (!isDbInitialized) {
      return
    }

    // 簡易実装：データがない場合は空の結果を返す
    if (singleTasks.length === 0 && recurringTasks.length === 0) {
      setRolloverData({
        incompleteSingle: [],
        incompleteRecurring: []
      })
      return
    }

    const loadRolloverData = async () => {
      try {
        // RecurringLogデータを取得
        const recurringLogs = await db.getAllRecurringLogs()
        
        const incomplete = findIncompleTasks(singleTasks, recurringTasks, recurringLogs)
        setRolloverData(incomplete)
        
        // 自動繰り越し実行
        if (autoRollover && incomplete.incompleteSingle.length > 0) {
          setTimeout(() => {
            executeAutoRollover(incomplete.incompleteSingle)
          }, 1000) // 1秒後に自動実行
        }
      } catch (error) {
        console.error('Rollover detection error:', error)
        setRolloverData({
          incompleteSingle: [],
          incompleteRecurring: []
        })
      }
    }

    loadRolloverData()
  }, [singleTasks, recurringTasks, isDbInitialized])

  // 繰り越し候補があるかチェック
  const hasRolloverCandidates = rolloverData && (
    rolloverData.incompleteSingle.length > 0 || 
    rolloverData.incompleteRecurring.length > 0
  )

  // 繰り越し表示テキスト
  const rolloverDisplayText = rolloverData ? 
    getRolloverDisplayText(rolloverData.incompleteSingle, rolloverData.incompleteRecurring) : ''

  // 自動繰り越し実行（単発タスクのみ）
  const executeAutoRollover = async (incompleteTasks: Task[]) => {
    if (isRollingOver || incompleteTasks.length === 0) return

    setIsRollingOver(true)
    console.log(`Auto rollover: Processing ${incompleteTasks.length} incomplete tasks`)

    try {
      for (const task of incompleteTasks) {
        const rolledOverTask = rolloverSingleTask(task)
        await db.createTask(rolledOverTask)
      }

      // 繰り越し後にデータをリフレッシュ
      setRolloverData(prev => prev ? {
        ...prev,
        incompleteSingle: []
      } : null)
      
      console.log('Auto rollover completed successfully')
    } catch (error) {
      console.error('Auto rollover error:', error)
    } finally {
      setIsRollingOver(false)
    }
  }

  // 手動繰り越し実行
  const executeRollover = async (options: {
    rolloverSingle?: boolean
    rolloverRecurring?: boolean
    selectedSingleTasks?: string[] // タスクID配列
    selectedRecurringTasks?: string[] // 繰り返しタスクID配列
  } = {}) => {
    if (!rolloverData || isRollingOver) return

    setIsRollingOver(true)
    
    try {
      const { 
        rolloverSingle = true, 
        rolloverRecurring = true,
        selectedSingleTasks,
        selectedRecurringTasks
      } = options

      // 単発タスクの繰り越し
      if (rolloverSingle && rolloverData.incompleteSingle.length > 0) {
        const tasksToRollover = selectedSingleTasks 
          ? rolloverData.incompleteSingle.filter(task => selectedSingleTasks.includes(task.id))
          : rolloverData.incompleteSingle

        for (const task of tasksToRollover) {
          const rolledOverTask = rolloverSingleTask(task)
          
          await db.createTask(rolledOverTask)
          
          // 元のタスクを完了済みにマーク
          await db.updateTask(task.id, {
            completed: true, 
            completed_at: new Date().toLocaleDateString('ja-CA')
          })
        }
      }

      // 繰り返しタスクの繰り越し
      if (rolloverRecurring && rolloverData.incompleteRecurring.length > 0) {
        const recurringToRollover = selectedRecurringTasks
          ? rolloverData.incompleteRecurring.filter(item => selectedRecurringTasks.includes(item.task.id))
          : rolloverData.incompleteRecurring

        for (const { task, missedDates } of recurringToRollover) {
          const rolledOverTasks = rolloverRecurringTask(task, missedDates)
          
          for (const rolledOverTask of rolledOverTasks) {
            await db.createTask(rolledOverTask)
          }
        }
      }

      // データを再取得して更新
      setRolloverData(null)
      
    } catch (error) {
      console.error('Rollover failed:', error)
    } finally {
      setIsRollingOver(false)
    }
  }

  return {
    rolloverData,
    hasRolloverCandidates,
    rolloverDisplayText,
    isRollingOver,
    executeRollover
  }
}