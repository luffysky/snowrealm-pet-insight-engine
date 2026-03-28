-- 多相簿支援

CREATE TABLE IF NOT EXISTS user_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL DEFAULT '我的相簿',
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_album_photos ADD COLUMN IF NOT EXISTS album_id UUID REFERENCES user_albums(id) ON DELETE SET NULL;
ALTER TABLE user_album_photos ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';

CREATE INDEX IF NOT EXISTS idx_user_albums_user ON user_albums (user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_album_photos_album ON user_album_photos (album_id, display_order);
