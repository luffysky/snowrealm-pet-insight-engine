-- Phase 52: Z 幣經濟體系 v2 — 商城 + 裝備 + 每日打卡 + LINE Pay 訂單
-- 2026-03-30
-- ⚠️ 完全 additive，不修改任何現有表

-- ===== Z 幣商城商品 =====
CREATE TABLE IF NOT EXISTS zcoin_shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,  -- 'emoji' | 'sticker' | 'theme' | 'frame' | 'title' | 'costume' | 'zaicai'
  name TEXT NOT NULL,
  description TEXT,
  price INT NOT NULL,                        -- Z 幣定價
  preview_url TEXT,                          -- 預覽圖
  asset_url TEXT,                            -- 解鎖後的素材 URL
  asset_data JSONB,                          -- 主題色 / 邊框設定等結構化資料
  rarity TEXT NOT NULL DEFAULT 'common',     -- 'common' | 'rare' | 'epic' | 'limited'
  is_limited BOOLEAN NOT NULL DEFAULT false,
  available_until TIMESTAMPTZ,               -- limited 商品到期時間
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_items_category ON zcoin_shop_items (category, is_active, display_order);

-- ===== 使用者擁有的商品 =====
CREATE TABLE IF NOT EXISTS zcoin_user_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES zcoin_shop_items(id),
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_items_user ON zcoin_user_items (user_id);

-- ===== 使用者裝備的商品（每個 slot 同時只能裝一個） =====
-- slot: 'title' | 'frame' | 'theme' | 'zaicai' | 'costume'
CREATE TABLE IF NOT EXISTS zcoin_user_equipped (
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  slot TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES zcoin_shop_items(id),
  equipped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, slot)
);

-- ===== 每日打卡（連續登入計算） =====
CREATE TABLE IF NOT EXISTS daily_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  streak_days INT NOT NULL DEFAULT 1,        -- 當日為第幾天連續
  zcoin_earned INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON daily_check_ins (user_id, check_in_date DESC);

-- ===== LINE Pay / 付款訂單（完整版，取代 zcoin_recharge_orders） =====
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,             -- "ZCOIN_timestamp_uuid" 格式
  user_id UUID NOT NULL REFERENCES admin_users(id),
  plan_id TEXT NOT NULL,                     -- plan_100 / plan_300 / plan_500 / plan_1000
  zcoin_amount INT NOT NULL,
  price_ntd INT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'line_pay', -- 'line_pay' | 'newebpay' | 'stripe'
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'expired')),
  transaction_id TEXT,                       -- LINE Pay transactionId
  line_pay_response JSONB,                   -- 完整 LINE Pay API 回應
  is_first_topup BOOLEAN NOT NULL DEFAULT false,
  bonus_zcoin INT NOT NULL DEFAULT 0,        -- 首儲加碼等額外發放
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,                    -- pending 訂單有效期（1 小時）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user    ON payment_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status  ON payment_orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_txn     ON payment_orders (transaction_id) WHERE transaction_id IS NOT NULL;

-- ===== Z 幣首儲記錄（方便快速查詢） =====
ALTER TABLE zcoin_wallets ADD COLUMN IF NOT EXISTS has_first_topup BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zcoin_wallets ADD COLUMN IF NOT EXISTS first_topup_at TIMESTAMPTZ;

-- ===== admin_users 補充欄位（支援 VRM 裝備 + 稱號） =====
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS equipped_title TEXT;    -- 稱號文字
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS equipped_frame TEXT;    -- 邊框 item_id
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS equipped_theme TEXT;    -- 主題 item_id
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS equipped_costume TEXT;  -- 雪凜服裝 item_id

-- ===== 種子資料：預設商城商品 =====
INSERT INTO zcoin_shop_items (category, name, description, price, rarity, display_order) VALUES
  -- 稱號
  ('title', '問卷達人',  '完成 10 份問卷解鎖',          80,  'common',  1),
  ('title', '故事說書人', '發布 5 篇故事解鎖',           80,  'common',  2),
  ('title', '招財 VIP',  '首次儲值 Z 幣解鎖（限定）',   0,   'limited', 3),
  ('title', '雪凜之友',  '與雪凜對話 50 次解鎖',        120, 'rare',    4),
  -- 主題
  ('theme', '薰衣草夢',  '薰衣草紫玻璃主題',            100, 'common',  10),
  ('theme', '桃粉泡泡',  '桃粉色玻璃主題',              100, 'common',  11),
  ('theme', '冰藍海洋',  '冰藍色玻璃主題',              100, 'common',  12),
  ('theme', '極夜星空',  '深黑星空主題（稀有）',         150, 'rare',    13),
  -- 卡片邊框
  ('frame', '星星邊框',  '閃爍星星邊框',                50,  'common',  20),
  ('frame', '花瓣邊框',  '粉色花瓣邊框',                50,  'common',  21),
  ('frame', '彩虹光暈',  '彩虹漸層光暈（稀有）',        80,  'rare',    22)
ON CONFLICT DO NOTHING;
