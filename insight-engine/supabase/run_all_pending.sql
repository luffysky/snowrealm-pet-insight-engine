-- ================================================================
-- SUPABASE PENDING MIGRATIONS — 依序執行
-- 建立時間：2026-03-28
-- 如果某段已存在會自動跳過 (IF NOT EXISTS / IF EXISTS)
-- ================================================================

-- ──────────────────────────────────────
-- migration_social.sql
-- ──────────────────────────────────────
-- Social Posts
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'post', -- 'post' | 'article'
  title TEXT,
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'published',
  is_public BOOLEAN DEFAULT true,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_tenant ON social_posts (tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts (user_id, created_at DESC);

-- Social Reactions
CREATE TABLE IF NOT EXISTS social_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

-- Social Comments
CREATE TABLE IF NOT EXISTS social_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES social_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  gif_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_comments_post ON social_comments (post_id, created_at);

-- Extend admin_users with profile fields
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT true;

-- ──────────────────────────────────────
-- migration_follow_dm.sql
-- ──────────────────────────────────────
-- Follow system
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);
CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);

-- Direct messages (encrypted content)
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL,
  iv TEXT NOT NULL,
  tag TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_dm_from ON direct_messages(from_user_id, created_at DESC);
CREATE INDEX idx_dm_to ON direct_messages(to_user_id, created_at DESC);
CREATE INDEX idx_dm_conversation ON direct_messages(LEAST(from_user_id::text, to_user_id::text), GREATEST(from_user_id::text, to_user_id::text), created_at DESC);

-- ──────────────────────────────────────
-- migration_social_bookmarks.sql
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON social_bookmarks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post ON social_bookmarks (post_id);

-- ──────────────────────────────────────
-- migration_social_reports.sql
-- ──────────────────────────────────────
-- 社群檢舉/舉報系統
CREATE TABLE IF NOT EXISTS social_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 誰舉報
  reporter_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  reporter_name TEXT,
  -- 舉報目標
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user', 'message')),
  target_id TEXT NOT NULL,       -- post_id / comment_id / user_id
  target_content TEXT,           -- 被舉報的內容快照（方便審查）
  target_author_id TEXT,         -- 被舉報的人
  target_author_name TEXT,
  -- 舉報原因
  reason TEXT NOT NULL CHECK (reason IN (
    'spam',           -- 垃圾訊息
    'fraud',          -- 詐騙
    'harassment',     -- 騷擾/霸凌
    'inappropriate',  -- 不當內容
    'violence',       -- 暴力
    'privacy',        -- 侵犯隱私
    'copyright',      -- 侵犯著作權
    'other'           -- 其他
  )),
  description TEXT,              -- 補充說明
  -- 處理狀態
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES admin_users(id),
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  -- 時間
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE INDEX IF NOT EXISTS idx_social_reports_status ON social_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_reports_reporter ON social_reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_social_reports_target ON social_reports (target_type, target_id);

-- ──────────────────────────────────────
-- migration_user_bans_blocks.sql
-- ──────────────────────────────────────
-- 封禁系統（Super Admin 專用）
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES admin_users(id);

-- 用戶互封（一般用戶可以封鎖另一個用戶）
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON user_blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON user_blocks (blocked_id);

-- ──────────────────────────────────────
-- migration_phase33_report_sharing.sql
-- ──────────────────────────────────────
-- Phase 33: AI 洞察報告 — 分享功能 + 故事報告類型 + 支援客服表
-- ===================================================

-- 1. ai_insight_reports 新增分享欄位 + report_type
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'data';
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_slug TEXT UNIQUE;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_title TEXT;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_views INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_insight_reports_share
  ON ai_insight_reports (share_slug) WHERE is_public = true;

-- 2. ai_usage_logs action CHECK 擴充（加入 story、sentiment、chat 等新 action）
ALTER TABLE ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_action_check;
ALTER TABLE ai_usage_logs ADD CONSTRAINT ai_usage_logs_action_check
  CHECK (action IN (
    'generate', 'regenerate',
    'generate_meta', 'regenerate_meta',
    'chat', 'insight', 'story', 'sentiment'
  ));

