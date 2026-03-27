-- SOCIAL-2: 限時動態（Stories）

-- 動態主體
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  -- Canvas 資料（layers、背景、音樂等）
  canvas JSONB NOT NULL DEFAULT '{}',
  -- 設定
  visibility TEXT NOT NULL DEFAULT 'public',  -- 'public' | 'followers'
  expires_at TIMESTAMPTZ NOT NULL,             -- 24h/72h/永久
  is_highlight BOOLEAN NOT NULL DEFAULT false, -- 精選動態（不過期）
  -- 統計
  view_count INT NOT NULL DEFAULT 0,
  -- 狀態
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 觀看紀錄（去重，每人只算一次）
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (story_id, viewer_id)
);

-- 投票貼圖
CREATE TABLE IF NOT EXISTS story_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 投票紀錄
CREATE TABLE IF NOT EXISTS story_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES story_polls(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  choice TEXT NOT NULL,  -- 'a' | 'b'
  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (poll_id, voter_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_stories_user_active ON stories (user_id, is_active, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_active_public ON stories (is_active, expires_at) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_views (story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer ON story_views (viewer_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_polls_story ON story_polls (story_id);
