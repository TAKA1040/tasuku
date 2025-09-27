-- 既存の繰り返しタスクからテンプレートを作成（簡易版）
-- RLSを一時的に無効にして作業
ALTER TABLE recurring_templates DISABLE ROW LEVEL SECURITY;

-- 既存の繰り返しタスクからテンプレートを作成
INSERT INTO recurring_templates (
  id,
  title,
  memo,
  category,
  importance,
  pattern,
  user_id,
  active,
  created_at,
  updated_at
)
SELECT DISTINCT
  gen_random_uuid() as id,
  title,
  memo,
  category,
  importance,
  recurring_pattern as pattern,
  user_id,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
FROM unified_tasks
WHERE recurring_pattern = 'DAILY'
  AND task_type = 'RECURRING'
  AND recurring_template_id IS NULL;

-- RLSを再有効化
ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;