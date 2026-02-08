-- ============================================
-- notifications（通知）テーブル
-- ============================================
-- いいね、コメント、フォローの通知を管理

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,     -- 通知を受け取るユーザー
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,    -- アクションを起こしたユーザー
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow')),    -- 通知タイプ
  activity_log_id UUID REFERENCES activity_logs(id) ON DELETE CASCADE, -- いいね/コメント対象の投稿（nullable）
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,           -- コメントの場合のコメントID（nullable）
  is_read BOOLEAN DEFAULT FALSE NOT NULL,                              -- 既読フラグ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 重複防止: 同じユーザーが同じ投稿に同じタイプの通知を複数作らない
  UNIQUE(user_id, actor_id, type, activity_log_id)
);

-- ============================================
-- RLS (Row Level Security) の有効化
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分宛ての通知のみ閲覧可能
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- 認証ユーザーは通知を作成可能（actor_idが自分であること）
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

-- ユーザーは自分宛ての通知のみ更新可能（既読マーク用）
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ユーザーは自分が作成した通知のみ削除可能（いいね取消時など）
CREATE POLICY "Users can delete notifications they created"
  ON notifications FOR DELETE
  USING (auth.uid() = actor_id);

-- ============================================
-- インデックス（パフォーマンス最適化）
-- ============================================

-- ユーザー別通知取得用（最新順）
CREATE INDEX IF NOT EXISTS notifications_user_id_created_at_idx
  ON notifications(user_id, created_at DESC);

-- 未読通知カウント用（部分インデックス）
CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_idx
  ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- actor_id検索用（通知削除時に使用）
CREATE INDEX IF NOT EXISTS notifications_actor_id_idx ON notifications(actor_id);

-- activity_log_id検索用（投稿削除時のCASCADE用）
CREATE INDEX IF NOT EXISTS notifications_activity_log_id_idx ON notifications(activity_log_id);
