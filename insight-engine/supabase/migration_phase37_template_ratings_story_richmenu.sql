-- Phase 37: 補齊 CLAUDE.md 定義但尚未建立的表
-- 包含：template_ratings、story_cards、line_rich_menus

-- 問卷模板評分（配合 survey_templates 使用）
CREATE TABLE IF NOT EXISTS template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES survey_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (template_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_template_ratings_template ON template_ratings (template_id);

-- 個人故事卡片（填答完成後 AI 生成的個人化卡片）
CREATE TABLE IF NOT EXISTS story_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  survey_id UUID REFERENCES surveys(id),
  card_data JSONB NOT NULL,       -- StoryCardData JSON（個人化事實 + 群體比較 + 引言）
  share_slug TEXT UNIQUE,         -- 公開分享用的短碼（如 sc-a3x9k2m1）
  is_public BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_cards_response ON story_cards (response_id);
CREATE INDEX IF NOT EXISTS idx_story_cards_survey ON story_cards (survey_id);
CREATE INDEX IF NOT EXISTS idx_story_cards_share ON story_cards (share_slug) WHERE is_public = true;

-- LINE Rich Menu 設定（儲存租戶自訂的 Rich Menu 資訊）
CREATE TABLE IF NOT EXISTS line_rich_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  rich_menu_id TEXT,              -- LINE API 回傳的 richmenu-xxx ID
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'default',  -- 'default'（新好友預設）| 'post_survey'（填答後切換）
  is_active BOOLEAN DEFAULT false,
  chat_bar_text TEXT DEFAULT '選單',
  size JSONB,                     -- { width, height }
  areas JSONB,                    -- Rich Menu 按鈕區域定義
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_rich_menus_tenant ON line_rich_menus (tenant_id);
CREATE INDEX IF NOT EXISTS idx_line_rich_menus_type ON line_rich_menus (tenant_id, type) WHERE is_active = true;
