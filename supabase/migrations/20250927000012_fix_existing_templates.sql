-- 既存のテンプレートのweekdaysデータを修正
-- 毎日タスクに[1,2,3,4,5,6,7]を設定（すべての曜日）

UPDATE recurring_templates
SET weekdays = ARRAY[1,2,3,4,5,6,7]
WHERE pattern = 'WEEKLY' AND weekdays IS NULL;

-- 実際のタスクから曜日データを取得して更新
UPDATE recurring_templates
SET weekdays = (
  SELECT recurring_weekdays
  FROM unified_tasks
  WHERE unified_tasks.recurring_template_id = recurring_templates.id
  AND unified_tasks.recurring_weekdays IS NOT NULL
  LIMIT 1
)
WHERE pattern = 'WEEKLY' AND EXISTS (
  SELECT 1 FROM unified_tasks
  WHERE unified_tasks.recurring_template_id = recurring_templates.id
  AND unified_tasks.recurring_weekdays IS NOT NULL
);