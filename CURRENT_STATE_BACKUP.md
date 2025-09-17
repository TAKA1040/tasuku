# 📸 現在の状態バックアップ - 統一データベース移行開始点

## 📅 スナップショット情報
- **日時**: 2025年9月18日
- **コミット**: `447f800c2b76b3c1e8107dd6d309c097dba15e74`
- **ブランチ**: `main` (安定状態)
- **目的**: 統一データベース設計への移行開始点

---

## 🗂️ 現在のファイル構成

### 主要ファイル（正常動作中）
- `src/app/today/page.tsx` - メインページ（`TaskTable`使用）
- `src/components/TaskTable.tsx` - 今日のタスク表示
- `src/components/UpcomingPreview.tsx` - 予定タスク表示
- `src/components/ShoppingTasksSection.tsx` - 買い物タスク
- `src/components/IdeaBox.tsx` - やることリスト
- `src/hooks/useTasks.ts` - 通常タスク管理
- `src/hooks/useRecurringTasks.ts` - 繰り返しタスク管理
- `src/hooks/useIdeas.ts` - アイデア管理

### データベース関連
- `src/lib/db/supabase-database.ts` - 既存DB操作（正常動作）
- `src/lib/db/schema.ts` - 現在のスキーマ定義
- `supabase/migrations/` - 既存マイグレーション

---

## 🏗️ 現在のアーキテクチャ

### データフロー
```
Supabase (3テーブル)
├── tasks (通常タスク)
├── recurring_tasks (繰り返し)
└── ideas (やることリスト)
    ↓
Custom Hooks (3つ)
├── useTasks()
├── useRecurringTasks()
└── useIdeas()
    ↓
Components (4セクション)
├── TaskTable (今日・期日切れ)
├── UpcomingPreview (予定)
├── ShoppingTasksSection (買い物)
└── IdeaBox (アイデア)
```

### 現在の動作確認済み機能
- ✅ タスク作成・編集・削除
- ✅ 繰り返しタスク管理
- ✅ 今日・期日切れ・予定の表示分離
- ✅ 買い物リスト機能
- ✅ やることリスト
- ✅ ダークモード対応
- ✅ 認証機能
- ✅ データベース同期

---

## 📊 現在のSupabaseテーブル構造

### 実際のテーブル状態（確認済み）
```sql
-- 1. tasks テーブル
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks';

-- 2. recurring_tasks テーブル
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'recurring_tasks';

-- 3. ideas テーブル
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ideas';
```

### RLS (Row Level Security) 設定
- 各テーブルでuser_id基準のRLS有効
- 認証ユーザーのみ自分のデータアクセス可能

---

## 🎯 移行前の問題点（解決予定）

### 1. 順序管理の欠如
- ドラッグ&ドロップ機能が未完成
- タスクの表示順序をユーザーが制御できない
- 複数テーブルにまたがる順序管理が困難

### 2. データ分散による複雑性
- 3つのhooksでの状態管理
- セクション間でのタスク移動が困難
- 統一的な操作インターフェースの欠如

### 3. 将来拡張の困難性
- 新しいタスクタイプ追加のコスト
- フィルタリングロジックの分散
- パフォーマンス最適化の限界

---

## 🚨 復元手順（緊急時）

### 1. Gitによる復元
```bash
# 現在の作業をバックアップ
git add . && git commit -m "WIP: 統一DB移行中"

# この状態に戻る
git checkout 447f800c2b76b3c1e8107dd6d309c097dba15e74

# または新しいブランチで作業継続
git checkout -b hotfix/revert-to-stable
```

### 2. Supabaseの復元
```sql
-- 新しく作成されたテーブルがあれば削除
DROP TABLE IF EXISTS unified_tasks CASCADE;

-- 既存テーブルは変更しないので、そのまま動作する
-- (tasks, recurring_tasks, ideas テーブルは無変更)
```

### 3. npm依存関係の復元
```bash
# 現在のpackage.json状態
npm install

# または完全なクリーンインストール
rm -rf node_modules package-lock.json
npm install
```

---

## 🔧 現在の開発環境

### 必要なツール
- Node.js (バージョン確認: `node --version`)
- npm (バージョン確認: `npm --version`)
- Supabase CLI (バージョン確認: `supabase --version`)

### 環境変数
```bash
# .env.local (ローカル開発用)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 開発サーバー起動
```bash
npm run dev  # http://localhost:3000
```

---

## 📋 テスト済みユーザーフロー

### 基本操作（正常動作確認済み）
1. **ログイン** → 認証画面表示
2. **タスク作成** → 通常・繰り返し両対応
3. **タスク表示** → 今日・期日切れ・予定で分離表示
4. **タスク完了** → チェックボックスで完了切り替え
5. **買い物リスト** → カテゴリ別表示とサブタスク
6. **アイデア管理** → やることリストの追加・削除

### 既知の制限事項
- ドラッグ&ドロップは未実装
- タスクの順序変更は手動不可
- セクション間のタスク移動は限定的

---

## 🎯 移行後の期待効果

### 実現予定機能
1. **統一番号システム** - 全タスクに一意の順序番号
2. **ドラッグ&ドロップ** - 直感的な順序変更
3. **セクション間移動** - タスクタイプの変更
4. **高速フィルタリング** - 単一テーブルからの効率的取得
5. **新機能追加** - 将来のタスクタイプ拡張

### パフォーマンス向上
- 単一クエリでの全データ取得
- 適切なインデックス設計
- フロントエンドの状態管理簡素化

---

**このバックアップファイルにより、いつでも安全にこの状態に復元可能**