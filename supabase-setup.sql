-- ===========================================
-- Tasuku Project - Supabase Database Setup
-- ===========================================
-- 手動実行用: Supabase Dashboard → SQL Editor で実行

-- 1. profilesテーブル作成
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  status text not null check (status in ('PENDING','APPROVED')),
  role text not null check (role in ('USER','ADMIN')),
  created_at timestamptz default now(),
  approved_at timestamptz,
  approved_by uuid
);

-- 2. RLS有効化
alter table public.profiles enable row level security;

-- 3. RLSポリシー: 自分のレコードまたは管理者は全て閲覧可能
create policy "profiles_select_self_or_admin" on public.profiles
for select
using (
  id = auth.uid() OR
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
);

-- 4. RLSポリシー: 自分のレコードのみ作成可能
create policy "profiles_insert_self" on public.profiles
for insert
with check (id = auth.uid());

-- 5. RLSポリシー: 管理者のみ更新可能
create policy "profiles_update_admin" on public.profiles
for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
)
with check (true);