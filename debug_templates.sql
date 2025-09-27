-- 現在のテンプレートデータを確認
SELECT
  id,
  title,
  category,
  pattern,
  weekdays,
  active,
  created_at
FROM recurring_templates
ORDER BY created_at DESC;

-- 関連する統一タスクデータも確認
SELECT
  id,
  title,
  category,
  task_type,
  recurring_pattern,
  recurring_weekdays,
  recurring_template_id
FROM unified_tasks
WHERE task_type = 'RECURRING'
ORDER BY created_at DESC
LIMIT 5;