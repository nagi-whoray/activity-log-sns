-- log_type カラムを追加（活動ログ/達成ログの区分）
-- 既存のレコードは 'activity' として扱う

ALTER TABLE activity_logs
ADD COLUMN IF NOT EXISTS log_type TEXT NOT NULL DEFAULT 'activity'
CHECK (log_type IN ('activity', 'achievement'));

-- フィルタリング用のインデックスを追加
CREATE INDEX IF NOT EXISTS activity_logs_log_type_idx ON activity_logs(log_type);

-- 複合インデックス（タイムライン表示用）
CREATE INDEX IF NOT EXISTS activity_logs_log_type_created_at_idx ON activity_logs(log_type, created_at DESC);
