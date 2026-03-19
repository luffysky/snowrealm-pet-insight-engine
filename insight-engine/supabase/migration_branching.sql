-- ===== 分流問卷系統 — 新增路線欄位 =====

-- questions 新增 route 欄位：標記該題屬於哪個路線
-- 'all' = 所有人看到, 'A' = A路線, 'B' = B路線, 'C' = C路線
ALTER TABLE questions ADD COLUMN IF NOT EXISTS route TEXT NOT NULL DEFAULT 'all';

-- surveys 新增 branch_config：分流規則 JSON
-- 格式: { "branchKey": "q1", "routes": { "A": ["有，現在正在養","曾經養過"], "B": ["沒有，但未來有考慮"], "C": ["沒有，也不考慮"] } }
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS branch_config JSONB;

-- responses 新增 route 欄位：紀錄此填答走的路線
ALTER TABLE responses ADD COLUMN IF NOT EXISTS route TEXT;

-- 索引
CREATE INDEX IF NOT EXISTS idx_questions_route ON questions(route);
CREATE INDEX IF NOT EXISTS idx_responses_route ON responses(route);
