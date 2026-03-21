-- Phase 15: site_settings（每租戶的 Meta/OG 設定 + 圖片管理）

CREATE TABLE IF NOT EXISTS site_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT NOT NULL UNIQUE REFERENCES tenants(slug) ON DELETE CASCADE,
  site_title    TEXT NOT NULL DEFAULT '',
  site_description TEXT NOT NULL DEFAULT '',
  og_title      TEXT NOT NULL DEFAULT '',
  og_description TEXT NOT NULL DEFAULT '',
  og_image_url  TEXT NOT NULL DEFAULT '',
  og_site_name  TEXT NOT NULL DEFAULT '',
  og_locale     TEXT NOT NULL DEFAULT 'zh_TW',
  twitter_card  TEXT NOT NULL DEFAULT 'summary_large_image',
  favicon_url   TEXT NOT NULL DEFAULT '',
  extra_meta    JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 為既有 tenant 插入預設值
INSERT INTO site_settings (tenant_id, site_title, site_description, og_site_name)
SELECT slug, name, name || ' 問卷系統', name
FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- 圖片資產表（通用，任何用途都可追蹤）
CREATE TABLE IF NOT EXISTS media_assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT NOT NULL REFERENCES tenants(slug) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  filename      TEXT NOT NULL DEFAULT '',
  original_name TEXT NOT NULL DEFAULT '',
  mime_type     TEXT NOT NULL DEFAULT '',
  size_bytes    INTEGER NOT NULL DEFAULT 0,
  folder        TEXT NOT NULL DEFAULT 'uploads',
  uploaded_by   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_tenant ON media_assets(tenant_id);
