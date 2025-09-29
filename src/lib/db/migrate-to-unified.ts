// レガシーマイグレーションコード（無効化済み）
// 旧テーブルは既に存在しないため、この関数は使用されない

import { createClient } from '@/lib/supabase/client'
import { DisplayNumberUtils } from '@/lib/types/unified-task'

export async function migrateToUnifiedTasks() {
  console.log('⚠️ Migration function disabled - legacy tables no longer exist')
  console.log('✅ Data migration was already completed during previous setup')
  console.log('📊 All data is now in unified_tasks table with appropriate task_type values')
  return { success: true, message: 'Migration already completed' }
}