-- 3. support_tickets（客服工單）
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  channel TEXT NOT NULL DEFAULT 'line',
  line_user_id TEXT,
  line_display_name TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  category TEXT,
  subject TEXT,
  assigned_to UUID REFERENCES admin_users(id),
  survey_id UUID REFERENCES surveys(id),
  response_id UUID REFERENCES responses(id),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_tenant_status ON support_tickets (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_line_user ON support_tickets (line_user_id);

-- 4. support_messages（客服訊息）
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  sender_id TEXT,
  sender_name TEXT,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_ticket ON support_messages (ticket_id, created_at);

-- 5. support_templates（快速回覆模板）
CREATE TABLE IF NOT EXISTS support_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  usage_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. survey_templates（問卷模板系統）
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'platform',
  tenant_id TEXT,
  created_by UUID REFERENCES admin_users(id),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  icon TEXT DEFAULT '📋',
  tags TEXT[] DEFAULT '{}',
  survey_config JSONB NOT NULL,
  questions JSONB NOT NULL,
  branch_config JSONB,
  use_count INT DEFAULT 0,
  rating_sum INT DEFAULT 0,
  rating_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_templates_industry ON survey_templates (industry) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_survey_templates_marketplace ON survey_templates (is_public, use_count DESC) WHERE is_active = true;

-- 7. automation_rules（已在 phase28，確認欄位齊全）
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMPTZ;

-- ──────────────────────────────────────
-- migration_phase34_bot_passcode.sql
-- ──────────────────────────────────────
-- Phase 34: LINE Bot 管理員口令欄位（site_settings 新增 bot_admin_passcode）
-- 讓每個租戶可自訂 Insight Bot 的管理員註冊口令，不再硬編碼毛行天下專用文案

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_admin_passcode TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN site_settings.bot_admin_passcode IS 'Insight Bot 管理員口令（用戶輸入此口令後可取得一次性管理員註冊連結）';

-- ──────────────────────────────────────
-- migration_phase35_platform_notifications.sql
-- ──────────────────────────────────────
-- Phase 35: Platform notifications + notification styles for super admin

-- 平台通知
CREATE TABLE IF NOT EXISTS platform_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  category TEXT NOT NULL DEFAULT 'announcement',
  target TEXT NOT NULL DEFAULT 'all',
  target_tenant_ids TEXT[],
  channels TEXT[] DEFAULT ARRAY['line','dashboard'],
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_notifications_status ON platform_notifications (status);
CREATE INDEX IF NOT EXISTS idx_platform_notifications_created ON platform_notifications (created_at DESC);

-- 通知已讀紀錄
CREATE TABLE IF NOT EXISTS notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES platform_notifications(id) ON DELETE CASCADE,
  user_id UUID,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (notification_id, user_id)
);

-- 平台通知樣式
CREATE TABLE IF NOT EXISTS platform_notification_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  header_color TEXT DEFAULT '#1DB446',
  header_text TEXT,
  body_template TEXT NOT NULL DEFAULT '',
  footer_text TEXT,
  button_label TEXT,
  button_url TEXT,
  text_template TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 預設通知樣式 seed
INSERT INTO platform_notification_styles (event_type, display_name, header_color, body_template, text_template) VALUES
  ('new_signup', '新用戶註冊', '#1DB446', '🎉 新用戶 {{userName}} 已加入！\n組織：{{orgName}}', '🎉 新用戶 {{userName}} 加入了 {{orgName}}'),
  ('survey_complete', '問卷填答完成', '#4A90E2', '📋 {{surveyTitle}} 收到新回覆\n填答者：{{displayName}}', '📋 {{surveyTitle}} 有新回覆'),
  ('ai_report_ready', 'AI 報告生成完成', '#7B61FF', '✨ AI 洞察報告已產出\n問卷：{{surveyTitle}}', '✨ {{surveyTitle}} 的 AI 報告已就緒'),
  ('weekly_report', '每週報告', '#FF6B35', '📊 本週問卷摘要\n回覆：{{responseCount}} 筆 | 完成率：{{completionRate}}%', '📊 本週共收到 {{responseCount}} 筆回覆'),
  ('payment_success', '付款成功', '#1DB446', '💳 付款成功！\n方案：{{planName}} | 金額：{{amount}}', '💳 付款成功，{{planName}} 已啟用'),
  ('trial_expiring', '試用即將到期', '#FF9500', '⏰ 試用將於 {{daysLeft}} 天後到期\n升級保留所有數據', '⏰ 試用還剩 {{daysLeft}} 天'),
  ('trial_expired', '試用已到期', '#FF3B30', '⚠️ 試用已到期，部分功能已暫停\n點此升級繼續使用', '⚠️ 試用已到期，請升級方案'),
  ('response_milestone', '回覆數里程碑', '#FFD60A', '🎊 恭喜達成里程碑！\n{{surveyTitle}} 已累積 {{count}} 筆回覆', '🎊 {{surveyTitle}} 達到 {{count}} 筆回覆！'),
  ('support_new_ticket', '新客服工單', '#FF6B6B', '📬 新客服工單 #{{ticketId}}\n來自：{{customerName}}', '📬 新工單：{{subject}}'),
  ('system_alert', '系統異常警報', '#FF3B30', '🚨 系統警報\n{{message}}', '🚨 系統異常：{{message}}')
