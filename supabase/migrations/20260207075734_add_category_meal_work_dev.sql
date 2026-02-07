-- 新しいカテゴリを追加: 食事(meal), 仕事(work), 開発(dev)
ALTER TYPE activity_category ADD VALUE IF NOT EXISTS 'meal';
ALTER TYPE activity_category ADD VALUE IF NOT EXISTS 'work';
ALTER TYPE activity_category ADD VALUE IF NOT EXISTS 'dev';
