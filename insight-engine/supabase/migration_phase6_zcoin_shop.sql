-- Phase 6: Z幣商店 — 每日任務 + 充值訂單
-- 執行前確認 zcoin_wallets 和 zcoin_transactions 表已建立 (migration_phase6.sql)

-- 每日任務完成記錄
CREATE TABLE IF NOT EXISTS daily_task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date
  ON daily_task_logs (user_id, completed_at);

-- Z幣充值訂單
CREATE TABLE IF NOT EXISTS zcoin_recharge_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  package_id TEXT NOT NULL,          -- starter | basic | popular | value
  amount_zcoin INT NOT NULL,         -- 充值的 Z幣數量
  amount_ntd INT NOT NULL,           -- 付款金額（新台幣）
  status TEXT DEFAULT 'pending'      -- pending | completed | failed
    CHECK (status IN ('pending', 'completed', 'failed')),
  payment_id TEXT,                   -- 第三方金流交易 ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_zcoin_recharge_user
  ON zcoin_recharge_orders (user_id, created_at DESC);
