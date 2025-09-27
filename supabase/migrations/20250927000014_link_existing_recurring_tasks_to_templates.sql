-- 既存の繰り返しタスクを対応するテンプレートにリンク
UPDATE unified_tasks
SET recurring_template_id = (
    SELECT rt.id::text
    FROM recurring_templates rt
    WHERE rt.user_id::text = unified_tasks.user_id::text
    AND rt.title = unified_tasks.title
    AND rt.pattern = unified_tasks.recurring_pattern
    AND COALESCE(rt.category, '') = COALESCE(unified_tasks.category, '')
    LIMIT 1
)
WHERE task_type = 'RECURRING'
AND recurring_template_id IS NULL
AND EXISTS (
    SELECT 1
    FROM recurring_templates rt
    WHERE rt.user_id::text = unified_tasks.user_id::text
    AND rt.title = unified_tasks.title
    AND rt.pattern = unified_tasks.recurring_pattern
    AND COALESCE(rt.category, '') = COALESCE(unified_tasks.category, '')
);