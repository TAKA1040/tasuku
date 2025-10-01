-- ===========================================
-- Tasuku Project - 実際使用ベース最適化スキーマ
-- ===========================================
-- 実際のフォーム・hooks分析に基づく正確なDB設計

-- 1. Tasks Table (実際使用項目のみ)
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- 必須フィールド
  title text not null,
  completed boolean default false,
  
  -- 基本情報（実際に使用される）
  memo text,
  due_date date, -- YYYY-MM-DD
  category text check (category in ('仕事', 'プライベート', '勉強', '健康', '買い物', '家事', 'その他')),
  importance integer check (importance in (1,2,3,4,5)), -- 1=最低 5=最高
  duration_min integer, -- 所要時間（分）
  urls text[], -- 関連URL配列（最大5個）
  
  -- システム管理項目
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at date, -- 完了日
  
  -- 実際に使用される管理項目
  archived boolean default false,
  snoozed_until date, -- スヌーズ期限
  
  -- URL制限
  constraint max_urls_limit check (array_length(urls, 1) is null or array_length(urls, 1) <= 5)
);

-- 2. Recurring Tasks Table (実際使用項目のみ)
create table if not exists public.recurring_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- 必須フィールド
  title text not null,
  frequency text not null check (frequency in ('DAILY', 'INTERVAL_DAYS', 'WEEKLY', 'MONTHLY')),
  active boolean default true,
  
  -- 基本情報
  memo text,
  importance integer check (importance in (1,2,3,4,5)),
  duration_min integer, -- 所要時間（分）
  urls text[], -- 関連URL配列
  
  -- 繰り返し設定（実際に使用される）
  interval_n integer default 1, -- 間隔
  weekdays integer[], -- WEEKLY用: 1=月〜7=日の配列
  month_day integer check (month_day between 1 and 31), -- MONTHLY用
  
  -- 期間設定
  start_date date not null default current_date,
  end_date date, -- 任意
  
  -- システム管理項目
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- URL制限
  constraint max_urls_limit check (array_length(urls, 1) is null or array_length(urls, 1) <= 5)
);

-- 3. Recurring Logs Table (実際使用項目のみ)
create table if not exists public.recurring_logs (
  user_id uuid references auth.users(id) on delete cascade not null,
  recurring_id uuid references public.recurring_tasks(id) on delete cascade not null,
  date date not null, -- 実行日
  logged_at timestamptz default now(), -- 実行時刻
  
  primary key (user_id, recurring_id, date) -- 複合主キー（重複防止）
);

-- ===========================================
-- INDEXES for Performance（実際使用ベース）
-- ===========================================

-- Tasks indexes（よく使用されるクエリ用）
create index if not exists idx_tasks_user_due_date on public.tasks(user_id, due_date) where not completed and not archived;
create index if not exists idx_tasks_user_completed on public.tasks(user_id, completed, updated_at) where completed;
create index if not exists idx_tasks_user_today on public.tasks(user_id, due_date, completed) where due_date = current_date;

-- Recurring Tasks indexes
create index if not exists idx_recurring_tasks_user_active on public.recurring_tasks(user_id, active) where active;
create index if not exists idx_recurring_tasks_frequency on public.recurring_tasks(user_id, frequency, active);

-- Recurring Logs indexes（日付範囲検索用）
create index if not exists idx_recurring_logs_date on public.recurring_logs(user_id, date);
create index if not exists idx_recurring_logs_recurring_id on public.recurring_logs(recurring_id, date);

-- ===========================================
-- RLS (Row Level Security) Policies
-- ===========================================

-- Enable RLS
alter table public.tasks enable row level security;
alter table public.recurring_tasks enable row level security;
alter table public.recurring_logs enable row level security;

-- Tasks RLS：ユーザー自身のデータのみアクセス可能
create policy "tasks_crud_own" on public.tasks
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Recurring Tasks RLS
create policy "recurring_tasks_crud_own" on public.recurring_tasks
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Recurring Logs RLS
create policy "recurring_logs_crud_own" on public.recurring_logs
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===========================================
-- Triggers（実際に必要な自動化のみ）
-- ===========================================

-- updated_at自動更新
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_tasks_updated_at before update on public.tasks
  for each row execute procedure update_updated_at_column();

create trigger update_recurring_tasks_updated_at before update on public.recurring_tasks
  for each row execute procedure update_updated_at_column();

-- ===========================================
-- Views（実際のフロントエンド用）
-- ===========================================

