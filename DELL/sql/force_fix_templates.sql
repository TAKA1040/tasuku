-- 既存のWEEKLYテンプレートすべてに強制的にweekdaysを設定
UPDATE recurring_templates
SET weekdays = CASE
  WHEN title LIKE '%月%' AND title LIKE '%水%' AND title LIKE '%金%' THEN ARRAY[1,3,5]::integer[]
  WHEN title LIKE '%土%' AND title LIKE '%日%' THEN ARRAY[6,7]::integer[]
  WHEN title LIKE '%毎日%' OR title LIKE '%daily%' THEN ARRAY[1,2,3,4,5,6,7]::integer[]
  ELSE ARRAY[1,2,3,4,5]::integer[] -- デフォルト：平日
END
WHERE pattern = 'WEEKLY' AND (weekdays IS NULL OR array_length(weekdays, 1) = 0);

-- すべてのWEEKLYテンプレートのweekdaysをチェック用に表示
SELECT id, title, pattern, weekdays, category
FROM recurring_templates
WHERE pattern = 'WEEKLY';