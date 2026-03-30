-- ── Phase 54: 雪凜 AI 對話歷史保存 ──────────────────────────────────

CREATE TABLE IF NOT EXISTS guide_chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_key   TEXT NOT NULL,                        -- 'user:{userId}' 或 'ip:{ip}'
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  mood       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guide_chat_messages_user
  ON guide_chat_messages (user_key, created_at DESC);

-- 自動清理：只保留最近 7 天的對話（節省空間）
-- 可搭配 cron job 定期執行：
-- DELETE FROM guide_chat_messages WHERE created_at < NOW() - INTERVAL '7 days';
