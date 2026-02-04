-- Activity Log SNS データベーススキーマ
-- 活動ログSNS用の完全なテーブル定義
-- Supabase SQL Editor で実行してください

-- ============================================
-- 既存テーブルの削除（必要に応じてコメントアウト）
-- ============================================
-- DROP TABLE IF EXISTS comments CASCADE;
-- DROP TABLE IF EXISTS likes CASCADE;
-- DROP TABLE IF EXISTS activity_logs CASCADE;
-- DROP TABLE IF EXISTS posts CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- ENUM型の作成
-- ============================================

-- カテゴリタイプ（筋トレ/勉強/美容）
DO $$ BEGIN
  CREATE TYPE activity_category AS ENUM ('workout', 'study', 'beauty');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 1. users (profiles) テーブル
-- ============================================
-- 注: Supabaseでは auth.users と連携するため profiles という名前を使用

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. activity_logs（活動ログ投稿）テーブル
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category activity_category NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  activity_date DATE DEFAULT CURRENT_DATE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. likes（いいね）テーブル
-- ============================================

CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_log_id UUID REFERENCES activity_logs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 同じユーザーが同じ投稿に複数回いいねできないように制約
  UNIQUE(activity_log_id, user_id)
);

-- ============================================
-- 4. comments（コメント）テーブル
-- ============================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_log_id UUID REFERENCES activity_logs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security) の有効化
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- profiles のRLSポリシー
-- ============================================

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- activity_logs のRLSポリシー
-- ============================================

CREATE POLICY "Activity logs are viewable by everyone"
  ON activity_logs FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity logs"
  ON activity_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity logs"
  ON activity_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- likes のRLSポリシー
-- ============================================

CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- comments のRLSポリシー
-- ============================================

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- トリガー: 新規ユーザー登録時にプロフィール自動作成
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーが存在しない場合のみ作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- トリガー: updated_at の自動更新
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- activity_logs
DROP TRIGGER IF EXISTS set_activity_logs_updated_at ON activity_logs;
CREATE TRIGGER set_activity_logs_updated_at
  BEFORE UPDATE ON activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- comments
DROP TRIGGER IF EXISTS set_comments_updated_at ON comments;
CREATE TRIGGER set_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- インデックス（パフォーマンス最適化）
-- ============================================

-- activity_logs
CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_category_idx ON activity_logs(category);
CREATE INDEX IF NOT EXISTS activity_logs_activity_date_idx ON activity_logs(activity_date DESC);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs(created_at DESC);

-- likes
CREATE INDEX IF NOT EXISTS likes_activity_log_id_idx ON likes(activity_log_id);
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON likes(user_id);

-- comments
CREATE INDEX IF NOT EXISTS comments_activity_log_id_idx ON comments(activity_log_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at DESC);

-- ============================================
-- 便利なビュー（オプション）
-- ============================================

-- 活動ログにいいね数とコメント数を含めたビュー
CREATE OR REPLACE VIEW activity_logs_with_counts AS
SELECT
  al.*,
  p.username,
  p.display_name,
  p.avatar_url,
  COALESCE(l.likes_count, 0) AS likes_count,
  COALESCE(c.comments_count, 0) AS comments_count
FROM activity_logs al
LEFT JOIN profiles p ON al.user_id = p.id
LEFT JOIN (
  SELECT activity_log_id, COUNT(*) AS likes_count
  FROM likes
  GROUP BY activity_log_id
) l ON al.id = l.activity_log_id
LEFT JOIN (
  SELECT activity_log_id, COUNT(*) AS comments_count
  FROM comments
  GROUP BY activity_log_id
) c ON al.id = c.activity_log_id;

-- ============================================
-- セットアップ完了
-- ============================================
-- カテゴリの日本語対応:
--   'workout' = 筋トレ
--   'study'   = 勉強
--   'beauty'  = 美容
