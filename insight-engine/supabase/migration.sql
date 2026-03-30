-- ===== 毛行天下問卷系統 — Supabase 資料庫初始化 =====
-- 在 Supabase SQL Editor 中執行此檔案

-- UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. surveys 問卷表
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. questions 題目表
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single', 'multiple', 'text')),
  content TEXT NOT NULL,
  options JSONB DEFAULT '[]',
  order_index INT NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. responses 填答表
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- 4. answers 答案表
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  question_key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. user_tags 使用者標籤表
CREATE TABLE IF NOT EXISTS user_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  user_id UUID,
  tag_key TEXT NOT NULL,
  tag_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. admin_users 管理員表（可選）
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== 索引 =====
CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(status);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);
CREATE INDEX IF NOT EXISTS idx_responses_utm_source ON responses(utm_source);
CREATE INDEX IF NOT EXISTS idx_answers_response_id ON answers(response_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_key ON answers(question_key);
CREATE INDEX IF NOT EXISTS idx_user_tags_response_id ON user_tags(response_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag_key ON user_tags(tag_key);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag_key_value ON user_tags(tag_key, tag_value);

-- ===== RLS（Row Level Security）=====
-- 前台提交用：允許匿名 insert
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;

-- 允許匿名用戶 insert（前端提交問卷）
-- 重跑腳本時先刪除既有 policy，避免 already exists
DROP POLICY IF EXISTS "Allow anonymous insert on responses" ON responses;
DROP POLICY IF EXISTS "Allow anonymous insert on answers" ON answers;
DROP POLICY IF EXISTS "Allow anonymous insert on user_tags" ON user_tags;

CREATE POLICY "Allow anonymous insert on responses"
  ON responses FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous insert on answers"
  ON answers FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous insert on user_tags"
  ON user_tags FOR INSERT
  TO anon
  WITH CHECK (true);

-- 後台讀取透過 service_role key 繞過 RLS，不需要額外 policy
-- 總後台升級：安全監控 + 活動記錄 + 內容審核 + 檔案管理
-- 2026-03-30

-- 活動記錄（即時活動流核心）
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

-- 系統警報
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  details TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 內容審核佇列
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

-- 觀察名單
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

-- 裝置指紋
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

-- 檔案元數據
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

-- user_profiles 擴充欄位（若表存在才執行）
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS on_watchlist BOOLEAN DEFAULT FALSE;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS device_fingerprints TEXT[] DEFAULT '{}';
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS known_ips TEXT[] DEFAULT '{}';
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banned_reason TEXT;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ;
    ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banned_by UUID;
  END IF;
END $$;

-- payment_orders 退款欄位（若已有此表）
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_orders') THEN
    ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
    ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
  END IF;
END $$;

-- AI 成本記錄表（若尚未建立）
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

-- 雪凜 Agent 升級 — DB Migration
-- 2026-03-30

-- 排程任務
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

-- 推送記錄
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

-- 技能設定（全域，非使用者級）
CREATE TABLE IF NOT EXISTS skill_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初始化內建技能（啟用狀態）
INSERT INTO skill_settings (skill_id, enabled) VALUES
  ('survey_recommend', true),
  ('survey_reminder', true),
  ('result_comparator', true),
  ('social_digest', true),
  ('trending_detector', true),
  ('story_coach', true),
  ('zcoin_advisor', true),
  ('zcoin_goal_tracker', true),
  ('shop_alert', true),
  ('weekly_reporter', true),
  ('achievement_coach', true),
  ('mood_tracker', true),
  ('personality_evolution', true),
  ('reminder', true),
  ('daily_task_master', true),
  ('greeting_master', true),
  ('admin_morning_brief', true),
  ('anomaly_detector', true),
  ('cost_watchdog', true)
ON CONFLICT (skill_id) DO NOTHING;

-- 使用者通知偏好
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

-- 週報（個人化使用者版）
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

-- Z 幣目標
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

-- LINE 使用者與平台使用者映射
ALTER TABLE line_users ADD COLUMN IF NOT EXISTS platform_user_id UUID;
CREATE INDEX IF NOT EXISTS idx_line_users_platform ON line_users(platform_user_id) WHERE platform_user_id IS NOT NULL;

-- 回應記錄 — 追蹤問卷後追
ALTER TABLE responses ADD COLUMN IF NOT EXISTS followup_sent BOOLEAN DEFAULT FALSE;
