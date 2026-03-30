-- 總後台所需 DB 補完 Migration
-- 2026-03-31
-- 涵蓋：admin_upgrade / yukirin_agent / guide_chat / missing_tables / friend_qr
-- 全部 IF NOT EXISTS，可安全重複執行

-- ═══════════════════════════════════════════════════════════
-- 來自 20260330_admin_upgrade.sql
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  category TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_category ON activity_log(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_time ON activity_log(created_at DESC);
ALTER TABLE activity_log REPLICA IDENTITY FULL;

CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  details TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('story', 'comment', 'message', 'image')),
  content_id TEXT NOT NULL,
  content_preview TEXT,
  author_id UUID,
  ai_categories JSONB,
  ai_confidence FLOAT,
  ai_action TEXT CHECK (ai_action IN ('pass', 'flag', 'block')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'removed', 'warned', 'banned')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moderation_status ON content_moderation_queue(status, created_at DESC);

CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  risk_signals JSONB,
  added_by TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID,
  resolved_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);

CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  fingerprint TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_device_fp ON device_fingerprints(fingerprint);
CREATE INDEX IF NOT EXISTS idx_device_user ON device_fingerprints(user_id);

CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  ai_moderation_status TEXT DEFAULT 'pending' CHECK (ai_moderation_status IN ('pending', 'approved', 'flagged', 'removed')),
  ai_moderation_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_file_user ON file_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_file_status ON file_metadata(ai_moderation_status);

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS on_watchlist BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS device_fingerprints TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS known_ips TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banned_reason TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banned_by UUID;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_orders') THEN
    ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
    ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ai_cost_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  model TEXT NOT NULL,
  intent_type TEXT,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10, 6) DEFAULT 0,
  conversation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_cost_time ON ai_cost_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cost_model ON ai_cost_log(model);

-- ═══════════════════════════════════════════════════════════
-- 來自 20260330_yukirin_agent.sql
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'reminder', 'weekly_report', 'streak_reminder', 'survey_followup',
    'zcoin_alert', 'birthday', 'comeback', 'content_digest',
    'achievement_nudge', 'custom', 'delayed_push'
  )),
  execute_at TIMESTAMPTZ NOT NULL,
  recurring JSONB,
  payload JSONB DEFAULT '{}',
  channel TEXT DEFAULT 'line' CHECK (channel IN ('line', 'web', 'both')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled', 'failed')),
  yukirin_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_execute ON scheduled_tasks(execute_at, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON scheduled_tasks(user_id);

CREATE TABLE IF NOT EXISTS push_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel TEXT NOT NULL,
  message TEXT NOT NULL,
  mood TEXT,
  trigger_type TEXT,
  trigger_skill TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_log(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS skill_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO skill_settings (skill_id, enabled) VALUES
  ('survey_recommend', true), ('survey_reminder', true), ('result_comparator', true),
  ('social_digest', true), ('trending_detector', true), ('story_coach', true),
  ('zcoin_advisor', true), ('zcoin_goal_tracker', true), ('shop_alert', true),
  ('weekly_reporter', true), ('achievement_coach', true), ('mood_tracker', true),
  ('personality_evolution', true), ('reminder', true), ('daily_task_master', true),
  ('greeting_master', true), ('admin_morning_brief', true), ('anomaly_detector', true),
  ('cost_watchdog', true)
ON CONFLICT (skill_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_notification_prefs (
  user_id UUID PRIMARY KEY,
  proactive_enabled BOOLEAN DEFAULT TRUE,
  morning_greeting BOOLEAN DEFAULT FALSE,
  streak_reminder BOOLEAN DEFAULT TRUE,
  weekly_report BOOLEAN DEFAULT TRUE,
  social_notifications BOOLEAN DEFAULT TRUE,
  quiet_hours_start INTEGER DEFAULT 22,
  quiet_hours_end INTEGER DEFAULT 8,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  report_data JSONB NOT NULL,
  sent_via TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user ON user_weekly_reports(user_id, week_start DESC);

CREATE TABLE IF NOT EXISTS zcoin_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id UUID,
  item_name TEXT NOT NULL,
  target_amount INTEGER NOT NULL,
  achieved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_zcoin_goals_user ON zcoin_goals(user_id);

ALTER TABLE line_users ADD COLUMN IF NOT EXISTS platform_user_id UUID;
CREATE INDEX IF NOT EXISTS idx_line_users_platform ON line_users(platform_user_id) WHERE platform_user_id IS NOT NULL;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS followup_sent BOOLEAN DEFAULT FALSE;

-- ═══════════════════════════════════════════════════════════
-- 來自 20260330_guide_chat_tables.sql
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS guide_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_key TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_guide_msgs_user ON guide_chat_messages (user_key, created_at DESC);

CREATE TABLE IF NOT EXISTS guide_chat_rate (
  user_key TEXT NOT NULL,
  date DATE NOT NULL,
  free_used INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_key, date)
);
CREATE INDEX IF NOT EXISTS idx_guide_rate_date ON guide_chat_rate (date);

CREATE TABLE IF NOT EXISTS guide_chat_credits (
  user_key TEXT PRIMARY KEY,
  credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guide_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  intent_type TEXT,
  model TEXT,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_guide_conv_user ON guide_conversations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guide_conv_time ON guide_conversations(created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- 來自 20260330_missing_tables.sql
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  reported_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES admin_users(id),
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON user_reports (reported_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports (status, created_at DESC);

CREATE TABLE IF NOT EXISTS response_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_response_tags_response ON response_tags (response_id);
CREATE INDEX IF NOT EXISTS idx_response_tags_tag ON response_tags (tag);

-- ═══════════════════════════════════════════════════════════
-- 來自 20260330_friend_qr.sql
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS friend_qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);
CREATE INDEX IF NOT EXISTS idx_fqr_user ON friend_qr_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fqr_token ON friend_qr_tokens(token);

-- ═══════════════════════════════════════════════════════════
-- 通知發送 — platform_notifications 補充欄位
-- ═══════════════════════════════════════════════════════════
ALTER TABLE platform_notifications ADD COLUMN IF NOT EXISTS target_tenant_ids TEXT[];
ALTER TABLE platform_notifications ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text';
ALTER TABLE platform_notifications ADD COLUMN IF NOT EXISTS flex_json JSONB;
ALTER TABLE platform_notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
