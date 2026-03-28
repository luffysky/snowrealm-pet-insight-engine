-- ============================================================
-- 使用者部落格系統
-- ============================================================

-- 部落格設定（每位用戶一筆）
CREATE TABLE IF NOT EXISTS user_blog_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES admin_users(id) ON DELETE CASCADE,
  blog_slug   TEXT UNIQUE,               -- 自訂 URL slug，NULL 時用 user_id
  blog_title  TEXT,                       -- 部落格標題
  blog_desc   TEXT,                       -- 部落格簡介
  is_enabled  BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_blog_settings_slug
  ON user_blog_settings(blog_slug) WHERE blog_slug IS NOT NULL;

-- 部落格文章
CREATE TABLE IF NOT EXISTS user_blog_articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  tenant_id    TEXT NOT NULL DEFAULT 'default',
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL,             -- 文章 slug（使用者 + slug 唯一）
  summary      TEXT,                       -- 摘要
  content      TEXT NOT NULL DEFAULT '',  -- HTML 內容
  cover_image  TEXT,                       -- 封面圖片 URL
  tags         TEXT[] NOT NULL DEFAULT '{}',
  is_public    BOOLEAN NOT NULL DEFAULT true,
  view_count   INT NOT NULL DEFAULT 0,
  seo_title    TEXT,
  seo_desc     TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_user_blog_articles_user
  ON user_blog_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_blog_articles_public
  ON user_blog_articles(user_id, is_public);
CREATE INDEX IF NOT EXISTS idx_user_blog_articles_slug
  ON user_blog_articles(user_id, slug);
