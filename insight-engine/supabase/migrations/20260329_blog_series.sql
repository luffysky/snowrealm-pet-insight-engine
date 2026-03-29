-- Blog series (連載系列)
CREATE TABLE IF NOT EXISTS blog_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_series_user ON blog_series(user_id);

-- Add series columns to articles
ALTER TABLE user_blog_articles
  ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES blog_series(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS series_order INT;

CREATE INDEX IF NOT EXISTS idx_blog_articles_series ON user_blog_articles(series_id, series_order);
