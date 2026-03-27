-- Follow system
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);
CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);

-- Direct messages (encrypted content)
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL,
  iv TEXT NOT NULL,
  tag TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_dm_from ON direct_messages(from_user_id, created_at DESC);
CREATE INDEX idx_dm_to ON direct_messages(to_user_id, created_at DESC);
CREATE INDEX idx_dm_conversation ON direct_messages(LEAST(from_user_id::text, to_user_id::text), GREATEST(from_user_id::text, to_user_id::text), created_at DESC);
