# 🚀 新システムへの移行ガイド

## 📋 移行概要

レガシーテーブル（`tasks`, `recurring_tasks`, `recurring_logs`）から新しい統一システム（`unified_tasks` + `done`）への完全移行。

### ✅ 移行完了項目

1. **データモデル統合**: `unified_tasks`テーブルで全タスクタイプを統合管理
2. **完了記録統合**: `done`テーブルで全タスクの完了記録を統一
3. **ストリーク計算**: `CompletionTracker`でdoneテーブルベースの機能実現
4. **新API実装**: `unified_tasks`専用のサービス層とフック作成

---

## 🔄 マイグレーション手順

### Phase 1: データ移行

```sql
-- 1. recurring_logsからdoneテーブルへデータ移行
-- ファイル: 20250930000001_migrate_recurring_logs_to_done.sql
```

### Phase 2: レガシーテーブル削除

```sql
-- 2. 不要になったテーブルをクリーンアップ
-- ファイル: 20250930000002_drop_legacy_tables.sql
```

### マイグレーション実行

```bash
# Dockerが起動していることを確認
docker ps

# Supabaseローカル環境でマイグレーション実行
supabase db reset

# または個別実行
supabase db push
```

---

## 🆕 新システムのAPI

### 1. CompletionTracker (完了記録管理)

```typescript
import { CompletionTracker } from '@/lib/services/completion-tracker'

// 完了記録
await CompletionTracker.recordCompletion(task, '2024-09-30')

// ストリーク計算
const streak = await CompletionTracker.calculateStreak(taskId)

// 統計取得
const stats = await CompletionTracker.getRecurringStats(taskId)
```

### 2. useCompletionTracker (Reactフック)

```typescript
import { useCompletionTracker } from '@/hooks/useCompletionTracker'

const tracker = useCompletionTracker(isDbInitialized, recurringTaskIds)

// 完了操作
await tracker.recordCompletion(task)
await tracker.removeCompletion(taskId)

// 状態確認
const isCompleted = tracker.isCompletedToday(taskId)
const streak = tracker.getStreak(taskId)
```

### 3. useUnifiedRecurringTasks (統合繰り返しタスク)

```typescript
import { useUnifiedRecurringTasks } from '@/hooks/useUnifiedRecurringTasks'

const {
  recurringTasks,
  todayRecurringTasks,
  completeRecurringTask,
  uncompleteRecurringTask
} = useUnifiedRecurringTasks(isDbInitialized)
```

---

## 🔄 コード移行ガイド

### レガシーフックの置き換え

```typescript
// 🔴 OLD: useRecurringTasks + useRecurringLogs
import { useRecurringTasks } from '@/hooks/useRecurringTasks'
import { useRecurringLogs } from '@/hooks/useRecurringLogs'

const recurringTasks = useRecurringTasks(isDbInitialized)
const recurringLogs = useRecurringLogs(isDbInitialized)

// 🟢 NEW: useUnifiedRecurringTasks
import { useUnifiedRecurringTasks } from '@/hooks/useUnifiedRecurringTasks'

const recurringTasks = useUnifiedRecurringTasks(isDbInitialized)
```

### 完了操作の移行

```typescript
// 🔴 OLD: recurring_logs操作
await recurringLogs.addLog(taskId, date)
await recurringLogs.removeLog(taskId, date)
const streak = recurringLogs.getCurrentStreak(taskId)

// 🟢 NEW: CompletionTracker操作
await recurringTasks.completeRecurringTask(taskId, date)
await recurringTasks.uncompleteRecurringTask(taskId, date)
const streak = recurringTasks.recurringTasks.find(rt => rt.task.id === taskId)?.currentStreak || 0
```

### 統計データの取得

```typescript
// 🔴 OLD: 複数のデータソースから集計
const taskCount = tasks.length
const completedCount = completedTasks.length
const recurringCompletedCount = completedRecurringTasks.length

// 🟢 NEW: 統一されたデータから取得
const allTasks = unifiedTasks.tasks
const completedToday = allTasks.filter(task =>
  unifiedTasks.completedTasks.some(ct => ct.id === task.id)
).length
```

---

## 🗂️ 削除されたファイル・テーブル

### データベーステーブル
- ❌ `tasks` - `unified_tasks`に統合
- ❌ `recurring_tasks` - `unified_tasks`に統合
- ❌ `recurring_logs` - `done`テーブルに統合

### 削除可能なファイル（段階的）
```
src/hooks/useRecurringTasks.ts     -> useUnifiedRecurringTasks.ts
src/hooks/useRecurringLogs.ts      -> useCompletionTracker.ts
src/hooks/useTasks.ts              -> useUnifiedTasks.ts
src/lib/db/supabase-database.ts    -> 関連部分削除可能
```

---

## ⚠️ 注意事項

### 1. 段階的移行推奨
- 新旧システムの並行運用期間を設ける
- レガシーフックに互換レイヤーを提供済み

### 2. データ整合性確認
```bash
# 移行後の確認SQL
SELECT
  'unified_tasks' as table_name, COUNT(*) as count
FROM unified_tasks
UNION ALL
SELECT
  'done' as table_name, COUNT(*) as count
FROM done;
```

### 3. パフォーマンス監視
- `done`テーブルのインデックス最適化済み
- ストリーク計算の最大遡及期間: 365日

---

## ✅ 検証チェックリスト

### 機能検証
- [ ] 通常タスクの作成・編集・削除
- [ ] 繰り返しタスクの作成・編集・削除
- [ ] タスク完了・未完了の切り替え
- [ ] ストリーク計算の正確性
- [ ] 統計データの整合性

### データ整合性
- [ ] 移行前後のタスク数が一致
- [ ] 完了記録が正しく移行
- [ ] ユーザーデータの分離確認

### パフォーマンス
- [ ] ページ読み込み速度
- [ ] 大量データでのストリーク計算
- [ ] データベースクエリ最適化

---

## 🎉 移行完了後の利点

1. **シンプルなデータモデル**: 統一テーブルで管理が容易
2. **一貫性のある完了記録**: 全タスクタイプで共通のトラッキング
3. **高性能ストリーク計算**: 最適化されたクエリとインデックス
4. **保守性向上**: レガシーコードの削除により、バグ修正が容易
5. **スケーラビリティ**: 将来の機能拡張が容易

移行に関する質問やトラブルシューティングは、このドキュメントを参照してください。