-- Migration: Create optimized tasuku schema based on actual usage analysis
-- Date: 2025-09-13
-- Purpose: Replace existing schema with optimized design based on form/hooks analysis

-- Drop existing tables if they exist (clean slate approach)
DROP TABLE IF EXISTS public.unified_items;
DROP TABLE IF EXISTS public.location_tags;
DROP TABLE IF EXISTS public.settings;
DROP TABLE IF EXISTS public.recurring_logs;
DROP TABLE IF EXISTS public.recurring_tasks;
DROP TABLE IF EXISTS public.tasks;

-- Drop existing views
DROP VIEW IF EXISTS tasks_with_urgency;
DROP VIEW IF EXISTS today_tasks;
DROP VIEW IF EXISTS active_recurring_tasks;
DROP VIEW IF EXISTS user_task_stats;

-- Drop existing functions
DROP FUNCTION IF EXISTS migrate_task_from_indexeddb;
DROP FUNCTION IF EXISTS create_default_settings_for_user;
DROP FUNCTION IF EXISTS update_updated_at_column;

-- ===========================================
-- OPTIMIZED SCHEMA BASED ON ACTUAL USAGE
-- ===========================================

-- 1. Tasks Table (実際使用項目のみ)
CREATE TABLE public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 必須フィールド
  title text NOT NULL,
  completed boolean DEFAULT false,
  
  -- 基本情報（実際に使用される）
  memo text,
  due_date date, -- YYYY-MM-DD
  category text CHECK (category IN ('仕事', 'プライベート', '勉強', '健康', '買い物', '家事', 'その他')),
  importance integer CHECK (importance IN (1,2,3,4,5)), -- 1=最低 5=最高
  duration_min integer, -- 所要時間（分）
  urls text[], -- 関連URL配列（最大5個）
  
  -- システム管理項目
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at date, -- 完了日
  
  -- 実際に使用される管理項目
  archived boolean DEFAULT false,
  snoozed_until date, -- スヌーズ期限
  
  -- URL制限
  CONSTRAINT max_urls_limit CHECK (array_length(urls, 1) IS NULL OR array_length(urls, 1) <= 5)
);

-- 2. Recurring Tasks Table (実際使用項目のみ)
CREATE TABLE public.recurring_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 必須フィールド
  title text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('DAILY', 'INTERVAL_DAYS', 'WEEKLY', 'MONTHLY')),
  active boolean DEFAULT true,
  
  -- 基本情報
  memo text,
  importance integer CHECK (importance IN (1,2,3,4,5)),
  duration_min integer, -- 所要時間（分）
  urls text[], -- 関連URL配列
  
  -- 繰り返し設定（実際に使用される）
  interval_n integer DEFAULT 1, -- 間隔
  weekdays integer[], -- WEEKLY用: 1=月〜7=日の配列
  month_day integer CHECK (month_day BETWEEN 1 AND 31), -- MONTHLY用
  
  -- 期間設定
  start_date date NOT NULL DEFAULT current_date,
  end_date date, -- 任意
  
  -- システム管理項目
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- URL制限
  CONSTRAINT max_urls_limit CHECK (array_length(urls, 1) IS NULL OR array_length(urls, 1) <= 5)
);

-- 3. Recurring Logs Table (実際使用項目のみ)
CREATE TABLE public.recurring_logs (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recurring_id uuid REFERENCES public.recurring_tasks(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL, -- 実行日
  logged_at timestamptz DEFAULT now(), -- 実行時刻
  
  PRIMARY KEY (user_id, recurring_id, date) -- 複合主キー（重複防止）
);

-- ===========================================
-- INDEXES for Performance（実際使用ベース）
-- ===========================================

-- Tasks indexes（よく使用されるクエリ用）
CREATE INDEX idx_tasks_user_due_date ON public.tasks(user_id, due_date) WHERE NOT completed AND NOT archived;
CREATE INDEX idx_tasks_user_completed ON public.tasks(user_id, completed, updated_at) WHERE completed;
CREATE INDEX idx_tasks_user_today ON public.tasks(user_id, due_date, completed);

-- Recurring Tasks indexes
CREATE INDEX idx_recurring_tasks_user_active ON public.recurring_tasks(user_id, active) WHERE active;
CREATE INDEX idx_recurring_tasks_frequency ON public.recurring_tasks(user_id, frequency, active);

-- Recurring Logs indexes（日付範囲検索用）
CREATE INDEX idx_recurring_logs_date ON public.recurring_logs(user_id, date);
CREATE INDEX idx_recurring_logs_recurring_id ON public.recurring_logs(recurring_id, date);

-- ===========================================
-- RLS (Row Level Security) Policies
-- ===========================================

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_logs ENABLE ROW LEVEL SECURITY;

-- Tasks RLS：ユーザー自身のデータのみアクセス可能
CREATE POLICY "tasks_crud_own" ON public.tasks
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Recurring Tasks RLS
CREATE POLICY "recurring_tasks_crud_own" ON public.recurring_tasks
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Recurring Logs RLS
CREATE POLICY "recurring_logs_crud_own" ON public.recurring_logs
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ===========================================
-- Triggers（実際に必要な自動化のみ）
-- ===========================================

-- updated_at自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_recurring_tasks_updated_at BEFORE UPDATE ON public.recurring_tasks
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ===========================================
-- Views（実際のフロントエンド用）
-- ===========================================

-- Tasks with urgency calculation（useTasks.tsで使用）
CREATE OR REPLACE VIEW tasks_with_urgency AS
SELECT 
  t.*,
  CASE 
    WHEN t.due_date IS NULL THEN 'Normal'
    WHEN t.due_date < current_date THEN 'Overdue'
    WHEN t.due_date <= current_date + interval '3 days' THEN 'Soon'
    WHEN t.due_date <= current_date + interval '7 days' THEN 'Next7'
    WHEN t.due_date <= current_date + interval '30 days' THEN 'Next30'
    ELSE 'Normal'
  END AS urgency,
  COALESCE(t.due_date - current_date, 999) AS days_from_today
FROM public.tasks t
WHERE t.user_id = auth.uid();

-- Today's tasks view（パフォーマンス最適化）
CREATE OR REPLACE VIEW today_tasks AS
SELECT * FROM tasks_with_urgency 
WHERE due_date = current_date 
  AND NOT completed 
  AND NOT archived 
  AND (snoozed_until IS NULL OR snoozed_until <= current_date);

-- Active recurring tasks view
CREATE OR REPLACE VIEW active_recurring_tasks AS
SELECT * FROM public.recurring_tasks 
WHERE user_id = auth.uid() AND active = true;

-- ===========================================
-- Simple constraints (complex validation moved to application layer)
-- ===========================================
-- Note: Complex array validation is handled in the application layer
-- for better performance and PostgreSQL compatibility

-- ===========================================
-- User task statistics view
-- ===========================================
CREATE OR REPLACE VIEW user_task_stats AS
SELECT 
  user_id,
  count(*) AS total_tasks,
  count(*) FILTER (WHERE completed) AS completed_tasks,
  count(*) FILTER (WHERE NOT completed AND due_date < current_date) AS overdue_tasks,
  count(*) FILTER (WHERE NOT completed AND due_date = current_date) AS today_tasks,
  avg(duration_min) FILTER (WHERE duration_min > 0) AS avg_duration_min
FROM public.tasks 
WHERE NOT archived
GROUP BY user_id;