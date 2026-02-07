-- ============================================
-- user_routines テーブルに started_at, ended_at カラムを追加
-- ============================================

-- started_at: 利用開始日（自動設定）
ALTER TABLE user_routines
ADD COLUMN started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ended_at: 利用停止日（NULL=アクティブ）
ALTER TABLE user_routines
ADD COLUMN ended_at TIMESTAMP WITH TIME ZONE;

-- 既存レコードの started_at を created_at の値で更新
UPDATE user_routines SET started_at = created_at WHERE started_at IS NULL;

-- インデックス追加（利用中/停止中のソート用）
CREATE INDEX IF NOT EXISTS user_routines_ended_at_idx ON user_routines(ended_at NULLS FIRST);

-- 開始日順ソート用
CREATE INDEX IF NOT EXISTS user_routines_started_at_idx ON user_routines(started_at DESC);
