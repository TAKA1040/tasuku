-- Fix recurring_pattern constraint to include INTERVAL_DAYS and align with code usage

-- Drop the existing constraint
ALTER TABLE unified_tasks DROP CONSTRAINT IF EXISTS unified_tasks_recurring_pattern_check;

-- Add the new constraint with INTERVAL_DAYS included
ALTER TABLE unified_tasks
ADD CONSTRAINT unified_tasks_recurring_pattern_check
CHECK (recurring_pattern IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'INTERVAL_DAYS'));

-- Comment for documentation
COMMENT ON CONSTRAINT unified_tasks_recurring_pattern_check ON unified_tasks IS
'Allows DAILY, WEEKLY, MONTHLY, YEARLY, and INTERVAL_DAYS patterns to match code usage';