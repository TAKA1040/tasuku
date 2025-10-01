-- Fix URLs field data type issues
-- Convert string values to proper array format

-- Step 1: Update all text-type URLs to empty arrays
UPDATE recurring_templates
SET urls = '{}'::TEXT[]
WHERE urls IS NOT NULL
  AND NOT (urls = '{}'::TEXT[] OR array_length(urls, 1) > 0);

-- Step 2: Reset any problematic string data to empty arrays
UPDATE recurring_templates
SET urls = '{}'::TEXT[]
WHERE urls::text LIKE '%text%' OR urls::text LIKE '%テキスト%';

-- Step 3: Ensure all NULL values become empty arrays
UPDATE recurring_templates
SET urls = '{}'::TEXT[]
WHERE urls IS NULL;

-- Step 4: Same fixes for unified_tasks table
UPDATE unified_tasks
SET urls = '{}'::TEXT[]
WHERE urls IS NOT NULL
  AND NOT (urls = '{}'::TEXT[] OR array_length(urls, 1) > 0);

UPDATE unified_tasks
SET urls = '{}'::TEXT[]
WHERE urls::text LIKE '%text%' OR urls::text LIKE '%テキスト%';

UPDATE unified_tasks
SET urls = '{}'::TEXT[]
WHERE urls IS NULL;