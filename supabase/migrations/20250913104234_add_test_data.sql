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
    -- TASKS TEST DATA (YyfnÓí∆π»)
    -- ===========================================

    -- 1. ˙,øπØ
    INSERT INTO public.tasks (user_id, title, completed) VALUES
    (test_user_id, '˙,øπØﬂ¸∆£Û∞ñô', false);

    -- 2. åhjøπØhÓ	
    INSERT INTO public.tasks (
        user_id, title, memo, due_date, category, importance, duration_min, urls, 
        completed, archived, snoozed_until
    ) VALUES
    (
        test_user_id,
        'åhøπØ◊Ì∏ßØ»«ô\',
        'ØÈ§¢Û»Q–H«ô30⁄¸∏ns0«ô',
        current_date + interval '3 days',
        '’ã',
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

    -- 3.  %øπØ
    INSERT INTO public.tasks (user_id, title, memo, due_date, category, importance, duration_min) VALUES
    (test_user_id, ' %Ÿ¯^', 'Pån∫ö3J', current_date - interval '2 days', ']n÷', 5, 180);

    -- 4.  ÂnøπØ
    INSERT INTO public.tasks (user_id, title, memo, due_date, category, importance, duration_min) VALUES
    (test_user_id, ' Â∑Di', '[s—Ûuí¸e', current_date, '∑Di', 3, 30);

    -- 5. åÜøπØ
    INSERT INTO public.tasks (user_id, title, memo, due_date, category, completed, completed_at) VALUES
    (test_user_id, 'åÜnK’', '∏ÁÆÛ∞30hπ»Ï√¡', current_date, 'e∑', true, current_date);

    -- 6. ´∆¥Í%∆π»
    INSERT INTO public.tasks (user_id, title, category, importance) VALUES
    (test_user_id, '…7Reactf“', '…7', 4),
    (test_user_id, '∂ãÉd', '∂ã', 2),
    (test_user_id, '◊È§Ÿ¸» ;Qﬁ', '◊È§Ÿ¸»', 2);

    -- 7. URLpøπØ
    INSERT INTO public.tasks (user_id, title, memo, category, urls) VALUES
    (
        test_user_id,
        'Íµ¸¡ˆø˚',
        '4ê(ns0ø˚',
        '’ã',
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

    -- 1. ŒÂøπØ
    INSERT INTO public.recurring_tasks (
        user_id, title, memo, frequency, importance, duration_min, start_date, active
    ) VALUES
    (test_user_id, 'ŒÂnπ»Ï√¡', 'e∑≠“c', 'DAILY', 3, 15, current_date, true);

    -- 2. 1!øπØp‹Â	
    INSERT INTO public.recurring_tasks (
        user_id, title, memo, frequency, weekdays, importance, duration_min, urls, start_date, active
    ) VALUES
    (
        test_user_id,
        '1!∏‡D',
        'K»Ïh	x K’',
        'WEEKLY',
        ARRAY[1, 3, 5], -- 4—
        4,
        90,
        ARRAY['https://gym-booking.example.com'],
        current_date,
        true
    );

    -- 3. !øπØ
    INSERT INTO public.recurring_tasks (
        user_id, title, memo, frequency, month_day, importance, duration_min, start_date, end_date, active
    ) VALUES
    (
        test_user_id,
        '!∂?¡ß√Ø',
        'Œ+nŒ/∫ç',
        'MONTHLY',
        28,
        3,
        60,
        current_date,
        current_date + interval '1 year',
        true
    );

    -- 4. ìîøπØ
    INSERT INTO public.recurring_tasks (
        user_id, title, memo, frequency, interval_n, importance, duration_min, start_date, active
    ) VALUES
    (test_user_id, 'ìîin4Ñä', '≥Ii·Û∆ Ûπ', 'INTERVAL_DAYS', 3, 2, 10, current_date, true);

    -- 5. åhjpä‘WøπØ
    INSERT INTO public.recurring_tasks (
        user_id, title, memo, frequency, weekdays, importance, duration_min, urls, start_date, end_date, active
    ) VALUES
    (
        test_user_id,
        'åh¡¸‡ﬂ¸∆£Û∞',
        '1!2W∫çhøπØøt',
        'WEEKLY',
        ARRAY[2], -- k‹Â
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

    -- 6. ^¢Ø∆£÷øπØ
    INSERT INTO public.recurring_tasks (
        user_id, title, memo, frequency, importance, active
    ) VALUES
    (test_user_id, '^¢Ø∆£÷‰D“c', '\b-npä‘WøπØ', 'DAILY', 1, false);

    -- ===========================================
    -- RECURRING LOGS TEST DATA
    -- ===========================================

    --  ÂnüL2
    WITH daily_task AS (
        SELECT id FROM public.recurring_tasks 
        WHERE user_id = test_user_id AND title LIKE '%ŒÂnπ»Ï√¡%' 
        LIMIT 1
    )
    INSERT INTO public.recurring_logs (user_id, recurring_id, date, logged_at)
    SELECT test_user_id, daily_task.id, current_date, now() - interval '2 hours'
    FROM daily_task;

    -- (ÂnüL2
    WITH daily_task AS (
        SELECT id FROM public.recurring_tasks 
        WHERE user_id = test_user_id AND title LIKE '%ŒÂnπ»Ï√¡%' 
        LIMIT 1
    )
    INSERT INTO public.recurring_logs (user_id, recurring_id, date, logged_at)
    SELECT test_user_id, daily_task.id, current_date - interval '1 day', now() - interval '1 day'
    FROM daily_task;

    -- ∏‡nüL2
    WITH gym_task AS (
        SELECT id FROM public.recurring_tasks 
        WHERE user_id = test_user_id AND title LIKE '%1!∏‡D%' 
        LIMIT 1
    )
    INSERT INTO public.recurring_logs (user_id, recurring_id, date, logged_at)
    SELECT test_user_id, gym_task.id, current_date - interval '2 days', now() - interval '2 days'
    FROM gym_task;

END $$;