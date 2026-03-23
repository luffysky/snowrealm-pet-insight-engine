-- Phase 26: 平台合作夥伴（僅指定 admin_users，不影響其他帳號）
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS platform_unlimited BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS platform_unlimited_at TIMESTAMPTZ;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS platform_unlimited_by UUID REFERENCES admin_users(id);

CREATE INDEX IF NOT EXISTS idx_admin_users_platform_unlimited
  ON admin_users (platform_unlimited) WHERE platform_unlimited = TRUE;

COMMENT ON COLUMN admin_users.platform_unlimited IS 'true 時：該帳號使用平台 AI Key 不套用免費額度上限（僅本人請求）';
