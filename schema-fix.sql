-- Add missing columns to recurring_tasks table
-- This will enable category functionality for recurring tasks

-- Add category column (TEXT type, nullable)
ALTER TABLE recurring_tasks ADD COLUMN IF NOT EXISTS category TEXT;

-- Add max_occurrences column for schema completeness
ALTER TABLE recurring_tasks ADD COLUMN IF NOT EXISTS max_occurrences INTEGER;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'recurring_tasks'
  AND column_name IN ('category', 'max_occurrences')
ORDER BY column_name;