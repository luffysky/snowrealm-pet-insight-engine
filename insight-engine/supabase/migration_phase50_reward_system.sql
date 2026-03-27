-- Phase 50: 獎勵系統補齊 — ad_views, daily_task_logs, zcoin tables 確保存在
-- 2026-03-28

-- ===== Z幣錢包（如果 phase42 沒跑到） =====

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
  amount INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  reason TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zcoin_wallets_user ON zcoin_wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_zcoin_wallets_line ON zcoin_wallets (line_user_id);
CREATE INDEX IF NOT EXISTS idx_zcoin_transactions_wallet ON zcoin_transactions (wallet_id, created_at DESC);

-- ===== 每日任務完成記錄 =====

CREATE TABLE IF NOT EXISTS daily_task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_task_logs (user_id, completed_at);

-- ===== 廣告觀看記錄 =====

CREATE TABLE IF NOT EXISTS ad_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reward_type TEXT NOT NULL DEFAULT 'zcoin_reward',
  reward_amount INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ad_views_user_date ON ad_views (user_id, viewed_at DESC);

-- ===== Z幣充值訂單 =====

CREATE TABLE IF NOT EXISTS zcoin_recharge_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  package_id TEXT NOT NULL,
  amount_zcoin INT NOT NULL,
  amount_ntd INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_zcoin_recharge_user ON zcoin_recharge_orders (user_id, created_at DESC);

-- ===== 訊息編輯欄位 =====

ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
