-- ===== Phase 13: LINE 環境設定後台化 =====
-- line_configs 表：儲存 LINE Channel 相關敏感/非敏感設定
-- 敏感值（Token / Secret）使用 AES-256-GCM 加密，同 ai_provider_configs 模式

CREATE TABLE IF NOT EXISTS line_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  config_key TEXT NOT NULL,
  config_value TEXT NOT NULL,
  is_secret BOOLEAN NOT NULL DEFAULT true,
  encryption_iv TEXT,
  encryption_tag TEXT,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, config_key)
);

CREATE INDEX IF NOT EXISTS idx_line_configs_tenant ON line_configs(tenant_id);
