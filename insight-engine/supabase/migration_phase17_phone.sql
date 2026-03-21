-- Phase 17: 手機號碼欄位 + SMS 驗證
-- admin_users 加入手機欄位
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS phone TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_phone ON admin_users (phone) WHERE phone IS NOT NULL;

-- email_verification_codes 擴充支援手機驗證（共用同一張表）
-- 已有 email 欄位，加入 phone 欄位（二選一使用）
ALTER TABLE email_verification_codes ADD COLUMN IF NOT EXISTS phone TEXT;
