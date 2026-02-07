-- Add is_image_private column to activity_logs table
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS is_image_private BOOLEAN DEFAULT FALSE;
