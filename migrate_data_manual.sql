-- 手動データ移行: tasks → unified_tasks
INSERT INTO public.unified_tasks (
  id,
  user_id,
  display_number,
  task_type,
  title,
  completed,
  memo,
  due_date,
  category,
  importance,
  duration_min,
  urls,
  created_at,
  updated_at,
  completed_at,
  archived,
  snoozed_until,
  rollover_count,
  attachment
)
SELECT
  id,
  user_id,
  COALESCE(display_number, to_char(COALESCE(due_date, created_at::date), 'YYYYMMDD') || '10' || lpad(row_number() OVER (PARTITION BY user_id, COALESCE(due_date, created_at::date) ORDER BY created_at)::text, 3, '0')) as display_number,
  'NORMAL' as task_type,
  title,
  completed,
  memo,
  due_date,
  category,
  COALESCE(importance, 3) as importance,
  duration_min,
  urls,
  created_at,
  updated_at,
  completed_at,
  archived,
  snoozed_until,
  COALESCE(rollover_count, 0) as rollover_count,
  attachment
FROM public.tasks
WHERE NOT EXISTS (
  SELECT 1 FROM public.unified_tasks ut
  WHERE ut.id = tasks.id
);

-- recurring_tasks → unified_tasks も移行
INSERT INTO public.unified_tasks (
  id,
  user_id,
  display_number,
  task_type,
  title,
  completed,
  memo,
  due_date,
  category,
  importance,
  duration_min,
  created_at,
  updated_at,
  active,
  frequency,
  interval_n,
  weekdays,
  month_day,
  start_date,
  end_date
)
SELECT
  id,
  user_id,
  to_char(COALESCE(start_date, created_at::date), 'YYYYMMDD') || '12' || lpad(row_number() OVER (PARTITION BY user_id, COALESCE(start_date, created_at::date) ORDER BY created_at)::text, 3, '0') as display_number,
  'RECURRING' as task_type,
  title,
  false as completed,
  memo,
  NULL as due_date,
  category,
  COALESCE(importance, 3) as importance,
  duration_min,
  created_at,
  updated_at,
  active,
  frequency,
  COALESCE(interval_n, 1) as interval_n,
  weekdays,
  month_day,
  start_date,
  end_date
FROM public.recurring_tasks
WHERE NOT EXISTS (
  SELECT 1 FROM public.unified_tasks ut
  WHERE ut.id = recurring_tasks.id
);