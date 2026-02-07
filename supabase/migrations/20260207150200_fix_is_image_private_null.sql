-- Fix existing records where is_image_private is null
UPDATE activity_logs SET is_image_private = FALSE WHERE is_image_private IS NULL;
