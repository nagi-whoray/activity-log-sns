-- ============================================
-- user_routines（ユーザールーティン）テーブル
-- ============================================
-- 定型的な活動のテンプレートを管理

CREATE TABLE IF NOT EXISTS user_routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,                              -- ルーティンのタイトル（例: 「朝のランニング」）
  category activity_category NOT NULL,             -- カテゴリ（既存のENUM型を使用）
  duration_minutes INTEGER,                         -- 所要時間（分）- NULLable
  content TEXT,                                     -- 内容（URLの自動リンク化対象）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security) の有効化
-- ============================================

ALTER TABLE user_routines ENABLE ROW LEVEL SECURITY;

-- 全員がルーティンを閲覧可能（公開）
CREATE POLICY "User routines are viewable by everyone"
  ON user_routines FOR SELECT
  USING (true);

-- ユーザーは自分のルーティンのみ作成可能
CREATE POLICY "Users can insert their own routines"
  ON user_routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のルーティンのみ更新可能
CREATE POLICY "Users can update their own routines"
  ON user_routines FOR UPDATE
  USING (auth.uid() = user_id);

-- ユーザーは自分のルーティンのみ削除可能
CREATE POLICY "Users can delete their own routines"
  ON user_routines FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- トリガー: updated_at の自動更新
-- ============================================

DROP TRIGGER IF EXISTS set_user_routines_updated_at ON user_routines;
CREATE TRIGGER set_user_routines_updated_at
  BEFORE UPDATE ON user_routines
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- インデックス（パフォーマンス最適化）
-- ============================================

-- ユーザー別ルーティン取得用
CREATE INDEX IF NOT EXISTS user_routines_user_id_idx ON user_routines(user_id);

-- カテゴリ別取得用
CREATE INDEX IF NOT EXISTS user_routines_category_idx ON user_routines(category);

-- ============================================
-- activity_logs テーブルに routine_id カラムを追加
-- ============================================

ALTER TABLE activity_logs
ADD COLUMN routine_id UUID REFERENCES user_routines(id) ON DELETE SET NULL;

-- インデックス追加（ルーティン別の投稿検索用）
CREATE INDEX IF NOT EXISTS activity_logs_routine_id_idx ON activity_logs(routine_id);
