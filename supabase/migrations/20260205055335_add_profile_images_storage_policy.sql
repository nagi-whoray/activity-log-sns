-- 既存のストレージポリシーを更新して profiles/{userId}/* パスも許可する

-- アップロードポリシーを更新
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
CREATE POLICY "Users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'activity-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'profiles'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

-- 削除ポリシーを更新
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'activity-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'profiles'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

-- 更新ポリシーを更新
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'activity-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'profiles'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);
