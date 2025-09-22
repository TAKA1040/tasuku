-- ===========================================
-- 基本テーブルの再作成（missing tables fix）
-- ===========================================

-- 1. Tasks テーブル
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  memo TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at DATE,

  -- 拡張フィールド
  rollover_count INTEGER DEFAULT 0,
  archived BOOLEAN DEFAULT FALSE,
  snoozed_until TEXT,
  duration_min INTEGER,
  importance INTEGER CHECK (importance >= 1 AND importance <= 5),
  category TEXT,
  urls TEXT[],
  location_tag_id TEXT,
  attachment JSONB
);

-- 2. Recurring Tasks テーブル
CREATE TABLE IF NOT EXISTS public.recurring_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  memo TEXT,
  frequency TEXT NOT NULL, -- 'DAILY', 'INTERVAL_DAYS', 'WEEKLY', 'MONTHLY'
  interval_n INTEGER DEFAULT 1 NOT NULL,
  weekdays INTEGER[], -- WEEKLY用: 0=月〜6=日
  month_day INTEGER, -- MONTHLY用: 1〜31
  start_date DATE NOT NULL,
  end_date DATE,
  max_occurrences INTEGER,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- 拡張フィールド
  category TEXT,
  attachment JSONB
);

-- 3. Recurring Logs テーブル
CREATE TABLE IF NOT EXISTS public.recurring_logs (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recurring_id UUID REFERENCES public.recurring_tasks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  logged_at TIMESTAMPTZ,

  -- 一意制約: 同じ繰り返しタスクの同じ日のログは1つまで
  UNIQUE(user_id, recurring_id, date)
);

-- ===========================================
-- インデックス作成
-- ===========================================

-- Tasks テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON public.tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON public.tasks(user_id, completed, updated_at);

-- Recurring Tasks テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_user_id ON public.recurring_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_active ON public.recurring_tasks(user_id, active);

-- Recurring Logs テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_recurring_logs_user_id ON public.recurring_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_logs_date ON public.recurring_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_recurring_logs_recurring_task ON public.recurring_logs(recurring_id, date);

-- ===========================================
-- RLS (Row Level Security)
-- ===========================================

-- Tasks テーブル
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_dev_all" ON public.tasks;
CREATE POLICY "tasks_dev_all" ON public.tasks
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Recurring Tasks テーブル
ALTER TABLE public.recurring_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recurring_tasks_dev_all" ON public.recurring_tasks;
CREATE POLICY "recurring_tasks_dev_all" ON public.recurring_tasks
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Recurring Logs テーブル
ALTER TABLE public.recurring_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recurring_logs_dev_all" ON public.recurring_logs;
CREATE POLICY "recurring_logs_dev_all" ON public.recurring_logs
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ===========================================
-- トリガー（updated_at自動更新）
-- ===========================================

-- Tasks テーブル
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Recurring Tasks テーブル
DROP TRIGGER IF EXISTS update_recurring_tasks_updated_at ON public.recurring_tasks;
CREATE TRIGGER update_recurring_tasks_updated_at
  BEFORE UPDATE ON public.recurring_tasks
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ===========================================
-- コメント
-- ===========================================

COMMENT ON TABLE public.tasks IS '基本タスクテーブル - 通常のTo-Doアイテム';
COMMENT ON TABLE public.recurring_tasks IS '繰り返しタスクテーブル - 定期的なタスクのテンプレート';
COMMENT ON TABLE public.recurring_logs IS '繰り返しログテーブル - 繰り返しタスクの実行履歴';