ON CONFLICT (event_type) DO NOTHING;

-- ──────────────────────────────────────
-- migration_phase36_missing_tables.sql
-- ──────────────────────────────────────
-- Phase 36: 補齊直接在 Supabase 建立的表（本地 migration 缺失）
-- 包含：media_assets、payment_logs、broadcast_logs

-- 媒體資源表（R2/S3 上傳紀錄）
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  url TEXT NOT NULL,
  filename TEXT NOT NULL DEFAULT '',
  original_name TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT '',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  folder TEXT NOT NULL DEFAULT 'uploads',
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_tenant ON media_assets (tenant_id);

-- 付款紀錄表（藍新金流）
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  subscription_id UUID,
  trade_no TEXT,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  provider TEXT DEFAULT 'newebpay',
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_tenant ON payment_logs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_logs_trade ON payment_logs (trade_no);

-- 廣播推播紀錄表
CREATE TABLE IF NOT EXISTS broadcast_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  tag_filter JSONB,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ,
  tenant_id TEXT DEFAULT 'default'
);

CREATE INDEX IF NOT EXISTS idx_broadcast_logs_tenant ON broadcast_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_created_at ON broadcast_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_scheduled ON broadcast_logs (scheduled_at)
  WHERE scheduled_at IS NOT NULL AND sent_count = 0;

-- ──────────────────────────────────────
-- migration_phase37_template_ratings_story_richmenu.sql
-- ──────────────────────────────────────
-- Phase 37: 補齊 CLAUDE.md 定義但尚未建立的表
-- 包含：template_ratings、story_cards、line_rich_menus

