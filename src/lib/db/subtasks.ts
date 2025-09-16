// SubTask CRUD Operations
// サブタスクの作成、読み取り、更新、削除機能

import { db as database, STORE_NAMES } from './database'
import type { SubTask } from './schema'
import { generateId } from '../utils/id-generator'

export class SubTaskService {
  // サブタスクを作成
  async createSubTask(parentTaskId: string, title: string, sortOrder?: number): Promise<SubTask> {
    await database.init()

    // 並び順が指定されていない場合、最後に追加
    if (sortOrder === undefined) {
      const existingSubTasks = await this.getSubTasksByParentId(parentTaskId)
      sortOrder = existingSubTasks.length
    }

    const subTask: SubTask = {
      id: generateId(),
      parent_task_id: parentTaskId,
      title,
      completed: false,
      sort_order: sortOrder,
      created_at: new Date().toISOString()
    }

    await database.put(STORE_NAMES.SUB_TASKS, subTask)
    return subTask
  }

  // 親タスクIDでサブタスクを取得
  async getSubTasksByParentId(parentTaskId: string): Promise<SubTask[]> {
    await database.init()
    return database.getByIndex<SubTask>(
      STORE_NAMES.SUB_TASKS,
      'by_parent_task_id',
      parentTaskId
    )
  }

  // サブタスクの完了状態を切り替え
  async toggleSubTaskCompletion(subTaskId: string): Promise<void> {
    await database.init()

    const subTask = await database.get<SubTask>(STORE_NAMES.SUB_TASKS, subTaskId)
    if (!subTask) {
      throw new Error('SubTask not found')
    }

    subTask.completed = !subTask.completed
    await database.put(STORE_NAMES.SUB_TASKS, subTask)
  }

  // サブタスクのタイトルを更新
  async updateSubTaskTitle(subTaskId: string, title: string): Promise<void> {
    await database.init()

    const subTask = await database.get<SubTask>(STORE_NAMES.SUB_TASKS, subTaskId)
    if (!subTask) {
      throw new Error('SubTask not found')
    }

    subTask.title = title
    await database.put(STORE_NAMES.SUB_TASKS, subTask)
  }

  // サブタスクの並び順を更新
  async updateSubTaskOrder(subTaskId: string, newSortOrder: number): Promise<void> {
    await database.init()

    const subTask = await database.get<SubTask>(STORE_NAMES.SUB_TASKS, subTaskId)
    if (!subTask) {
      throw new Error('SubTask not found')
    }

    subTask.sort_order = newSortOrder
    await database.put(STORE_NAMES.SUB_TASKS, subTask)
  }

  // サブタスクを削除
  async deleteSubTask(subTaskId: string): Promise<void> {
    await database.init()
    await database.delete(STORE_NAMES.SUB_TASKS, subTaskId)
  }

  // 親タスクのすべてのサブタスクを削除
  async deleteSubTasksByParentId(parentTaskId: string): Promise<void> {
    await database.init()
    const subTasks = await this.getSubTasksByParentId(parentTaskId)

    for (const subTask of subTasks) {
      await this.deleteSubTask(subTask.id)
    }
  }

  // 未完了のサブタスクを取得
  async getIncompleteSubTasks(parentTaskId: string): Promise<SubTask[]> {
    await database.init()
    const allSubTasks = await this.getSubTasksByParentId(parentTaskId)
    return allSubTasks.filter(subTask => !subTask.completed)
  }

  // 完了済みのサブタスクを取得
  async getCompletedSubTasks(parentTaskId: string): Promise<SubTask[]> {
    await database.init()
    const allSubTasks = await this.getSubTasksByParentId(parentTaskId)
    return allSubTasks.filter(subTask => subTask.completed)
  }

  // サブタスクの完了率を計算
  async getCompletionRate(parentTaskId: string): Promise<number> {
    await database.init()
    const allSubTasks = await this.getSubTasksByParentId(parentTaskId)

    if (allSubTasks.length === 0) return 0

    const completedCount = allSubTasks.filter(subTask => subTask.completed).length
    return Math.round((completedCount / allSubTasks.length) * 100)
  }
}

// シングルトンインスタンス
export const subTaskService = new SubTaskService()