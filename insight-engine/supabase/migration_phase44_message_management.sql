-- Phase 44: Message management (recall, delete, save, export, friend requests)

-- Add recall + per-side delete to direct_messages
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS recalled_at TIMESTAMPTZ;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS deleted_for TEXT[] DEFAULT '{}';

-- Saved messages
CREATE TABLE IF NOT EXISTS saved_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_messages_user ON saved_messages (user_id);

-- Friend requests (follow/friend system)
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'declined'
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests (to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests (from_user_id);
