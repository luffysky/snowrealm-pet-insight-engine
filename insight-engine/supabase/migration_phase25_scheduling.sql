-- Phase 25: 問卷排程
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS scheduled_close_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_surveys_schedule ON surveys (scheduled_publish_at, scheduled_close_at)
  WHERE scheduled_publish_at IS NOT NULL OR scheduled_close_at IS NOT NULL;
