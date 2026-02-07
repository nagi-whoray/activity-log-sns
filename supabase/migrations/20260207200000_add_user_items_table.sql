-- ============================================
-- user_items（ユーザーアイテム）テーブル
-- ============================================
-- 利用中のアイテム（プロテイン、美容製品など）を管理

CREATE TABLE IF NOT EXISTS user_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,                           -- 商品名
  product_url TEXT,                                     -- 商品URL（任意）
  usage_method TEXT,                                    -- 使用方法・頻度
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),   -- 利用開始日（自動設定、編集不可）
  ended_at TIMESTAMP WITH TIME ZONE,                   -- 利用停止日（NULL=利用中、設定後は編集不可）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security) の有効化
-- ============================================

ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;

-- 全員がアイテムを閲覧可能（公開）
CREATE POLICY "User items are viewable by everyone"
  ON user_items FOR SELECT
  USING (true);

-- ユーザーは自分のアイテムのみ作成可能
CREATE POLICY "Users can insert their own items"
  ON user_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のアイテムのみ更新可能
CREATE POLICY "Users can update their own items"
  ON user_items FOR UPDATE
  USING (auth.uid() = user_id);

-- ユーザーは自分のアイテムのみ削除可能
CREATE POLICY "Users can delete their own items"
  ON user_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- トリガー: updated_at の自動更新
-- ============================================

DROP TRIGGER IF EXISTS set_user_items_updated_at ON user_items;
CREATE TRIGGER set_user_items_updated_at
  BEFORE UPDATE ON user_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- インデックス（パフォーマンス最適化）
-- ============================================

-- ユーザー別アイテム取得用
CREATE INDEX IF NOT EXISTS user_items_user_id_idx ON user_items(user_id);

-- 利用中/停止中のソート用
CREATE INDEX IF NOT EXISTS user_items_ended_at_idx ON user_items(ended_at NULLS FIRST);

-- 開始日順ソート用
CREATE INDEX IF NOT EXISTS user_items_started_at_idx ON user_items(started_at DESC);
