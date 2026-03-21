-- Phase 16: Email 驗證碼 + admin_users 新增 email 欄位
-- ============================================================

-- 1. admin_users 加入 email 欄位
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email) WHERE email IS NOT NULL;

-- 2. Email 驗證碼表
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,            -- SHA-256 hashed
  purpose TEXT NOT NULL DEFAULT 'register',  -- register | login_2fa | reset_password
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evc_email_purpose ON email_verification_codes (email, purpose);

-- 3. 自動清理過期驗證碼（每次新增時觸發）
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM email_verification_codes
  WHERE expires_at < now() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_expired_codes ON email_verification_codes;
CREATE TRIGGER trg_cleanup_expired_codes
  AFTER INSERT ON email_verification_codes
  EXECUTE FUNCTION cleanup_expired_verification_codes();
