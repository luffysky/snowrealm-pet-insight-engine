-- Phase E: AI Settings + Survey Generation + Usage Quota
-- ai_provider_configs: 使用者的 AI provider 設定（加密存 API Key）
-- ai_usage_logs: AI 用量記錄 + 額度控制

CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 預留多租戶：目前 tenant_id = 'default'
  tenant_id TEXT NOT NULL DEFAULT 'default',
  -- openai | anthropic | google | cohere | groq
  provider TEXT NOT NULL,
  -- 顯示名稱（如「OpenAI - 主帳號」）
  display_name TEXT NOT NULL DEFAULT '',
  -- AES-256-GCM 加密後的 API Key（base64）
  encrypted_api_key TEXT NOT NULL,
  -- 加密用的 IV（base64）
  encryption_iv TEXT NOT NULL,
  -- 加密用的 auth tag（base64）
  encryption_tag TEXT NOT NULL,
  -- 預設使用的模型（如 gpt-4o-mini）
  default_model TEXT NOT NULL DEFAULT '',
  -- 是否為該 tenant 的主要 provider
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, provider, display_name)
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  -- generate | regenerate
  action TEXT NOT NULL CHECK (action IN ('generate', 'regenerate')),
  -- platform_key | own_key
  key_source TEXT NOT NULL CHECK (key_source IN ('platform_key', 'own_key')),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  -- 生成的問卷 survey_id（如有）
  survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
  -- token 用量
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  -- 是否計費
  is_free BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_provider_configs_tenant ON ai_provider_configs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_tenant ON ai_usage_logs (tenant_id, created_at);
