-- OGPキャッシュの削除ポリシーを修正
-- 認証済みユーザーのみ削除可能に制限

DROP POLICY IF EXISTS "Anyone can delete OGP cache" ON ogp_cache;

CREATE POLICY "Authenticated users can delete OGP cache"
  ON ogp_cache FOR DELETE
  TO authenticated
  USING (true);
