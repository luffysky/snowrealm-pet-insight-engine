-- ============================================================
-- Phase 11: Survey Theme Settings
-- 問卷主題設定表 — 後台管理各問卷可用主題、預設主題、裝飾強度
-- ============================================================

CREATE TABLE IF NOT EXISTS survey_theme_settings (
  id            SERIAL PRIMARY KEY,
  survey_slug   TEXT NOT NULL UNIQUE,

  -- 預設主題（使用者未選時套用）
  default_theme TEXT NOT NULL DEFAULT 'default',

  -- 開放給使用者的主題清單 (JSON array of theme keys)
  available_themes JSONB NOT NULL DEFAULT '["default"]',

  -- 是否允許使用者自選主題
  allow_user_choice BOOLEAN NOT NULL DEFAULT false,

  -- 各主題裝飾強度 1=輕量 2=標準 3=華麗 (JSON object)
  theme_intensity JSONB NOT NULL DEFAULT '{"default": 2, "game": 2, "cyber": 2}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 為 MVP 問卷插入預設設定
INSERT INTO survey_theme_settings (survey_slug, default_theme, available_themes, allow_user_choice, theme_intensity)
VALUES (
  'maoxingtianxia-mvp-survey',
  'default',
  '["default", "game", "cyber"]',
  true,
  '{"default": 2, "game": 3, "cyber": 3}'
)
ON CONFLICT (survey_slug) DO NOTHING;
