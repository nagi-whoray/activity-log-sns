-- ============================================
-- follows（フォロー関係）テーブル
-- ============================================
-- Supabase SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 同じユーザーを複数回フォローできないように制約
  UNIQUE(follower_id, following_id),
  -- 自分自身をフォローできないように制約
  CHECK (follower_id != following_id)
);

-- ============================================
-- RLS (Row Level Security) の有効化
-- ============================================

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 全員がフォロー関係を閲覧可能
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

-- 認証ユーザーが自分のフォローを作成可能
CREATE POLICY "Users can insert their own follows"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- 自分のフォローのみ削除可能（フォロー解除）
CREATE POLICY "Users can delete their own follows"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================
-- インデックス（パフォーマンス最適化）
-- ============================================

-- 「自分がフォローしているユーザー一覧」クエリ用
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows(follower_id);

-- 「自分をフォローしているユーザー一覧」クエリ用
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows(following_id);
