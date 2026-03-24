-- Phase 35: Platform notifications + notification styles for super admin

-- 平台通知
CREATE TABLE IF NOT EXISTS platform_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  category TEXT NOT NULL DEFAULT 'announcement',
  target TEXT NOT NULL DEFAULT 'all',
  target_tenant_ids TEXT[],
  channels TEXT[] DEFAULT ARRAY['line','dashboard'],
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_notifications_status ON platform_notifications (status);
CREATE INDEX IF NOT EXISTS idx_platform_notifications_created ON platform_notifications (created_at DESC);

-- 通知已讀紀錄
CREATE TABLE IF NOT EXISTS notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES platform_notifications(id) ON DELETE CASCADE,
  user_id UUID,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (notification_id, user_id)
);

-- 平台通知樣式
CREATE TABLE IF NOT EXISTS platform_notification_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  header_color TEXT DEFAULT '#1DB446',
  header_text TEXT,
  body_template TEXT NOT NULL DEFAULT '',
  footer_text TEXT,
  button_label TEXT,
  button_url TEXT,
  text_template TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 預設通知樣式 seed
INSERT INTO platform_notification_styles (event_type, display_name, header_color, body_template, text_template) VALUES
  ('new_signup', '新用戶註冊', '#1DB446', '🎉 新用戶 {{userName}} 已加入！\n組織：{{orgName}}', '🎉 新用戶 {{userName}} 加入了 {{orgName}}'),
  ('survey_complete', '問卷填答完成', '#4A90E2', '📋 {{surveyTitle}} 收到新回覆\n填答者：{{displayName}}', '📋 {{surveyTitle}} 有新回覆'),
  ('ai_report_ready', 'AI 報告生成完成', '#7B61FF', '✨ AI 洞察報告已產出\n問卷：{{surveyTitle}}', '✨ {{surveyTitle}} 的 AI 報告已就緒'),
  ('weekly_report', '每週報告', '#FF6B35', '📊 本週問卷摘要\n回覆：{{responseCount}} 筆 | 完成率：{{completionRate}}%', '📊 本週共收到 {{responseCount}} 筆回覆'),
  ('payment_success', '付款成功', '#1DB446', '💳 付款成功！\n方案：{{planName}} | 金額：{{amount}}', '💳 付款成功，{{planName}} 已啟用'),
  ('trial_expiring', '試用即將到期', '#FF9500', '⏰ 試用將於 {{daysLeft}} 天後到期\n升級保留所有數據', '⏰ 試用還剩 {{daysLeft}} 天'),
  ('trial_expired', '試用已到期', '#FF3B30', '⚠️ 試用已到期，部分功能已暫停\n點此升級繼續使用', '⚠️ 試用已到期，請升級方案'),
  ('response_milestone', '回覆數里程碑', '#FFD60A', '🎊 恭喜達成里程碑！\n{{surveyTitle}} 已累積 {{count}} 筆回覆', '🎊 {{surveyTitle}} 達到 {{count}} 筆回覆！'),
  ('support_new_ticket', '新客服工單', '#FF6B6B', '📬 新客服工單 #{{ticketId}}\n來自：{{customerName}}', '📬 新工單：{{subject}}'),
  ('system_alert', '系統異常警報', '#FF3B30', '🚨 系統警報\n{{message}}', '🚨 系統異常：{{message}}')
ON CONFLICT (event_type) DO NOTHING;
