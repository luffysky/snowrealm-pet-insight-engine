-- Phase 17b: LINE Login 欄位
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS line_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_line_id ON admin_users (line_id) WHERE line_id IS NOT NULL;
