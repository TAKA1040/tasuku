# 🗄️ Supabase手動SQL実行手順

## 📋 実行する必要があるSQL（順番に実行）

### 1. メインテーブル作成
```sql
CREATE TABLE IF NOT EXISTS public.unified_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 統一番号システム
  display_number TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'NORMAL',

  -- 基本フィールド
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  memo TEXT,
  due_date DATE,
  category TEXT,
  importance INTEGER DEFAULT 1 CHECK (importance >= 1 AND importance <= 5),
  duration_min INTEGER,
  urls TEXT[],

  -- システム管理項目
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at DATE,
  archived BOOLEAN DEFAULT FALSE,
  snoozed_until DATE,
  rollover_count INTEGER DEFAULT 0,

  -- 繰り返しタスク用フィールド
  frequency TEXT,
  active BOOLEAN DEFAULT TRUE,
  interval_n INTEGER DEFAULT 1,
  weekdays INTEGER[],
  month_day INTEGER,
  start_date DATE,
  end_date DATE,

  -- 添付ファイル
  attachment JSONB,

  -- 制約
  UNIQUE(user_id, display_number)
);
```

### 2. インデックス作成
```sql
CREATE INDEX IF NOT EXISTS idx_unified_tasks_display_number ON public.unified_tasks(user_id, display_number);
CREATE INDEX IF NOT EXISTS idx_unified_tasks_type ON public.unified_tasks(user_id, task_type, completed);
CREATE INDEX IF NOT EXISTS idx_unified_tasks_user_due_date ON public.unified_tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_unified_tasks_user_completed ON public.unified_tasks(user_id, completed, updated_at);
```

### 3. RLS設定
```sql
ALTER TABLE public.unified_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "unified_tasks_dev_all" ON public.unified_tasks;
CREATE POLICY "unified_tasks_dev_all" ON public.unified_tasks
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);
```

### 4. トリガー作成
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_unified_tasks_updated_at ON public.unified_tasks;
CREATE TRIGGER update_unified_tasks_updated_at
  BEFORE UPDATE ON public.unified_tasks
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

### 5. 番号生成関数
```sql
CREATE OR REPLACE FUNCTION generate_display_number(
  p_user_id UUID,
  p_task_type TEXT,
  p_date DATE DEFAULT current_date
) RETURNS TEXT AS $$
DECLARE
  type_code TEXT;
  base_number TEXT;
  next_sequence INTEGER;
  new_number TEXT;
BEGIN
  type_code := CASE p_task_type
    WHEN 'NORMAL' THEN '10'
    WHEN 'RECURRING' THEN '12'
    WHEN 'IDEA' THEN '13'
    ELSE '10'
  END;

  base_number := to_char(p_date, 'YYYYMMDD') || type_code;

  SELECT COALESCE(MAX(
    CAST(substring(display_number, 11, 3) AS INTEGER)
  ), 0) + 1
  INTO next_sequence
  FROM public.unified_tasks
  WHERE user_id = p_user_id
    AND display_number LIKE base_number || '%';

  IF next_sequence > 999 THEN
    RAISE EXCEPTION 'Maximum sequence number reached for date % and type %', p_date, p_task_type;
  END IF;

  new_number := base_number || lpad(next_sequence::TEXT, 3, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📱 実行手順

1. **Supabase Dashboard**にアクセス
   - https://supabase.com/dashboard/projects
   - プロジェクト「wgtrffjwdtytqgqybjwx」を選択

2. **SQL Editor**を開く
   - 左メニューの「SQL Editor」をクリック

3. **上記SQLを順番に実行**
   - 各SQLブロックを1つずつコピペして実行
   - エラーが出た場合は次に進まずに解決

4. **テーブル確認**
   - 左メニューの「Table Editor」で`unified_tasks`テーブルが作成されていることを確認

## ✅ 完了チェック
- [ ] unified_tasksテーブル作成完了
- [ ] インデックス作成完了
- [ ] RLSポリシー設定完了
- [ ] トリガー作成完了
- [ ] 番号生成関数作成完了

完了したら、`/unified`ページにアクセスしてテストしてください。