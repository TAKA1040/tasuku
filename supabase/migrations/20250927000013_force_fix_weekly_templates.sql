-- 強制的にすべてのWEEKLYテンプレートにweekdaysを設定
UPDATE recurring_templates
SET weekdays = ARRAY[1,2,3,4,5]::integer[]
WHERE pattern = 'WEEKLY' AND (weekdays IS NULL OR weekdays = '{}' OR array_length(weekdays, 1) = 0);