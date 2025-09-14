-- Basic Tasks Test Data
INSERT INTO public.tasks (user_id, title, memo, due_date, category, importance, duration_min, urls, completed) VALUES
('550e8400-e29b-41d4-a716-446655440000', '基本タスク：ミーティング準備', '重要な会議の準備資料', current_date + 1, '仕事', 4, 60, ARRAY['https://example.com/agenda'], false),
('550e8400-e29b-41d4-a716-446655440000', '買い物：食材購入', '牛乳、パン、卵を購入', current_date, '買い物', 3, 30, NULL, false),
('550e8400-e29b-41d4-a716-446655440000', '勉強：プログラミング学習', 'React.jsの復習', current_date + 2, '勉強', 4, 120, ARRAY['https://reactjs.org'], false),
('550e8400-e29b-41d4-a716-446655440000', '完了済み：朝の運動', 'ジョギング30分完了', current_date, '健康', 3, 45, NULL, true);

-- Recurring Tasks Test Data  
INSERT INTO public.recurring_tasks (user_id, title, memo, frequency, interval_n, weekdays, month_day, importance, duration_min, urls, start_date, active) VALUES
('550e8400-e29b-41d4-a716-446655440000', '毎日：朝のストレッチ', '健康維持習慣', 'DAILY', 1, NULL, NULL, 3, 15, NULL, current_date, true),
('550e8400-e29b-41d4-a716-446655440000', '週次：ジム通い', '筋トレと有酸素', 'WEEKLY', 1, ARRAY[1,3,5], NULL, 4, 90, ARRAY['https://gym.example.com'], current_date, true),
('550e8400-e29b-41d4-a716-446655440000', '月次：家計簿', '毎月の収支確認', 'MONTHLY', 1, NULL, 28, 3, 60, NULL, current_date, true);

-- Get recurring task IDs for logs
WITH daily_task AS (
  SELECT id FROM public.recurring_tasks WHERE user_id = '550e8400-e29b-41d4-a716-446655440000' AND title LIKE '%毎日：朝のストレッチ%' LIMIT 1
)
INSERT INTO public.recurring_logs (user_id, recurring_id, date, logged_at)
SELECT '550e8400-e29b-41d4-a716-446655440000', daily_task.id, current_date, now()
FROM daily_task;