-- Add category column to recurring_tasks table
-- This enables category functionality for recurring tasks

-- Add category column (TEXT type, nullable)
ALTER TABLE recurring_tasks ADD COLUMN IF NOT EXISTS category TEXT;

-- Add max_occurrences column for schema completeness
ALTER TABLE recurring_tasks ADD COLUMN IF NOT EXISTS max_occurrences INTEGER;