-- 補充真正缺失的 table（Code 有用到但 migration 沒有建立過）
-- 2026-03-30

-- ── user_reports（使用者舉報記錄，super-admin 用）────────────────────────
-- 注意：social_reports 是社群文章舉報；user_reports 是對使用者帳號的舉報
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  reported_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES admin_users(id),
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON user_reports (reported_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports (status, created_at DESC);

-- ── response_tags（填答標籤，用於 CSV 匯出分析）──────────────────────────
-- 注意：這是一個扁平化的標籤表，跟 user_tags 類似但用於匯出統計
CREATE TABLE IF NOT EXISTS response_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_response_tags_response ON response_tags (response_id);
CREATE INDEX IF NOT EXISTS idx_response_tags_tag ON response_tags (tag);
