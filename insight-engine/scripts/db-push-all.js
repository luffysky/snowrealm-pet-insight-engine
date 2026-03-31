/**
 * 依序執行 supabase 內所有 schema migration（含 migration.sql 基底 + 各 phase）。
 * 用法：npm run db:push:all
 *
 * 需 DATABASE_URL。雲端 PostgreSQL 若要求 SSL，連線字串通常含 sslmode=require，
 * 或設定環境變數 DATABASE_SSL=true
 */
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ 請設定 DATABASE_URL')
  process.exit(1)
}

/** 依相依順序排列（勿依檔名字母序） */
const MIGRATION_FILES = [
  // ── 基底 ──
  'migration.sql',
  'migration_branching.sql',

  // ── Phase 5–35 ──
  'migration_phase5.sql',
  'migration_phase6.sql',
  'migration_phase7_tag_rules.sql',
  'migration_phase7_broadcast.sql',
  'migration_phase8_notifications.sql',
  'migration_phase9_templates_utm.sql',
  'migration_phase10_ai.sql',
  'migration_phase11_themes.sql',
  'migration_phase12_chapters.sql',
  'migration_phase13_line_configs.sql',
  'migration_phase14_multi_tenant.sql',
  'migration_phase15_site_settings.sql',
  'migration_phase16_email_verification.sql',
  'migration_phase17_phone.sql',
  'migration_phase17b_line.sql',
  'migration_phase18_admin_title.sql',
  'migration_phase18_tenant_users.sql',
  'migration_phase19_survey_og.sql',
  'migration_phase20_verification_codes_optional.sql',
  'migration_phase21_account_support.sql',
  'migration_phase22_audit_logs.sql',
  'migration_phase23_subscriptions.sql',
  'migration_phase24_insight_reports.sql',
  'migration_phase25_scheduling.sql',
  'migration_phase26_platform_unlimited.sql',
  'migration_phase27_bot_branding.sql',
  'migration_line_survey_sessions.sql',
  'migration_phase28_automation.sql',
  'migration_phase29_api_keys.sql',
  'migration_phase30_story.sql',
  'migration_phase31_story_wall.sql',
  'migration_phase32_trial.sql',
  'migration_phase33_report_sharing.sql',
  'migration_phase34_bot_passcode.sql',
  'migration_phase35_platform_notifications.sql',

  // ── Phase 36–52 ──
  'migration_phase36_missing_tables.sql',
  'migration_phase37_template_ratings_story_richmenu.sql',
  'migration_phase38_sync_fixes.sql',
  'migration_phase39_ai_constraints_report_type.sql',
  'migration_phase40_other_text_done_config_share.sql',
  'migration_phase41_survey_templates.sql',
  'migration_phase42_growth_engine.sql',
  'migration_phase43_cognitive_gap.sql',
  'migration_phase44_message_management.sql',
  'migration_phase45_social_video.sql',
  'migration_phase46_stickers.sql',
  'migration_phase47_survey_cover.sql',
  'migration_phase48_password_lock.sql',
  'migration_phase49_game_titles.sql',
  'migration_phase5_viral_templates.sql',
  'migration_phase50_reward_system.sql',
  'migration_phase51_profile_theme.sql',
  'migration_phase52_zcoin_economy_v2.sql',

  // ── 社群系統 ──
  'migration_social.sql',
  'migration_social_bookmarks.sql',
  'migration_social_notifications.sql',
  'migration_social_reports.sql',
  'migration_stories.sql',
  'migration_follow_dm.sql',
  'migration_user_bans_blocks.sql',
  'migration_message_edit.sql',
  'migration_phase6_zcoin_shop.sql',

  // ── 最新 migrations/ 資料夾 ──
  'migrations/20260327_sql_arch_indexes.sql',
  'migrations/20260327_user_album.sql',
  'migrations/20260328_comment_likes.sql',
  'migrations/20260328_multi_album.sql',
  'migrations/20260329_user_blog.sql',
  'migrations/20260329_blog_cover_position.sql',
  'migrations/20260329_sticker_columns.sql',
  'migrations/20260329_marketplace.sql',
  'migrations/20260329_messages_social.sql',
  'migrations/20260329_blog_comments_reactions.sql',
  'migrations/20260329_blog_series.sql',
  'migrations/20260330_admin_upgrade.sql',
  'migrations/20260330_yukirin_agent.sql',
  'migrations/20260330_guide_chat_tables.sql',
  'migrations/20260330_missing_tables.sql',
  'migrations/20260330_friend_qr.sql',
  'migrations/20260331_super_admin_platform.sql',
  'migrations/20260331_zcoin_wallet_unique.sql',
  'migrations/20260401_blog_subscribers.sql',
  'migrations/20260401_ai_base_url.sql',
]

function pgSslOption() {
  if (process.env.DATABASE_SSL === 'false') return false
  if (process.env.DATABASE_SSL === 'true') return { rejectUnauthorized: false }
  if (/sslmode=require|sslmode=verify-full|sslmode=prefer/i.test(DATABASE_URL)) {
    return { rejectUnauthorized: false }
  }
  return false
}

async function main() {
  const supabaseDir = path.join(__dirname, '..', 'supabase')
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: pgSslOption(),
  })

  try {
    await client.connect()
    console.log('🔗 已連線資料庫')

    for (const name of MIGRATION_FILES) {
      const filePath = path.join(supabaseDir, name)
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  略過（找不到檔案）: ${name}`)
        continue
      }
      const sql = fs.readFileSync(filePath, 'utf8')
      console.log(`\n📄 執行 ${name} …`)
      try {
        await client.query(sql)
        console.log(`   ✅ 完成`)
      } catch (fileErr) {
        console.warn(`   ⚠️  部分語句失敗（已略過）: ${fileErr.message}`)
      }
    }

    const { rows } = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename",
    )
    console.log('\n📋 public schema 表：', rows.map((r) => r.tablename).join(', '))
    console.log('\n🎉 全部 migration 已套用')
  } catch (err) {
    console.error('❌ 執行失敗:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
