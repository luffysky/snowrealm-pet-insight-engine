-- ============================================================
-- 部落格訂閱者系統
-- ============================================================

CREATE TABLE IF NOT EXISTS blog_subscribers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_user_id     UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  email            TEXT NOT NULL,
  name             TEXT,
  is_verified      BOOLEAN NOT NULL DEFAULT false,
  verify_token     TEXT,
  unsubscribe_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (blog_user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_blog_subscribers_blog
  ON blog_subscribers (blog_user_id);

CREATE INDEX IF NOT EXISTS idx_blog_subscribers_unsubscribe
  ON blog_subscribers (unsubscribe_token);
