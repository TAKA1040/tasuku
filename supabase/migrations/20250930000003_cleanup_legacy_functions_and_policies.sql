-- Cleanup legacy database functions and policies
-- All migration to unified_tasks is complete

-- ============================================
-- 1. Drop legacy migration functions
-- ============================================

DROP FUNCTION IF EXISTS migrate_tasks_to_unified() CASCADE;
DROP FUNCTION IF EXISTS migrate_recurring_tasks_to_unified() CASCADE;
DROP FUNCTION IF EXISTS complete_migration_to_unified() CASCADE;

-- ============================================
-- 2. Drop debug/temporary functions
-- ============================================

DROP FUNCTION IF EXISTS check_duplicates() CASCADE;
DROP FUNCTION IF EXISTS check_task_duplicates() CASCADE;
DROP FUNCTION IF EXISTS get_cleanup_stats() CASCADE;
DROP FUNCTION IF EXISTS get_table_stats() CASCADE;

-- ============================================
-- 3. Drop ideas table (CASCADE will drop policies, triggers, indexes)
-- ============================================

-- Note: This will automatically drop:
-- - RLS policies: "Users can view/insert/update/delete their own ideas"
-- - Trigger: handle_ideas_updated_at
-- - Indexes: idx_ideas_user_id, idx_ideas_completed, idx_ideas_created_at

DROP TABLE IF EXISTS ideas CASCADE;

-- ============================================
-- Functions that are KEPT (DO NOT DROP):
-- ============================================
-- - handle_updated_at() : Used by user_settings table
-- - generate_display_number() : Used by unified_tasks triggers
-- - update_updated_at_column() : Used by unified_tasks triggers