-- Migration Phase 18: Admin Title Customization
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS admin_title TEXT;
