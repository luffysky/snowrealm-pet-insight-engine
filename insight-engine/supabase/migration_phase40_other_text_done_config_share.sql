-- Phase 40: 其他選項文字填答 + doneConfig 後台設定 + ai_insight_reports 分享欄位

-- 1. 題目表新增 allow_other_text 欄位
ALTER TABLE questions ADD COLUMN IF NOT EXISTS allow_other_text BOOLEAN DEFAULT false;

-- 2. 問卷表確保 done_config 欄位存在
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS done_config JSONB DEFAULT '{}';

-- 3. ai_insight_reports 分享欄位
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_slug TEXT UNIQUE;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_title TEXT;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_views INT DEFAULT 0;

-- 4. 為分享欄位建立索引
CREATE INDEX IF NOT EXISTS idx_insight_reports_share ON ai_insight_reports (share_slug) WHERE is_public = true;

-- 5. 設定毛行天下 MVP 問卷的 done_config（若尚未設定）
UPDATE surveys
SET done_config = '{"showWaitlist":true,"waitlistFields":{"nickname":true,"email":true,"lineId":true},"showStoryCard":true,"showDownloadAnswers":true}'
WHERE slug = 'maoxingtianxia-mvp-survey'
  AND (done_config IS NULL OR done_config::text = '{}');
