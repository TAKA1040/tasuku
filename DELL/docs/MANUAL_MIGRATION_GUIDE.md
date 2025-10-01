# 🚀 手動マイグレーション実行ガイド

## ⚠️ 実行前の重要な確認事項

### 🔒 安全性チェック
1. **バックアップ確認**: データベースのバックアップが取られていることを確認済み ✅
2. **テスト環境**: 可能であれば開発環境で事前テスト推奨
3. **実行時間**: アクセスの少ない時間帯での実行推奨

---

## 📋 Step 1: データ移行（Phase 1）

### 🎯 目的
`recurring_logs`のデータを`done`テーブルに移行し、重複制約を追加

### 📄 実行SQL
```sql
-- Step 1-1: doneテーブルに重複防止制約を追加
ALTER TABLE done ADD CONSTRAINT unique_task_completion_date
UNIQUE (original_task_id, completion_date);

-- Step 1-2: 移行前の統計を記録
DO $$
DECLARE
  recurring_logs_count INTEGER;
  done_count_before INTEGER;
BEGIN
  SELECT COUNT(*) INTO recurring_logs_count FROM recurring_logs;
  SELECT COUNT(*) INTO done_count_before FROM done;

  RAISE NOTICE 'Migration Phase 1 - Before:';
  RAISE NOTICE '- recurring_logs records: %', recurring_logs_count;
  RAISE NOTICE '- done table records: %', done_count_before;
END $$;

-- Step 1-3: データ移行実行
INSERT INTO done (
  original_task_id,
  task_title,
  completion_date,
  completion_time,
  user_id,
  created_at,
  updated_at
)
SELECT
  rl.recurring_id as original_task_id,
  rt.title as task_title,
  rl.date as completion_date,
  rl.logged_at as completion_time,
  rl.user_id,
  rl.logged_at as created_at,
  rl.logged_at as updated_at
FROM recurring_logs rl
JOIN recurring_tasks rt ON rl.recurring_id = rt.id
ON CONFLICT (original_task_id, completion_date) DO NOTHING;

-- Step 1-4: インデックス最適化
CREATE INDEX IF NOT EXISTS idx_done_task_date_desc
ON done (original_task_id, completion_date DESC);

CREATE INDEX IF NOT EXISTS idx_done_completion_date_range
ON done (completion_date, original_task_id)
WHERE completion_date >= CURRENT_DATE - INTERVAL '365 days';

-- Step 1-5: 移行後の統計を確認
DO $$
DECLARE
  done_count_after INTEGER;
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO done_count_after FROM done;
  SELECT COUNT(*) INTO migrated_count
  FROM done d
  WHERE EXISTS (
    SELECT 1 FROM recurring_logs rl
    WHERE rl.recurring_id = d.original_task_id
    AND rl.date = d.completion_date
  );

  RAISE NOTICE 'Migration Phase 1 - After:';
  RAISE NOTICE '- done table total records: %', done_count_after;
  RAISE NOTICE '- migrated records: %', migrated_count;
  RAISE NOTICE 'Phase 1 completed successfully!';
END $$;
```

### ✅ Step 1 完了確認
- [ ] 制約が正常に追加された
- [ ] データが`done`テーブルに移行された
- [ ] インデックスが作成された
- [ ] ログに移行統計が表示された

---

## 📋 Step 2: アプリケーションテスト

### 🎯 目的
データ移行後にアプリケーションが正常動作することを確認

### 🧪 テスト項目
```bash
# アプリケーションを起動
npm run dev

# ブラウザで以下をテスト:
# 1. http://localhost:3000/today - 今日のタスク表示
# 2. タスクの完了・未完了切り替え
# 3. 繰り返しタスクの動作確認
# 4. 統計ページの表示確認
```

### ✅ Step 2 完了確認
- [ ] タスク一覧が正常に表示される
- [ ] タスクの完了・未完了が正常に動作する
- [ ] エラーが発生していない
- [ ] 繰り返しタスクが正常に動作する

---

## 📋 Step 3: レガシーテーブル削除（Phase 2）

### ⚠️ 重要な注意事項
**Step 1とStep 2が正常に完了し、アプリが正常動作することを確認してから実行してください。**

