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
CREATE TABLE IF NOT EXISTS social_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON social_bookmarks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post ON social_bookmarks (post_id);
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
-- Phase 45: social_posts 加影片欄位

ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;
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
-- Phase 34: LINE Bot 管理員口令欄位（site_settings 新增 bot_admin_passcode）
-- 讓每個租戶可自訂 Insight Bot 的管理員註冊口令，不再硬編碼毛行天下專用文案

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_admin_passcode TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN site_settings.bot_admin_passcode IS 'Insight Bot 管理員口令（用戶輸入此口令後可取得一次性管理員註冊連結）';
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
-- Phase 38: 同步 Supabase 手動調整（本地 migration 缺失項目）

-- 1. surveys.done_config — 填答完成頁自訂設定（直接在 Supabase 新增，migration 未涵蓋）
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS done_config JSONB DEFAULT '{}';

-- 2. admin_invites.tenant_id DEFAULT 修正
--    migration_phase14 硬編碼了 DEFAULT 'maoxingtianxia'，改為通用預設值
ALTER TABLE admin_invites ALTER COLUMN tenant_id SET DEFAULT 'default';

-- 3. tenants.plan DEFAULT 確認為 'free'（phase32 寫 'trial' 但實際應為 'free'）
ALTER TABLE tenants ALTER COLUMN plan SET DEFAULT 'free';
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
);-- Phase 42: 成長引擎 — result_config, explore, zcoin, referral
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
-- Phase 6: Z幣商店 — 每日任務 + 充值訂單
-- 執行前確認 zcoin_wallets 和 zcoin_transactions 表已建立 (migration_phase6.sql)

-- 每日任務完成記錄
CREATE TABLE IF NOT EXISTS daily_task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date
  ON daily_task_logs (user_id, completed_at);

-- Z幣充值訂單
CREATE TABLE IF NOT EXISTS zcoin_recharge_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  package_id TEXT NOT NULL,          -- starter | basic | popular | value
  amount_zcoin INT NOT NULL,         -- 充值的 Z幣數量
  amount_ntd INT NOT NULL,           -- 付款金額（新台幣）
  status TEXT DEFAULT 'pending'      -- pending | completed | failed
    CHECK (status IN ('pending', 'completed', 'failed')),
  payment_id TEXT,                   -- 第三方金流交易 ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_zcoin_recharge_user
  ON zcoin_recharge_orders (user_id, created_at DESC);
-- Phase 5: 爆款問卷模板系統
-- 建立 survey_templates 表（含 slug/category/theme/quiz_config），seed 10 個爆款模板
-- v2: 重寫為完整版（含 questions + quiz_config inline JSON）

CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📋',
  category TEXT DEFAULT 'general',
  industry TEXT DEFAULT 'general',
  theme TEXT DEFAULT 'default',
  tags TEXT[] DEFAULT '{}',
  survey_config JSONB NOT NULL DEFAULT '{}',
  questions JSONB NOT NULL DEFAULT '[]',
  quiz_config JSONB,
  source TEXT NOT NULL DEFAULT 'platform',  -- 'platform' | 'tenant' | 'marketplace'
  tenant_id TEXT,
  created_by UUID,
  use_count INT DEFAULT 0,
  rating_sum INT DEFAULT 0,
  rating_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 補欄位（表已存在時安全補上，CREATE TABLE IF NOT EXISTS 不會重跑）
ALTER TABLE survey_templates ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE survey_templates ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE survey_templates ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';
ALTER TABLE survey_templates ADD COLUMN IF NOT EXISTS quiz_config JSONB;

-- 為 slug 建立唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_templates_slug ON survey_templates (slug);

