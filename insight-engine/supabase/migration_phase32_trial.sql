-- Phase 32: Free Trial Enforcement
-- Add trial/plan columns to tenants table

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;

-- Set trial_started_at for existing tenants that don't have it
UPDATE tenants
SET trial_started_at = created_at,
    trial_expires_at = created_at + INTERVAL '30 days'
WHERE trial_started_at IS NULL AND plan = 'trial';
