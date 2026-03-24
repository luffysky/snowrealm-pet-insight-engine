-- Phase 29: Rule Engine API Keys
-- 外部 API Key 表（供第三方開發者存取 Rule Engine）

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,        -- SHA-256 hash of the raw key
  key_prefix TEXT NOT NULL,             -- first 8 chars of raw key (for display)
  name TEXT,
  scopes TEXT[] NOT NULL DEFAULT '{}',  -- e.g. ['rules:read', 'validate', 'submit']
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys (key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys (tenant_id, is_active);
