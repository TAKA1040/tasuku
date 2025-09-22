// SubTask CRUD Operations using Supabase
// サブタスクの作成、読み取り、更新、削除機能 (Supabase版)

import { supabaseDb as db } from './supabase-database'
import type { SubTask } from './schema'

export class SupabaseSubTaskService {
  // サブタスクを作成
  async createSubTask(parentTaskId: string, title: string, sortOrder?: number): Promise<SubTask> {
    // 並び順が指定されていない場合、最後に追加
    if (sortOrder === undefined) {
      const existingSubTasks = await this.getSubTasksByParentId(parentTaskId)
      sortOrder = existingSubTasks.length
    }

    const subTask = await db.createSubTask({
      parent_task_id: parentTaskId,
      title,
      completed: false,
      sort_order: sortOrder
    })

    return subTask
  }

  // 親タスクIDでサブタスクを取得
  async getSubTasksByParentId(parentTaskId: string): Promise<SubTask[]> {
    return db.getSubTasksByParentId(parentTaskId)
  }

  // サブタスクの完了状態を切り替え
  async toggleSubTaskCompletion(subTaskId: string): Promise<void> {
    const subTask = await db.getSubTask(subTaskId)
    if (!subTask) {
      throw new Error('SubTask not found')
    }

    await db.updateSubTask(subTaskId, { completed: !subTask.completed })
  }

  // サブタスクを更新（汎用）
  async updateSubTask(subTaskId: string, updates: Partial<Pick<SubTask, 'title' | 'completed' | 'sort_order'>>): Promise<void> {
    await db.updateSubTask(subTaskId, updates)
  }

  // サブタスクのタイトルを更新
  async updateSubTaskTitle(subTaskId: string, title: string): Promise<void> {
    await db.updateSubTask(subTaskId, { title })
  }

  // サブタスクの並び順を更新
  async updateSubTaskOrder(subTaskId: string, newSortOrder: number): Promise<void> {
    await db.updateSubTask(subTaskId, { sort_order: newSortOrder })
  }

  // サブタスクを削除
  async deleteSubTask(subTaskId: string): Promise<void> {
    await db.deleteSubTask(subTaskId)
  }

  // 親タスクのすべてのサブタスクを削除
  async deleteSubTasksByParentId(parentTaskId: string): Promise<void> {
    await db.deleteSubTasksByParentId(parentTaskId)
  }

  // 未完了のサブタスクを取得
  async getIncompleteSubTasks(parentTaskId: string): Promise<SubTask[]> {
    const allSubTasks = await this.getSubTasksByParentId(parentTaskId)
    return allSubTasks.filter(subTask => !subTask.completed)
  }

  // 完了済みのサブタスクを取得
  async getCompletedSubTasks(parentTaskId: string): Promise<SubTask[]> {
    const allSubTasks = await this.getSubTasksByParentId(parentTaskId)
    return allSubTasks.filter(subTask => subTask.completed)
  }

  // サブタスクの完了率を計算
  async getCompletionRate(parentTaskId: string): Promise<number> {
    const allSubTasks = await this.getSubTasksByParentId(parentTaskId)

    if (allSubTasks.length === 0) return 0

    const completedCount = allSubTasks.filter(subTask => subTask.completed).length
    return Math.round((completedCount / allSubTasks.length) * 100)
  }
}

// シングルトンインスタンス
export const supabaseSubTaskService = new SupabaseSubTaskService()

// 後方互換性のため既存のインポートでも使えるようにする
export const subTaskService = supabaseSubTaskService