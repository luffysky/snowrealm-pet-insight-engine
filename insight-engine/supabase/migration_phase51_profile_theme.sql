-- Phase 51: 個人頁面主題 + 橫幅圖片
-- 2026-03-28

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS profile_theme TEXT DEFAULT 'default';
