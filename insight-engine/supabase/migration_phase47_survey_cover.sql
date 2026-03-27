-- 問卷封面圖片欄位
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
