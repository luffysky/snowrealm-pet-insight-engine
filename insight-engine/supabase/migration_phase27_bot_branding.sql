-- Phase 27: LINE Bot 品牌文案欄位（site_settings 新增 bot_* 欄位）
-- 讓每個租戶可自訂 LINE Bot 的歡迎訊息、介紹、預設回覆、完成訊息、問卷提示

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_welcome TEXT NOT NULL DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_intro TEXT NOT NULL DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_default_reply TEXT NOT NULL DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_completion TEXT NOT NULL DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_survey_prompt TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN site_settings.bot_welcome IS 'LINE Bot 歡迎加入訊息';
COMMENT ON COLUMN site_settings.bot_intro IS 'LINE Bot 介紹文案（回覆「你是誰」時使用）';
COMMENT ON COLUMN site_settings.bot_default_reply IS 'LINE Bot 預設回覆（無法識別關鍵字時使用）';
COMMENT ON COLUMN site_settings.bot_completion IS 'LINE Bot 填答完成訊息';
COMMENT ON COLUMN site_settings.bot_survey_prompt IS 'LINE Bot 問卷提示文案';
