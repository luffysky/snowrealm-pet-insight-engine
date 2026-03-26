-- Phase 36: 補齊直接在 Supabase 建立的表（本地 migration 缺失）
-- 包含：media_assets、payment_logs、broadcast_logs

-- 媒體資源表（R2/S3 上傳紀錄）
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  url TEXT NOT NULL,
  filename TEXT NOT NULL DEFAULT '',
  original_name TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT '',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  folder TEXT NOT NULL DEFAULT 'uploads',
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_tenant ON media_assets (tenant_id);

-- 付款紀錄表（藍新金流）
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  subscription_id UUID,
  trade_no TEXT,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  provider TEXT DEFAULT 'newebpay',
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_tenant ON payment_logs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_logs_trade ON payment_logs (trade_no);

-- 廣播推播紀錄表
CREATE TABLE IF NOT EXISTS broadcast_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  tag_filter JSONB,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ,
  tenant_id TEXT DEFAULT 'default'
);

CREATE INDEX IF NOT EXISTS idx_broadcast_logs_tenant ON broadcast_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_created_at ON broadcast_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_scheduled ON broadcast_logs (scheduled_at)
  WHERE scheduled_at IS NOT NULL AND sent_count = 0;
