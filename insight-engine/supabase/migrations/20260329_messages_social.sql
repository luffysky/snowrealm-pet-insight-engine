-- 上線狀態追蹤
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS hide_online_status BOOLEAN NOT NULL DEFAULT false;

-- 聯絡人備註名字（只有自己看得到）
CREATE TABLE IF NOT EXISTS user_contact_notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  noter_id     UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  noted_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  nickname     TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (noter_id, noted_user_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_notes_noter ON user_contact_notes (noter_id);
