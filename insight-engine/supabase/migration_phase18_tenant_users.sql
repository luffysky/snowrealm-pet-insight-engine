-- =============================================================
-- Phase 18: Multi-Tenant Architecture (User to Tenants mapping)
-- =============================================================

-- 1. 建立 tenant_users 關聯表
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(slug) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- 2. 將現有資料從 admin_users 轉移到 tenant_users
-- 由於先前的寫法是一人一租戶，這裡直接 SELECT 並 INSERT
INSERT INTO tenant_users (tenant_id, user_id, role)
SELECT tenant_id, id, role FROM admin_users
WHERE tenant_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. （可選）為 tenant_users 增加索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);
