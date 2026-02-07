-- AIが生成したメッセージを保存するカラムを追加
-- ai_message: ログ投稿時にAIが生成した励ましメッセージ

ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS ai_message TEXT;
