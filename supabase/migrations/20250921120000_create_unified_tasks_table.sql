-- ===========================================
-- 統一タスクテーブルの作成
-- ===========================================

CREATE TABLE IF NOT EXISTS public.unified_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 🎯 統一番号システム（新機能）
  display_number TEXT NOT NULL, -- YYYYMMDDTTCCC形式
  task_type TEXT NOT NULL DEFAULT 'NORMAL', -- 'NORMAL', 'RECURRING', 'IDEA'

  -- 📋 基本フィールド
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  memo TEXT,
  due_date DATE, -- YYYY-MM-DD
  category TEXT,
  importance INTEGER DEFAULT 1 CHECK (importance >= 1 AND importance <= 5),
  duration_min INTEGER, -- 所要時間（分）
  urls TEXT[], -- 関連URL配列

  -- システム管理項目
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at DATE, -- 完了日
  archived BOOLEAN DEFAULT FALSE,
  snoozed_until DATE, -- スヌーズ期限
  rollover_count INTEGER DEFAULT 0, -- 既存テーブルとの互換性

  -- 🔄 繰り返しタスク用フィールド
  frequency TEXT, -- 'DAILY', 'INTERVAL_DAYS', 'WEEKLY', 'MONTHLY'
  active BOOLEAN DEFAULT TRUE, -- 繰り返しタスクの有効性
  interval_n INTEGER DEFAULT 1, -- 間隔
  weekdays INTEGER[], -- WEEKLY用: 1=月〜7=日の配列
  month_day INTEGER, -- MONTHLY用: 1-31
  start_date DATE, -- 繰り返し開始日
  end_date DATE, -- 繰り返し終了日（任意）

  -- 📎 添付ファイル（JSON形式）
  attachment JSONB, -- {file_name, file_type, file_data}

  -- 🔒 基本制約
  UNIQUE(user_id, display_number)
);

-- ===========================================
-- インデックス（パフォーマンス最適化）
-- ===========================================

-- 統一番号システム用
CREATE INDEX IF NOT EXISTS idx_unified_tasks_display_number ON public.unified_tasks(user_id, display_number);
CREATE INDEX IF NOT EXISTS idx_unified_tasks_type ON public.unified_tasks(user_id, task_type, completed);

-- 基本検索用
CREATE INDEX IF NOT EXISTS idx_unified_tasks_user_due_date ON public.unified_tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_unified_tasks_user_completed ON public.unified_tasks(user_id, completed, updated_at);

-- ===========================================
-- RLS (Row Level Security)
-- ===========================================

ALTER TABLE public.unified_tasks ENABLE ROW LEVEL SECURITY;

-- 開発用：全アクセス許可ポリシー（認証・非認証両対応）
CREATE POLICY "unified_tasks_dev_all" ON public.unified_tasks
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ===========================================
-- トリガー（updated_at自動更新）
-- ===========================================

-- トリガー関数が存在しない場合は作成
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

-- ===========================================
-- 番号生成関数（YYYYMMDDTTCCC形式）
-- ===========================================

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
  -- タイプコード決定
  type_code := CASE p_task_type
    WHEN 'NORMAL' THEN '10'
    WHEN 'RECURRING' THEN '12'
    WHEN 'IDEA' THEN '13'
    ELSE '10'
  END;

  -- ベース番号生成 (YYYYMMDDTT)
  base_number := to_char(p_date, 'YYYYMMDD') || type_code;

  -- 次の連番を取得
  SELECT COALESCE(MAX(
    CAST(substring(display_number, 11, 3) AS INTEGER)
  ), 0) + 1
  INTO next_sequence
  FROM public.unified_tasks
  WHERE user_id = p_user_id
    AND display_number LIKE base_number || '%';

  -- 999を超える場合はエラー
  IF next_sequence > 999 THEN
    RAISE EXCEPTION 'Maximum sequence number reached for date % and type %', p_date, p_task_type;
  END IF;

  -- 新しい番号生成
  new_number := base_number || lpad(next_sequence::TEXT, 3, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- コメント
-- ===========================================

COMMENT ON TABLE public.unified_tasks IS '統一タスク管理テーブル - tasks + recurring_tasks + 統一番号システム';
COMMENT ON COLUMN public.unified_tasks.display_number IS 'YYYYMMDDTTCCC形式: 年月日+タイプコード+連番';
COMMENT ON COLUMN public.unified_tasks.task_type IS 'NORMAL=通常タスク, RECURRING=繰り返しタスク, IDEA=アイデア';
COMMENT ON FUNCTION generate_display_number IS '統一番号自動生成関数';