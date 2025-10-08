-- 𝕏ポストテンプレートのURLsを修復
-- まず現在の状態を確認
SELECT
  id,
  title,
  urls,
  CASE
    WHEN urls IS NULL THEN 'NULL'
    WHEN urls::text = '[]' THEN 'EMPTY_ARRAY'
    WHEN urls::text = '{}' THEN 'EMPTY_OBJECT'
    ELSE 'HAS_DATA'
  END as urls_status
FROM recurring_templates
WHERE title LIKE '%ポスト%'
ORDER BY created_at DESC
LIMIT 5;

-- 𝕏ポストテンプレートのURLsを正しい値に更新
-- ⚠️ 実行前に必ずテンプレートIDを確認してください
UPDATE recurring_templates
SET
  urls = '[
    "list:1769487534948794610 -filter:nativeretweets -filter:retweets -filter:quote -filter:replies",
    "list:1778669827957358973 -filter:nativeretweets -filter:retweets -filter:quote -filter:replies"
  ]'::jsonb,
  updated_at = NOW()
WHERE title = '𝕏ポスト'
RETURNING id, title, urls;
