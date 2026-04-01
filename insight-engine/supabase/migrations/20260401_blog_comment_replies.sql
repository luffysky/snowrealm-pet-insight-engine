-- Blog comment replies: add parent_id for nested comments
ALTER TABLE blog_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE;
ALTER TABLE blog_comments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES admin_users(id);
ALTER TABLE blog_comments ADD COLUMN IF NOT EXISTS author_avatar TEXT;
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_comments(parent_id);
