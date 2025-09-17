# 🔄 TASUKUデータベース統一化計画

## 📅 開始日時
2025年9月18日 - コミット `447f800c2b76b3c1e8107dd6d309c097dba15e74` から開始

## 🎯 目的
複数テーブルに分散したタスク管理を統一テーブルに移行し、統一番号システムを実現する。

---

## 📊 現在のデータベース構造（移行前）

### 既存テーブル
1. **`tasks`** - 通常のタスク
2. **`recurring_tasks`** - 繰り返しタスク
3. **`ideas`** - やることリスト
4. **`sub_tasks`** - サブタスク（買い物リスト等）

### 現在のSupabaseスキーマ
```sql
-- tasks テーブル
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  memo TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at DATE,
  rollover_count INTEGER DEFAULT 0,
  archived BOOLEAN DEFAULT FALSE,
  snoozed_until DATE,
  duration_min INTEGER,
  importance INTEGER CHECK (importance >= 1 AND importance <= 5),
  category TEXT,
  urls TEXT[],
  attachment JSONB
);

-- recurring_tasks テーブル
CREATE TABLE recurring_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  memo TEXT,
  frequency TEXT NOT NULL,
  interval_n INTEGER DEFAULT 1,
  weekdays INTEGER[],
  month_day INTEGER,
  start_date DATE NOT NULL,
  end_date DATE,
  max_occurrences INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  importance INTEGER CHECK (importance >= 1 AND importance <= 5),
  duration_min INTEGER,
  urls TEXT[],
  category TEXT,
  attachment JSONB
);

-- ideas テーブル
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 新設計: 統一テーブル構造

### `unified_tasks` テーブル
```sql
CREATE TABLE unified_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),

  -- 基本情報
  title TEXT NOT NULL,
  memo TEXT,

  -- 統一順序システム（核心機能）
  order_index INTEGER NOT NULL DEFAULT 0,

  -- タスクタイプ分類
  task_type TEXT NOT NULL CHECK (task_type IN ('NORMAL', 'RECURRING', 'SHOPPING', 'IDEA')),

  -- 日付関連
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at DATE,
  completed BOOLEAN DEFAULT FALSE,

  -- 繰り返し設定（JSON形式）
  recurring_config JSONB,
  -- 例: {"frequency": "WEEKLY", "interval_n": 1, "weekdays": [1,3,5], "active": true}

  -- 拡張フィールド
  importance INTEGER CHECK (importance >= 1 AND importance <= 5),
  category TEXT,
  urls TEXT[],
  attachment JSONB,

  -- その他既存フィールド
  rollover_count INTEGER DEFAULT 0,
  archived BOOLEAN DEFAULT FALSE,
  snoozed_until DATE,
  duration_min INTEGER,

  -- インデックス用
  UNIQUE(user_id, order_index)
);

-- パフォーマンス用インデックス
CREATE INDEX idx_unified_tasks_user_type ON unified_tasks(user_id, task_type);
CREATE INDEX idx_unified_tasks_due_date ON unified_tasks(due_date) WHERE completed = FALSE;
CREATE INDEX idx_unified_tasks_order ON unified_tasks(user_id, order_index);
```

---

## 📋 段階的移行計画

### Phase 1: 新テーブル作成と並行運用
- [x] 新テーブル`unified_tasks`作成
- [ ] 既存データの新テーブルへのコピー
- [ ] 新テーブル用のCRUD操作実装
- [ ] 既存機能の動作確認

### Phase 2: 新機能実装
- [ ] 統一番号システム実装
- [ ] 手動順序変更機能
- [ ] ドラッグ&ドロップ統合

### Phase 3: 段階的切り替え
- [ ] 今日のタスク → 新テーブル
- [ ] 期日切れタスク → 新テーブル
- [ ] 買い物タスク → 新テーブル
- [ ] 未来のタスク → 新テーブル

### Phase 4: 完全移行
- [ ] 全機能の新テーブル対応確認
- [ ] 旧テーブルのバックアップ
- [ ] 旧テーブル削除

---

## 🔧 実装方針

### データベース操作
```typescript
// 新しいunified_tasksサービス
class UnifiedTaskService {
  // 全タスク取得（順序付き）
  async getAllTasks(userId: string): Promise<UnifiedTask[]> {
    return await supabase
      .from('unified_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true })
  }

  // タスクタイプ別取得
  async getTasksByType(userId: string, taskType: TaskType): Promise<UnifiedTask[]> {
    return await supabase
      .from('unified_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('task_type', taskType)
      .order('order_index', { ascending: true })
  }

  // 順序変更
  async updateTaskOrder(taskId: string, newOrderIndex: number): Promise<void> {
    await supabase
      .from('unified_tasks')
      .update({ order_index: newOrderIndex, updated_at: new Date().toISOString() })
      .eq('id', taskId)
  }
}
```

### フロントエンド統合
```typescript
// 統一タスクフック
export function useUnifiedTasks() {
  const [tasks, setTasks] = useState<UnifiedTask[]>([])

  // タスクタイプ別フィルタリング
  const todayTasks = useMemo(() =>
    tasks.filter(task => task.task_type === 'NORMAL' && isToday(task.due_date))
  , [tasks])

  const shoppingTasks = useMemo(() =>
    tasks.filter(task => task.task_type === 'SHOPPING')
  , [tasks])

  return {
    allTasks: tasks,
    todayTasks,
    shoppingTasks,
    updateOrder: (taskId: string, newOrder: number) => {
      // 順序更新ロジック
    }
  }
}
```

---

## 🔄 ロールバック手順

このポイント（`447f800`）に戻る場合：

```bash
# 1. 現在の作業をバックアップ
git add .
git commit -m "WIP: 統一データベース移行作業中"
git push origin HEAD

# 2. 安全なポイントに戻る
git checkout 447f800c2b76b3c1e8107dd6d309c097dba15e74

# 3. Supabaseの変更をロールバック
# - unified_tasksテーブルを削除
# - 既存テーブルは影響なし（並行運用のため）
```

### Supabaseロールバック用SQL
```sql
-- 新テーブルの削除（既存テーブルには影響なし）
DROP TABLE IF EXISTS unified_tasks;
DROP INDEX IF EXISTS idx_unified_tasks_user_type;
DROP INDEX IF EXISTS idx_unified_tasks_due_date;
DROP INDEX IF EXISTS idx_unified_tasks_order;
```

---

## 📊 メリット・デメリット

### ✅ メリット
1. **統一順序管理** - 全タスクの順序を一元管理
2. **シンプルなクエリ** - 1つのテーブルから全データ
3. **高いパフォーマンス** - 適切なインデックス設計
4. **将来拡張性** - 新しいタスクタイプを簡単追加
5. **安全な移行** - 既存機能に影響なし

### ⚠️ デメリット
1. **初期実装コスト** - 新しいCRUD操作の実装
2. **一時的な複雑性** - 並行運用期間の管理
3. **データ同期** - 移行期間中の整合性管理

---

## 🎯 成功判定基準

1. **機能維持** - 既存の全機能が正常動作
2. **性能維持** - レスポンス時間の劣化なし
3. **データ整合性** - データロスなし
4. **ユーザー体験** - 操作性の向上
5. **開発効率** - 新機能実装の高速化

---

## 📝 注意事項

1. **バックアップ必須** - 各段階でデータベースバックアップ
2. **段階的実装** - 一度に全変更せず、段階的に移行
3. **テスト重視** - 各段階でのテスト実施
4. **ユーザー通知** - 必要に応じてメンテナンス通知

---

**このドキュメントは移行作業の指針として、常に最新状態を維持する**