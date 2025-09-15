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
    if (process.env.NODE_ENV === 'development') {
      console.log(`Auto rollover: Processing ${incompleteTasks.length} incomplete tasks`)
    }

    try {
      for (const task of incompleteTasks) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Auto rollover: Processing task:', task.title)
        }
        const rolledOverTask = rolloverSingleTask(task)

        // createTask用にid, created_at, updated_atを除く
        const { id, created_at, updated_at, ...taskForCreate } = rolledOverTask

        try {
          await db.createTask(taskForCreate)
          if (process.env.NODE_ENV === 'development') {
            console.log('Auto rollover: Successfully created task:', task.title)
          }

          // 元のタスクを完了済みにマーク（重複表示を防ぐ）
          await db.updateTask(task.id, {
            completed: true,
            completed_at: new Date().toLocaleDateString('ja-CA')
          })
          if (process.env.NODE_ENV === 'development') {
            console.log('Auto rollover: Marked original task as completed:', task.title)
          }
        } catch (createError) {
          console.error('Auto rollover: Failed to create task:', {
            title: task.title,
            error: createError instanceof Error ? createError.message : String(createError)
          })
          throw createError
        }
      }

      // 繰り越し後にデータをリフレッシュ（完全に初期化）
      setRolloverData({
        incompleteSingle: [],
        incompleteRecurring: []
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('Auto rollover completed successfully')
      }
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

          // createTask用にid, created_at, updated_atを除く
          const { id, created_at, updated_at, ...taskForCreate } = rolledOverTask
          await db.createTask(taskForCreate)

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
            // createTask用にid, created_at, updated_atを除く
            const { id, created_at, updated_at, ...taskForCreate } = rolledOverTask
            await db.createTask(taskForCreate)
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