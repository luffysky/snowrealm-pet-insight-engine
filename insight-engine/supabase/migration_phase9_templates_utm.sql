-- Phase D: Templates + UTM Management + Rich Menu
-- message_templates: 可重複使用的訊息模板
-- utm_links: UTM 追蹤連結管理

CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  -- text | flex
  type TEXT NOT NULL CHECK (type IN ('text', 'flex')) DEFAULT 'text',
  -- text 模板的純文字內容
  content TEXT NOT NULL DEFAULT '',
  -- flex 模板的完整 JSON（LINE Flex Message contents）
  flex_json JSONB,
  -- 分類標籤，方便過濾
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utm_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  -- 完整帶 UTM 的連結（自動生成）
  full_url TEXT NOT NULL DEFAULT '',
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_active ON message_templates (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_utm_links_created ON utm_links (created_at);

-- 預設模板：問卷推廣
INSERT INTO message_templates (name, type, content, category) VALUES
  ('問卷推廣（簡短）', 'text', '📋 毛行天下 MVP 問卷\n\n花 2 分鐘填寫，幫助我們打造更好的寵物紀錄平台！', 'survey'),
  ('封測邀請', 'text', '🎉 毛行天下封測即將開放！\n\n填完問卷留下 email，上線第一時間通知你！', 'waitlist'),
  ('感謝回饋', 'text', '🐾 感謝你的寶貴回饋！\n\n你的意見會幫助我們打造更好的寵物紀錄平台 ❤️', 'general'),
  ('新功能上線', 'text', '🚀 毛行天下有新消息！\n\n我們正在加緊開發中，敬請期待 💛', 'announcement')
ON CONFLICT DO NOTHING;
