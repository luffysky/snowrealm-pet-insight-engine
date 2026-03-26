-- Phase 39: AI 約束修正 + report_type 欄位

-- 1. ai_insight_reports 新增 report_type 欄位（'data' | 'story'）
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'data';

-- 2. 修正 ai_usage_logs_action_check 約束
--    原約束只允許 generate / regenerate，但實際使用了 chat / insight / story / sentiment 等
ALTER TABLE ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_action_check;
ALTER TABLE ai_usage_logs ADD CONSTRAINT ai_usage_logs_action_check
  CHECK (action IN (
    'generate',
    'regenerate',
    'generate_meta',
    'regenerate_meta',
    'chat',
    'insight',
    'story',
    'sentiment'
  ));
