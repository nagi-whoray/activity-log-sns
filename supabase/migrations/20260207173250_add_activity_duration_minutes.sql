-- 活動時間（分単位）カラムを追加
ALTER TABLE activity_logs
ADD COLUMN activity_duration_minutes INTEGER;

-- コメント追加
COMMENT ON COLUMN activity_logs.activity_duration_minutes IS '活動時間（分単位）。任意入力。活動ログの場合のみ使用。';
