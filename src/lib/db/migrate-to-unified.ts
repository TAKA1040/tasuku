// レガシーマイグレーションコード（無効化済み）
// 旧テーブルは既に存在しないため、この関数は使用されない

import { logger } from '@/lib/utils/logger'

export async function migrateToUnifiedTasks() {
  logger.info('⚠️ Migration function disabled - legacy tables no longer exist')
  logger.info('✅ Data migration was already completed during previous setup')
  logger.info('📊 All data is now in unified_tasks table with appropriate task_type values')
  return { success: true, message: 'Migration already completed' }
}