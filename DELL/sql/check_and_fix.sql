-- 現在のWEEKLYテンプレートをチェック
SELECT id, title, pattern, weekdays, category FROM recurring_templates WHERE pattern = 'WEEKLY';

-- WEEKLYテンプレートを強制修正
UPDATE recurring_templates
SET weekdays = ARRAY[1,2,3,4,5]
WHERE pattern = 'WEEKLY' AND (weekdays IS NULL OR array_length(weekdays, 1) = 0 OR weekdays = '{}');

-- 修正後のデータを確認
SELECT id, title, pattern, weekdays, category FROM recurring_templates WHERE pattern = 'WEEKLY';