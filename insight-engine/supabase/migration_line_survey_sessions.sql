-- LINE Bot 對話式填答 Session 管理
-- line_survey_sessions: 記錄 LINE 用戶的問卷填答進度

CREATE TABLE IF NOT EXISTS line_survey_sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id  TEXT        NOT NULL,
  tenant_id     TEXT        NOT NULL DEFAULT 'default',
  survey_id     UUID        NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  response_id   UUID        NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  current_step  INTEGER     NOT NULL DEFAULT 0,
  route         TEXT        NOT NULL DEFAULT 'all',
  -- 'in_progress' | 'completed' | 'abandoned'
  status        TEXT        NOT NULL DEFAULT 'in_progress',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 查詢活躍 session 用（webhook 每次都會查）
CREATE INDEX IF NOT EXISTS idx_line_sessions_user_status
  ON line_survey_sessions(line_user_id, status);

-- 透過 survey_id 反查用（管理後台查詢）
CREATE INDEX IF NOT EXISTS idx_line_sessions_survey
  ON line_survey_sessions(survey_id);
