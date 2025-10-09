-- 𝕏ポストテンプレートのURLs確認
SELECT
  id,
  title,
  urls,
  CASE
    WHEN urls IS NULL THEN 'NULL'
    WHEN urls::text = '[]' THEN 'EMPTY_ARRAY'
    WHEN urls::text = '{}' THEN 'EMPTY_OBJECT'
    ELSE 'HAS_DATA: ' || urls::text
  END as urls_status,
  active,
  pattern,
  weekdays,
  created_at,
  updated_at
FROM recurring_templates
WHERE title LIKE '%ポスト%' OR title LIKE '%𝕏%' OR title LIKE '%X%'
ORDER BY created_at DESC;
