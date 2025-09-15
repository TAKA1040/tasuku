-- Add category column to tasks table to match the schema
-- This ensures rollover functionality works correctly

-- Add category column (TEXT type, nullable)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category TEXT;

-- Add other missing columns that might be in the schema but not in the table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rollover_count INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS snoozed_until TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS duration_min INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS importance INTEGER CHECK (importance >= 1 AND importance <= 5);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS urls TEXT[];
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_tag_id TEXT;