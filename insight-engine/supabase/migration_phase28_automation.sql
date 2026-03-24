-- Phase 28: 自動化規則 + 免費試用

-- 自動化規則表
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '自動化規則',
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_tenant ON automation_rules (tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_automation_survey ON automation_rules (survey_id);

-- 免費試用欄位（加到 tenants 表）
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial';

CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants (plan);
