-- Force reset URLs columns to fix persistent data corruption
-- Drop and recreate columns to ensure clean state

-- Step 1: Drop URLs columns completely
ALTER TABLE recurring_templates DROP COLUMN IF EXISTS urls;
ALTER TABLE unified_tasks DROP COLUMN IF EXISTS urls;

-- Step 2: Recreate with proper constraints
ALTER TABLE recurring_templates
ADD COLUMN urls TEXT[] DEFAULT '{}' NOT NULL;

ALTER TABLE unified_tasks
ADD COLUMN urls TEXT[] DEFAULT '{}' NOT NULL;

-- Step 3: Add constraints to prevent future corruption
ALTER TABLE recurring_templates
ADD CONSTRAINT check_urls_is_array CHECK (urls IS NOT NULL);

ALTER TABLE unified_tasks
ADD CONSTRAINT check_urls_is_array CHECK (urls IS NOT NULL);

-- Step 4: Add comments
COMMENT ON COLUMN recurring_templates.urls IS 'Array of URLs associated with the template (max 5 recommended)';
COMMENT ON COLUMN unified_tasks.urls IS 'Array of URLs associated with the task (inherited from template, max 5 recommended)';