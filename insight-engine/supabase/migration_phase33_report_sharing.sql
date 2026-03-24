-- Phase 33: AI 洞察報告 — 分享功能 + 故事報告類型 + 支援客服表
-- ===================================================

-- 1. ai_insight_reports 新增分享欄位 + report_type
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'data';
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_slug TEXT UNIQUE;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_title TEXT;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_views INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_insight_reports_share
  ON ai_insight_reports (share_slug) WHERE is_public = true;

-- 2. ai_usage_logs action CHECK 擴充（加入 story、sentiment、chat 等新 action）
ALTER TABLE ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_action_check;
ALTER TABLE ai_usage_logs ADD CONSTRAINT ai_usage_logs_action_check
  CHECK (action IN (
    'generate', 'regenerate',
    'generate_meta', 'regenerate_meta',
    'chat', 'insight', 'story', 'sentiment'
  ));

-- 3. support_tickets（客服工單）
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  channel TEXT NOT NULL DEFAULT 'line',
  line_user_id TEXT,
  line_display_name TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  category TEXT,
  subject TEXT,
  assigned_to UUID REFERENCES admin_users(id),
  survey_id UUID REFERENCES surveys(id),
  response_id UUID REFERENCES responses(id),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_tenant_status ON support_tickets (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_line_user ON support_tickets (line_user_id);

-- 4. support_messages（客服訊息）
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  sender_id TEXT,
  sender_name TEXT,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_ticket ON support_messages (ticket_id, created_at);

-- 5. support_templates（快速回覆模板）
CREATE TABLE IF NOT EXISTS support_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  usage_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. survey_templates（問卷模板系統）
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'platform',
  tenant_id TEXT,
  created_by UUID REFERENCES admin_users(id),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  icon TEXT DEFAULT '📋',
  tags TEXT[] DEFAULT '{}',
  survey_config JSONB NOT NULL,
  questions JSONB NOT NULL,
  branch_config JSONB,
  use_count INT DEFAULT 0,
  rating_sum INT DEFAULT 0,
  rating_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_templates_industry ON survey_templates (industry) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_survey_templates_marketplace ON survey_templates (is_public, use_count DESC) WHERE is_active = true;

-- 7. automation_rules（已在 phase28，確認欄位齊全）
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMPTZ;
