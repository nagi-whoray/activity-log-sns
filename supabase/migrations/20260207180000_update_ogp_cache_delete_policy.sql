-- OGPキャッシュの削除ポリシーを更新
-- キャッシュデータは公開情報のため、誰でも削除可能にする

DROP POLICY IF EXISTS "Authenticated users can delete OGP cache" ON ogp_cache;

CREATE POLICY "Anyone can delete OGP cache"
  ON ogp_cache FOR DELETE
  USING (true);
