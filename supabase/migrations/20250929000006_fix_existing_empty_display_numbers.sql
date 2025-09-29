-- Fix existing empty display_numbers by triggering the auto-generation
-- This will update all rows where display_number is NULL or empty

UPDATE unified_tasks
SET display_number = ''
WHERE display_number IS NULL OR display_number = '';

-- The update trigger will automatically generate proper display_numbers