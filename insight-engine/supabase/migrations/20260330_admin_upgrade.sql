-- 總後台升級：安全監控 + 活動記錄 + 內容審核 + 檔案管理
-- 2026-03-30

-- 活動記錄（即時活動流核心）
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  category TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_category ON activity_log(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_time ON activity_log(created_at DESC);
ALTER TABLE activity_log REPLICA IDENTITY FULL;

-- 系統警報
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  details TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 內容審核佇列
CREATE TABLE IF NOT EXISTS content_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('story', 'comment', 'message', 'image')),
  content_id TEXT NOT NULL,
  content_preview TEXT,
  author_id UUID,
  ai_categories JSONB,
  ai_confidence FLOAT,
  ai_action TEXT CHECK (ai_action IN ('pass', 'flag', 'block')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'removed', 'warned', 'banned')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moderation_status ON content_moderation_queue(status, created_at DESC);

-- 觀察名單
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  risk_signals JSONB,
  added_by TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID,
  resolved_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);

-- 裝置指紋
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  fingerprint TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_device_fp ON device_fingerprints(fingerprint);
CREATE INDEX IF NOT EXISTS idx_device_user ON device_fingerprints(user_id);

-- 檔案元數據
CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  ai_moderation_status TEXT DEFAULT 'pending' CHECK (ai_moderation_status IN ('pending', 'approved', 'flagged', 'removed')),
  ai_moderation_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_file_user ON file_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_file_status ON file_metadata(ai_moderation_status);

-- user_profiles 擴充欄位（逐一 ALTER，避免若已存在則報錯）
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS on_watchlist BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS device_fingerprints TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS known_ips TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banned_reason TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS banned_by UUID;

-- payment_orders 退款欄位（若已有此表）
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_orders') THEN
    ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
    ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
  END IF;
END $$;

-- AI 成本記錄表（若尚未建立）
CREATE TABLE IF NOT EXISTS ai_cost_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  model TEXT NOT NULL,
  intent_type TEXT,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10, 6) DEFAULT 0,
  conversation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_cost_time ON ai_cost_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cost_model ON ai_cost_log(model);
