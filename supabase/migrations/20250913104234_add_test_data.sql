-- Migration: Add comprehensive test data for all tables and fields
-- Purpose: Verify all database fields work correctly with realistic test data

-- Test user UUID for consistent testing
-- In production, this would be actual user UUIDs from auth.users
DO $$
DECLARE
    test_user_id uuid := '550e8400-e29b-41d4-a716-446655440000';
BEGIN
    -- Delete existing test data if any
    DELETE FROM public.recurring_logs WHERE user_id = test_user_id;
    DELETE FROM public.recurring_tasks WHERE user_id = test_user_id;
    DELETE FROM public.tasks WHERE user_id = test_user_id;

    -- ===========================================
    -- TASKS TEST DATA (Yyfn�ƹ�)
    -- ===========================================

    -- 1. �,���
    INSERT INTO public.tasks (user_id, title, completed) VALUES
    (test_user_id, '�,�����ƣ󰖙', false);

    -- 2. �hj���h�	
    INSERT INTO public.tasks (
        user_id, title, memo, due_date, category, importance, duration_min, urls, 
        completed, archived, snoozed_until
    ) VALUES
    (
        test_user_id,
        '�h�������Ǚ\',
        '�餢��Q�HǙ30���ns0Ǚ',
        current_date + interval '3 days',
        'Ջ',
        5,
        120,
        ARRAY[
            'https://docs.google.com/presentation/example',
            'https://github.com/project/repo',
            'https://trello.com/project-board'
        ],
        false,
        false,
        NULL
    );

    -- 3. �%���
    INSERT INTO public.tasks (user_id, title, memo, due_date, category, importance, duration_min) VALUES
    (test_user_id, '�%��^', 'P�n��3J', current_date - interval '2 days', ']n�', 5, 180);

    -- 4. ��n���
    INSERT INTO public.tasks (user_id, title, memo, due_date, category, importance, duration_min) VALUES
    (test_user_id, '���Di', '[s��u��e', current_date, '�Di', 3, 30);

    -- 5. �����
    INSERT INTO public.tasks (user_id, title, memo, due_date, category, completed, completed_at) VALUES
    (test_user_id, '��nK�', '���30h�����', current_date, 'e�', true, current_date);

    -- 6. �ƴ�%ƹ�
    INSERT INTO public.tasks (user_id, title, category, importance) VALUES
    (test_user_id, '�7Reactf�', '�7', 4),
    (test_user_id, '���d', '��', 2),
    (test_user_id, '����� ;Q�', '�����', 2);

    -- 7. URLp���
    INSERT INTO public.tasks (user_id, title, memo, category, urls) VALUES
    (
        test_user_id,
        '������',
        '4�(ns0��',
        'Ջ',
        ARRAY[
            'https://competitor1.com',
            'https://competitor2.com',
            'https://market-research.com',
            'https://analytics.com',
            'https://reports.com'
        ]
    );

    -- ===========================================
    -- RECURRING TASKS TEST DATA
    -- ===========================================

    -- 1. �忹�
    INSERT INTO public.recurring_tasks (
        user_id, title, memo, frequency, importance, duration_min, start_date, active
    ) VALUES
    (test_user_id, '��n�����', 'e���c', 'DAILY', 3, 15, current_date, true);

    -- 2. 1!���p��	
    INSERT INTO public.recurring_tasks (
        user_id, title, memo, frequency, weekdays, importance, duration_min, urls, start_date, active
    ) VALUES
    (
        test_user_id,
        '1!��D',
        'K��h	x K�',
        'WEEKLY',
        ARRAY[1, 3, 5], -- 4�
        4,
        90,
        ARRAY['https://gym-booking.example.com'],
        current_date,
        true
    );

    -- 3. !���
    INSERT INTO public.recurring_tasks (
        user_id, title, memo, frequency, month_day, importance, duration_min, start_date, end_date, active
    ) VALUES
    (
        test_user_id,
        '!�?��ï',
        '�+n�/��',
        'MONTHLY',
        28,
        3,
        60,
        current_date,
        current_date + interval '1 year',
        true
    );

    -- 4. �����
    INSERT INTO public.recurring_tasks (
        user_id, title, memo, frequency, interval_n, importance, duration_min, start_date, active
    ) VALUES
    (test_user_id, '��in4��', '�Ii�����', 'INTERVAL_DAYS', 3, 2, 10, current_date, true);

    -- 5. �hjp��W���
    INSERT INTO public.recurring_tasks (
        user_id, title, memo, frequency, weekdays, importance, duration_min, urls, start_date, end_date, active
    ) VALUES
    (
        test_user_id,
        '�h�����ƣ�',
        '1!2W��h����t',
        'WEEKLY',
        ARRAY[2], -- k��
        5,
        60,
        ARRAY[
            'https://zoom.us/meeting/example',
            'https://docs.google.com/agenda'
        ],
        current_date,
        current_date + interval '6 months',
        true
    );

    -- 6. ^��ƣֿ��
    INSERT INTO public.recurring_tasks (
        user_id, title, memo, frequency, importance, active
    ) VALUES
    (test_user_id, '^��ƣ��D�c', '\b-np��W���', 'DAILY', 1, false);

    -- ===========================================
    -- RECURRING LOGS TEST DATA
    -- ===========================================

    -- ��n�L2
    WITH daily_task AS (
        SELECT id FROM public.recurring_tasks 
        WHERE user_id = test_user_id AND title LIKE '%��n�����%' 
        LIMIT 1
    )
    INSERT INTO public.recurring_logs (user_id, recurring_id, date, logged_at)
    SELECT test_user_id, daily_task.id, current_date, now() - interval '2 hours'
    FROM daily_task;

    -- (�n�L2
    WITH daily_task AS (
        SELECT id FROM public.recurring_tasks 
        WHERE user_id = test_user_id AND title LIKE '%��n�����%' 
        LIMIT 1
    )
    INSERT INTO public.recurring_logs (user_id, recurring_id, date, logged_at)
    SELECT test_user_id, daily_task.id, current_date - interval '1 day', now() - interval '1 day'
    FROM daily_task;

    -- ��n�L2
    WITH gym_task AS (
        SELECT id FROM public.recurring_tasks 
        WHERE user_id = test_user_id AND title LIKE '%1!��D%' 
        LIMIT 1
    )
    INSERT INTO public.recurring_logs (user_id, recurring_id, date, logged_at)
    SELECT test_user_id, gym_task.id, current_date - interval '2 days', now() - interval '2 days'
    FROM gym_task;

END $$;