CREATE INDEX IF NOT EXISTS idx_templates_category ON survey_templates (category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_templates_featured ON survey_templates (is_featured, use_count DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_templates_source ON survey_templates (source) WHERE is_active = true;

-- 模板評分表
CREATE TABLE IF NOT EXISTS template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES survey_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (template_id, user_id)
);

-- Seed：10 個爆款模板（含完整 questions + quiz_config）
INSERT INTO survey_templates (slug, name, description, icon, category, theme, survey_config, questions, quiz_config, is_featured, source)
VALUES

-- 1. 你在朋友眼中是什麼人？
('friend-persona','你在朋友眼中是什麼人？','透過幾個生活情境，揭開你在朋友心中的真實形象！','👥','social','candy','{"coverTitle":"你在朋友眼中是什麼人？","coverSubtitle":"幾個小問題，揭開你最真實的社交面貌 💫","doneTitle":"你的朋友形象揭曉了！","doneSubtitle":"分享給朋友，看看他們同不同意？😄","estimatedMinutes":3}','[{"key":"q1","type":"single","content":"朋友約週末出遊，你通常是？","isRequired":true,"options":[{"label":"第一個說好、還順手幫大家排行程","value":"A","emoji":"📋"},{"label":"笑著說好、但其實有點懶得動","value":"B","emoji":"😴"},{"label":"問清楚去哪、幾個人再決定","value":"C","emoji":"🤔"},{"label":"說要想想、結果常常臨時取消","value":"D","emoji":"🙈"}]},{"key":"q2","type":"single","content":"朋友遇到感情問題來找你，你的第一反應是？","isRequired":true,"options":[{"label":"認真聽完、給出分析和建議","value":"A","emoji":"🧠"},{"label":"先給大大的擁抱、讓他哭個夠","value":"B","emoji":"🤗"},{"label":"幫他想最壞情況怎麼應對","value":"C","emoji":"💪"},{"label":"帶他去吃好料轉移注意力","value":"D","emoji":"🍜"}]},{"key":"q3","type":"single","content":"群組裡有人說了個冷笑話，你通常怎麼回應？","isRequired":true,"options":[{"label":"馬上接梗、越接越歪","value":"A","emoji":"😂"},{"label":"傳個笑臉貼圖、默默支持","value":"B","emoji":"😊"},{"label":"分析這個笑話的笑點在哪","value":"C","emoji":"🔍"},{"label":"沉默是金、繼續滑手機","value":"D","emoji":"📱"}]},{"key":"q4","type":"single","content":"大家要選一家餐廳吃飯，討論了半天沒結果，你會？","isRequired":true,"options":[{"label":"直接拍板決定一家","value":"A","emoji":"👊"},{"label":"說「都好都好」然後跟著走","value":"B","emoji":"🤷"},{"label":"列出三個選項讓大家投票","value":"C","emoji":"📊"},{"label":"偷偷查 Google 評論再推薦","value":"D","emoji":"🔎"}]},{"key":"q5","type":"single","content":"朋友生日，你送禮的風格是？","isRequired":true,"options":[{"label":"提前一個月問他想要什麼、用心準備","value":"A","emoji":"🎁"},{"label":"傳一段走心的祝福文字比什麼都重要","value":"B","emoji":"💌"},{"label":"幾個朋友一起湊錢買一個好的","value":"C","emoji":"💰"},{"label":"臨時去便利商店買也沒關係反正心意到了","value":"D","emoji":"🏪"}]},{"key":"q6","type":"single","content":"你覺得自己在朋友圈裡最常扮演什麼角色？","isRequired":true,"options":[{"label":"帶頭的那個","value":"A","emoji":"🚀"},{"label":"說話最好笑的那個","value":"B","emoji":"🎭"},{"label":"最冷靜理智的那個","value":"C","emoji":"🧊"},{"label":"神秘低調但關鍵時刻都在的那個","value":"D","emoji":"🌙"}]}]','{"traits":["warm","funny","wise","mysterious"],"scoringRules":[{"questionKey":"q1","optionValue":"A","traitKey":"warm","score":2},{"questionKey":"q1","optionValue":"B","traitKey":"funny","score":2},{"questionKey":"q1","optionValue":"C","traitKey":"wise","score":2},{"questionKey":"q1","optionValue":"D","traitKey":"mysterious","score":2},{"questionKey":"q2","optionValue":"A","traitKey":"wise","score":2},{"questionKey":"q2","optionValue":"B","traitKey":"warm","score":2},{"questionKey":"q2","optionValue":"C","traitKey":"warm","score":1},{"questionKey":"q2","optionValue":"D","traitKey":"funny","score":2},{"questionKey":"q3","optionValue":"A","traitKey":"funny","score":3},{"questionKey":"q3","optionValue":"B","traitKey":"warm","score":2},{"questionKey":"q3","optionValue":"C","traitKey":"wise","score":2},{"questionKey":"q3","optionValue":"D","traitKey":"mysterious","score":3},{"questionKey":"q4","optionValue":"A","traitKey":"warm","score":2},{"questionKey":"q4","optionValue":"B","traitKey":"funny","score":1},{"questionKey":"q4","optionValue":"C","traitKey":"wise","score":3},{"questionKey":"q4","optionValue":"D","traitKey":"mysterious","score":2},{"questionKey":"q5","optionValue":"A","traitKey":"warm","score":3},{"questionKey":"q5","optionValue":"B","traitKey":"warm","score":2},{"questionKey":"q5","optionValue":"C","traitKey":"wise","score":2},{"questionKey":"q5","optionValue":"D","traitKey":"funny","score":2},{"questionKey":"q6","optionValue":"A","traitKey":"warm","score":2},{"questionKey":"q6","optionValue":"B","traitKey":"funny","score":3},{"questionKey":"q6","optionValue":"C","traitKey":"wise","score":3},{"questionKey":"q6","optionValue":"D","traitKey":"mysterious","score":3}],"results":[{"resultKey":"warm","name":"暖心好友","description":"你是那種讓人感到安心的存在。朋友有事第一個想到你，因為你總是用心傾聽、真誠回應。","emoji":"🌸","traits":{"warm":[6,20]}},{"resultKey":"funny","name":"開心果","description":"有你在的地方，氣氛永遠不冷場。你的幽默感是天生的，能在最尷尬的瞬間讓大家笑出來。","emoji":"😄","traits":{"funny":[6,20]}},{"resultKey":"wise","name":"智囊","description":"遇到難題，大家第一個找的就是你。你邏輯清晰、分析到位，總能看到別人看不到的角度。","emoji":"🦉","traits":{"wise":[6,20]}},{"resultKey":"mysterious","name":"神秘感","description":"你是朋友圈裡最讓人猜不透的存在。話不多，但每次開口都讓人印象深刻。","emoji":"🌙","traits":{"mysterious":[6,20]}}]}',true,'platform'),

-- 2. 你的戀愛人格
('love-personality','你的戀愛人格','在愛情裡，你是哪一種人？浪漫派、理性派還是獨立派？','💕','relationship','sakura','{"coverTitle":"你的戀愛人格是什麼？","coverSubtitle":"幾個問題，揭開你在感情中的真實模樣 🌸","doneTitle":"你的戀愛人格揭曉！","doneSubtitle":"傳給另一半，看看你們合不合拍？💑","estimatedMinutes":3}','[{"key":"q1","type":"single","content":"剛開始喜歡一個人，你通常會？","isRequired":true,"options":[{"label":"腦補各種浪漫的相遇場景","value":"A","emoji":"🌹"},{"label":"先觀察對方的生活習慣和價值觀","value":"B","emoji":"🔍"},{"label":"若無其事、等對方先表示","value":"C","emoji":"😌"},{"label":"想辦法多製造相遇機會","value":"D","emoji":"🎯"}]},{"key":"q2","type":"single","content":"在一段關係裡，最重要的是？","isRequired":true,"options":[{"label":"心動感覺——沒有怦然心動就沒有意義","value":"A","emoji":"💓"},{"label":"相互理解——能溝通才能走長遠","value":"B","emoji":"🤝"},{"label":"個人空間——再愛也需要自己的時間","value":"C","emoji":"🌿"},{"label":"陪伴守護——在對方最需要時出現","value":"D","emoji":"🛡️"}]},{"key":"q3","type":"single","content":"情人節到了，你期待的慶祝方式是？","isRequired":true,"options":[{"label":"精心策劃的驚喜，越用心越感動","value":"A","emoji":"🎁"},{"label":"安靜地在家煮頓飯、好好聊天","value":"B","emoji":"🍳"},{"label":"平常心——每天都是情人節","value":"C","emoji":"😎"},{"label":"做對方最想做的事，讓他開心就好","value":"D","emoji":"🌟"}]},{"key":"q4","type":"single","content":"和另一半發生爭吵，你的第一反應是？","isRequired":true,"options":[{"label":"情緒先爆發、事後再和好，但道歉很真誠","value":"A","emoji":"🌋"},{"label":"先冷靜、整理思路再好好討論","value":"B","emoji":"🧊"},{"label":"需要一個人靜一靜再談","value":"C","emoji":"🚶"},{"label":"不管誰對誰錯、先顧好對方的情緒","value":"D","emoji":"🤍"}]},{"key":"q5","type":"single","content":"如果另一半要出差兩週，你會？","isRequired":true,"options":[{"label":"每天傳長長的訊息、傾訴思念","value":"A","emoji":"💌"},{"label":"約好視訊時間、維持固定聯絡","value":"B","emoji":"📱"},{"label":"趁機好好過自己的生活，反而挺自在","value":"C","emoji":"🌈"},{"label":"默默幫他/她準備回來後的驚喜","value":"D","emoji":"🎀"}]},{"key":"q6","type":"single","content":"你覺得一段健康的感情應該是？","isRequired":true,"options":[{"label":"像電影一樣有高低起伏才刺激","value":"A","emoji":"🎬"},{"label":"建立在誠實和尊重上的平等關係","value":"B","emoji":"⚖️"},{"label":"兩個獨立的人選擇在一起","value":"C","emoji":"🌸"},{"label":"彼此都是對方最堅強的後盾","value":"D","emoji":"🏠"}]}]','{"traits":["romantic","rational","independent","guardian"],"scoringRules":[{"questionKey":"q1","optionValue":"A","traitKey":"romantic","score":3},{"questionKey":"q1","optionValue":"B","traitKey":"rational","score":3},{"questionKey":"q1","optionValue":"C","traitKey":"independent","score":3},{"questionKey":"q1","optionValue":"D","traitKey":"guardian","score":2},{"questionKey":"q2","optionValue":"A","traitKey":"romantic","score":3},{"questionKey":"q2","optionValue":"B","traitKey":"rational","score":3},{"questionKey":"q2","optionValue":"C","traitKey":"independent","score":3},{"questionKey":"q2","optionValue":"D","traitKey":"guardian","score":3},{"questionKey":"q3","optionValue":"A","traitKey":"romantic","score":3},{"questionKey":"q3","optionValue":"B","traitKey":"rational","score":2},{"questionKey":"q3","optionValue":"C","traitKey":"independent","score":3},{"questionKey":"q3","optionValue":"D","traitKey":"guardian","score":3},{"questionKey":"q4","optionValue":"A","traitKey":"romantic","score":2},{"questionKey":"q4","optionValue":"B","traitKey":"rational","score":3},{"questionKey":"q4","optionValue":"C","traitKey":"independent","score":3},{"questionKey":"q4","optionValue":"D","traitKey":"guardian","score":3},{"questionKey":"q5","optionValue":"A","traitKey":"romantic","score":3},{"questionKey":"q5","optionValue":"B","traitKey":"rational","score":2},{"questionKey":"q5","optionValue":"C","traitKey":"independent","score":3},{"questionKey":"q5","optionValue":"D","traitKey":"guardian","score":3},{"questionKey":"q6","optionValue":"A","traitKey":"romantic","score":3},{"questionKey":"q6","optionValue":"B","traitKey":"rational","score":3},{"questionKey":"q6","optionValue":"C","traitKey":"independent","score":3},{"questionKey":"q6","optionValue":"D","traitKey":"guardian","score":3}],"results":[{"resultKey":"romantic","name":"浪漫派","description":"你相信愛情是有魔法的。心動的感覺、浪漫的儀式感——這些對你來說缺一不可。","emoji":"🌹","traits":{"romantic":[8,20]}},{"resultKey":"rational","name":"理性派","description":"你用腦袋愛人，也用腦袋解決問題。你認為真正的愛需要溝通和理解做基礎。","emoji":"🧠","traits":{"rational":[8,20]}},{"resultKey":"independent","name":"獨立派","description":"你知道愛一個人不等於失去自己。你在感情裡保持清醒和自我，反而讓關係更健康。","emoji":"🦋","traits":{"independent":[8,20]}},{"resultKey":"guardian","name":"守護派","description":"你是那種默默付出、不求回報的人。你喜歡用行動表達愛，讓另一半感覺最踏實。","emoji":"🛡️","traits":{"guardian":[8,20]}}]}',true,'platform'),

-- 3. 你是哪種動物？
('spirit-animal','你是哪種動物？','你的性格最像哪種動物？5個問題找出你的靈魂動物！','🦊','personality','forest','{"coverTitle":"你的靈魂動物是？","coverSubtitle":"5 個問題，找出隱藏在你內心的動物原型 🌿","doneTitle":"你的靈魂動物出現了！","doneSubtitle":"快分享給朋友，看看他們同不同意？🐾","estimatedMinutes":2}','[{"key":"q1","type":"single","content":"突然有一個假期，你最想做的是？","isRequired":true,"options":[{"label":"去一個從沒去過的地方冒險","value":"lion","emoji":"🗺️"},{"label":"在家研究一件感興趣的事","value":"owl","emoji":"📚"},{"label":"計劃一個聰明的小旅行","value":"fox","emoji":"🧳"},{"label":"找朋友一起窩在某個舒服的地方","value":"panda","emoji":"🏡"},{"label":"去海邊或湖邊享受","value":"dolphin","emoji":"🌊"},{"label":"獨自爬山或登高","value":"eagle","emoji":"🏔️"}]},{"key":"q2","type":"single","content":"面對挑戰，你的第一反應是？","isRequired":true,"options":[{"label":"衝！先做再說，邊做邊調整","value":"lion","emoji":"💥"},{"label":"先收集所有資訊再行動","value":"owl","emoji":"🔍"},{"label":"找到最聰明的突破口","value":"fox","emoji":"💡"},{"label":"找朋友討論，集思廣益","value":"panda","emoji":"🤝"},{"label":"用直覺感受、相信水到渠成","value":"dolphin","emoji":"🌊"},{"label":"從高處俯瞰全局再決定","value":"eagle","emoji":"🦅"}]},{"key":"q3","type":"single","content":"你的朋友會用哪個詞形容你？","isRequired":true,"options":[{"label":"霸氣、有領導力","value":"lion","emoji":"👑"},{"label":"博學、說話有深度","value":"owl","emoji":"🎓"},{"label":"聰明、總有妙計","value":"fox","emoji":"✨"},{"label":"可愛、讓人放鬆","value":"panda","emoji":"🐼"},{"label":"開朗、充滿活力","value":"dolphin","emoji":"🐬"},{"label":"沉穩、視野廣闊","value":"eagle","emoji":"🦅"}]},{"key":"q4","type":"single","content":"你覺得自己最大的優勢是？","isRequired":true,"options":[{"label":"強大的執行力和意志力","value":"lion","emoji":"💪"},{"label":"深度思考和學習能力","value":"owl","emoji":"🧠"},{"label":"靈活應變、快速解決問題","value":"fox","emoji":"⚡"},{"label":"讓人感到舒適和被接納","value":"panda","emoji":"💛"},{"label":"感染力和團隊合作","value":"dolphin","emoji":"🎵"},{"label":"大局觀和獨立判斷","value":"eagle","emoji":"🌅"}]},{"key":"q5","type":"single","content":"你在一個陌生的聚會中，通常會？","isRequired":true,"options":[{"label":"很快成為注意力中心","value":"lion","emoji":"🌟"},{"label":"找一個角落安靜觀察","value":"owl","emoji":"👁️"},{"label":"觀察後找最有趣的人搭話","value":"fox","emoji":"🎭"},{"label":"親和地讓大家都感覺自在","value":"panda","emoji":"🤗"},{"label":"帶動氣氛、讓大家玩起來","value":"dolphin","emoji":"🎉"},{"label":"保持距離、默默評估","value":"eagle","emoji":"🦅"}]}]','{"traits":["lion","owl","fox","panda","dolphin","eagle"],"scoringRules":[{"questionKey":"q1","optionValue":"lion","traitKey":"lion","score":1},{"questionKey":"q1","optionValue":"owl","traitKey":"owl","score":1},{"questionKey":"q1","optionValue":"fox","traitKey":"fox","score":1},{"questionKey":"q1","optionValue":"panda","traitKey":"panda","score":1},{"questionKey":"q1","optionValue":"dolphin","traitKey":"dolphin","score":1},{"questionKey":"q1","optionValue":"eagle","traitKey":"eagle","score":1},{"questionKey":"q2","optionValue":"lion","traitKey":"lion","score":1},{"questionKey":"q2","optionValue":"owl","traitKey":"owl","score":1},{"questionKey":"q2","optionValue":"fox","traitKey":"fox","score":1},{"questionKey":"q2","optionValue":"panda","traitKey":"panda","score":1},{"questionKey":"q2","optionValue":"dolphin","traitKey":"dolphin","score":1},{"questionKey":"q2","optionValue":"eagle","traitKey":"eagle","score":1},{"questionKey":"q3","optionValue":"lion","traitKey":"lion","score":1},{"questionKey":"q3","optionValue":"owl","traitKey":"owl","score":1},{"questionKey":"q3","optionValue":"fox","traitKey":"fox","score":1},{"questionKey":"q3","optionValue":"panda","traitKey":"panda","score":1},{"questionKey":"q3","optionValue":"dolphin","traitKey":"dolphin","score":1},{"questionKey":"q3","optionValue":"eagle","traitKey":"eagle","score":1},{"questionKey":"q4","optionValue":"lion","traitKey":"lion","score":1},{"questionKey":"q4","optionValue":"owl","traitKey":"owl","score":1},{"questionKey":"q4","optionValue":"fox","traitKey":"fox","score":1},{"questionKey":"q4","optionValue":"panda","traitKey":"panda","score":1},{"questionKey":"q4","optionValue":"dolphin","traitKey":"dolphin","score":1},{"questionKey":"q4","optionValue":"eagle","traitKey":"eagle","score":1},{"questionKey":"q5","optionValue":"lion","traitKey":"lion","score":1},{"questionKey":"q5","optionValue":"owl","traitKey":"owl","score":1},{"questionKey":"q5","optionValue":"fox","traitKey":"fox","score":1},{"questionKey":"q5","optionValue":"panda","traitKey":"panda","score":1},{"questionKey":"q5","optionValue":"dolphin","traitKey":"dolphin","score":1},{"questionKey":"q5","optionValue":"eagle","traitKey":"eagle","score":1}],"results":[{"resultKey":"lion","name":"獅子","description":"你天生是領導者。充滿行動力、敢於冒險，你的存在本身就有磁場。","emoji":"🦁","traits":{"lion":[4,5]}},{"resultKey":"owl","name":"貓頭鷹","description":"你是思考型的智者。你不急著行動，而是先深入理解。","emoji":"🦉","traits":{"owl":[4,5]}},{"resultKey":"fox","name":"狐狸","description":"你聰明、靈活，總能找到別人找不到的出路。","emoji":"🦊","traits":{"fox":[4,5]}},{"resultKey":"panda","name":"熊貓","description":"你是大家的療癒系存在。你的笑容有魔法，讓人感到放鬆安心。","emoji":"🐼","traits":{"panda":[4,5]}},{"resultKey":"dolphin","name":"海豚","description":"你充滿活力和感染力，是群體中的開心果。","emoji":"🐬","traits":{"dolphin":[4,5]}},{"resultKey":"eagle","name":"老鷹","description":"你擁有卓越的大局觀。你看得遠、想得深，不輕易受眼前事物干擾。","emoji":"🦅","traits":{"eagle":[4,5]}}]}',true,'platform'),

-- 4. 你的未來人生路線
('life-path','你的未來人生路線','你的選擇透露了你最適合走的人生道路！','🛤️','lifestyle','cyber','{"coverTitle":"你會走哪條人生路線？","coverSubtitle":"6 個選擇，看見你未來的方向 ⚡","doneTitle":"你的人生路線揭曉！","doneSubtitle":"這條路，你準備好了嗎？分享給同路人吧！","estimatedMinutes":3}','[{"key":"q1","type":"single","content":"你最嚮往的生活狀態是？","isRequired":true,"options":[{"label":"每天都不一樣、充滿新鮮感","value":"A","emoji":"🌍"},{"label":"有規律、有目標，一步步往上走","value":"B","emoji":"📈"},{"label":"做自己熱愛的事、改變世界","value":"C","emoji":"⚡"},{"label":"有深度的人際連結、真正懂我的人","value":"D","emoji":"🤍"}]},{"key":"q2","type":"single","content":"如果可以選，你的工作環境是？","isRequired":true,"options":[{"label":"隨時可以換地點的遠端工作","value":"A","emoji":"🌐"},{"label":"大公司或知名機構，有系統有資源","value":"B","emoji":"🏢"},{"label":"自己創業或小而美的新創","value":"C","emoji":"🚀"},{"label":"非營利、教育或幫助人的領域","value":"D","emoji":"💚"}]},{"key":"q3","type":"single","content":"你對「成功」的定義是？","isRequired":true,"options":[{"label":"去過最多地方、體驗最豐富的人生","value":"A","emoji":"🗺️"},{"label":"財務自由、有能力給家人最好的","value":"B","emoji":"💰"},{"label":"做出真正改變世界的東西","value":"C","emoji":"🌟"},{"label":"身邊都是真正在乎彼此的人","value":"D","emoji":"👥"}]},{"key":"q4","type":"single","content":"面對未知，你的態度是？","isRequired":true,"options":[{"label":"興奮！未知就是可能性","value":"A","emoji":"🎲"},{"label":"謹慎準備、把風險降到最低","value":"B","emoji":"🛡️"},{"label":"把未知當成創新的機會","value":"C","emoji":"💡"},{"label":"只要和重要的人一起，什麼都能面對","value":"D","emoji":"🤝"}]},{"key":"q5","type":"single","content":"十年後，你最希望在哪裡？","isRequired":true,"options":[{"label":"不確定——那才是最棒的答案","value":"A","emoji":"🌈"},{"label":"在一個我努力搭建的穩固基地","value":"B","emoji":"🏠"},{"label":"站在某個我親手打造的舞台上","value":"C","emoji":"🎭"},{"label":"和最重要的人在一起，地方不重要","value":"D","emoji":"💛"}]},{"key":"q6","type":"single","content":"你最欣賞哪種人？","isRequired":true,"options":[{"label":"放下一切出走、活得自由的人","value":"A","emoji":"🦅"},{"label":"十年磨一劍、終於成功的人","value":"B","emoji":"⚔️"},{"label":"用一個想法改變了一個行業的人","value":"C","emoji":"💥"},{"label":"默默影響了很多人生命的人","value":"D","emoji":"🌱"}]}]','{"traits":["explorer","builder","innovator","connector"],"scoringRules":[{"questionKey":"q1","optionValue":"A","traitKey":"explorer","score":3},{"questionKey":"q1","optionValue":"B","traitKey":"builder","score":3},{"questionKey":"q1","optionValue":"C","traitKey":"innovator","score":3},{"questionKey":"q1","optionValue":"D","traitKey":"connector","score":3},{"questionKey":"q2","optionValue":"A","traitKey":"explorer","score":3},{"questionKey":"q2","optionValue":"B","traitKey":"builder","score":3},{"questionKey":"q2","optionValue":"C","traitKey":"innovator","score":3},{"questionKey":"q2","optionValue":"D","traitKey":"connector","score":3},{"questionKey":"q3","optionValue":"A","traitKey":"explorer","score":3},{"questionKey":"q3","optionValue":"B","traitKey":"builder","score":3},{"questionKey":"q3","optionValue":"C","traitKey":"innovator","score":3},{"questionKey":"q3","optionValue":"D","traitKey":"connector","score":3},{"questionKey":"q4","optionValue":"A","traitKey":"explorer","score":3},{"questionKey":"q4","optionValue":"B","traitKey":"builder","score":3},{"questionKey":"q4","optionValue":"C","traitKey":"innovator","score":3},{"questionKey":"q4","optionValue":"D","traitKey":"connector","score":3},{"questionKey":"q5","optionValue":"A","traitKey":"explorer","score":3},{"questionKey":"q5","optionValue":"B","traitKey":"builder","score":3},{"questionKey":"q5","optionValue":"C","traitKey":"innovator","score":3},{"questionKey":"q5","optionValue":"D","traitKey":"connector","score":3},{"questionKey":"q6","optionValue":"A","traitKey":"explorer","score":3},{"questionKey":"q6","optionValue":"B","traitKey":"builder","score":3},{"questionKey":"q6","optionValue":"C","traitKey":"innovator","score":3},{"questionKey":"q6","optionValue":"D","traitKey":"connector","score":3}],"results":[{"resultKey":"explorer","name":"自由探索者","description":"你的人生字典裡沒有「一成不變」。你需要自由、渴望多元體驗，每一段旅程都是你的養分。","emoji":"🌍","traits":{"explorer":[12,18]}},{"resultKey":"builder","name":"穩定建造者","description":"你相信積累的力量。你不追求一夜爆紅，而是把每一塊磚都砌好。","emoji":"🏗️","traits":{"builder":[12,18]}},{"resultKey":"innovator","name":"創新突破者","description":"你看到的世界和別人不一樣。你在別人看到問題的地方，看到機會。","emoji":"⚡","traits":{"innovator":[12,18]}},{"resultKey":"connector","name":"深度連結者","description":"你知道人才是一切的核心。你的影響力靠的是一個一個真實的連結。","emoji":"🤍","traits":{"connector":[12,18]}}]}',false,'platform'),

-- 5. 你在職場的角色
('workplace-role','你在職場的角色','你是領導者、執行者、創意人還是協調者？','💼','lifestyle','default','{"coverTitle":"你在職場扮演什麼角色？","coverSubtitle":"6 個問題，看清你的工作人格 📊","doneTitle":"你的職場角色揭曉！","doneSubtitle":"分享給同事，看看他們認同嗎？😄","estimatedMinutes":3}','[{"key":"q1","type":"single","content":"開會時，你通常是？","isRequired":true,"options":[{"label":"主導討論方向、做最後決定","value":"A","emoji":"🎯"},{"label":"認真做筆記、回去按時完成","value":"B","emoji":"📝"},{"label":"提出大家沒想到的角度","value":"C","emoji":"💡"},{"label":"確保每個人都有機會說話","value":"D","emoji":"🤝"}]},{"key":"q2","type":"single","content":"拿到一個新專案，你的第一步是？","isRequired":true,"options":[{"label":"確認目標、分配任務、訂 deadline","value":"A","emoji":"📋"},{"label":"把自己負責的部分研究透徹","value":"B","emoji":"🔍"},{"label":"先腦暴一堆可能的方向","value":"C","emoji":"🌈"},{"label":"確認團隊成員的狀態和分工","value":"D","emoji":"👥"}]},{"key":"q3","type":"single","content":"專案遇到瓶頸，你會？","isRequired":true,"options":[{"label":"快速決策、調整方向","value":"A","emoji":"⚡"},{"label":"深入分析原因、找出問題根源","value":"B","emoji":"🔬"},{"label":"想一個完全不同的解法","value":"C","emoji":"🎨"},{"label":"召集大家一起想辦法","value":"D","emoji":"🤗"}]},{"key":"q4","type":"single","content":"最讓你有成就感的是？","isRequired":true,"options":[{"label":"看到團隊超越目標","value":"A","emoji":"🏆"},{"label":"把一件事做到極致、完美交付","value":"B","emoji":"✅"},{"label":"一個想法從無到有變成現實","value":"C","emoji":"🚀"},{"label":"幫助同事解決困難","value":"D","emoji":"💛"}]},{"key":"q5","type":"single","content":"理想的工作日是？","isRequired":true,"options":[{"label":"高強度、高節奏，充滿決策和挑戰","value":"A","emoji":"🔥"},{"label":"專注深入地完成一件重要的事","value":"B","emoji":"🎯"},{"label":"自由探索、嘗試新的東西","value":"C","emoji":"🌟"},{"label":"和不同的人互動、解決各種問題","value":"D","emoji":"🌐"}]},{"key":"q6","type":"single","content":"如果你是一個工具，你會是？","isRequired":true,"options":[{"label":"指南針——指引方向","value":"A","emoji":"🧭"},{"label":"精密儀器——精準可靠","value":"B","emoji":"⚙️"},{"label":"畫筆——創造無限可能","value":"C","emoji":"🖌️"},{"label":"橋梁——連接彼此","value":"D","emoji":"🌉"}]}]','{"traits":["leader","executor","creative","coordinator"],"scoringRules":[{"questionKey":"q1","optionValue":"A","traitKey":"leader","score":3},{"questionKey":"q1","optionValue":"B","traitKey":"executor","score":3},{"questionKey":"q1","optionValue":"C","traitKey":"creative","score":3},{"questionKey":"q1","optionValue":"D","traitKey":"coordinator","score":3},{"questionKey":"q2","optionValue":"A","traitKey":"leader","score":3},{"questionKey":"q2","optionValue":"B","traitKey":"executor","score":3},{"questionKey":"q2","optionValue":"C","traitKey":"creative","score":3},{"questionKey":"q2","optionValue":"D","traitKey":"coordinator","score":3},{"questionKey":"q3","optionValue":"A","traitKey":"leader","score":3},{"questionKey":"q3","optionValue":"B","traitKey":"executor","score":3},{"questionKey":"q3","optionValue":"C","traitKey":"creative","score":3},{"questionKey":"q3","optionValue":"D","traitKey":"coordinator","score":3},{"questionKey":"q4","optionValue":"A","traitKey":"leader","score":3},{"questionKey":"q4","optionValue":"B","traitKey":"executor","score":3},{"questionKey":"q4","optionValue":"C","traitKey":"creative","score":3},{"questionKey":"q4","optionValue":"D","traitKey":"coordinator","score":3},{"questionKey":"q5","optionValue":"A","traitKey":"leader","score":3},{"questionKey":"q5","optionValue":"B","traitKey":"executor","score":3},{"questionKey":"q5","optionValue":"C","traitKey":"creative","score":3},{"questionKey":"q5","optionValue":"D","traitKey":"coordinator","score":3},{"questionKey":"q6","optionValue":"A","traitKey":"leader","score":3},{"questionKey":"q6","optionValue":"B","traitKey":"executor","score":3},{"questionKey":"q6","optionValue":"C","traitKey":"creative","score":3},{"questionKey":"q6","optionValue":"D","traitKey":"coordinator","score":3}],"results":[{"resultKey":"leader","name":"領導者","description":"你天生有帶人的格局。你看的是全局、管的是方向。有你在，團隊就有主心骨。","emoji":"👑","traits":{"leader":[12,18]}},{"resultKey":"executor","name":"執行者","description":"你是那種說到做到、讓人放心的人。你的可靠性是整個團隊最強的資產之一。","emoji":"⚙️","traits":{"executor":[12,18]}},{"resultKey":"creative","name":"創意人","description":"你的腦袋裡永遠有別人想不到的東西。你在框架之外思考，讓平凡的問題有了不平凡的解法。","emoji":"🎨","traits":{"creative":[12,18]}},{"resultKey":"coordinator","name":"協調者","description":"你是讓團隊順暢運作的關鍵齒輪。你能在衝突中找到共識、在混亂中建立秩序。","emoji":"🌉","traits":{"coordinator":[12,18]}}]}',false,'platform'),

-- 6. 情侶默契測驗
('couple-compatibility','情侶默契測驗','你們有多了解彼此？8個問題測出真實默契！','💑','relationship','sakura','{"coverTitle":"你們的默契有幾分？","coverSubtitle":"兩個人各自填、再來對答案 💕","doneTitle":"你的答案填好了！","doneSubtitle":"讓另一半也來填，然後對照答案看看默契幾分 😄","estimatedMinutes":3}','[{"key":"q1","type":"single","content":"你們最常吵架的原因是？","isRequired":true,"options":[{"label":"溝通不良、說了對方聽不懂","value":"A","emoji":"💬"},{"label":"生活習慣不一樣","value":"B","emoji":"🏠"},{"label":"時間和陪伴","value":"C","emoji":"⏰"},{"label":"金錢觀念不同","value":"D","emoji":"💰"},{"label":"其實很少吵架","value":"E","emoji":"😊"}]},{"key":"q2","type":"single","content":"另一半最常說你哪一點需要改進？","isRequired":true,"options":[{"label":"太粗心、常常忘東忘西","value":"A","emoji":"🙈"},{"label":"說話太直、有時會傷人","value":"B","emoji":"💬"},{"label":"情緒管理需要加強","value":"C","emoji":"😤"},{"label":"太獨立、有時不讓對方參與","value":"D","emoji":"🚪"},{"label":"其實沒什麼需要改進的","value":"E","emoji":"😇"}]},{"key":"q3","type":"single","content":"你們在一起最享受的時光是？","isRequired":true,"options":[{"label":"一起出去玩、探索新地方","value":"A","emoji":"🗺️"},{"label":"在家窩著、什麼都不做","value":"B","emoji":"🛋️"},{"label":"一起吃好吃的東西","value":"C","emoji":"🍽️"},{"label":"深夜聊天、說各種心裡話","value":"D","emoji":"🌙"},{"label":"一起做一個共同的興趣","value":"E","emoji":"🎮"}]},{"key":"q4","type":"single","content":"另一半最讓你感動的地方是？","isRequired":true,"options":[{"label":"在你最低落時，默默陪在旁邊","value":"A","emoji":"🤍"},{"label":"記得你說過的每一個小細節","value":"B","emoji":"💛"},{"label":"總是讓你先、願意為你犧牲","value":"C","emoji":"🌸"},{"label":"讓你做自己、從不試圖改變你","value":"D","emoji":"🦋"},{"label":"在別人面前維護你、讓你有安全感","value":"E","emoji":"🛡️"}]},{"key":"q5","type":"single","content":"你們的愛情，你覺得最像？","isRequired":true,"options":[{"label":"溫水——平靜但越來越暖","value":"A","emoji":"☕"},{"label":"煙火——激烈燦爛","value":"B","emoji":"🎆"},{"label":"樹木——紮根、穩定成長","value":"C","emoji":"🌳"},{"label":"海浪——有起伏但一直在","value":"D","emoji":"🌊"}]},{"key":"q6","type":"single","content":"如果你們的愛情是一首歌，曲風會是？","isRequired":true,"options":[{"label":"抒情情歌，悠遠深情","value":"A","emoji":"🎵"},{"label":"輕快流行，陽光活潑","value":"B","emoji":"🎶"},{"label":"爵士，有質感有深度","value":"C","emoji":"🎷"},{"label":"搖滾，充滿能量和熱情","value":"D","emoji":"🎸"}]},{"key":"q7","type":"single","content":"你覺得你們在一起，讓你最成長的是？","isRequired":true,"options":[{"label":"學會更好地表達自己的感受","value":"A","emoji":"💬"},{"label":"變得更有耐心和包容","value":"B","emoji":"🌿"},{"label":"更了解自己真正想要什麼","value":"C","emoji":"🔍"},{"label":"更敢去追求自己的夢想","value":"D","emoji":"🚀"}]},{"key":"q8","type":"single","content":"你們的未來，你最期待的是？","isRequired":true,"options":[{"label":"一起去還沒去過的地方旅行","value":"A","emoji":"✈️"},{"label":"建立一個真正屬於我們的家","value":"B","emoji":"🏡"},{"label":"一起實現某個共同的夢想","value":"C","emoji":"⭐"},{"label":"就這樣慢慢變老、陪著彼此","value":"D","emoji":"👫"}]}]',NULL,true,'platform'),

-- 7. 你的人生價值觀
('life-values','你的人生價值觀','你最在乎什麼？揭開驅動你人生的核心價值！','🌟','lifestyle','ancient','{"coverTitle":"你的人生價值觀是什麼？","coverSubtitle":"6 個選擇，看見你最深處的在乎 🏯","doneTitle":"你的核心價值觀揭曉！","doneSubtitle":"了解自己，是最重要的事。分享給也在探索的朋友吧。","estimatedMinutes":3}','[{"key":"q1","type":"single","content":"如果你只能追求一件事，你會選？","isRequired":true,"options":[{"label":"自由——隨心所欲地活著","value":"freedom","emoji":"🕊️"},{"label":"成就——做出真正有意義的事","value":"achievement","emoji":"🏆"},{"label":"愛——深刻的連結和歸屬感","value":"love","emoji":"❤️"},{"label":"智慧——真正理解這個世界","value":"wisdom","emoji":"📜"}]},{"key":"q2","type":"single","content":"你最無法接受的是？","isRequired":true,"options":[{"label":"被束縛、被控制","value":"freedom","emoji":"⛓️"},{"label":"碌碌無為、虛度光陰","value":"achievement","emoji":"⏳"},{"label":"孤獨、與世界失去連結","value":"love","emoji":"🌑"},{"label":"無知、人云亦云","value":"wisdom","emoji":"🙈"}]},{"key":"q3","type":"single","content":"在你心中，一個完整的人生必須包含？","isRequired":true,"options":[{"label":"足夠的選擇和冒險","value":"freedom","emoji":"🌍"},{"label":"留下一些有價值的東西","value":"achievement","emoji":"🗿"},{"label":"深刻愛過、也被愛過","value":"love","emoji":"💞"},{"label":"真正理解過幾件重要的事","value":"wisdom","emoji":"🎓"}]},{"key":"q4","type":"single","content":"面對一個艱難的人生決定，你最看重什麼？","isRequired":true,"options":[{"label":"這個選擇讓我更自由還是更受限？","value":"freedom","emoji":"🔓"},{"label":"這個選擇能不能讓我成長？","value":"achievement","emoji":"📈"},{"label":"這個選擇對我在乎的人有什麼影響？","value":"love","emoji":"🤲"},{"label":"這個選擇符不符合我的內心？","value":"wisdom","emoji":"🪞"}]},{"key":"q5","type":"single","content":"如果可以留下一句話給後人，你希望是？","isRequired":true,"options":[{"label":"「勇敢地活出自己。」","value":"freedom","emoji":"🦅"},{"label":"「用你的存在讓世界更好一點。」","value":"achievement","emoji":"🌟"},{"label":"「好好愛你身邊的人。」","value":"love","emoji":"💛"},{"label":"「持續思考，不要停止追問。」","value":"wisdom","emoji":"🔍"}]},{"key":"q6","type":"single","content":"你覺得人生最大的遺憾通常是？","isRequired":true,"options":[{"label":"沒有勇氣做那些想做的事","value":"freedom","emoji":"😔"},{"label":"沒有把潛力完全發揮出來","value":"achievement","emoji":"💭"},{"label":"沒有好好珍惜重要的人","value":"love","emoji":"🥺"},{"label":"活了一輩子卻沒有真正認識自己","value":"wisdom","emoji":"🌫️"}]}]','{"traits":["freedom","achievement","love","wisdom"],"scoringRules":[{"questionKey":"q1","optionValue":"freedom","traitKey":"freedom","score":3},{"questionKey":"q1","optionValue":"achievement","traitKey":"achievement","score":3},{"questionKey":"q1","optionValue":"love","traitKey":"love","score":3},{"questionKey":"q1","optionValue":"wisdom","traitKey":"wisdom","score":3},{"questionKey":"q2","optionValue":"freedom","traitKey":"freedom","score":3},{"questionKey":"q2","optionValue":"achievement","traitKey":"achievement","score":3},{"questionKey":"q2","optionValue":"love","traitKey":"love","score":3},{"questionKey":"q2","optionValue":"wisdom","traitKey":"wisdom","score":3},{"questionKey":"q3","optionValue":"freedom","traitKey":"freedom","score":3},{"questionKey":"q3","optionValue":"achievement","traitKey":"achievement","score":3},{"questionKey":"q3","optionValue":"love","traitKey":"love","score":3},{"questionKey":"q3","optionValue":"wisdom","traitKey":"wisdom","score":3},{"questionKey":"q4","optionValue":"freedom","traitKey":"freedom","score":3},{"questionKey":"q4","optionValue":"achievement","traitKey":"achievement","score":3},{"questionKey":"q4","optionValue":"love","traitKey":"love","score":3},{"questionKey":"q4","optionValue":"wisdom","traitKey":"wisdom","score":3},{"questionKey":"q5","optionValue":"freedom","traitKey":"freedom","score":3},{"questionKey":"q5","optionValue":"achievement","traitKey":"achievement","score":3},{"questionKey":"q5","optionValue":"love","traitKey":"love","score":3},{"questionKey":"q5","optionValue":"wisdom","traitKey":"wisdom","score":3},{"questionKey":"q6","optionValue":"freedom","traitKey":"freedom","score":3},{"questionKey":"q6","optionValue":"achievement","traitKey":"achievement","score":3},{"questionKey":"q6","optionValue":"love","traitKey":"love","score":3},{"questionKey":"q6","optionValue":"wisdom","traitKey":"wisdom","score":3}],"results":[{"resultKey":"freedom","name":"自由主義者","description":"你最深層的渴望是：做自己，活在自己的規則裡。你的人生是一場持續的自我解放之旅。","emoji":"🕊️","traits":{"freedom":[12,18]}},{"resultKey":"achievement","name":"成就驅動者","description":"你活著是為了留下一點什麼。你有強烈的使命感，不甘心平庸。","emoji":"🏆","traits":{"achievement":[12,18]}},{"resultKey":"love","name":"連結主義者","description":"對你來說，人生最真實的意義存在於關係之中。","emoji":"❤️","traits":{"love":[12,18]}},{"resultKey":"wisdom","name":"智慧探求者","description":"你一直在問「為什麼」。你不滿足於表面，想要真正理解事物的本質。","emoji":"📜","traits":{"wisdom":[12,18]}}]}',false,'platform'),

-- 8. 你的隱藏天賦
('hidden-talent','你的隱藏天賦','你真正的天賦是什麼？也許連你自己都不知道！','🌠','personality','game','{"coverTitle":"你隱藏的天賦是什麼？","coverSubtitle":"6 個問題，解鎖你的隱藏屬性 🎮","doneTitle":"你的隱藏天賦解鎖了！","doneSubtitle":"分享給朋友，看看他們發現了什麼天賦！","estimatedMinutes":3}','[{"key":"q1","type":"single","content":"小時候，你最常做的事是？","isRequired":true,"options":[{"label":"講故事給其他小朋友聽","value":"language","emoji":"📖"},{"label":"畫畫、做手工、搭樂高","value":"visual","emoji":"🎨"},{"label":"哼歌、學各種聲音","value":"music","emoji":"🎵"},{"label":"玩數學遊戲或解謎","value":"logic","emoji":"🧩"},{"label":"當朋友之間的和事佬","value":"social","emoji":"🤝"},{"label":"喜歡跑跳、肢體活動","value":"physical","emoji":"⚽"}]},{"key":"q2","type":"single","content":"別人向你求助，你最拿手的是？","isRequired":true,"options":[{"label":"幫他們用文字表達想說的話","value":"language","emoji":"✍️"},{"label":"幫他們設計或美化東西","value":"visual","emoji":"🖌️"},{"label":"推薦適合的音樂或場景","value":"music","emoji":"🎧"},{"label":"幫他們理清邏輯和問題","value":"logic","emoji":"💡"},{"label":"幫他們處理人際關係","value":"social","emoji":"💬"},{"label":"教他們一個動作或技巧","value":"physical","emoji":"🏃"}]},{"key":"q3","type":"single","content":"你最容易進入「心流」狀態的是？","isRequired":true,"options":[{"label":"寫作、閱讀、辯論","value":"language","emoji":"📝"},{"label":"拍照、排版、佈置空間","value":"visual","emoji":"📸"},{"label":"聽音樂、演奏、哼歌","value":"music","emoji":"🎼"},{"label":"解題、寫程式、分析數據","value":"logic","emoji":"💻"},{"label":"和人聊天、幫助他人","value":"social","emoji":"🌟"},{"label":"運動、跳舞、手作","value":"physical","emoji":"💃"}]},{"key":"q4","type":"single","content":"別人最常稱讚你？","isRequired":true,"options":[{"label":"「你說話/寫作真的很有力量」","value":"language","emoji":"🗣️"},{"label":"「你的美感好好，什麼都好看」","value":"visual","emoji":"👁️"},{"label":"「你對音樂的感受力超強」","value":"music","emoji":"🎤"},{"label":"「你分析問題真的很厲害」","value":"logic","emoji":"🔬"},{"label":"「和你說話感覺很被理解」","value":"social","emoji":"💛"},{"label":"「你的協調性和肢體感超好」","value":"physical","emoji":"🤸"}]},{"key":"q5","type":"single","content":"如果要你學一個新技能，你最想學？","isRequired":true,"options":[{"label":"寫劇本或出版一本書","value":"language","emoji":"📚"},{"label":"學插畫或學電影剪輯","value":"visual","emoji":"🎬"},{"label":"學一種樂器或學唱歌","value":"music","emoji":"🎹"},{"label":"學 AI 應用或學統計分析","value":"logic","emoji":"🤖"},{"label":"學教練技術或心理學","value":"social","emoji":"🧠"},{"label":"學一種武術或學瑜珈","value":"physical","emoji":"🧘"}]},{"key":"q6","type":"single","content":"哪種成就讓你最有自豪感？","isRequired":true,"options":[{"label":"用一段話讓別人眼睛一亮","value":"language","emoji":"✨"},{"label":"創作出一個讓自己滿意的作品","value":"visual","emoji":"🖼️"},{"label":"在人群面前表演，感受共鳴","value":"music","emoji":"🎭"},{"label":"解開一個別人解不了的問題","value":"logic","emoji":"🏆"},{"label":"幫助一個人走出困境","value":"social","emoji":"🌈"},{"label":"用身體做到一件困難的事","value":"physical","emoji":"🥇"}]}]','{"traits":["language","visual","music","logic","social","physical"],"scoringRules":[{"questionKey":"q1","optionValue":"language","traitKey":"language","score":1},{"questionKey":"q1","optionValue":"visual","traitKey":"visual","score":1},{"questionKey":"q1","optionValue":"music","traitKey":"music","score":1},{"questionKey":"q1","optionValue":"logic","traitKey":"logic","score":1},{"questionKey":"q1","optionValue":"social","traitKey":"social","score":1},{"questionKey":"q1","optionValue":"physical","traitKey":"physical","score":1},{"questionKey":"q2","optionValue":"language","traitKey":"language","score":1},{"questionKey":"q2","optionValue":"visual","traitKey":"visual","score":1},{"questionKey":"q2","optionValue":"music","traitKey":"music","score":1},{"questionKey":"q2","optionValue":"logic","traitKey":"logic","score":1},{"questionKey":"q2","optionValue":"social","traitKey":"social","score":1},{"questionKey":"q2","optionValue":"physical","traitKey":"physical","score":1},{"questionKey":"q3","optionValue":"language","traitKey":"language","score":1},{"questionKey":"q3","optionValue":"visual","traitKey":"visual","score":1},{"questionKey":"q3","optionValue":"music","traitKey":"music","score":1},{"questionKey":"q3","optionValue":"logic","traitKey":"logic","score":1},{"questionKey":"q3","optionValue":"social","traitKey":"social","score":1},{"questionKey":"q3","optionValue":"physical","traitKey":"physical","score":1},{"questionKey":"q4","optionValue":"language","traitKey":"language","score":1},{"questionKey":"q4","optionValue":"visual","traitKey":"visual","score":1},{"questionKey":"q4","optionValue":"music","traitKey":"music","score":1},{"questionKey":"q4","optionValue":"logic","traitKey":"logic","score":1},{"questionKey":"q4","optionValue":"social","traitKey":"social","score":1},{"questionKey":"q4","optionValue":"physical","traitKey":"physical","score":1},{"questionKey":"q5","optionValue":"language","traitKey":"language","score":1},{"questionKey":"q5","optionValue":"visual","traitKey":"visual","score":1},{"questionKey":"q5","optionValue":"music","traitKey":"music","score":1},{"questionKey":"q5","optionValue":"logic","traitKey":"logic","score":1},{"questionKey":"q5","optionValue":"social","traitKey":"social","score":1},{"questionKey":"q5","optionValue":"physical","traitKey":"physical","score":1},{"questionKey":"q6","optionValue":"language","traitKey":"language","score":1},{"questionKey":"q6","optionValue":"visual","traitKey":"visual","score":1},{"questionKey":"q6","optionValue":"music","traitKey":"music","score":1},{"questionKey":"q6","optionValue":"logic","traitKey":"logic","score":1},{"questionKey":"q6","optionValue":"social","traitKey":"social","score":1},{"questionKey":"q6","optionValue":"physical","traitKey":"physical","score":1}],"results":[{"resultKey":"language","name":"語言天才","description":"你有操控文字和語言的天賦。你能用精準的詞彙表達複雜的感受。","emoji":"📖","traits":{"language":[5,6]}},{"resultKey":"visual","name":"視覺天才","description":"你看世界的方式和別人不一樣。你對顏色、構圖、空間有天生的敏感。","emoji":"🎨","traits":{"visual":[5,6]}},{"resultKey":"music","name":"音樂天才","description":"你的靈魂和音符之間有直接的連線。你能感受到音樂裡的情感層次。","emoji":"🎵","traits":{"music":[5,6]}},{"resultKey":"logic","name":"邏輯天才","description":"你的大腦是一台精密的分析機器。你能快速找出規律、識破矛盾。","emoji":"🧩","traits":{"logic":[5,6]}},{"resultKey":"social","name":"人際天才","description":"你天生懂人心。你能感受到別人說不出口的需求，讓每個人都感覺被看見。","emoji":"💛","traits":{"social":[5,6]}},{"resultKey":"physical","name":"身體天才","description":"你的身體是你最精準的表達工具。你有卓越的協調性和空間感。","emoji":"🤸","traits":{"physical":[5,6]}}]}',true,'platform'),

-- 9. 朋友適合你的程度
('friendship-match','朋友適合你的程度','測測你和某位朋友到底合不合拍！','🤝','social','ocean','{"coverTitle":"你們有多合拍？","coverSubtitle":"5 個問題，測出你的理想友誼模式 🌊","doneTitle":"你的友誼類型揭曉！","doneSubtitle":"傳給你的好朋友，看看他們的結果一不一樣！","estimatedMinutes":2}','[{"key":"q1","type":"single","content":"你最理想的朋友相處模式是？","isRequired":true,"options":[{"label":"時常聯繫、互相關心、什麼都分享","value":"A","emoji":"💌"},{"label":"不一定常聯絡，但見面就像沒斷過","value":"B","emoji":"🔮"},{"label":"一起做事、共同目標讓我們更緊密","value":"C","emoji":"🤝"},{"label":"什麼話都能說，不用維持形象","value":"D","emoji":"🛋️"},{"label":"各自生活，但永遠知道對方在","value":"E","emoji":"⭐"}]},{"key":"q2","type":"single","content":"朋友最重要的特質是？","isRequired":true,"options":[{"label":"誠實——就算話難聽也願意說真話","value":"A","emoji":"🎯"},{"label":"忠誠——在你最難的時候還在","value":"B","emoji":"🛡️"},{"label":"趣味——在一起就會開心","value":"C","emoji":"😂"},{"label":"理解——不用解釋就懂你","value":"D","emoji":"🌊"},{"label":"成長——相互激勵、一起變更好","value":"E","emoji":"🌱"}]},{"key":"q3","type":"single","content":"你害怕友誼中的哪種情況？","isRequired":true,"options":[{"label":"朋友突然疏遠、不知道哪裡出了問題","value":"A","emoji":"❓"},{"label":"漸漸變成只有表面的客套","value":"B","emoji":"😶"},{"label":"朋友遇到困難卻不告訴你","value":"C","emoji":"😔"},{"label":"被誤解、說了也沒辦法解釋清楚","value":"D","emoji":"🌧️"},{"label":"感覺自己在這段友誼裡付出比較多","value":"E","emoji":"⚖️"}]},{"key":"q4","type":"single","content":"一個好朋友在你低潮時，你最希望他/她怎麼做？","isRequired":true,"options":[{"label":"主動聯繫，問你還好嗎","value":"A","emoji":"📞"},{"label":"默默陪著你，不需要說什麼","value":"B","emoji":"🤗"},{"label":"帶你出去、讓你暫時忘記煩惱","value":"C","emoji":"🎉"},{"label":"認真聽你說話、不急著給建議","value":"D","emoji":"👂"},{"label":"給你一個直接、有用的建議","value":"E","emoji":"💡"}]},{"key":"q5","type":"single","content":"你覺得一段友誼最終的試金石是？","isRequired":true,"options":[{"label":"時間——能不能越走越久","value":"A","emoji":"⏰"},{"label":"危難——在你最差的時候還不離開","value":"B","emoji":"🌩️"},{"label":"成長——讓彼此都變得更好","value":"C","emoji":"🌿"},{"label":"真實——在對方面前可以完全做自己","value":"D","emoji":"🪞"},{"label":"快樂——每次見面都覺得值得","value":"E","emoji":"✨"}]}]','{"traits":["intimate","loyal","fun","deep","growth"],"scoringRules":[{"questionKey":"q1","optionValue":"A","traitKey":"intimate","score":3},{"questionKey":"q1","optionValue":"B","traitKey":"loyal","score":3},{"questionKey":"q1","optionValue":"C","traitKey":"growth","score":3},{"questionKey":"q1","optionValue":"D","traitKey":"deep","score":3},{"questionKey":"q1","optionValue":"E","traitKey":"loyal","score":2},{"questionKey":"q2","optionValue":"A","traitKey":"deep","score":2},{"questionKey":"q2","optionValue":"B","traitKey":"loyal","score":3},{"questionKey":"q2","optionValue":"C","traitKey":"fun","score":3},{"questionKey":"q2","optionValue":"D","traitKey":"deep","score":3},{"questionKey":"q2","optionValue":"E","traitKey":"growth","score":3},{"questionKey":"q3","optionValue":"A","traitKey":"intimate","score":3},{"questionKey":"q3","optionValue":"B","traitKey":"deep","score":3},{"questionKey":"q3","optionValue":"C","traitKey":"loyal","score":3},{"questionKey":"q3","optionValue":"D","traitKey":"deep","score":2},{"questionKey":"q3","optionValue":"E","traitKey":"intimate","score":2},{"questionKey":"q4","optionValue":"A","traitKey":"intimate","score":3},{"questionKey":"q4","optionValue":"B","traitKey":"loyal","score":3},{"questionKey":"q4","optionValue":"C","traitKey":"fun","score":3},{"questionKey":"q4","optionValue":"D","traitKey":"deep","score":3},{"questionKey":"q4","optionValue":"E","traitKey":"growth","score":3},{"questionKey":"q5","optionValue":"A","traitKey":"loyal","score":3},{"questionKey":"q5","optionValue":"B","traitKey":"loyal","score":3},{"questionKey":"q5","optionValue":"C","traitKey":"growth","score":3},{"questionKey":"q5","optionValue":"D","traitKey":"deep","score":3},{"questionKey":"q5","optionValue":"E","traitKey":"fun","score":3}],"results":[{"resultKey":"intimate","name":"黏膩型好友","description":"你需要的是那種常聯絡、什麼都分享的緊密友誼。","emoji":"💌","traits":{"intimate":[6,15]}},{"resultKey":"loyal","name":"生死之交型","description":"你在乎的是那種無論多久沒聯絡、再次見面都像昨天的友誼。","emoji":"🛡️","traits":{"loyal":[6,15]}},{"resultKey":"fun","name":"快樂夥伴型","description":"你最看重的是在一起的時光有多開心。","emoji":"🎉","traits":{"fun":[6,15]}},{"resultKey":"deep","name":"靈魂連結型","description":"你需要的是那種能深入彼此靈魂的友誼，彼此真正理解的人。","emoji":"🌊","traits":{"deep":[6,15]}},{"resultKey":"growth","name":"共同成長型","description":"你最看重的友誼是能讓彼此變得更好的關係。","emoji":"🌱","traits":{"growth":[6,15]}}]}',false,'platform'),

-- 10. 你的壓力應對方式
('stress-style','你的壓力應對方式','壓力來的時候，你是哪種人？行動派、思考派還是獨處派？','🌪️','lifestyle','noir','{"coverTitle":"壓力來了，你怎麼辦？","coverSubtitle":"5 個問題，了解你的解壓模式 🖤","doneTitle":"你的壓力應對風格揭曉！","doneSubtitle":"了解自己如何面對壓力，是照顧自己的第一步。","estimatedMinutes":2}','[{"key":"q1","type":"single","content":"壓力很大的時候，你最先出現的反應是？","isRequired":true,"options":[{"label":"立刻找事情做，動起來就不會亂想","value":"action","emoji":"⚡"},{"label":"在腦袋裡反覆分析，找出問題根源","value":"thinking","emoji":"🧠"},{"label":"想找個人說說話、被聽見就會好多了","value":"social","emoji":"💬"},{"label":"需要一個人靜一靜，不想被打擾","value":"solitude","emoji":"🌙"}]},{"key":"q2","type":"single","content":"你最有效的解壓方式是？","isRequired":true,"options":[{"label":"運動、打掃、做點體力活","value":"action","emoji":"🏃"},{"label":"寫日記、列清單、整理思緒","value":"thinking","emoji":"📓"},{"label":"找朋友出去玩或訴苦","value":"social","emoji":"🍻"},{"label":"一個人聽音樂、看電影、發呆","value":"solitude","emoji":"🎧"}]},{"key":"q3","type":"single","content":"壓力累積了一陣子，你通常會怎麼顯現？","isRequired":true,"options":[{"label":"開始做很多事，忙到不知道在幹嘛","value":"action","emoji":"🌀"},{"label":"越想越多，晚上睡不著","value":"thinking","emoji":"💭"},{"label":"特別需要人陪、怕一個人","value":"social","emoji":"🤗"},{"label":"把自己關起來，不想見任何人","value":"solitude","emoji":"🚪"}]},{"key":"q4","type":"single","content":"朋友也在壓力大，你會怎麼幫他/她？","isRequired":true,"options":[{"label":"帶他去做點什麼，行動最有效","value":"action","emoji":"🏋️"},{"label":"幫他分析問題、想出解決方案","value":"thinking","emoji":"💡"},{"label":"陪他說話、讓他說個夠","value":"social","emoji":"👂"},{"label":"尊重他需要的空間，讓他自己消化","value":"solitude","emoji":"🌿"}]},{"key":"q5","type":"single","content":"壓力消解之後，你通常的感受是？","isRequired":true,"options":[{"label":"「還好我沒有停下來，做就對了」","value":"action","emoji":"💪"},{"label":"「我想清楚了，知道怎麼做了」","value":"thinking","emoji":"✅"},{"label":"「說出來真的好多了，謝謝你聽我說」","value":"social","emoji":"💛"},{"label":"「一個人靜一靜真的很重要」","value":"solitude","emoji":"🌸"}]}]','{"traits":["action","thinking","social","solitude"],"scoringRules":[{"questionKey":"q1","optionValue":"action","traitKey":"action","score":3},{"questionKey":"q1","optionValue":"thinking","traitKey":"thinking","score":3},{"questionKey":"q1","optionValue":"social","traitKey":"social","score":3},{"questionKey":"q1","optionValue":"solitude","traitKey":"solitude","score":3},{"questionKey":"q2","optionValue":"action","traitKey":"action","score":3},{"questionKey":"q2","optionValue":"thinking","traitKey":"thinking","score":3},{"questionKey":"q2","optionValue":"social","traitKey":"social","score":3},{"questionKey":"q2","optionValue":"solitude","traitKey":"solitude","score":3},{"questionKey":"q3","optionValue":"action","traitKey":"action","score":3},{"questionKey":"q3","optionValue":"thinking","traitKey":"thinking","score":3},{"questionKey":"q3","optionValue":"social","traitKey":"social","score":3},{"questionKey":"q3","optionValue":"solitude","traitKey":"solitude","score":3},{"questionKey":"q4","optionValue":"action","traitKey":"action","score":3},{"questionKey":"q4","optionValue":"thinking","traitKey":"thinking","score":3},{"questionKey":"q4","optionValue":"social","traitKey":"social","score":3},{"questionKey":"q4","optionValue":"solitude","traitKey":"solitude","score":3},{"questionKey":"q5","optionValue":"action","traitKey":"action","score":3},{"questionKey":"q5","optionValue":"thinking","traitKey":"thinking","score":3},{"questionKey":"q5","optionValue":"social","traitKey":"social","score":3},{"questionKey":"q5","optionValue":"solitude","traitKey":"solitude","score":3}],"results":[{"resultKey":"action","name":"行動派","description":"你的身體比腦袋更快知道怎麼應對壓力。動起來就是你的解藥。","emoji":"⚡","traits":{"action":[10,15]}},{"resultKey":"thinking","name":"思考派","description":"你用腦袋消化壓力。在搞清楚「為什麼」和「怎麼辦」之前，你很難真正放鬆。","emoji":"🧠","traits":{"thinking":[10,15]}},{"resultKey":"social","name":"社交派","description":"你在人與人的連結中充電。說出來、被聽見、被支持——這是你最有效的解壓方式。","emoji":"💬","traits":{"social":[10,15]}},{"resultKey":"solitude","name":"獨處派","description":"你需要安靜和空間來恢復。獨處不是逃避，而是你充電的方式。","emoji":"🌙","traits":{"solitude":[10,15]}}]}',false,'platform')

ON CONFLICT (slug) DO UPDATE SET
  name          = EXCLUDED.name,
  description   = EXCLUDED.description,
  icon          = EXCLUDED.icon,
  category      = EXCLUDED.category,
  theme         = EXCLUDED.theme,
  survey_config = EXCLUDED.survey_config,
  questions     = EXCLUDED.questions,
  quiz_config   = EXCLUDED.quiz_config,
  is_featured   = EXCLUDED.is_featured,
  updated_at    = NOW();
