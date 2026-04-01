-- guide_chat_messages 新增 image_url 欄位
-- 用於儲存使用者上傳給 AI 分析的圖片 URL（儲存在 R2）
ALTER TABLE guide_chat_messages ADD COLUMN IF NOT EXISTS image_url TEXT;
