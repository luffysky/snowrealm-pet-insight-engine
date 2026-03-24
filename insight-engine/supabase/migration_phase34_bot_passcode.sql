-- Phase 34: LINE Bot 管理員口令欄位（site_settings 新增 bot_admin_passcode）
-- 讓每個租戶可自訂 Insight Bot 的管理員註冊口令，不再硬編碼毛行天下專用文案

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_admin_passcode TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN site_settings.bot_admin_passcode IS 'Insight Bot 管理員口令（用戶輸入此口令後可取得一次性管理員註冊連結）';
