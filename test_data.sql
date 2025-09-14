-- ===========================================
-- Comprehensive Test Data for Tasuku Application
-- ===========================================
-- Purpose: Test all fields and functionality with realistic data

-- First, we need a test user UUID (using a fixed UUID for consistency)
-- In production, this would be actual user UUIDs from auth.users

-- Test user simulation (in production this would come from auth.users)
DO $$
DECLARE
    test_user_id uuid := '550e8400-e29b-41d4-a716-446655440000';
BEGIN
    -- For testing, we'll use this UUID throughout
    -- In production, actual user_ids from auth.users would be used

-- ===========================================
-- TASKS TEST DATA (すべての項目を網羅)
-- ===========================================

-- 1. 基本的なタスク（最小限の項目）
INSERT INTO public.tasks (user_id, title, completed) VALUES
(test_user_id, '基本タスク：ミーティング準備', false);

-- 2. 完全なタスク（全項目入力）
INSERT INTO public.tasks (
    user_id, title, memo, due_date, category, importance, duration_min, urls, 
    completed, archived, snoozed_until, created_at, updated_at
) VALUES
(
    test_user_id,
    '完全タスク：プロジェクト資料作成',
    'クライアント向けの提案資料を作成する。グラフとスライドを含む30ページの資料。',
    current_date + interval '3 days',
    '仕事',
    5, -- 最高重要度
    120, -- 2時間
    ARRAY[
        'https://docs.google.com/presentation/example',
        'https://github.com/project/repo',
        'https://trello.com/project-board'
    ],
    false,
    false,
    NULL,
    now() - interval '2 days',
    now() - interval '1 day'
);

-- 3. 期日なしタスク
INSERT INTO public.tasks (user_id, title, memo, category, importance, duration_min) VALUES
(test_user_id, 'いつかやる：本を読む', '積読本を消化する', 'プライベート', 2, 60);

-- 4. 緊急タスク（期日が過去）
INSERT INTO public.tasks (user_id, title, memo, due_date, category, importance, duration_min, urls) VALUES
(
    test_user_id,
    '緊急：税務書類提出',
    '確定申告の締切が過ぎている',
    current_date - interval '2 days',
    'その他',
    5,
    180,
    ARRAY['https://tax.example.com/login']
);

-- 5. 今日のタスク
INSERT INTO public.tasks (user_id, title, memo, due_date, category, importance, duration_min) VALUES
(test_user_id, '今日：買い物', '牛乳、パン、卵を購入', current_date, '買い物', 3, 30);

-- 6. 完了済みタスク
INSERT INTO public.tasks (
    user_id, title, memo, due_date, category, importance, duration_min, 
    completed, completed_at, updated_at
) VALUES
(
    test_user_id,
    '完了：朝の運動',
    'ジョギング30分とストレッチ',
    current_date,
    '健康',
    4,
    45,
    true,
    current_date,
    now()
);

-- 7. アーカイブ済みタスク
INSERT INTO public.tasks (
    user_id, title, memo, due_date, category, completed, archived, completed_at
) VALUES
(
    test_user_id,
    'アーカイブ：古いプロジェクト',
    '終了したプロジェクトの残作業',
    current_date - interval '30 days',
    '仕事',
    true,
    true,
    current_date - interval '30 days'
);

-- 8. スヌーズ中のタスク
INSERT INTO public.tasks (user_id, title, memo, due_date, category, snoozed_until) VALUES
(
    test_user_id,
    'スヌーズ：歯医者予約',
    '来週まで延期',
    current_date + interval '1 day',
    '健康',
    current_date + interval '7 days'
);

-- 9. URLが多いタスク（最大5個）
INSERT INTO public.tasks (user_id, title, memo, category, importance, urls) VALUES
(
    test_user_id,
    'リサーチ：競合調査',
    '市場分析のための競合他社調査',
    '仕事',
    4,
    ARRAY[
        'https://competitor1.com',
        'https://competitor2.com',
        'https://market-research.com',
        'https://industry-report.com',
        'https://analytics-tool.com'
    ]
);

-- 10. 各カテゴリのテスト
INSERT INTO public.tasks (user_id, title, category, importance) VALUES
(test_user_id, '勉強：プログラミング学習', '勉強', 4),
(test_user_id, '家事：掃除', '家事', 2),
(test_user_id, '健康：定期検診', '健康', 5);

-- ===========================================
-- RECURRING TASKS TEST DATA (すべての項目を網羅)
-- ===========================================

-- 1. 毎日タスク
INSERT INTO public.recurring_tasks (
    user_id, title, memo, frequency, importance, duration_min, 
    start_date, active
) VALUES
(
    test_user_id,
    '毎日：朝のストレッチ',
    '健康維持のための朝の習慣',
    'DAILY',
    3,
    15,
    current_date,
    true
);

