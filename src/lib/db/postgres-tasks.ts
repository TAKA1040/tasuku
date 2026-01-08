// PostgreSQL用 統一タスクサービス（manariedb用）
// サーバーサイド専用

import { query, queryOne } from './postgres-client'
import type { UnifiedTask, SubTask } from '@/lib/types/unified-task'
import type { RecurringTemplate } from '@/lib/types/recurring-template'
import { getTodayJST, getNowJST } from '@/lib/utils/date-jst'
import { SPECIAL_DATES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'

const NO_DUE_DATE = SPECIAL_DATES.NO_DUE_DATE

export class PostgresTasksService {
  // ディスプレイ番号生成
  static async generateDisplayNumber(userId: string): Promise<string> {
    try {
      const rows = await query<{ display_number: string }>(
        `SELECT display_number FROM unified_tasks
         WHERE user_id = $1 AND display_number LIKE 'T___'
         ORDER BY display_number DESC LIMIT 1`,
        [userId]
      )

      if (!rows || rows.length === 0) {
        return 'T001'
      }

      const lastNumber = rows[0].display_number
      const number = parseInt(lastNumber.substring(1)) + 1
      if (isNaN(number)) return 'T001'

      return `T${number.toString().padStart(3, '0')}`
    } catch (error) {
      logger.error('generateDisplayNumber error:', error)
      return 'T001'
    }
  }

  // 全統一タスクを取得
  static async getAllUnifiedTasks(userId: string, filters?: {
    completed?: boolean
    category?: string
    date_range?: { start?: string; end?: string }
    has_due_date?: boolean
    importance_min?: number
  }): Promise<UnifiedTask[]> {
    try {
      let sql = `SELECT * FROM unified_tasks WHERE user_id = $1`
      const params: unknown[] = [userId]
      let paramIndex = 2

      if (filters?.completed !== undefined) {
        sql += ` AND completed = $${paramIndex}`
        params.push(filters.completed)
        paramIndex++
      }

      if (filters?.category) {
        sql += ` AND category = $${paramIndex}`
        params.push(filters.category)
        paramIndex++
      }

      if (filters?.date_range?.start) {
        sql += ` AND due_date >= $${paramIndex}`
        params.push(filters.date_range.start)
        paramIndex++
      }

      if (filters?.date_range?.end) {
        sql += ` AND due_date <= $${paramIndex}`
        params.push(filters.date_range.end)
        paramIndex++
      }

      if (filters?.has_due_date !== undefined) {
        if (filters.has_due_date) {
          sql += ` AND due_date != $${paramIndex}`
          params.push(NO_DUE_DATE)
        } else {
          sql += ` AND due_date = $${paramIndex}`
          params.push(NO_DUE_DATE)
        }
        paramIndex++
      }

      if (filters?.importance_min) {
        sql += ` AND importance >= $${paramIndex}`
        params.push(filters.importance_min)
        paramIndex++
      }

      sql += ` ORDER BY display_number ASC`

      return await query<UnifiedTask>(sql, params)
    } catch (error) {
      logger.error('PostgresTasksService.getAllUnifiedTasks error:', error)
      throw error
    }
  }

  // 今日のタスクを取得
  static async getTodayTasks(userId: string): Promise<UnifiedTask[]> {
    const today = getTodayJST()
    return this.getAllUnifiedTasks(userId, {
      completed: false,
      date_range: { start: today, end: today }
    })
  }

  // やることリスト（期限なし）を取得
  static async getIdeaTasks(userId: string): Promise<UnifiedTask[]> {
    return this.getAllUnifiedTasks(userId, {
      completed: false,
      has_due_date: false
    })
  }

  // 買い物リストを取得
  static async getShoppingTasks(userId: string): Promise<UnifiedTask[]> {
    return this.getAllUnifiedTasks(userId, {
      category: '買い物',
      completed: false,
      has_due_date: false
    })
  }

  // 期限切れタスクを取得
  static async getOverdueTasks(userId: string): Promise<UnifiedTask[]> {
    const today = getTodayJST()
    const tasks = await this.getAllUnifiedTasks(userId, {
      completed: false,
      date_range: { start: '2000-01-01', end: today }
    })
    return tasks.filter(task => task.due_date !== NO_DUE_DATE)
  }

  // 完了済みタスクを取得
  static async getCompletedTasks(userId: string): Promise<UnifiedTask[]> {
    return this.getAllUnifiedTasks(userId, { completed: true })
  }

  // 新しい統一タスクを作成
  static async createUnifiedTask(
    userId: string,
    task: Omit<UnifiedTask, 'id' | 'created_at' | 'updated_at' | 'user_id'>
  ): Promise<UnifiedTask> {
    try {
      const now = new Date().toISOString()

      const result = await queryOne<UnifiedTask>(
        `INSERT INTO unified_tasks (
          user_id, title, memo, due_date, category, importance,
          task_type, display_number, completed, completed_at,
          recurring_pattern, recurring_weekdays, recurring_day,
          recurring_template_id, start_time, end_time, urls,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) RETURNING *`,
        [
          userId,
          task.title,
          task.memo || null,
          task.due_date || NO_DUE_DATE,
          task.category || null,
          task.importance || 1,
          task.task_type || 'NORMAL',
          task.display_number,
          task.completed || false,
          task.completed_at || null,
          task.recurring_pattern || null,
          task.recurring_weekdays || null,
          task.recurring_day || null,
          task.recurring_template_id || null,
          task.start_time || null,
          task.end_time || null,
          task.urls || [],  // NOT NULL制約があるため空配列をデフォルトに
          now,
          now
        ]
      )

      if (!result) {
        throw new Error('Failed to create task - no data returned')
      }

      // 繰り返しタスクの場合、テンプレートを作成
      if (result.task_type === 'RECURRING' && result.recurring_pattern) {
        await this.createTemplateFromTask(result)
      }

      return result
    } catch (error) {
      logger.error('PostgresTasksService.createUnifiedTask error:', error)
      throw error
    }
  }

  // テンプレートを作成
  private static async createTemplateFromTask(task: UnifiedTask): Promise<void> {
    try {
      // 既存テンプレートをチェック
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM recurring_templates
         WHERE user_id = $1 AND title = $2 AND pattern = $3 AND COALESCE(category, '') = $4
         LIMIT 1`,
        [task.user_id, task.title, task.recurring_pattern, task.category || '']
      )

      if (existing) {
        // 既存テンプレートにリンク
        await query(
          `UPDATE unified_tasks SET recurring_template_id = $1 WHERE id = $2`,
          [existing.id, task.id]
        )
        return
      }

      // 新規テンプレート作成
      const now = new Date().toISOString()
      const template = await queryOne<{ id: string }>(
        `INSERT INTO recurring_templates (
          title, memo, category, importance, pattern, weekdays,
          user_id, active, urls, start_time, end_time, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id`,
        [
          task.title,
          task.memo,
          task.category,
          task.importance || 1,
          task.recurring_pattern,
          task.recurring_weekdays,
          task.user_id,
          true,
          task.urls,
          task.start_time,
          task.end_time,
          now,
          now
        ]
      )

      if (template) {
        await query(
          `UPDATE unified_tasks SET recurring_template_id = $1 WHERE id = $2`,
          [template.id, task.id]
        )
      }
    } catch (error) {
      logger.error('createTemplateFromTask error:', error)
    }
  }

  // 統一タスクを更新
  static async updateUnifiedTask(
    userId: string,
    id: string,
    updates: Partial<UnifiedTask>
  ): Promise<UnifiedTask> {
    try {
      const setClauses: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      const allowedFields = [
        'title', 'memo', 'due_date', 'category', 'importance',
        'task_type', 'completed', 'completed_at', 'recurring_pattern',
        'recurring_weekdays', 'recurring_day', 'recurring_template_id',
        'start_time', 'end_time', 'urls'
      ]

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          setClauses.push(`${key} = $${paramIndex}`)
          params.push(value)
          paramIndex++
        }
      }

      setClauses.push(`updated_at = $${paramIndex}`)
      params.push(new Date().toISOString())
      paramIndex++

      params.push(id)
      params.push(userId)

      const result = await queryOne<UnifiedTask>(
        `UPDATE unified_tasks SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex - 1} AND user_id = $${paramIndex}
         RETURNING *`,
        params
      )

      if (!result) {
        throw new Error('Task not found or update failed')
      }

      // 繰り返しタスクのテンプレート同期
      if (result.task_type === 'RECURRING' && result.recurring_template_id) {
        await this.syncTemplateFromTask(result)
      }

      return result
    } catch (error) {
      logger.error('PostgresTasksService.updateUnifiedTask error:', error)
      throw error
    }
  }

  // テンプレート同期
  private static async syncTemplateFromTask(task: UnifiedTask): Promise<void> {
    try {
      if (!task.recurring_template_id) return

      // 現在のテンプレートのURLsを取得
      const current = await queryOne<{ urls: string[] | null }>(
        `SELECT urls FROM recurring_templates WHERE id = $1`,
        [task.recurring_template_id]
      )

      // URLs保護: タスクのURLsが空でテンプレートにURLsがある場合は保持
      const taskUrls = task.urls || []
      const templateUrls = current?.urls || []
      const finalUrls = (taskUrls.length === 0 && templateUrls.length > 0) ? templateUrls : taskUrls

      await query(
        `UPDATE recurring_templates SET
          title = $1, memo = $2, category = $3, importance = $4,
          weekdays = $5, urls = $6, start_time = $7, end_time = $8,
          updated_at = $9
         WHERE id = $10`,
        [
          task.title, task.memo, task.category, task.importance,
          task.recurring_weekdays, finalUrls, task.start_time, task.end_time,
          new Date().toISOString(), task.recurring_template_id
        ]
      )
    } catch (error) {
      logger.error('syncTemplateFromTask error:', error)
    }
  }

  // 統一タスクを削除
  static async deleteUnifiedTask(userId: string, id: string): Promise<void> {
    try {
      // done記録も削除
      await query(
        `DELETE FROM done WHERE original_task_id = $1 AND user_id = $2`,
        [id, userId]
      )

      // タスク削除
      await query(
        `DELETE FROM unified_tasks WHERE id = $1 AND user_id = $2`,
        [id, userId]
      )
    } catch (error) {
      logger.error('PostgresTasksService.deleteUnifiedTask error:', error)
      throw error
    }
  }

  // タスクを完了にする
  static async completeTask(userId: string, id: string): Promise<UnifiedTask> {
    try {
      const completedAt = getNowJST()

      // タスク情報を取得
      const task = await queryOne<UnifiedTask>(
        `SELECT * FROM unified_tasks WHERE id = $1 AND user_id = $2`,
        [id, userId]
      )

      if (!task) {
        throw new Error('Task not found')
      }

      // done履歴に保存
      await query(
        `INSERT INTO done (
          original_task_id, original_title, original_memo, original_category,
          original_importance, original_due_date, original_recurring_pattern,
          original_display_number, completed_at, user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          task.id, task.title, task.memo, task.category,
          task.importance, task.due_date, task.recurring_pattern,
          task.display_number, completedAt, userId
        ]
      )

      // タスクを完了状態に更新
      return this.updateUnifiedTask(userId, id, {
        completed: true,
        completed_at: completedAt
      })
    } catch (error) {
      logger.error('PostgresTasksService.completeTask error:', error)
      throw error
    }
  }

  // タスクを未完了にする
  static async uncompleteTask(userId: string, id: string): Promise<UnifiedTask> {
    return this.updateUnifiedTask(userId, id, {
      completed: false,
      completed_at: undefined
    })
  }

  // ===================================
  // SUBTASKS Operations
  // ===================================

  // サブタスクを取得
  static async getSubtasks(userId: string, parentTaskId: string): Promise<SubTask[]> {
    try {
      return await query<SubTask>(
        `SELECT * FROM subtasks WHERE parent_task_id = $1 AND user_id = $2 ORDER BY sort_order ASC`,
        [parentTaskId, userId]
      )
    } catch (error) {
      logger.error('PostgresTasksService.getSubtasks error:', error)
      throw error
    }
  }

  // サブタスクを作成
  static async createSubtask(userId: string, parentTaskId: string, title: string): Promise<SubTask> {
    try {
      // 次のsort_orderを取得
      const maxOrder = await queryOne<{ max: number }>(
        `SELECT COALESCE(MAX(sort_order), 0) as max FROM subtasks WHERE parent_task_id = $1 AND user_id = $2`,
        [parentTaskId, userId]
      )

      const result = await queryOne<SubTask>(
        `INSERT INTO subtasks (parent_task_id, title, sort_order, completed, user_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [parentTaskId, title, (maxOrder?.max || 0) + 1, false, userId, new Date().toISOString()]
      )

      if (!result) {
        throw new Error('Failed to create subtask')
      }

      return result
    } catch (error) {
      logger.error('PostgresTasksService.createSubtask error:', error)
      throw error
    }
  }

  // サブタスクの完了状態を切り替え
  static async toggleSubtask(userId: string, subtaskId: string): Promise<SubTask> {
    try {
      const result = await queryOne<SubTask>(
        `UPDATE subtasks SET completed = NOT completed WHERE id = $1 AND user_id = $2 RETURNING *`,
        [subtaskId, userId]
      )

      if (!result) {
        throw new Error('Subtask not found')
      }

      return result
    } catch (error) {
      logger.error('PostgresTasksService.toggleSubtask error:', error)
      throw error
    }
  }

  // サブタスクを削除
  static async deleteSubtask(userId: string, subtaskId: string): Promise<void> {
    try {
      await query(
        `DELETE FROM subtasks WHERE id = $1 AND user_id = $2`,
        [subtaskId, userId]
      )
    } catch (error) {
      logger.error('PostgresTasksService.deleteSubtask error:', error)
      throw error
    }
  }

  // サブタスクを更新
  static async updateSubtask(
    userId: string,
    subtaskId: string,
    updates: { title?: string; completed?: boolean; sort_order?: number }
  ): Promise<SubTask> {
    try {
      const setClauses: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      if (updates.title !== undefined) {
        setClauses.push(`title = $${paramIndex}`)
        params.push(updates.title)
        paramIndex++
      }
      if (updates.completed !== undefined) {
        setClauses.push(`completed = $${paramIndex}`)
        params.push(updates.completed)
        paramIndex++
      }
      if (updates.sort_order !== undefined) {
        setClauses.push(`sort_order = $${paramIndex}`)
        params.push(updates.sort_order)
        paramIndex++
      }

      if (setClauses.length === 0) {
        throw new Error('No updates provided')
      }

      params.push(subtaskId)
      params.push(userId)

      const result = await queryOne<SubTask>(
        `UPDATE subtasks SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
         RETURNING *`,
        params
      )

      if (!result) {
        throw new Error('Subtask not found')
      }

      return result
    } catch (error) {
      logger.error('PostgresTasksService.updateSubtask error:', error)
      throw error
    }
  }

  // ===================================
  // TEMPLATES Operations
  // ===================================

  // アクティブなテンプレートをパターン別に取得
  static async getTemplatesByPattern(userId: string, pattern: string): Promise<RecurringTemplate[]> {
    try {
      return await query<RecurringTemplate>(
        `SELECT * FROM recurring_templates
         WHERE user_id = $1 AND pattern = $2 AND active = true
         ORDER BY created_at DESC`,
        [userId, pattern]
      )
    } catch (error) {
      logger.error('getTemplatesByPattern error:', error)
      throw error
    }
  }

  // 全テンプレートを取得
  static async getAllTemplates(userId: string, filters?: {
    pattern?: string
    category?: string
    active?: boolean
  }): Promise<RecurringTemplate[]> {
    try {
      let sql = `SELECT * FROM recurring_templates WHERE user_id = $1`
      const params: unknown[] = [userId]
      let paramIndex = 2

      if (filters?.pattern) {
        sql += ` AND pattern = $${paramIndex}`
        params.push(filters.pattern)
        paramIndex++
      }
      if (filters?.category) {
        sql += ` AND category = $${paramIndex}`
        params.push(filters.category)
        paramIndex++
      }
      if (filters?.active !== undefined) {
        sql += ` AND active = $${paramIndex}`
        params.push(filters.active)
        paramIndex++
      }

      sql += ` ORDER BY created_at DESC`

      return await query<RecurringTemplate>(sql, params)
    } catch (error) {
      logger.error('getAllTemplates error:', error)
      throw error
    }
  }

  // テンプレートを取得（ID指定）
  static async getTemplateById(userId: string, id: string): Promise<RecurringTemplate | null> {
    try {
      return await queryOne<RecurringTemplate>(
        `SELECT * FROM recurring_templates WHERE id = $1 AND user_id = $2`,
        [id, userId]
      )
    } catch (error) {
      logger.error('getTemplateById error:', error)
      throw error
    }
  }

  // テンプレートを更新
  static async updateTemplate(userId: string, id: string, updates: Partial<RecurringTemplate>): Promise<RecurringTemplate> {
    try {
      const setClauses: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      const allowedFields = [
        'title', 'memo', 'category', 'importance', 'pattern', 'weekdays',
        'day_of_month', 'month_of_year', 'day_of_year', 'active', 'urls',
        'start_time', 'end_time', 'last_activated_at'
      ]

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          setClauses.push(`${key} = $${paramIndex}`)
          params.push(value)
          paramIndex++
        }
      }

      setClauses.push(`updated_at = $${paramIndex}`)
      params.push(new Date().toISOString())
      paramIndex++

      params.push(id)
      params.push(userId)

      const result = await queryOne<RecurringTemplate>(
        `UPDATE recurring_templates SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex - 1} AND user_id = $${paramIndex}
         RETURNING *`,
        params
      )

      if (!result) {
        throw new Error('Template not found')
      }

      return result
    } catch (error) {
      logger.error('updateTemplate error:', error)
      throw error
    }
  }

  // テンプレートを削除
  static async deleteTemplate(userId: string, id: string): Promise<void> {
    try {
      await query(
        `DELETE FROM recurring_templates WHERE id = $1 AND user_id = $2`,
        [id, userId]
      )
    } catch (error) {
      logger.error('deleteTemplate error:', error)
      throw error
    }
  }

  // テンプレートを作成
  static async createTemplate(userId: string, template: Partial<RecurringTemplate>): Promise<RecurringTemplate> {
    try {
      const now = new Date().toISOString()
      const result = await queryOne<RecurringTemplate>(
        `INSERT INTO recurring_templates (
          title, memo, category, importance, pattern, weekdays,
          day_of_month, month_of_year, day_of_year, user_id, active,
          urls, start_time, end_time, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          template.title,
          template.memo || null,
          template.category || null,
          template.importance || 1,
          template.pattern,
          template.weekdays || null,
          template.day_of_month || null,
          template.month_of_year || null,
          template.day_of_year || null,
          userId,
          template.active !== false,
          template.urls || [],  // NOT NULL制約があるため空配列をデフォルトに
          template.start_time || null,
          template.end_time || null,
          now,
          now
        ]
      )

      if (!result) {
        throw new Error('Failed to create template')
      }

      return result
    } catch (error) {
      logger.error('createTemplate error:', error)
      throw error
    }
  }

  // ===================================
  // USER METADATA Operations
  // ===================================

  // メタデータを取得
  static async getMetadata(userId: string, key: string): Promise<string | null> {
    try {
      const result = await queryOne<{ value: string }>(
        `SELECT value FROM user_metadata WHERE user_id = $1 AND key = $2`,
        [userId, key]
      )
      return result?.value || null
    } catch (error) {
      logger.error('getMetadata error:', error)
      return null
    }
  }

  // メタデータを設定
  static async setMetadata(userId: string, key: string, value: string): Promise<void> {
    try {
      await query(
        `INSERT INTO user_metadata (user_id, key, value, updated_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, key) DO UPDATE SET value = $3, updated_at = $4`,
        [userId, key, value, new Date().toISOString()]
      )
    } catch (error) {
      logger.error('setMetadata error:', error)
      throw error
    }
  }

  // メタデータを削除
  static async deleteMetadata(userId: string, key: string): Promise<void> {
    try {
      await query(
        `DELETE FROM user_metadata WHERE user_id = $1 AND key = $2`,
        [userId, key]
      )
    } catch (error) {
      logger.error('deleteMetadata error:', error)
    }
  }

  // メタデータ取得（updated_at付き）
  static async getMetadataWithTimestamp(userId: string, key: string): Promise<{ value: string; updated_at: string } | null> {
    try {
      return await queryOne<{ value: string; updated_at: string }>(
        `SELECT value, updated_at FROM user_metadata WHERE user_id = $1 AND key = $2`,
        [userId, key]
      )
    } catch (error) {
      logger.error('getMetadataWithTimestamp error:', error)
      return null
    }
  }

  // ===================================
  // TASK GENERATION Operations
  // ===================================

  // テンプレートIDと日付でタスク存在チェック
  static async getTaskByTemplateAndDate(
    userId: string,
    templateId: string,
    dueDate: string
  ): Promise<UnifiedTask | null> {
    try {
      return await queryOne<UnifiedTask>(
        `SELECT * FROM unified_tasks
         WHERE user_id = $1 AND recurring_template_id = $2 AND due_date = $3
         LIMIT 1`,
        [userId, templateId, dueDate]
      )
    } catch (error) {
      logger.error('getTaskByTemplateAndDate error:', error)
      throw error
    }
  }

  // 繰り返しタスクの一括削除（パターン・期限条件）
  static async deleteRecurringTasksByCondition(
    userId: string,
    pattern: string,
    dateCondition: 'gt' | 'lte',
    threshold: string
  ): Promise<number> {
    try {
      const op = dateCondition === 'gt' ? '>' : '<='
      const result = await query<{ id: string }>(
        `DELETE FROM unified_tasks
         WHERE user_id = $1
         AND completed = false
         AND recurring_pattern = $2
         AND recurring_template_id IS NOT NULL
         AND due_date ${op} $3
         RETURNING id`,
        [userId, pattern, threshold]
      )
      return result.length
    } catch (error) {
      logger.error('deleteRecurringTasksByCondition error:', error)
      return 0
    }
  }

  // 完了済み買い物タスク取得
  static async getCompletedShoppingTasks(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<UnifiedTask[]> {
    try {
      return await query<UnifiedTask>(
        `SELECT * FROM unified_tasks
         WHERE user_id = $1
         AND category = '買い物'
         AND completed = true
         AND completed_at >= $2
         AND completed_at <= $3`,
        [userId, startDate, endDate]
      )
    } catch (error) {
      logger.error('getCompletedShoppingTasks error:', error)
      return []
    }
  }

  // 未関連付け繰り返しタスクを取得（テンプレート管理画面用）
  static async getOrphanRecurringTasks(userId: string): Promise<UnifiedTask[]> {
    try {
      return await query<UnifiedTask>(
        `SELECT * FROM unified_tasks
         WHERE user_id = $1
         AND task_type = 'RECURRING'
         AND recurring_template_id IS NULL
         ORDER BY created_at DESC`,
        [userId]
      )
    } catch (error) {
      logger.error('getOrphanRecurringTasks error:', error)
      throw error
    }
  }

  // テンプレートIDに基づく未完了タスクの一括更新
  static async updateTasksByTemplate(
    userId: string,
    templateId: string,
    updates: { urls?: string[] | null; start_time?: string | null; end_time?: string | null }
  ): Promise<number> {
    try {
      const setClauses: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      if (updates.urls !== undefined) {
        setClauses.push(`urls = $${paramIndex}`)
        params.push(updates.urls)
        paramIndex++
      }
      if (updates.start_time !== undefined) {
        setClauses.push(`start_time = $${paramIndex}`)
        params.push(updates.start_time)
        paramIndex++
      }
      if (updates.end_time !== undefined) {
        setClauses.push(`end_time = $${paramIndex}`)
        params.push(updates.end_time)
        paramIndex++
      }

      if (setClauses.length === 0) {
        return 0
      }

      setClauses.push(`updated_at = $${paramIndex}`)
      params.push(new Date().toISOString())
      paramIndex++

      params.push(templateId)
      params.push(userId)

      const result = await query<{ id: string }>(
        `UPDATE unified_tasks SET ${setClauses.join(', ')}
         WHERE recurring_template_id = $${paramIndex - 1}
         AND user_id = $${paramIndex}
         AND completed = false
         RETURNING id`,
        params
      )

      return result.length
    } catch (error) {
      logger.error('updateTasksByTemplate error:', error)
      throw error
    }
  }
}

export default PostgresTasksService
