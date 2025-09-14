-- ===========================================
-- Tasuku Project - Complete Supabase Database Schema
-- ===========================================
-- IndexedDBスキーマをSupabase PostgreSQL向けに完全移植

-- 1. Tasks Table (メインタスク)
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  memo text,
  due_date date, -- YYYY-MM-DD JST
  completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at date, -- YYYY-MM-DD JST, only when completed
  
  -- PHASE 1.2 - 繰り越し関連
  rollover_count integer default 0,
  archived boolean default false,
  snoozed_until date, -- YYYY-MM-DD JST
  
  -- PHASE 4.2 - 拡張フィールド
  duration_min integer, -- 想定所要時間（分）
  importance integer check (importance in (1,2,3,4,5)), -- 重要度
  category text, -- カテゴリ（仕事、プライベート、勉強など）
  urls text[], -- 関連URL配列（最大5個）
  location_tag_id uuid references public.location_tags(id)
);

-- 2. Recurring Tasks Table (繰り返しタスク)
create table if not exists public.recurring_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  memo text,
  frequency text not null check (frequency in ('DAILY', 'INTERVAL_DAYS', 'WEEKLY', 'MONTHLY')),
  interval_n integer default 1, -- 間隔
  weekdays integer[], -- WEEKLY用 0=月〜6=日
  month_day integer check (month_day between 1 and 31), -- MONTHLY用
  start_date date not null, -- YYYY-MM-DD JST
  end_date date, -- YYYY-MM-DD JST, optional
  max_occurrences integer, -- 回数上限、optional
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- PHASE 4.2 - 拡張フィールド
  duration_min integer,
  importance integer check (importance in (1,2,3,4,5)),
  urls text[], -- 関連URL配列
  location_tag_id uuid references public.location_tags(id)
);

-- 3. Recurring Logs Table (繰り返しタスク実行ログ)
create table if not exists public.recurring_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  recurring_id uuid references public.recurring_tasks(id) on delete cascade not null,
  date date not null, -- YYYY-MM-DD JST
  logged_at timestamptz default now(),
  unique(user_id, recurring_id, date) -- 同一日重複防止
);

-- 4. Settings Table (ユーザー設定)
create table if not exists public.settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  timezone text default 'Asia/Tokyo',
  urgency_thresholds jsonb default '{"soon": 3, "next7": 7, "next30": 30}',
  features jsonb default '{
    "connectors_readonly": false,
    "plan_suggestion": false,
    "ml_ranking": false,
    "geolocation": false
  }',
  updated_at timestamptz default now()
);

-- 5. Location Tags Table (位置タグ)
create table if not exists public.location_tags (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  alias text not null, -- '自宅', 'オフィス' など
  lat numeric(10,8) not null,
  lng numeric(11,8) not null,
  radius_m integer default 100, -- 近接判定の閾値（メートル）
  created_at timestamptz default now()
);

-- 6. Unified Items Table (統合ビュー - read-only items)
create table if not exists public.unified_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source text not null check (source in ('task', 'recurring', 'calendar', 'email', 'message')),
  source_id text not null, -- 外部システムのID
  title text not null,
  note text,
  due_date date, -- YYYY-MM-DD JST
  duration_min integer,
  location_tag_id uuid references public.location_tags(id),
  importance integer check (importance in (1,2,3,4,5)),
  link text, -- 外部アイテムの原本URL
  read_only boolean default true,
  created_at timestamptz default now(),
  unique(user_id, source, source_id) -- 外部アイテム重複防止
);

-- ===========================================
-- INDEXES for Performance
-- ===========================================

-- Tasks indexes
create index if not exists idx_tasks_user_due_date on public.tasks(user_id, due_date);
create index if not exists idx_tasks_user_completed on public.tasks(user_id, completed);
create index if not exists idx_tasks_user_created_at on public.tasks(user_id, created_at);

-- Recurring Tasks indexes  
create index if not exists idx_recurring_tasks_user_active on public.recurring_tasks(user_id, active);
create index if not exists idx_recurring_tasks_user_start_date on public.recurring_tasks(user_id, start_date);

-- Recurring Logs indexes
create index if not exists idx_recurring_logs_user_date on public.recurring_logs(user_id, date);
create index if not exists idx_recurring_logs_recurring_id on public.recurring_logs(recurring_id);

-- Location Tags indexes
create index if not exists idx_location_tags_user_id on public.location_tags(user_id);

-- Unified Items indexes
create index if not exists idx_unified_items_user_due_date on public.unified_items(user_id, due_date);

-- ===========================================
-- RLS (Row Level Security) Policies
-- ===========================================

-- Enable RLS on all tables
alter table public.tasks enable row level security;
alter table public.recurring_tasks enable row level security;
alter table public.recurring_logs enable row level security;
alter table public.settings enable row level security;
alter table public.location_tags enable row level security;
alter table public.unified_items enable row level security;

-- Tasks RLS policies
create policy "tasks_crud_own" on public.tasks
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Recurring Tasks RLS policies
create policy "recurring_tasks_crud_own" on public.recurring_tasks
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Recurring Logs RLS policies  
create policy "recurring_logs_crud_own" on public.recurring_logs
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Settings RLS policies
create policy "settings_crud_own" on public.settings
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Location Tags RLS policies
create policy "location_tags_crud_own" on public.location_tags
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Unified Items RLS policies
create policy "unified_items_crud_own" on public.unified_items
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ===========================================
-- Triggers for updated_at timestamps
-- ===========================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger update_tasks_updated_at before update on public.tasks
  for each row execute procedure update_updated_at_column();

create trigger update_recurring_tasks_updated_at before update on public.recurring_tasks
  for each row execute procedure update_updated_at_column();

create trigger update_settings_updated_at before update on public.settings
  for each row execute procedure update_updated_at_column();

-- ===========================================
-- Default Settings Setup Function
-- ===========================================

create or replace function create_default_settings_for_user()
returns trigger as $$
begin
  insert into public.settings (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create default settings when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure create_default_settings_for_user();

-- ===========================================
-- Helper Views (Optional)
-- ===========================================

-- View for tasks with urgency calculation
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
  (t.due_date - current_date) as days_from_today
from public.tasks t;

-- ===========================================
-- Data Types and Constants (for TypeScript)
-- ===========================================

-- Task Categories (enum-like constraint)
alter table public.tasks add constraint valid_category 
check (category is null or category in ('仕事', 'プライベート', '勉強', '健康', '買い物', '家事', 'その他'));

alter table public.recurring_tasks add constraint valid_category 
check (category is null or category in ('仕事', 'プライベート', '勉強', '健康', '買い物', '家事', 'その他'));

-- URL array size limit
alter table public.tasks add constraint max_urls_limit 
check (array_length(urls, 1) is null or array_length(urls, 1) <= 5);

alter table public.recurring_tasks add constraint max_urls_limit 
check (array_length(urls, 1) is null or array_length(urls, 1) <= 5);

-- ===========================================
-- Complete Schema Ready!
-- ===========================================