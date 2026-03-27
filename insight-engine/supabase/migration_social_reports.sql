-- 社群檢舉/舉報系統
CREATE TABLE IF NOT EXISTS social_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 誰舉報
  reporter_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  reporter_name TEXT,
  -- 舉報目標
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user', 'message')),
  target_id TEXT NOT NULL,       -- post_id / comment_id / user_id
  target_content TEXT,           -- 被舉報的內容快照（方便審查）
  target_author_id TEXT,         -- 被舉報的人
  target_author_name TEXT,
  -- 舉報原因
  reason TEXT NOT NULL CHECK (reason IN (
    'spam',           -- 垃圾訊息
    'fraud',          -- 詐騙
    'harassment',     -- 騷擾/霸凌
    'inappropriate',  -- 不當內容
    'violence',       -- 暴力
    'privacy',        -- 侵犯隱私
    'copyright',      -- 侵犯著作權
    'other'           -- 其他
  )),
  description TEXT,              -- 補充說明
  -- 處理狀態
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES admin_users(id),
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  -- 時間
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE INDEX IF NOT EXISTS idx_social_reports_status ON social_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_reports_reporter ON social_reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_social_reports_target ON social_reports (target_type, target_id);
