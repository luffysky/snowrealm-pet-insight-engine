-- 封禁系統（Super Admin 專用）
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES admin_users(id);

-- 用戶互封（一般用戶可以封鎖另一個用戶）
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON user_blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON user_blocks (blocked_id);
