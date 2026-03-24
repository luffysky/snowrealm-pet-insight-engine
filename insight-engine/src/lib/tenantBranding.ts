import { queryOne } from '@/lib/db'

interface BotBrandingRow extends Record<string, unknown> {
  site_title: string | null
  bot_welcome: string | null
  bot_intro: string | null
  bot_default_reply: string | null
  bot_completion: string | null
  bot_survey_prompt: string | null
  bot_admin_passcode: string | null
}

export interface TenantBranding {
  siteName: string
  welcomeMsg: string
  introText: string
  defaultReply: string
  completionMsg: string
  surveyPrompt: string
  /** 管理員 Insight Bot 口令（空字串表示使用系統預設） */
  adminPasscode: string
}

const BRANDING_DEFAULTS: TenantBranding = {
  siteName: 'Insight Engine',
  welcomeMsg: '👋 歡迎！輸入「問卷」開始填寫，或輸入「客服」聯繫我們。',
  introText: '我們提供 AI 智慧問卷服務，歡迎隨時告訴我們你的需求。',
  defaultReply: '輸入「問卷」開始填寫，或輸入「客服」聯繫我們。',
  completionMsg: '🎉 感謝你的填寫！你的回覆已成功送出 💛',
  surveyPrompt: '填寫問卷，幫助我們更了解你的需求！',
  adminPasscode: '',
}

/** 從 site_settings 表取得租戶的 LINE Bot 文案設定，未設定則回傳通用預設值 */
export async function getTenantBranding(tenantId: string): Promise<TenantBranding> {
  try {
    const row = await queryOne<BotBrandingRow>(
      `SELECT site_title, bot_welcome, bot_intro, bot_default_reply, bot_completion,
              bot_survey_prompt, bot_admin_passcode
       FROM site_settings WHERE tenant_id = $1`,
      [tenantId]
    )

    if (!row) return BRANDING_DEFAULTS

    return {
      siteName: row.site_title || BRANDING_DEFAULTS.siteName,
      welcomeMsg: row.bot_welcome || BRANDING_DEFAULTS.welcomeMsg,
      introText: row.bot_intro || BRANDING_DEFAULTS.introText,
      defaultReply: row.bot_default_reply || BRANDING_DEFAULTS.defaultReply,
      completionMsg: row.bot_completion || BRANDING_DEFAULTS.completionMsg,
      surveyPrompt: row.bot_survey_prompt || BRANDING_DEFAULTS.surveyPrompt,
      adminPasscode: row.bot_admin_passcode || BRANDING_DEFAULTS.adminPasscode,
    }
  } catch (err) {
    console.error('[tenantBranding] 無法載入品牌設定，使用預設值:', err)
    return BRANDING_DEFAULTS
  }
}
