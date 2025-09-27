-- すべての間違った日付のdoneレコードを削除
-- RLSを一時的に無効にして削除
ALTER TABLE done DISABLE ROW LEVEL SECURITY;

-- 9/26以外のすべてのレコードを削除（正しいのは9/26の復旧データのみ）
DELETE FROM done
WHERE completed_at::date != '2025-09-26'
   OR original_due_date != '2025-09-26';

-- 念のため、ジャンプ朝のタイトルを含む10/3のレコードも明示的に削除
DELETE FROM done
WHERE original_title LIKE '%ジャンプ%'
  AND (completed_at::date = '2025-10-03' OR original_due_date = '2025-10-03');

-- RLSを再有効化
ALTER TABLE done ENABLE ROW LEVEL SECURITY;