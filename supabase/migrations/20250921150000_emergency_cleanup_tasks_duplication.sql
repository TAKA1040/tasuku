-- ===========================================
-- 緊急: tasksテーブルの大量重複データクリーンアップ
-- ===========================================

-- 1. 重複データの削除 (最新のもの以外)
-- 同じuser_id, title, due_dateの組み合わせで、最新のcreated_atのもの以外を削除

DELETE FROM public.tasks
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, title, COALESCE(due_date, '1900-01-01')) id
    FROM public.tasks
    ORDER BY user_id, title, COALESCE(due_date, '1900-01-01'), created_at DESC
);

-- 2. 統計確認用の関数を更新
CREATE OR REPLACE FUNCTION get_cleanup_stats()
RETURNS TABLE(
    table_name TEXT,
    record_count BIGINT,
    sample_titles TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'tasks'::TEXT,
           COUNT(*)::BIGINT,
           ARRAY(SELECT DISTINCT title FROM public.tasks LIMIT 5) as sample_titles
    FROM public.tasks
    UNION ALL
    SELECT 'unified_tasks'::TEXT,
           COUNT(*)::BIGINT,
           ARRAY(SELECT DISTINCT title FROM public.unified_tasks LIMIT 5) as sample_titles
    FROM public.unified_tasks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 重複チェック用の関数
CREATE OR REPLACE FUNCTION check_task_duplicates()
RETURNS TABLE(
    duplicate_key TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT (user_id::TEXT || '|' || title || '|' || COALESCE(due_date::TEXT, 'NULL')) as duplicate_key,
           COUNT(*)::BIGINT
    FROM public.tasks
    GROUP BY user_id, title, due_date
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- コメント
-- ===========================================

COMMENT ON FUNCTION get_cleanup_stats IS '緊急クリーンアップ後の統計情報';
COMMENT ON FUNCTION check_task_duplicates IS '残存する重複データの確認用';