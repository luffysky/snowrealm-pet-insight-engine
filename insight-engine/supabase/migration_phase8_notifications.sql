-- Phase C: Smart Notifications — 條件觸發 + 週報
-- notification_rules: 通知觸發規則
-- notification_logs: 通知發送記錄

CREATE TABLE IF NOT EXISTS notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  -- tag_match: 標籤比對觸發 | completion: 完成問卷觸發
  condition_type TEXT NOT NULL CHECK (condition_type IN ('tag_match', 'completion')),
  -- JSONB: tag_match → {"tag_key":"emotion_level","tag_value":"high","operator":"eq"}
  --        completion → {} (空即可)
  condition_config JSONB NOT NULL DEFAULT '{}',
  -- line_push_admin: 推播給管理員 | line_push_user: 推播給填寫者（需綁定）
  action_type TEXT NOT NULL CHECK (action_type IN ('line_push_admin', 'line_push_user')),
  -- 訊息模板，支援 {{response_id}}, {{survey_slug}}, {{tag_value}}, {{display_name}}
  message_template TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES notification_rules(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('rule', 'weekly_report', 'manual')),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('admin', 'user')),
  recipient_id TEXT NOT NULL,
  response_id UUID REFERENCES responses(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_rules_active ON notification_rules (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_logs_rule ON notification_logs (rule_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs (created_at);

-- 預設規則：高情感用戶通知管理員
INSERT INTO notification_rules (name, condition_type, condition_config, action_type, message_template)
VALUES (
  '高情感用戶通知',
  'tag_match',
  '{"tag_key":"emotion_level","tag_value":"high","operator":"eq"}',
  'line_push_admin',
  '⚡ 高情感用戶填寫了問卷！\nResponse ID: {{response_id}}\n問卷: {{survey_slug}}'
) ON CONFLICT DO NOTHING;

-- 預設規則：高紀念需求通知管理員
INSERT INTO notification_rules (name, condition_type, condition_config, action_type, message_template)
VALUES (
  '高紀念需求通知',
  'tag_match',
  '{"tag_key":"memorial_need","tag_value":"high","operator":"eq"}',
  'line_push_admin',
  '💛 高紀念需求用戶填寫了問卷！\nResponse ID: {{response_id}}\n問卷: {{survey_slug}}'
) ON CONFLICT DO NOTHING;

-- 預設規則：問卷完成通知填寫者（需 LINE 綁定）
INSERT INTO notification_rules (name, condition_type, condition_config, action_type, message_template)
VALUES (
  '完成感謝通知',
  'completion',
  '{}',
  'line_push_user',
  '🐾 感謝你完成問卷！你的回饋對我們非常重要，我們會持續改進毛行天下 ❤️'
) ON CONFLICT DO NOTHING;
