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
