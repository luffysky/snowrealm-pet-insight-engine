-- Add cover image position field to blog articles
ALTER TABLE user_blog_articles
  ADD COLUMN IF NOT EXISTS cover_image_position TEXT DEFAULT 'center center';
