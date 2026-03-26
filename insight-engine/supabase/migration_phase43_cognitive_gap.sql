-- Phase 43: 認知落差引擎表

-- 自評答案表
CREATE TABLE IF NOT EXISTS self_trait_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  response_id UUID,
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  trait_key TEXT NOT NULL,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE self_trait_answers ADD CONSTRAINT uq_self_trait UNIQUE (user_id, survey_id, trait_key);
CREATE INDEX IF NOT EXISTS idx_self_trait_user ON self_trait_answers (user_id, survey_id);

-- 他評答案表
CREATE TABLE IF NOT EXISTS external_trait_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID,
  from_user_id UUID,
  response_id UUID,
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  trait_key TEXT NOT NULL,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ext_trait_target ON external_trait_answers (target_user_id, survey_id);

-- 認知落差快照表
CREATE TABLE IF NOT EXISTS cognitive_gap_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  trait_key TEXT NOT NULL,
  self_score INT,
  others_avg_score NUMERIC(5,2),
  gap_score NUMERIC(5,2),
  weighted_gap_score NUMERIC(5,2),
  response_count INT DEFAULT 0,
  gap_level TEXT,
  confidence_level NUMERIC(3,2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cognitive_gap_snapshots ADD CONSTRAINT uq_gap_snapshot UNIQUE (user_id, survey_id, trait_key);
CREATE INDEX IF NOT EXISTS idx_gap_user ON cognitive_gap_snapshots (user_id);
CREATE INDEX IF NOT EXISTS idx_gap_survey ON cognitive_gap_snapshots (survey_id);

-- 認知落差報告表
CREATE TABLE IF NOT EXISTS cognitive_gap_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  report_json JSONB NOT NULL,
  style_key TEXT DEFAULT 'A',
  is_partial BOOLEAN DEFAULT true,
  zcoin_spent INT DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gap_reports_user ON cognitive_gap_reports (user_id, survey_id);
