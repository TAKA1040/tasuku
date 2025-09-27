-- 10/3 (2025-10-03) の間違ったdoneレコードを削除
-- RLSを一時的に無効にして削除
ALTER TABLE done DISABLE ROW LEVEL SECURITY;

-- 10/3 (2025-10-03) のレコードを削除
DELETE FROM done
WHERE completed_at::date = '2025-10-03'
   OR original_due_date = '2025-10-03';

-- RLSを再有効化
ALTER TABLE done ENABLE ROW LEVEL SECURITY;