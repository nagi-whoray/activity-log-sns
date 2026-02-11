-- comment_reply 通知タイプを追加
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('like', 'comment', 'follow', 'comment_like', 'comment_reply'));
