-- AI 生成的問卷遊戲化稱號（填答過程升級用）
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS game_titles JSONB;
