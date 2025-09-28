-- Fix URLs field data format issues in both tables
-- Convert problematic string/text values to proper empty arrays

-- Fix recurring_templates table
UPDATE recurring_templates
SET urls = '{}'::TEXT[]
WHERE urls IS NOT NULL
  AND (
    -- Handle cases where urls is stored as text but not as proper array
    NOT (urls = '{}'::TEXT[] OR array_length(urls, 1) > 0)
    OR urls::text LIKE '%text%'
    OR urls::text LIKE '%テキスト%'
    OR urls::text = 'null'
    OR urls::text = 'undefined'
  );

-- Ensure all NULL values become empty arrays in recurring_templates
UPDATE recurring_templates
SET urls = '{}'::TEXT[]
WHERE urls IS NULL;

-- Fix unified_tasks table
UPDATE unified_tasks
SET urls = '{}'::TEXT[]
WHERE urls IS NOT NULL
  AND (
    -- Handle cases where urls is stored as text but not as proper array
    NOT (urls = '{}'::TEXT[] OR array_length(urls, 1) > 0)
    OR urls::text LIKE '%text%'
    OR urls::text LIKE '%テキスト%'
    OR urls::text = 'null'
    OR urls::text = 'undefined'
  );

-- Ensure all NULL values become empty arrays in unified_tasks
UPDATE unified_tasks
SET urls = '{}'::TEXT[]
WHERE urls IS NULL;