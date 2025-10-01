-- 買い物リスト形式のメモをクリーンアップ
-- 【買い物リスト】セクションをmemoから削除

-- 対象データを確認（実行前に確認）
SELECT
  id,
  title,
  category,
  memo,
  LENGTH(memo) as memo_length
FROM unified_tasks
WHERE memo LIKE '%【買い物リスト】%'
ORDER BY created_at DESC;

-- メモから買い物リストを削除（実行）
-- PostgreSQLのregexp_replaceを使用
UPDATE unified_tasks
SET memo = TRIM(
  regexp_replace(
    memo,
    '【買い物リスト】\n(•[^\n]*\n?)+',
    '',
    'g'
  )
),
updated_at = NOW()
WHERE memo LIKE '%【買い物リスト】%';

-- 結果確認
SELECT
  id,
  title,
  category,
  memo,
  LENGTH(memo) as memo_length,
  updated_at
FROM unified_tasks
WHERE category = '買い物'
ORDER BY updated_at DESC
LIMIT 10;

-- 統計情報
SELECT
  COUNT(*) as total_shopping_tasks,
  COUNT(CASE WHEN memo IS NOT NULL AND memo != '' THEN 1 END) as tasks_with_memo,
  COUNT(CASE WHEN memo LIKE '%【買い物リスト】%' THEN 1 END) as tasks_with_legacy_format
FROM unified_tasks
WHERE category = '買い物';