-- 雪凜對話系統 DB Migration
-- 2026-03-30
-- 涵蓋：對話歷史、每日限額、購買次數、對話紀錄（super-admin 監控）

-- ── 對話訊息歷史（登入用戶） ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guide_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_key TEXT NOT NULL,          -- 'user:{uuid}' 或 'ip:{addr}'
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_guide_msgs_user ON guide_chat_messages (user_key, created_at DESC);

-- 自動清理 90 天以上的訊息（避免無限增長）
-- 需手動建立排程或 cron，此處僅定義 table

-- ── 每日免費額度追蹤 ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guide_chat_rate (
  user_key TEXT NOT NULL,
  date DATE NOT NULL,
  free_used INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_key, date)
);
CREATE INDEX IF NOT EXISTS idx_guide_rate_date ON guide_chat_rate (date);

-- ── 購買的對話次數（Z幣兌換，跨日持久） ──────────────────────────────────
CREATE TABLE IF NOT EXISTS guide_chat_credits (
  user_key TEXT PRIMARY KEY,
  credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 對話紀錄（super-admin 監控用） ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guide_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                     -- 未登入時為 null
  intent_type TEXT,                 -- classifyIntent 回傳值
  model TEXT,                       -- 使用的 LLM model
  message_count INTEGER DEFAULT 1,
  total_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_guide_convs_user ON guide_conversations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guide_convs_created ON guide_conversations (created_at DESC);

-- ── 對話訊息明細（super-admin 展開查看） ──────────────────────────────────
CREATE TABLE IF NOT EXISTS guide_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES guide_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_guide_messages_conv ON guide_messages (conversation_id, created_at);
