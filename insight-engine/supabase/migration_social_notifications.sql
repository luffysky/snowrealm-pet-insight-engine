-- 社群通知（讚/留言/追蹤/限時動態回覆）
CREATE TABLE IF NOT EXISTS social_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,             -- 通知接收者
  actor_id UUID NOT NULL,            -- 觸發者
  type TEXT NOT NULL,                -- 'like' | 'comment' | 'follow' | 'story_reply' | 'poll_result'
  target_id TEXT,                    -- 貼文/限時動態 ID
  target_title TEXT,                 -- 摘要文字（貼文前幾個字）
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_notif_user ON social_notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_notif_unread ON social_notifications (user_id) WHERE read_at IS NULL;
