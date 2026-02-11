-- ============================================
-- comment_likes（コメントいいね）テーブル
-- ============================================
-- コメントへのいいねを管理（likesテーブルと同じパターン）

CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 同じユーザーが同じコメントに複数回いいねできないように制約
  UNIQUE(comment_id, user_id)
);

-- ============================================
-- RLS (Row Level Security) の有効化
-- ============================================

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- コメントいいねは誰でも閲覧可能
CREATE POLICY "Comment likes are viewable by everyone"
  ON comment_likes FOR SELECT
  USING (true);

-- 認証ユーザーはコメントいいねを作成可能（user_idが自分であること）
CREATE POLICY "Authenticated users can insert comment likes"
  ON comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のコメントいいねのみ削除可能
CREATE POLICY "Users can delete their own comment likes"
  ON comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- インデックス
-- ============================================

CREATE INDEX IF NOT EXISTS comment_likes_comment_id_idx ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS comment_likes_user_id_idx ON comment_likes(user_id);

-- ============================================
-- notifications の type 制約を更新（'comment_like' を追加）
-- ============================================

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('like', 'comment', 'follow', 'comment_like'));

-- ============================================
-- notifications の UNIQUE制約を更新
-- ============================================
-- comment_likeは同じactivity_log_idの異なるcommentにいいねできる必要がある
-- comment_idも含めた新しいUNIQUE制約に変更

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_actor_id_type_activity_log_id_key;
ALTER TABLE notifications ADD CONSTRAINT notifications_unique_constraint
  UNIQUE(user_id, actor_id, type, activity_log_id, comment_id);