-- Tasks with urgency calculation（useTasks.tsで使用）
create or replace view tasks_with_urgency as
select 
  t.*,
  case 
    when t.due_date is null then 'Normal'
    when t.due_date < current_date then 'Overdue'
    when t.due_date <= current_date + interval '3 days' then 'Soon'
    when t.due_date <= current_date + interval '7 days' then 'Next7'
    when t.due_date <= current_date + interval '30 days' then 'Next30'
    else 'Normal'
  end as urgency,
  coalesce(t.due_date - current_date, 999) as days_from_today
from public.tasks t
where t.user_id = auth.uid();

-- Today's tasks view（パフォーマンス最適化）
create or replace view today_tasks as
select * from tasks_with_urgency 
where due_date = current_date 
  and not completed 
  and not archived 
  and (snoozed_until is null or snoozed_until <= current_date);

-- Active recurring tasks view
create or replace view active_recurring_tasks as
select * from public.recurring_tasks 
where user_id = auth.uid() and active = true;

-- ===========================================
-- 実際のアプリケーション制約
-- ===========================================

-- Category制限（実際のフォームで使用される値のみ）
alter table public.tasks add constraint valid_task_category 
check (category is null or category in ('仕事', 'プライベート', '勉強', '健康', '買い物', '家事', 'その他'));

alter table public.recurring_tasks add constraint valid_recurring_category 
check (category is null or category in ('仕事', 'プライベート', '勉強', '健康', '買い物', '家事', 'その他'));

-- URL validation（簡易）
alter table public.tasks add constraint valid_urls 
check (urls is null or (
  array_length(urls, 1) <= 5 and 
  not exists (select 1 from unnest(urls) as url where length(url) > 2000)
));

alter table public.recurring_tasks add constraint valid_urls 
check (urls is null or (
  array_length(urls, 1) <= 5 and 
  not exists (select 1 from unnest(urls) as url where length(url) > 2000)
));

-- Weekdays validation（1-7の範囲）
alter table public.recurring_tasks add constraint valid_weekdays
check (weekdays is null or (
  array_length(weekdays, 1) <= 7 and
  not exists (select 1 from unnest(weekdays) as day where day < 1 or day > 7)
));

-- ===========================================
-- データ移行用関数（IndexedDBからの移行時）
-- ===========================================

-- Task移行用関数
create or replace function migrate_task_from_indexeddb(
  p_user_id uuid,
  p_title text,
  p_memo text default null,
  p_due_date date default null,
  p_category text default null,
  p_importance integer default null,
  p_duration_min integer default null,
  p_urls text[] default null,
  p_completed boolean default false,
  p_archived boolean default false,
  p_completed_at date default null,
  p_snoozed_until date default null,
  p_created_at timestamptz default now(),
  p_updated_at timestamptz default now()
) returns uuid as $$
declare
  new_task_id uuid;
begin
  insert into public.tasks (
    user_id, title, memo, due_date, category, importance, 
    duration_min, urls, completed, archived, completed_at, 
    snoozed_until, created_at, updated_at
  ) values (
    p_user_id, p_title, p_memo, p_due_date, p_category, p_importance,
    p_duration_min, p_urls, p_completed, p_archived, p_completed_at,
    p_snoozed_until, p_created_at, p_updated_at
  ) returning id into new_task_id;
  
  return new_task_id;
end;
$$ language plpgsql security definer;

-- ===========================================
-- 統計・分析用View（将来の機能拡張用）
-- ===========================================

-- User task statistics
create or replace view user_task_stats as
select 
  user_id,
  count(*) as total_tasks,
  count(*) filter (where completed) as completed_tasks,
  count(*) filter (where not completed and due_date < current_date) as overdue_tasks,
  count(*) filter (where not completed and due_date = current_date) as today_tasks,
  avg(duration_min) filter (where duration_min > 0) as avg_duration_min
from public.tasks 
where not archived
group by user_id;

-- ===========================================
-- 完成！実際使用ベース最適化スキーマ
-- ===========================================

-- 削除された不要な項目:
-- - rollover_count (使用されていない)
-- - location_tag_id (位置機能未実装)
-- - max_occurrences (繰り返し制限未実装)
-- - settings テーブル (未実装)
-- - location_tags テーブル (GPS機能未実装)
-- - unified_items テーブル (外部連携未実装)

-- 最適化された項目:
-- ✅ 実際のフォームで使用される項目のみ
-- ✅ 実際のhooksで処理される項目のみ
-- ✅ パフォーマンス最適化されたインデックス
-- ✅ 実際のデータ制約のみ
-- ✅ 必要なView（フロントエンド用）
-- ✅ データ移行対応