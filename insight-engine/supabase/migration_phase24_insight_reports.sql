-- Phase 24: AI 洞察報告儲存
CREATE TABLE IF NOT EXISTS ai_insight_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  survey_id UUID NOT NULL,
  report JSONB NOT NULL,
  meta JSONB,
  generated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insight_reports_survey ON ai_insight_reports (survey_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insight_reports_tenant ON ai_insight_reports (tenant_id, created_at DESC);
