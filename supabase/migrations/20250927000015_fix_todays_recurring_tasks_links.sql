-- 今日の繰り返しタスクでリンクされていないものを強制修正
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
AND due_date >= CURRENT_DATE - INTERVAL '7 days'  -- 過去1週間のタスク
AND EXISTS (
    SELECT 1
    FROM recurring_templates rt
    WHERE rt.user_id::text = unified_tasks.user_id::text
    AND rt.title = unified_tasks.title
    AND rt.pattern = unified_tasks.recurring_pattern
    AND COALESCE(rt.category, '') = COALESCE(unified_tasks.category, '')
);

-- リンクされたタスクの数を確認
SELECT
    COUNT(*) as total_recurring_tasks,
    COUNT(recurring_template_id) as linked_tasks,
    COUNT(*) - COUNT(recurring_template_id) as unlinked_tasks
FROM unified_tasks
WHERE task_type = 'RECURRING'
AND due_date >= CURRENT_DATE - INTERVAL '7 days';