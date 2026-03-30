-- ── Phase 53: 雪凜 AI 對話次數系統 ──────────────────────────────────

-- 免費每日次數追蹤
CREATE TABLE IF NOT EXISTS guide_chat_rate (
  user_key    TEXT PRIMARY KEY,          -- 'user:{userId}' 或 'ip:{ip}'
  free_used   INT  NOT NULL DEFAULT 0,   -- 當日已用免費次數
  reset_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 購買的額外次數（持久，不每日重置）
CREATE TABLE IF NOT EXISTS guide_chat_credits (
  user_key    TEXT PRIMARY KEY,
  credits     INT  NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cleanup jobs
CREATE INDEX IF NOT EXISTS idx_guide_chat_rate_date ON guide_chat_rate (reset_date);
