-- Blog comments
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES user_blog_articles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT '匿名訪客',
  author_email TEXT,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 1000),
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog_comments_article ON blog_comments(article_id, created_at);

-- Blog reactions (emoji)
CREATE TABLE IF NOT EXISTS blog_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES user_blog_articles(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '❤️',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, fingerprint, emoji)
);
CREATE INDEX IF NOT EXISTS idx_blog_reactions_article ON blog_reactions(article_id);
