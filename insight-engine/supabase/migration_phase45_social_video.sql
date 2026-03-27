-- Phase 45: social_posts 加影片欄位

ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;
