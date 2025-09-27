-- unified_tasksテーブルとdoneテーブルから不要なデータを削除
-- RLSを一時的に無効にして削除
ALTER TABLE done DISABLE ROW LEVEL SECURITY;
ALTER TABLE unified_tasks DISABLE ROW LEVEL SECURITY;

-- doneテーブルから10/3のレコードを完全に削除
DELETE FROM done
WHERE completed_at::date = '2025-10-03'
   OR original_due_date = '2025-10-03'
   OR original_title = 'ジャンプ朝';

-- unified_tasksテーブルから10/3のジャンプ朝を削除
DELETE FROM unified_tasks
WHERE due_date = '2025-10-03'
  AND title = 'ジャンプ朝';

-- RLSを再有効化
ALTER TABLE done ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_tasks ENABLE ROW LEVEL SECURITY;