-- YukiBoard × Insight 整合 — 新增資料表
-- 2026-04-06

-- 1. admin_users 補 avatar_url 欄位（/me 回傳用）
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';

-- 2. 問卷定義表
CREATE TABLE IF NOT EXISTS yukiboard_surveys (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question        TEXT NOT NULL,
  options         JSONB NOT NULL,          -- ["選項A", "選項B", "選項C"]
  trigger_emotions TEXT[],                 -- {"SAD", "ANGRY", "EXCITED"}
  reward_zcoin    INTEGER DEFAULT 1,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. 問卷回答記錄
CREATE TABLE IF NOT EXISTS yukiboard_survey_answers (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id       UUID REFERENCES yukiboard_surveys(id),
  user_id         TEXT,
  device_hash     TEXT,
  option_index    INTEGER NOT NULL,
  app_package     TEXT DEFAULT '',
  emotion         TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. 使用者鍵盤設定備份
CREATE TABLE IF NOT EXISTS yukiboard_user_settings (
  user_id              TEXT PRIMARY KEY,
  theme_id             TEXT DEFAULT '',
  keyboard_height_ratio FLOAT DEFAULT 0.35,
  keyboard_opacity     FLOAT DEFAULT 1.0,
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- 5. 預設問卷資料
INSERT INTO yukiboard_surveys (question, options, trigger_emotions, reward_zcoin) VALUES
  ('你最近壓力大嗎？', '["很大", "還好", "不大"]', ARRAY['SAD', 'ANGRY'], 1),
  ('你現在的心情如何？', '["開心", "普通", "不好"]', ARRAY['SAD'], 1),
  ('今天發生什麼好事了嗎？', '["有！", "沒有", "不確定"]', ARRAY['EXCITED'], 1)
ON CONFLICT DO NOTHING;

-- 6. Index 加速查詢
CREATE INDEX IF NOT EXISTS idx_survey_answers_survey_device ON yukiboard_survey_answers(survey_id, device_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_survey_answers_user ON yukiboard_survey_answers(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_surveys_active ON yukiboard_surveys(is_active, created_at DESC);
