-- 好友 QR Token 表
-- 2026-03-30

CREATE TABLE IF NOT EXISTS friend_qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);
CREATE INDEX IF NOT EXISTS idx_fqr_user ON friend_qr_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fqr_token ON friend_qr_tokens(token);
