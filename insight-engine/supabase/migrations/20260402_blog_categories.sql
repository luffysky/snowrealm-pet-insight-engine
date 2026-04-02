-- BLOG-15: Article category system
ALTER TABLE user_blog_articles ADD COLUMN IF NOT EXISTS category TEXT;
CREATE INDEX IF NOT EXISTS idx_blog_articles_category ON user_blog_articles (category) WHERE category IS NOT NULL;
