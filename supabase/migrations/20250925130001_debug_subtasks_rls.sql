-- 一時的にsubtasksテーブルのRLSを無効にしてデバッグ
-- 注意: 本番環境では絶対に使用しないこと

-- RLSを一時的に無効化
ALTER TABLE public.subtasks DISABLE ROW LEVEL SECURITY;

-- デバッグ用コメント
-- この変更により、全ユーザーがsubtasksテーブルにアクセス可能になります
-- 問題が解決したら、再度RLSを有効にして適切なポリシーを設定する必要があります