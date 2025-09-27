-- 既存の繰り返しタスクのrecurring_weekdaysをテンプレートから同期
UPDATE unified_tasks
SET recurring_weekdays = (
    SELECT rt.weekdays
    FROM recurring_templates rt
    WHERE rt.id::text = unified_tasks.recurring_template_id
)
WHERE task_type = 'RECURRING'
AND recurring_template_id IS NOT NULL
AND (recurring_weekdays IS NULL OR recurring_weekdays = '{}')
AND EXISTS (
    SELECT 1
    FROM recurring_templates rt
    WHERE rt.id::text = unified_tasks.recurring_template_id
    AND rt.weekdays IS NOT NULL
    AND rt.weekdays != '{}'
);