-- Fix display_number column type in done table to match unified_tasks
ALTER TABLE public.done ALTER COLUMN original_display_number TYPE TEXT;