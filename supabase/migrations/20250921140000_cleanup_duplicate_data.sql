-- ===========================================
-- 重複データのクリーンアップ
-- ===========================================

-- 1. unified_tasksテーブルの重複データを削除
-- 同じuser_id, display_numberの組み合わせで、最新のもの以外を削除

DELETE FROM public.unified_tasks
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, display_number) id
    FROM public.unified_tasks
    ORDER BY user_id, display_number, created_at DESC
);

-- 2. 統計情報を確認用関数として作成
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE(
    table_name TEXT,
    record_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'tasks'::TEXT, COUNT(*)::BIGINT FROM public.tasks
    UNION ALL
    SELECT 'recurring_tasks'::TEXT, COUNT(*)::BIGINT FROM public.recurring_tasks
    UNION ALL
    SELECT 'recurring_logs'::TEXT, COUNT(*)::BIGINT FROM public.recurring_logs
    UNION ALL
    SELECT 'unified_tasks'::TEXT, COUNT(*)::BIGINT FROM public.unified_tasks
    UNION ALL
    SELECT 'subtasks'::TEXT, COUNT(*)::BIGINT FROM public.subtasks
    UNION ALL
    SELECT 'ideas'::TEXT, COUNT(*)::BIGINT FROM public.ideas
    UNION ALL
    SELECT 'settings'::TEXT, COUNT(*)::BIGINT FROM public.settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. デバッグ用に重複チェック関数も作成
CREATE OR REPLACE FUNCTION check_duplicates()
RETURNS TABLE(
    table_name TEXT,
    duplicate_key TEXT,
    count BIGINT
) AS $$
BEGIN
    -- unified_tasksの重複チェック
    RETURN QUERY
    SELECT 'unified_tasks'::TEXT,
           (user_id::TEXT || '|' || display_number) as duplicate_key,
           COUNT(*)::BIGINT
    FROM public.unified_tasks
    GROUP BY user_id, display_number
    HAVING COUNT(*) > 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- コメント
-- ===========================================

COMMENT ON FUNCTION get_table_stats IS 'テーブル別レコード数を取得';
COMMENT ON FUNCTION check_duplicates IS '重複データの確認用';