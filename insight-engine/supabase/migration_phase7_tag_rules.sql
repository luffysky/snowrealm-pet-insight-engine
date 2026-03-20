-- ===== Phase A.5: Tag Rules — 標籤規則後台化 =====

-- tag_rules: 標籤自動生成規則表
-- match_mode:
--   'exact'     → answer_value 完全匹配
--   'contains'  → answer_value 包含在多選答案陣列中
--   'any'       → 該 question_key 有任何答案就匹配（用於 presence check）
CREATE TABLE IF NOT EXISTS tag_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  answer_value TEXT,
  match_mode TEXT NOT NULL DEFAULT 'exact' CHECK (match_mode IN ('exact', 'contains', 'any')),
  tag_key TEXT NOT NULL,
  tag_value TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tag_rules_survey ON tag_rules (survey_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tag_rules_question ON tag_rules (question_key);
