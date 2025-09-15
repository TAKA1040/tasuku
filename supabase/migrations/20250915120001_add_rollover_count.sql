-- Add rollover_count column to tasks table
-- This field tracks how many times a task has been rolled over

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rollover_count INTEGER DEFAULT 0;