### 📄 実行SQL
```sql
-- 削除前の最終確認
DO $$
DECLARE
  tasks_count INTEGER;
  recurring_tasks_count INTEGER;
  recurring_logs_count INTEGER;
  unified_tasks_count INTEGER;
  done_count INTEGER;
BEGIN
  -- 統計情報を記録
  SELECT COUNT(*) INTO tasks_count FROM tasks;
  SELECT COUNT(*) INTO recurring_tasks_count FROM recurring_tasks;
  SELECT COUNT(*) INTO recurring_logs_count FROM recurring_logs;
  SELECT COUNT(*) INTO unified_tasks_count FROM unified_tasks;
  SELECT COUNT(*) INTO done_count FROM done;

  RAISE NOTICE 'Legacy Tables Cleanup - Before Deletion:';
  RAISE NOTICE '- tasks: % records', tasks_count;
  RAISE NOTICE '- recurring_tasks: % records', recurring_tasks_count;
  RAISE NOTICE '- recurring_logs: % records', recurring_logs_count;
  RAISE NOTICE '- unified_tasks: % records', unified_tasks_count;
  RAISE NOTICE '- done: % records', done_count;

  -- 安全性チェック
  IF unified_tasks_count = 0 THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: unified_tasks table is empty';
  END IF;

  IF done_count = 0 AND recurring_logs_count > 0 THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: recurring_logs data not migrated';
  END IF;

  RAISE NOTICE 'Safety checks passed. Ready for cleanup...';
END $$;

-- レガシーテーブル削除実行
-- recurring_logsテーブルを削除
DROP INDEX IF EXISTS idx_recurring_logs_date;
DROP INDEX IF EXISTS idx_recurring_logs_recurring_id;
DROP TABLE IF EXISTS recurring_logs;

-- recurring_tasksテーブル関連を削除
DROP VIEW IF EXISTS active_recurring_tasks;
DROP INDEX IF EXISTS idx_recurring_tasks_user_active;
DROP INDEX IF EXISTS idx_recurring_tasks_frequency;
DROP TABLE IF EXISTS recurring_tasks;

-- tasksテーブル関連を削除
DROP VIEW IF EXISTS todays_tasks;
DROP VIEW IF EXISTS task_overview;
DROP INDEX IF EXISTS idx_tasks_user_due_date;
DROP INDEX IF EXISTS idx_tasks_user_completed;
DROP INDEX IF EXISTS idx_tasks_user_today;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TABLE IF EXISTS tasks;

-- 関連する関数があれば削除
DROP FUNCTION IF EXISTS create_task_from_recurring(UUID, DATE);

-- テーブルにコメントを追加
COMMENT ON TABLE unified_tasks IS
'Unified tasks table - consolidates former tasks, recurring_tasks, and ideas.
Legacy tables removed on manual migration.';

COMMENT ON TABLE done IS
'Task completion records - replaces recurring_logs and extends to all task types.
Enhanced with recurring task support and streak calculation.';

-- 削除後の確認
DO $$
DECLARE
  unified_tasks_final INTEGER;
  done_final INTEGER;
BEGIN
  SELECT COUNT(*) INTO unified_tasks_final FROM unified_tasks;
  SELECT COUNT(*) INTO done_final FROM done;

  RAISE NOTICE 'Legacy Tables Cleanup - Completed:';
  RAISE NOTICE '- unified_tasks: % records (active)', unified_tasks_final;
  RAISE NOTICE '- done: % records (active)', done_final;
  RAISE NOTICE '- Legacy tables: REMOVED';
  RAISE NOTICE 'Database migration completed successfully!';
END $$;
```

### ✅ Step 3 完了確認
- [ ] レガシーテーブルが削除された
- [ ] エラーが発生していない
- [ ] アプリケーションが正常動作する
- [ ] 統計ログが正常に出力された

---

## 🎉 移行完了後の確認

### 📊 最終動作テスト
1. **タスク管理機能**
   - [ ] タスク作成・編集・削除
   - [ ] 繰り返しタスクの設定
   - [ ] タスク完了・未完了の切り替え

2. **統計機能**
   - [ ] 今日の完了数表示
   - [ ] ストリーク表示
   - [ ] 期間別統計

3. **データ整合性**
   - [ ] 過去の完了記録が保持されている
   - [ ] 繰り返しタスクの履歴が正しい

### 🗑️ 削除可能なファイル（オプション）
移行完了後、以下のレガシーファイルを削除できます：
```
src/hooks/useRecurringTasks.ts      # → useUnifiedRecurringTasks.ts
src/hooks/useRecurringLogs.ts       # → useCompletionTracker.ts
src/hooks/useTasks.ts               # → useUnifiedTasks.ts
```

---

## 🚨 トラブルシューティング

### エラーが発生した場合
1. **制約エラー**: 重複データがある可能性 → 手動でクリーンアップ
2. **テーブル不存在エラー**: 既に削除済みの可能性 → 無視してOK
3. **アプリエラー**: 新システムの不具合 → GitHub Issueで報告

### ロールバック方法
1. **データベースバックアップからリストア**
2. **アプリケーションを旧バージョンに戻す**

---

**移行は慎重に、一段階ずつ実行してください。何か問題があれば、すぐに停止して状況を確認してください。**