-- 問卷模板評分（配合 survey_templates 使用）
CREATE TABLE IF NOT EXISTS template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES survey_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (template_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_template_ratings_template ON template_ratings (template_id);

-- 個人故事卡片（填答完成後 AI 生成的個人化卡片）
CREATE TABLE IF NOT EXISTS story_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  survey_id UUID REFERENCES surveys(id),
  card_data JSONB NOT NULL,       -- StoryCardData JSON（個人化事實 + 群體比較 + 引言）
  share_slug TEXT UNIQUE,         -- 公開分享用的短碼（如 sc-a3x9k2m1）
  is_public BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_cards_response ON story_cards (response_id);
CREATE INDEX IF NOT EXISTS idx_story_cards_survey ON story_cards (survey_id);
CREATE INDEX IF NOT EXISTS idx_story_cards_share ON story_cards (share_slug) WHERE is_public = true;

-- LINE Rich Menu 設定（儲存租戶自訂的 Rich Menu 資訊）
CREATE TABLE IF NOT EXISTS line_rich_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  rich_menu_id TEXT,              -- LINE API 回傳的 richmenu-xxx ID
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'default',  -- 'default'（新好友預設）| 'post_survey'（填答後切換）
  is_active BOOLEAN DEFAULT false,
  chat_bar_text TEXT DEFAULT '選單',
  size JSONB,                     -- { width, height }
  areas JSONB,                    -- Rich Menu 按鈕區域定義
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_rich_menus_tenant ON line_rich_menus (tenant_id);
CREATE INDEX IF NOT EXISTS idx_line_rich_menus_type ON line_rich_menus (tenant_id, type) WHERE is_active = true;

-- ──────────────────────────────────────
-- migration_phase38_sync_fixes.sql
-- ──────────────────────────────────────
-- Phase 38: 同步 Supabase 手動調整（本地 migration 缺失項目）

-- 1. surveys.done_config — 填答完成頁自訂設定（直接在 Supabase 新增，migration 未涵蓋）
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS done_config JSONB DEFAULT '{}';

-- 2. admin_invites.tenant_id DEFAULT 修正
--    migration_phase14 硬編碼了 DEFAULT 'maoxingtianxia'，改為通用預設值
ALTER TABLE admin_invites ALTER COLUMN tenant_id SET DEFAULT 'default';

-- 3. tenants.plan DEFAULT 確認為 'free'（phase32 寫 'trial' 但實際應為 'free'）
ALTER TABLE tenants ALTER COLUMN plan SET DEFAULT 'free';

-- ──────────────────────────────────────
-- migration_phase39_ai_constraints_report_type.sql
-- ──────────────────────────────────────
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

-- ──────────────────────────────────────
-- migration_phase40_other_text_done_config_share.sql
-- ──────────────────────────────────────
-- Phase 40: 其他選項文字填答 + doneConfig 後台設定 + ai_insight_reports 分享欄位

-- 1. 題目表新增 allow_other_text 欄位
ALTER TABLE questions ADD COLUMN IF NOT EXISTS allow_other_text BOOLEAN DEFAULT false;

-- 2. 問卷表確保 done_config 欄位存在
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS done_config JSONB DEFAULT '{}';

-- 3. ai_insight_reports 分享欄位
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_slug TEXT UNIQUE;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_title TEXT;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_views INT DEFAULT 0;

-- 4. 為分享欄位建立索引
CREATE INDEX IF NOT EXISTS idx_insight_reports_share ON ai_insight_reports (share_slug) WHERE is_public = true;

-- 5. 設定毛行天下 MVP 問卷的 done_config（若尚未設定）
UPDATE surveys
SET done_config = '{"showWaitlist":true,"waitlistFields":{"nickname":true,"email":true,"lineId":true},"showStoryCard":true,"showDownloadAnswers":true}'
WHERE slug = 'maoxingtianxia-mvp-survey'
  AND (done_config IS NULL OR done_config::text = '{}');

-- ──────────────────────────────────────
-- migration_phase41_survey_templates.sql
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'platform',
  tenant_id TEXT,
  created_by UUID,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  icon TEXT DEFAULT '📋',
  tags TEXT[] DEFAULT '{}',
  survey_config JSONB NOT NULL,
  questions JSONB NOT NULL,
  branch_config JSONB,
  use_count INT DEFAULT 0,
  rating_sum INT DEFAULT 0,
  rating_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ──────────────────────────────────────
-- migration_phase42_growth_engine.sql
-- ──────────────────────────────────────
-- Phase 42: 成長引擎 — result_config, explore, zcoin, referral
-- 2026-03-27

-- ===== 1. surveys 表新增欄位 =====

ALTER TABLE surveys ADD COLUMN IF NOT EXISTS result_config JSONB DEFAULT NULL;
-- result_config 格式：
-- {
--   "scoringRules": { "q1": { "選A": "guardian", "選B": "adventurer" }, ... },
--   "resultTypes": [{ "key": "guardian", "name": "守護者", "emoji": "🛡️", "description": "..." }]
-- }

ALTER TABLE surveys ADD COLUMN IF NOT EXISTS is_public_explore BOOLEAN DEFAULT false;
-- 是否公開到探索頁

-- ===== 2. Z幣系統 =====

CREATE TABLE IF NOT EXISTS zcoin_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_users(id),
  line_user_id TEXT,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  balance INT NOT NULL DEFAULT 0,
  total_earned INT NOT NULL DEFAULT 0,
  total_spent INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zcoin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES zcoin_wallets(id) ON DELETE CASCADE,
  amount INT NOT NULL,          -- 正數=收入, 負數=支出
  type TEXT NOT NULL,           -- 'earn' | 'spend'
  reason TEXT NOT NULL,         -- 'survey_complete' | 'share' | 'invite' | 'daily_login' | 'milestone' | 'unlock_template' | 'ai_usage'
  reference_id TEXT,            -- 關聯的 response_id / survey_id 等
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zcoin_wallets_user ON zcoin_wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_zcoin_wallets_line ON zcoin_wallets (line_user_id);
CREATE INDEX IF NOT EXISTS idx_zcoin_transactions_wallet ON zcoin_transactions (wallet_id, created_at DESC);

-- ===== 3. 裂變/推薦系統 =====

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES admin_users(id),
  referred_id UUID REFERENCES admin_users(id),
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'completed' | 'rewarded'
  commission_rate DECIMAL(4,3) NOT NULL DEFAULT 0.1,
  commission_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals (referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_id);

-- 在 admin_users 加推薦碼欄位（如果沒有的話）
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS referred_by TEXT;  -- 被哪個推薦碼邀請

-- ===== 4. 探索頁瀏覽紀錄 =====

CREATE TABLE IF NOT EXISTS survey_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  viewer_fingerprint TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_views_survey ON survey_views (survey_id, viewed_at DESC);

-- ──────────────────────────────────────
-- migration_phase43_cognitive_gap.sql
-- ──────────────────────────────────────
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

-- ──────────────────────────────────────
-- migration_phase44_message_management.sql
-- ──────────────────────────────────────
-- Phase 44: Message management (recall, delete, save, export, friend requests)

-- Add recall + per-side delete to direct_messages
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS recalled_at TIMESTAMPTZ;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS deleted_for TEXT[] DEFAULT '{}';

-- Saved messages
CREATE TABLE IF NOT EXISTS saved_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_messages_user ON saved_messages (user_id);

-- Friend requests (follow/friend system)
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'declined'
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests (to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests (from_user_id);

-- ──────────────────────────────────────
-- migration_phase45_social_video.sql
-- ──────────────────────────────────────
-- Phase 45: social_posts 加影片欄位

ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;

-- ──────────────────────────────────────
-- migration_phase46_stickers.sql
-- ──────────────────────────────────────
-- 貼圖包
CREATE TABLE IF NOT EXISTS sticker_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 貼圖
CREATE TABLE IF NOT EXISTS stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES sticker_packs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stickers_pack ON stickers(pack_id, sort_order);

-- ──────────────────────────────────────
-- migration_phase47_survey_cover.sql
-- ──────────────────────────────────────
-- 問卷封面圖片欄位
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- ──────────────────────────────────────
-- migration_phase48_password_lock.sql
-- ──────────────────────────────────────
-- 問卷密碼保護欄位
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS access_password TEXT;

-- ──────────────────────────────────────
-- migration_phase49_game_titles.sql
-- ──────────────────────────────────────
-- AI 生成的問卷遊戲化稱號（填答過程升級用）
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS game_titles JSONB;

-- ──────────────────────────────────────
-- migration_phase50_reward_system.sql
-- ──────────────────────────────────────
-- Phase 50: 獎勵系統補齊 — ad_views, daily_task_logs, zcoin tables 確保存在
-- 2026-03-28

-- ===== Z幣錢包（如果 phase42 沒跑到） =====

CREATE TABLE IF NOT EXISTS zcoin_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_users(id),
  line_user_id TEXT,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  balance INT NOT NULL DEFAULT 0,
  total_earned INT NOT NULL DEFAULT 0,
  total_spent INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zcoin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES zcoin_wallets(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  reason TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zcoin_wallets_user ON zcoin_wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_zcoin_wallets_line ON zcoin_wallets (line_user_id);
CREATE INDEX IF NOT EXISTS idx_zcoin_transactions_wallet ON zcoin_transactions (wallet_id, created_at DESC);

-- ===== 每日任務完成記錄 =====

CREATE TABLE IF NOT EXISTS daily_task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_task_logs (user_id, completed_at);

-- ===== 廣告觀看記錄 =====

CREATE TABLE IF NOT EXISTS ad_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reward_type TEXT NOT NULL DEFAULT 'zcoin_reward',
  reward_amount INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ad_views_user_date ON ad_views (user_id, viewed_at DESC);

-- ===== Z幣充值訂單 =====

CREATE TABLE IF NOT EXISTS zcoin_recharge_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  package_id TEXT NOT NULL,
  amount_zcoin INT NOT NULL,
  amount_ntd INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_zcoin_recharge_user ON zcoin_recharge_orders (user_id, created_at DESC);

-- ===== 訊息編輯欄位 =====

ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- ──────────────────────────────────────
-- migration_phase51_profile_theme.sql
-- ──────────────────────────────────────
-- Phase 51: 個人頁面主題 + 橫幅圖片
-- 2026-03-28

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS profile_theme TEXT DEFAULT 'default';

