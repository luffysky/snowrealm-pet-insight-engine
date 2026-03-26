-- Phase 5: 爆款問卷模板系統
-- 建立 survey_templates 表，並 seed 10 個爆款模板

CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📋',
  category TEXT DEFAULT 'general',
  industry TEXT DEFAULT 'general',
  theme TEXT DEFAULT 'default',
  tags TEXT[] DEFAULT '{}',
  survey_config JSONB NOT NULL DEFAULT '{}',
  questions JSONB NOT NULL DEFAULT '[]',
  quiz_config JSONB,
  source TEXT NOT NULL DEFAULT 'platform',  -- 'platform' | 'tenant' | 'marketplace'
  tenant_id TEXT,
  created_by UUID,
  use_count INT DEFAULT 0,
  rating_sum INT DEFAULT 0,
  rating_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON survey_templates (category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_templates_featured ON survey_templates (is_featured, use_count DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_templates_source ON survey_templates (source) WHERE is_active = true;

-- 模板評分表
CREATE TABLE IF NOT EXISTS template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES survey_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (template_id, user_id)
);

-- Seed：10 個爆款模板
-- 注意：questions 和 quiz_config 欄位由應用程式從 viralTemplates.ts 動態寫入
-- 這裡只建立基本的 metadata 記錄，完整資料透過 seed script 補充

INSERT INTO survey_templates (slug, name, description, icon, category, theme, survey_config, questions, is_featured, source)
VALUES
  ('friend-persona',       '你在朋友眼中是什麼人？',  '朋友眼中的你，和你想的一樣嗎？',         '🪞', 'personality',   'candy',   '{}', '[]', true,  'platform'),
  ('love-personality',     '你的戀愛人格',             '浪漫派還是理性派？3 分鐘測出你的戀愛風格', '💕', 'relationship',  'sakura',  '{}', '[]', true,  'platform'),
  ('spirit-animal',        '你是哪種動物？',           '最低門檻的人格測試，5 題揭曉你的精神動物', '🐾', 'personality',   'forest',  '{}', '[]', true,  'platform'),
  ('life-path',            '你的未來人生路線',          '自由探索者 vs 穩定建造者',                '🔮', 'lifestyle',     'cyber',   '{}', '[]', false, 'platform'),
  ('workplace-role',       '你在職場的角色',            '領導者/執行者/創意人/協調者',             '💼', 'lifestyle',     'default', '{}', '[]', false, 'platform'),
  ('couple-compatibility', '情侶默契測驗',             '和另一半一起測，看看你們的默契有幾分！',   '💑', 'relationship',  'sakura',  '{}', '[]', true,  'platform'),
  ('life-values',          '你的人生價值觀',            '自由、愛、成就、還是意義？',              '🧭', 'lifestyle',     'ancient', '{}', '[]', false, 'platform'),
  ('hidden-talent',        '你的隱藏天賦',             '你還不知道自己有這個天賦！',              '✨', 'personality',   'game',    '{}', '[]', true,  'platform'),
  ('friendship-match',     '朋友適合你的程度',          '5 題測出你們的友誼相配度',                '🤝', 'relationship',  'ocean',   '{}', '[]', false, 'platform'),
  ('stress-style',         '你的壓力應對方式',          '行動派？獨處派？測出你的壓力釋放模式',    '🧘', 'lifestyle',     'noir',    '{}', '[]', false, 'platform')
ON CONFLICT (slug) DO NOTHING;
