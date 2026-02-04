-- Supabase Storage セットアップ
-- このSQLをSupabaseダッシュボードのSQL Editorで実行してください

-- 1. activity-images バケットを作成（公開バケット）
INSERT INTO storage.buckets (id, name, public)
VALUES ('activity-images', 'activity-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. アップロード許可（認証ユーザーのみ、自分のフォルダにのみ）
CREATE POLICY "Users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'activity-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. 閲覧許可（全員）
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'activity-images');

-- 4. 削除許可（本人のみ）
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'activity-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. 更新許可（本人のみ）
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'activity-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
