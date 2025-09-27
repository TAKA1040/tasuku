-- 今日の繰り返しタスクとテンプレートの関連をチェック
SELECT
  ut.id,
  ut.title,
  ut.category,
  ut.task_type,
  ut.recurring_template_id,
  rt.id as template_id,
  rt.category as template_category,
  rt.pattern
FROM unified_tasks ut
LEFT JOIN recurring_templates rt ON rt.id::text = ut.recurring_template_id
WHERE ut.task_type = 'RECURRING'
  AND ut.due_date = CURRENT_DATE
ORDER BY ut.title;