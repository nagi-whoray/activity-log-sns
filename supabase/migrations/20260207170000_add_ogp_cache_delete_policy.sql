-- OGPキャッシュの削除ポリシーを追加
-- 認証済みユーザーがキャッシュを削除可能

CREATE POLICY "Authenticated users can delete OGP cache"
  ON ogp_cache FOR DELETE
  TO authenticated
  USING (true);
