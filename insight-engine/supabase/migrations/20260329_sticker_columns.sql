-- 貼圖包：新增每行顯示幾個貼圖的設定
ALTER TABLE sticker_packs ADD COLUMN IF NOT EXISTS columns_per_row INT NOT NULL DEFAULT 5;
