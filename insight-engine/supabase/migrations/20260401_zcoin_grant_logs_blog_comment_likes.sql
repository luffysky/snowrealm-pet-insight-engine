-- Bug 103: 部落格留言按讚
ALTER TABLE blog_comments ADD COLUMN IF NOT EXISTS like_count INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS blog_comment_likes (
  comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_id, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_blog_comment_likes_comment ON blog_comment_likes (comment_id);

-- Z幣發放記錄 + 給使用者的話
ALTER TABLE zcoin_transactions ADD COLUMN IF NOT EXISTS note TEXT;

CREATE TABLE IF NOT EXISTS zcoin_grant_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  amount INT NOT NULL,
  reason TEXT,
  note TEXT,
  affected_count INT NOT NULL DEFAULT 0,
  target_user_ids TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zcoin_grant_logs_created ON zcoin_grant_logs (created_at DESC);
