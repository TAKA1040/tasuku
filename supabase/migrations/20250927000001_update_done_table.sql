-- Update done table to match the application requirements
-- Add missing columns that the app expects

-- Add the columns that the app is trying to use
ALTER TABLE public.done ADD COLUMN IF NOT EXISTS original_title TEXT;
ALTER TABLE public.done ADD COLUMN IF NOT EXISTS original_memo TEXT;
ALTER TABLE public.done ADD COLUMN IF NOT EXISTS original_category TEXT;
ALTER TABLE public.done ADD COLUMN IF NOT EXISTS original_importance TEXT;
ALTER TABLE public.done ADD COLUMN IF NOT EXISTS original_due_date DATE;
ALTER TABLE public.done ADD COLUMN IF NOT EXISTS original_recurring_pattern TEXT;
ALTER TABLE public.done ADD COLUMN IF NOT EXISTS original_display_number INTEGER;
ALTER TABLE public.done ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Drop the old task_title column if it exists
ALTER TABLE public.done DROP COLUMN IF EXISTS task_title;

-- Drop the old completion_date and completion_time columns if they exist
ALTER TABLE public.done DROP COLUMN IF EXISTS completion_date;
ALTER TABLE public.done DROP COLUMN IF EXISTS completion_time;