-- Migration: Add start_time and end_time fields to unified_tasks table
-- これにより今日のタスクで時間軸ソートが可能になります

-- Add time-related fields to unified_tasks table
ALTER TABLE unified_tasks
ADD COLUMN start_time TIME NULL,
ADD COLUMN end_time TIME NULL;

-- Add comments for documentation
COMMENT ON COLUMN unified_tasks.start_time IS '開始時間 (HH:MM format, e.g., 09:00, 14:30)';
COMMENT ON COLUMN unified_tasks.end_time IS '終了時間 (HH:MM format, future use for calendar view)';

-- Create index for time-based sorting performance
CREATE INDEX IF NOT EXISTS unified_tasks_start_time_idx ON unified_tasks(start_time) WHERE start_time IS NOT NULL;

-- Update RLS policies to allow time fields (they inherit from existing policies)
-- No additional RLS policies needed as start_time and end_time will inherit from existing row-level security