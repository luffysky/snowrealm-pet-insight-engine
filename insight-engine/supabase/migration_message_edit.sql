-- 訊息編輯功能：新增 edited_at 欄位
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