-- 2. 週次タスク（複数曜日）
INSERT INTO public.recurring_tasks (
    user_id, title, memo, frequency, weekdays, importance, duration_min,
    urls, start_date, active
) VALUES
(
    test_user_id,
    '週次：ジム通い',
    '筋力トレーニングと有酸素運動',
    'WEEKLY',
    ARRAY[1, 3, 5], -- 月水金
    4,
    90,
    ARRAY['https://gym-reservation.com'],
    current_date,
    true
);

-- 3. 月次タスク
INSERT INTO public.recurring_tasks (
    user_id, title, memo, frequency, month_day, importance, duration_min,
    start_date, end_date, active
) VALUES
(
    test_user_id,
    '月次：家計簿チェック',
    '毎月末に家計の見直し',
    'MONTHLY',
    28, -- 28日
    3,
    60,
    current_date,
    current_date + interval '1 year',
    true
);

-- 4. 間隔タスク（3日おき）
INSERT INTO public.recurring_tasks (
    user_id, title, memo, frequency, interval_n, importance, duration_min,
    start_date, active
) VALUES
(
    test_user_id,
    '間隔：植物の水やり',
    '観葉植物のメンテナンス',
    'INTERVAL_DAYS',
    3,
    2,
    10,
    current_date,
    true
);

-- 5. 完全な繰り返しタスク（全項目）
INSERT INTO public.recurring_tasks (
    user_id, title, memo, frequency, weekdays, importance, duration_min,
    urls, start_date, end_date, active, created_at, updated_at
) VALUES
(
    test_user_id,
    '完全：チームミーティング',
    '週次の進捗確認とタスク調整。アジェンダの準備も含む。',
    'WEEKLY',
    ARRAY[2], -- 火曜日
    5,
    60,
    ARRAY[
        'https://zoom.us/meeting',
        'https://docs.google.com/agenda'
    ],
    current_date,
    current_date + interval '6 months',
    true,
    now() - interval '1 week',
    now() - interval '2 days'
);

-- 6. 非アクティブな繰り返しタスク
INSERT INTO public.recurring_tasks (
    user_id, title, memo, frequency, importance, active
) VALUES
(
    test_user_id,
    '非アクティブ：古い習慣',
    '一時停止中の繰り返しタスク',
    'DAILY',
    1,
    false
);

-- ===========================================
-- RECURRING LOGS TEST DATA（実行記録）
-- ===========================================

-- 今日の実行記録
INSERT INTO public.recurring_logs (user_id, recurring_id, date, logged_at)
SELECT 
    test_user_id,
    id,
    current_date,
    now() - interval '2 hours'
FROM public.recurring_tasks 
WHERE user_id = test_user_id AND title LIKE '%毎日：朝のストレッチ%'
LIMIT 1;

-- 昨日の実行記録
INSERT INTO public.recurring_logs (user_id, recurring_id, date, logged_at)
SELECT 
    test_user_id,
    id,
    current_date - interval '1 day',
    now() - interval '1 day'
FROM public.recurring_tasks 
WHERE user_id = test_user_id AND title LIKE '%毎日：朝のストレッチ%'
LIMIT 1;

-- 週次タスクの実行記録（月曜日）
INSERT INTO public.recurring_logs (user_id, recurring_id, date, logged_at)
SELECT 
    test_user_id,
    id,
    current_date - (EXTRACT(dow FROM current_date) - 1)::int, -- 今週の月曜日
    now() - interval '2 days'
FROM public.recurring_tasks 
WHERE user_id = test_user_id AND title LIKE '%週次：ジム通い%'
LIMIT 1;

END $$;

-- ===========================================
-- データ検証クエリ
-- ===========================================

-- 作成されたデータの確認
SELECT 'Tasks created:', count(*) FROM public.tasks WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
SELECT 'Recurring tasks created:', count(*) FROM public.recurring_tasks WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
SELECT 'Recurring logs created:', count(*) FROM public.recurring_logs WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

-- カテゴリ別タスク数
SELECT category, count(*) as task_count 
FROM public.tasks 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY category 
ORDER BY task_count DESC;

-- 重要度別タスク数
SELECT importance, count(*) as task_count 
FROM public.tasks 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000' AND importance IS NOT NULL
GROUP BY importance 
ORDER BY importance DESC;

-- 繰り返しタスクの頻度別数
SELECT frequency, count(*) as task_count 
FROM public.recurring_tasks 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY frequency;

-- Views のテスト
SELECT 'Tasks with urgency:', count(*) FROM tasks_with_urgency;
SELECT 'Today tasks:', count(*) FROM today_tasks;
SELECT 'Active recurring tasks:', count(*) FROM active_recurring_tasks;