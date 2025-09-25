-- Add missing recurring_pattern and related columns to unified_tasks table

ALTER TABLE unified_tasks
ADD COLUMN IF NOT EXISTS recurring_pattern TEXT CHECK (recurring_pattern IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'));

ALTER TABLE unified_tasks
ADD COLUMN IF NOT EXISTS recurring_weekdays INTEGER[] DEFAULT '{}';

ALTER TABLE unified_tasks
ADD COLUMN IF NOT EXISTS recurring_day INTEGER;

ALTER TABLE unified_tasks
ADD COLUMN IF NOT EXISTS recurring_month INTEGER;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS unified_tasks_recurring_pattern_idx ON unified_tasks(recurring_pattern);

-- Update existing records to set proper task_type based on recurring_pattern
UPDATE unified_tasks
SET task_type = 'RECURRING'
WHERE recurring_pattern IS NOT NULL
AND task_type = 'NORMAL';

-- Set default values for existing records
UPDATE unified_tasks
SET recurring_weekdays = '{}'
WHERE recurring_weekdays IS NULL;