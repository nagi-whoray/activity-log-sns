-- AI設定カラムを追加
-- ai_prompt: ユーザーの個人情報や目標（AIが覚えておくべきこと）
-- ai_tone: AIの口調やスタイルの指定

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_prompt TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_tone TEXT;
