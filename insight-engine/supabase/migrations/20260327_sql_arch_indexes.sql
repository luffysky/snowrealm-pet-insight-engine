-- SQL Architecture: Missing Indexes
-- 2026-03-27
-- 補充高頻查詢路徑上缺少的複合索引，提升 10M 用戶規模下的查詢效能

-- ===== surveys =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_surveys_tenant_status
  ON surveys (tenant_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_surveys_tenant_primary
  ON surveys (tenant_id, is_primary)
  WHERE is_primary = true AND status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_surveys_variant_group
  ON surveys (variant_group)
  WHERE variant_group IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_surveys_slug_status
  ON surveys (slug, status);

-- ===== questions =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_survey_order
  ON questions (survey_id, order_index ASC);

-- ===== responses =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_responses_survey_created
  ON responses (survey_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_responses_tenant_created
  ON responses (tenant_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_responses_survey_status_created
  ON responses (survey_id, status, created_at DESC);

-- ===== answers =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_answers_response_key
  ON answers (response_id, question_key);

-- ===== user_tags =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_tags_key_value_tenant
  ON user_tags (tag_key, tag_value, tenant_id);

-- ===== social_posts =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_posts_tenant_public_created
  ON social_posts (tenant_id, created_at DESC)
  WHERE status = 'published' AND is_public = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_posts_user_created
  ON social_posts (user_id, created_at DESC)
  WHERE status = 'published';

-- ===== social_comments =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_comments_post_parent
  ON social_comments (post_id, parent_id, created_at ASC);

-- ===== social_reactions =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_reactions_post_user
  ON social_reactions (post_id, user_id);

-- ===== direct_messages =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dm_conversation_created
  ON direct_messages (conversation_id, created_at DESC);

-- ===== notification_logs =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_logs_rule_created
  ON notification_logs (rule_id, created_at DESC);

-- ===== ai_insight_reports =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_insight_tenant_survey_created
  ON ai_insight_reports (tenant_id, survey_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_insight_share_slug
  ON ai_insight_reports (share_slug)
  WHERE is_public = true;
