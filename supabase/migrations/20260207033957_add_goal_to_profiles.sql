-- 目標カラムを追加
-- goal: ユーザーの現在の目標（マイページに表示される）

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goal TEXT;
