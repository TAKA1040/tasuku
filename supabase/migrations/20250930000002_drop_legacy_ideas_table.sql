-- Drop legacy ideas table
-- All data has been migrated to unified_tasks table with task_type='IDEA'

-- Drop RLS policies first
DROP POLICY IF EXISTS "Users can view their own ideas" ON ideas;
DROP POLICY IF EXISTS "Users can insert their own ideas" ON ideas;
DROP POLICY IF EXISTS "Users can update their own ideas" ON ideas;
DROP POLICY IF EXISTS "Users can delete their own ideas" ON ideas;

-- Drop the table
DROP TABLE IF EXISTS ideas CASCADE;