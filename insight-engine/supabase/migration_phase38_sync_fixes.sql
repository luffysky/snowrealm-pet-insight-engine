-- Phase 38: 同步 Supabase 手動調整（本地 migration 缺失項目）

-- 1. surveys.done_config — 填答完成頁自訂設定（直接在 Supabase 新增，migration 未涵蓋）
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS done_config JSONB DEFAULT '{}';

-- 2. admin_invites.tenant_id DEFAULT 修正
--    migration_phase14 硬編碼了 DEFAULT 'maoxingtianxia'，改為通用預設值
ALTER TABLE admin_invites ALTER COLUMN tenant_id SET DEFAULT 'default';

-- 3. tenants.plan DEFAULT 確認為 'free'（phase32 寫 'trial' 但實際應為 'free'）
ALTER TABLE tenants ALTER COLUMN plan SET DEFAULT 'free';
