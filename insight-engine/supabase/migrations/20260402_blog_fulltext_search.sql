-- BLOG-20: Add PostgreSQL full-text search to user_blog_articles
-- Uses 'simple' config for Chinese + English mixed content

-- Add tsvector column
ALTER TABLE user_blog_articles ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate existing rows
UPDATE user_blog_articles SET search_vector =
  setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(summary, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(array_to_string(tags, ' '), '')), 'B');

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_blog_search_vector ON user_blog_articles USING GIN (search_vector);

-- Trigger function to auto-update search_vector on insert/update
CREATE OR REPLACE FUNCTION blog_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blog_search_vector ON user_blog_articles;
CREATE TRIGGER trg_blog_search_vector
  BEFORE INSERT OR UPDATE OF title, summary, tags ON user_blog_articles
  FOR EACH ROW EXECUTE FUNCTION blog_search_vector_update();
