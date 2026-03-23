-- Phase 21: 帳號軟刪除 + 客服系統

-- 帳號軟刪除欄位
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 客服工單
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

-- 客服訊息
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

-- 快速回覆模板
CREATE TABLE IF NOT EXISTS support_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  usage_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_status ON support_tickets (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_line_user ON support_tickets (line_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_ticket ON support_messages (ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_deleted ON admin_users (deleted_at) WHERE deleted_at IS NOT NULL;
