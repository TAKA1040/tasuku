-- 昨日（2025-09-26）の達成記録を復旧
-- 今日のタスクが昨日も存在していたと仮定して、昨日の完了履歴を作成

-- RLSを一時的に無効にして挿入
ALTER TABLE done DISABLE ROW LEVEL SECURITY;

-- 昨日の達成記録を挿入
INSERT INTO done (
  original_task_id,
  original_title,
  original_memo,
  original_category,
  original_importance,
  original_due_date,
  original_recurring_pattern,
  original_display_number,
  completed_at,
  user_id
)
SELECT
  id as original_task_id,
  title as original_title,
  memo as original_memo,
  category as original_category,
  importance as original_importance,
  '2025-09-26'::date as original_due_date,
  recurring_pattern as original_recurring_pattern,
  display_number as original_display_number,
  '2025-09-26T23:59:59.000Z'::timestamptz as completed_at,
  user_id
FROM unified_tasks
WHERE due_date = '2025-09-27'
  AND completed = false
  AND id NOT IN (
    SELECT original_task_id
    FROM done
    WHERE completed_at::date = '2025-09-26'
      AND original_task_id IS NOT NULL
  );

-- RLSを再有効化
ALTER TABLE done ENABLE ROW LEVEL SECURITY;