-- 用戶相簿
-- 2026-03-27

CREATE TABLE IF NOT EXISTS user_album_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  url TEXT NOT NULL,
  caption TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_album_photos_user_public
  ON user_album_photos (user_id, is_public, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_album_photos_user_all
  ON user_album_photos (user_id, created_at DESC);
