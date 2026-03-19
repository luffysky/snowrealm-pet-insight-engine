-- ===== Phase 7: Broadcast + LINE Users =====

-- 1. broadcast_logs — 推播紀錄表
CREATE TABLE IF NOT EXISTS broadcast_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  tag_filter JSONB,
  sent_count INT NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_logs_scheduled
  ON broadcast_logs (scheduled_at)
  WHERE scheduled_at IS NOT NULL AND sent_count = 0;

CREATE INDEX IF NOT EXISTS idx_broadcast_logs_created_at
  ON broadcast_logs (created_at DESC);

-- 2. line_users — LINE 使用者綁定表（官方帳號好友 + LIFF 綁定）
CREATE TABLE IF NOT EXISTS line_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  response_id UUID REFERENCES responses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_users_response_id
  ON line_users (response_id)
  WHERE response_id IS NOT NULL;

-- 3. responses 新增 updated_at（供 cron/remind 使用）
ALTER TABLE responses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
