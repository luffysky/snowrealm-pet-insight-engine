-- Phase 42: 成長引擎 — result_config, explore, zcoin, referral
-- 2026-03-27

-- ===== 1. surveys 表新增欄位 =====

ALTER TABLE surveys ADD COLUMN IF NOT EXISTS result_config JSONB DEFAULT NULL;
-- result_config 格式：
-- {
--   "scoringRules": { "q1": { "選A": "guardian", "選B": "adventurer" }, ... },
--   "resultTypes": [{ "key": "guardian", "name": "守護者", "emoji": "🛡️", "description": "..." }]
-- }

ALTER TABLE surveys ADD COLUMN IF NOT EXISTS is_public_explore BOOLEAN DEFAULT false;
-- 是否公開到探索頁

-- ===== 2. Z幣系統 =====

CREATE TABLE IF NOT EXISTS zcoin_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_users(id),
  line_user_id TEXT,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  balance INT NOT NULL DEFAULT 0,
  total_earned INT NOT NULL DEFAULT 0,
  total_spent INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zcoin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES zcoin_wallets(id) ON DELETE CASCADE,
  amount INT NOT NULL,          -- 正數=收入, 負數=支出
  type TEXT NOT NULL,           -- 'earn' | 'spend'
  reason TEXT NOT NULL,         -- 'survey_complete' | 'share' | 'invite' | 'daily_login' | 'milestone' | 'unlock_template' | 'ai_usage'
  reference_id TEXT,            -- 關聯的 response_id / survey_id 等
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zcoin_wallets_user ON zcoin_wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_zcoin_wallets_line ON zcoin_wallets (line_user_id);
CREATE INDEX IF NOT EXISTS idx_zcoin_transactions_wallet ON zcoin_transactions (wallet_id, created_at DESC);

-- ===== 3. 裂變/推薦系統 =====

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES admin_users(id),
  referred_id UUID REFERENCES admin_users(id),
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'completed' | 'rewarded'
  commission_rate DECIMAL(4,3) NOT NULL DEFAULT 0.1,
  commission_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals (referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_id);

-- 在 admin_users 加推薦碼欄位（如果沒有的話）
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS referred_by TEXT;  -- 被哪個推薦碼邀請

-- ===== 4. 探索頁瀏覽紀錄 =====

CREATE TABLE IF NOT EXISTS survey_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  viewer_fingerprint TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_views_survey ON survey_views (survey_id, viewed_at DESC);
