-- Social Posts
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'post', -- 'post' | 'article'
  title TEXT,
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'published',
  is_public BOOLEAN DEFAULT true,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_tenant ON social_posts (tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts (user_id, created_at DESC);

-- Social Reactions
CREATE TABLE IF NOT EXISTS social_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

-- Social Comments
CREATE TABLE IF NOT EXISTS social_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES social_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  gif_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_comments_post ON social_comments (post_id, created_at);

-- Extend admin_users with profile fields
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT true;
