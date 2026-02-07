-- OGPキャッシュテーブルの作成
-- URLのOGPメタデータをキャッシュして、再取得を防止する

CREATE TABLE IF NOT EXISTS ogp_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  image_url TEXT,
  site_name TEXT,
  favicon_url TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- URL検索用インデックス
CREATE INDEX IF NOT EXISTS ogp_cache_url_idx ON ogp_cache(url);

-- 有効期限検索用インデックス
CREATE INDEX IF NOT EXISTS ogp_cache_expires_at_idx ON ogp_cache(expires_at);

-- RLSを有効化
ALTER TABLE ogp_cache ENABLE ROW LEVEL SECURITY;

-- 全員が閲覧可能（OGPデータは公開情報のため）
CREATE POLICY "OGP cache is viewable by everyone"
  ON ogp_cache FOR SELECT
  USING (true);

-- 認証済みユーザーが挿入可能
CREATE POLICY "Authenticated users can insert OGP cache"
  ON ogp_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 認証済みユーザーが更新可能
CREATE POLICY "Authenticated users can update OGP cache"
  ON ogp_cache FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
