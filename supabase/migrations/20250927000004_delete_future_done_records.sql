-- 未来の日付（10/6など）の間違ったdoneレコードを削除
-- RLSを一時的に無効にして削除
ALTER TABLE done DISABLE ROW LEVEL SECURITY;

-- 10/6 (2025-10-06) のレコードを削除
DELETE FROM done
WHERE completed_at::date = '2025-10-06'
   OR original_due_date = '2025-10-06';

-- 念のため、今日より未来の日付のレコードも削除
DELETE FROM done
WHERE completed_at::date > CURRENT_DATE
   OR original_due_date > CURRENT_DATE;

-- RLSを再有効化
ALTER TABLE done ENABLE ROW LEVEL SECURITY;