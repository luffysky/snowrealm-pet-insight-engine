-- 問卷密碼保護欄位
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS access_password TEXT;
