-- =============================================================
-- Phase 14: Multi-Tenant Foundation
-- 多租戶架構：tenants 表 + 所有核心表加 tenant_id
-- =============================================================

-- 1. 建立 tenants 表
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 預設租戶
INSERT INTO tenants (name, slug, plan)
VALUES ('毛行天下', 'maoxingtianxia', 'pro')
ON CONFLICT (slug) DO NOTHING;

-- 2. admin_users: 加 tenant_id
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
UPDATE admin_users SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default' OR tenant_id IS NULL;

-- 第一位管理員設為 super_admin
UPDATE admin_users SET role = 'super_admin'
WHERE id = (SELECT id FROM admin_users ORDER BY created_at ASC LIMIT 1);

-- 3. 核心表加 tenant_id
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
UPDATE surveys SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';

ALTER TABLE responses ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
UPDATE responses SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';

ALTER TABLE answers ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
UPDATE answers SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';

ALTER TABLE user_tags ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
UPDATE user_tags SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';

ALTER TABLE tag_rules ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
UPDATE tag_rules SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';

ALTER TABLE notification_rules ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
UPDATE notification_rules SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';

ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
UPDATE notification_logs SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';

ALTER TABLE broadcast_logs ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
UPDATE broadcast_logs SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';

ALTER TABLE line_users ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
UPDATE line_users SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';

ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
UPDATE message_templates SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';

ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
UPDATE waitlist SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';

ALTER TABLE utm_links ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
UPDATE utm_links SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';

ALTER TABLE survey_theme_settings ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
UPDATE survey_theme_settings SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';

-- admin_invites: 加 tenant_id + role
ALTER TABLE admin_invites ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'maoxingtianxia';
ALTER TABLE admin_invites ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';

-- line_admins: 加 tenant_id（若表存在）
DO $$ BEGIN
  ALTER TABLE line_admins ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
  UPDATE line_admins SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- click_events: 加 tenant_id（若表存在）
DO $$ BEGIN
  ALTER TABLE click_events ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
  UPDATE click_events SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 4. 更新已有 tenant_id 的表（從 'default' 改為實際值）
UPDATE ai_provider_configs SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';
UPDATE ai_usage_logs SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';
UPDATE line_configs SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';

-- 4c. webhook_configs, line_notification_styles（DO block 安全）
DO $$ BEGIN
  ALTER TABLE webhook_configs ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE line_notification_styles ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  UPDATE webhook_configs SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  UPDATE line_notification_styles SET tenant_id = 'maoxingtianxia' WHERE tenant_id = 'default';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 5. 索引
CREATE INDEX IF NOT EXISTS idx_surveys_tenant ON surveys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_responses_tenant ON responses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_answers_tenant ON answers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tenant ON user_tags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_tenant ON admin_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tag_rules_tenant ON tag_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_tenant ON broadcast_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_line_users_tenant ON line_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_tenant ON message_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_rules_tenant ON notification_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_tenant ON notification_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_tenant ON waitlist(tenant_id);
CREATE INDEX IF NOT EXISTS idx_utm_links_tenant ON utm_links(tenant_id);

-- 6. 主問卷標記（每個租戶只有一個 is_primary = true）
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
UPDATE surveys SET is_primary = true WHERE slug = 'maoxingtianxia-mvp-survey';
