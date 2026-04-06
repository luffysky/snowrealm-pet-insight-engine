import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { execute, queryOne } from '@/lib/db'
import { createLineToken } from '@/lib/lineToken'
import { getLineConfig } from '@/lib/lineConfig'
import { getPrimarySurveySlug } from '@/lib/surveyRepo'
import { getTenantBranding } from '@/lib/tenantBranding'
import {
  getActiveSession,
  startSurveySession,
  processUserAnswer,
  abandonSession,
  type LineTextMessage,
} from '@/lib/lineBotEngine'
import {
  getOpenTicketByLineUser,
  startSupportTicket,
  appendSupportMessage,
} from '@/lib/supportEngine'
import { setDefaultRichMenu } from '@/lib/lineNotify'
import { getPlatformKey } from '@/lib/aiService'
import {
  classifyIntent,
  buildSystemPrompt,
  parseGuideResponse,
  type GuideContext,
} from '@/lib/guideEngine'
import { buildYukirinFlexMessage } from '@/lib/proactive/pushEngine'
import { executeSkillFromChat } from '@/lib/skills/skillEngine'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://insight.snowrealm.pet'
/** 主問卷 / Rich Menu「填問卷」對應的租戶 slug；需設定 DEFAULT_TENANT_SLUG 環境變數 */
const DEFAULT_TENANT = process.env.DEFAULT_TENANT_SLUG || 'default'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snowrealm.pet'
const IG_URL = process.env.NEXT_PUBLIC_IG_URL || ''

/**
 * LINE Official Account Webhook
 * 官方帳號 @474iwlht — 使用者互動、自動回覆、歡迎訊息
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const CHANNEL_SECRET = await getLineConfig('OFFICIAL_CHANNEL_SECRET') ?? ''
  const CHANNEL_ACCESS_TOKEN = await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN') ?? ''
  if (!CHANNEL_SECRET) {
    return NextResponse.json({ error: 'LINE Official not configured' }, { status: 500 })
  }

  const signature = request.headers.get('x-line-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const rawBody = await request.text()

  const hash = crypto
    .createHmac('SHA256', CHANNEL_SECRET)
    .update(rawBody)
    .digest('base64')

  if (hash !== signature) {
    console.warn('[LINE Official Webhook] Signature mismatch')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const body = JSON.parse(rawBody)
  const events = body.events ?? []

  for (const event of events) {
    if (event.type === 'message' && event.message?.type === 'text') {
      const text = (event.message.text as string).trim()
      const replyToken = event.replyToken as string
      const userId = event.source?.userId as string | undefined

      const reply = await handleTextMessage(text, userId)
      await replyMessage(replyToken, reply, CHANNEL_ACCESS_TOKEN)
    }

    // LINE 貼圖：存成 [STICKER] 記錄（LINE 貼圖用 sticker URL）
    if (event.type === 'message' && event.message?.type === 'sticker') {
      const stickerId = event.message.stickerId as string
      const packageId = event.message.packageId as string
      const userId = event.source?.userId as string | undefined
      if (userId) {
        const stickerUrl = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/iPhone/sticker.png`
        try {
          await execute(
            `INSERT INTO line_message_log (line_user_id, message_type, content) VALUES ($1, 'sticker', $2)`,
            [userId, `[img:${stickerUrl}]`]
          )
        } catch { /* table may not exist */ }
      }
    }

    // LINE 圖片：下載並存成 [img] 記錄
    if (event.type === 'message' && event.message?.type === 'image') {
      const messageId = event.message.id as string
      const userId = event.source?.userId as string | undefined
      if (userId && CHANNEL_ACCESS_TOKEN) {
        try {
          // LINE Content API 取圖片 URL（需要 channel access token）
          const imgUrl = `https://api-data.line.me/v2/bot/message/${messageId}/content`
          await execute(
            `INSERT INTO line_message_log (line_user_id, message_type, content) VALUES ($1, 'image', $2)`,
            [userId, `[img:${imgUrl}]`]
          )
        } catch { /* table may not exist */ }
      }
    }

    if (event.type === 'follow') {
      const userId = event.source?.userId as string | undefined
      const replyToken = event.replyToken as string

      // 記錄 LINE 好友到 line_users（供推播用）
      if (userId) {
        const displayName = await getLineProfile(userId, CHANNEL_ACCESS_TOKEN)
        await execute(
          `INSERT INTO line_users (line_user_id, display_name)
           VALUES ($1, $2)
           ON CONFLICT (line_user_id) DO UPDATE SET display_name = COALESCE($2, line_users.display_name)`,
          [userId, displayName]
        )
      }

      // 設定預設 Rich Menu（選單 A）
      if (userId) await setDefaultRichMenu(userId)

      const followBranding = await getTenantBranding(DEFAULT_TENANT)
      await replyMessage(replyToken, [
        {
          type: 'text',
          text: followBranding.welcomeMsg,
        },
      ], CHANNEL_ACCESS_TOKEN)
    }

    if (event.type === 'unfollow') {
      const userId = event.source?.userId as string | undefined
      if (userId) {
        await execute(
          'DELETE FROM line_users WHERE line_user_id = $1',
          [userId]
        )
      }
    }
  }

  return NextResponse.json({ ok: true })
}

// ----- 對話式填答狀態機入口 -----

const ABANDON_KEYWORD = /^離開$/
const START_SURVEY_KEYWORD = /^LINE填答$/
const SUPPORT_KEYWORD = /客服|幫助|問題|投訴|反映|help|support/i

async function handleTextMessage(text: string, userId?: string): Promise<LineTextMessage[]> {
  if (!userId) return await getAutoReply(text, userId)

  // 優先偵測「離開」關鍵字
  if (ABANDON_KEYWORD.test(text)) {
    const session = await getActiveSession(userId)
    if (session) {
      await abandonSession(session.id)
      return [{ type: 'text', text: '已結束填答，感謝你的時間 👋\n\n隨時輸入「LINE填答」可重新開始' }]
    }
    return await getAutoReply(text, userId)
  }

  // 偵測「LINE填答」關鍵字（啟動新 session）
  if (START_SURVEY_KEYWORD.test(text)) {
    return startSurveySession(userId)
  }

  // 若有進行中的填答 session → 進入填答流程
  const session = await getActiveSession(userId)
  if (session) return processUserAnswer(session, text)

  // 偵測客服關鍵字 → 建立客服工單
  if (SUPPORT_KEYWORD.test(text)) {
    return startSupportTicket(userId, text, DEFAULT_TENANT)
  }

  // 若有開放中的客服工單 → 追加訊息（靜默接收）
  const openTicket = await getOpenTicketByLineUser(userId, DEFAULT_TENANT)
  if (openTicket) {
    const displayName = openTicket.line_display_name ?? userId
    await appendSupportMessage(openTicket.id, userId, displayName, text)
    return []
  }

  // 雪凜技能觸發（問卷推薦、Z幣查詢等）
  try {
    const skillResult = await executeSkillFromChat(text, userId)
    if (skillResult?.executed && skillResult.message) {
      const flexMsg = buildYukirinFlexMessage(
        skillResult.message,
        skillResult.mood ?? 'happy',
        skillResult.action
      ) as unknown as LineTextMessage
      return [flexMsg]
    }
  } catch {
    // skill fallback to AI chat
  }

  // 雪凜 AI 對話（一般訊息 → 雪凜回覆）
  if (userId) {
    const aiReply = await handleYukirinAiChat(text, userId)
    if (aiReply) return [aiReply]
  }

  // 一般關鍵字自動回覆
  return await getAutoReply(text, userId)
}

// ----- 雪凜 AI 對話 -----

/** 判斷 LINE 使用者是否為老闆（平台擁有者） */
async function isLineUserOwner(lineUserId: string): Promise<boolean> {
  // 方法 1：比對環境變數
  const allowedId = process.env.SUPER_ADMIN_LINE_USER_ID || process.env.LINE_YOUR_USER_ID
  if (allowedId && lineUserId === allowedId) return true
  // 方法 2：查 DB admin_users
  try {
    const row = await queryOne<{ id: string }>(
      `SELECT id FROM admin_users WHERE line_id = $1 AND role = 'super_admin' LIMIT 1`,
      [lineUserId]
    )
    return !!row
  } catch { return false }
}

async function handleYukirinAiChat(text: string, lineUserId: string): Promise<LineTextMessage | null> {
  const aiKey = getPlatformKey()
  if (!aiKey) return null

  try {
    const isOwner = await isLineUserOwner(lineUserId)
    const context: GuideContext = { trigger: 'manual', isOwner }
    const intent = classifyIntent(text, context)
    const systemPrompt = buildSystemPrompt(intent, context)

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiKey.apiKey}`,
      },
      body: JSON.stringify({
        model: aiKey.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return null
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
    const raw = data.choices?.[0]?.message?.content ?? ''
    if (!raw) return null

    const parsed = parseGuideResponse(raw)
    const action = parsed.action && 'target' in parsed.action
      ? { type: parsed.action.type, target: (parsed.action as { type: string; target: string }).target }
      : undefined
    const flexMsg = buildYukirinFlexMessage(parsed.text, parsed.mood, action)
    return flexMsg as unknown as LineTextMessage
  } catch {
    return null
  }
}

// ----- 關鍵字自動回覆邏輯 -----

/** 產生問卷連結（帶 LINE 身份簽名 + utm），格式 /{org}/{survey-slug} */
async function buildSurveyLink(userId?: string): Promise<string> {
  const tenantSlug = DEFAULT_TENANT
  const surveySlug = await getPrimarySurveySlug(tenantSlug)
  const path = surveySlug ? `/${tenantSlug}/${surveySlug}` : '/'
  const params = new URLSearchParams({ utm_source: 'line', utm_medium: 'chat' })
  if (userId) {
    params.set('lt', createLineToken(userId))
  }
  return `${BASE_URL}${path}?${params.toString()}`
}

async function getAutoReply(text: string, userId?: string): Promise<LineTextMessage[]> {
  const [surveyLink, branding] = await Promise.all([
    buildSurveyLink(userId),
    getTenantBranding(DEFAULT_TENANT),
  ])

  if (/問卷|填問卷|survey/i.test(text)) {
    return [
      {
        type: 'text',
        text: `📋 問卷調查\n\n${branding.surveyPrompt}\n\n👉 網頁版：${surveyLink}\n\n💬 LINE 對話填答：輸入「LINE填答」即可直接在這裡填寫`,
      },
    ]
  }

  if (/封測|內測|名單|waitlist/i.test(text)) {
    return [
      {
        type: 'text',
        text: `🎉 想加入封測？\n\n填完問卷後即可留下 email 加入封測名單，上線第一時間通知你！\n\n👉 ${surveyLink}`,
      },
    ]
  }

  if (/你是誰|介紹|關於/i.test(text)) {
    return [
      {
        type: 'text',
        text: `💬 ${branding.siteName}\n\n${branding.introText}`,
      },
    ]
  }

  if (/功能|下載|app|平台|什麼時候/i.test(text)) {
    return [
      {
        type: 'text',
        text: '🚀 平台目前正在開發中！\n\n你可以先填問卷告訴我們你最期待的功能，封測開放後會第一時間通知你！\n\n📋 填問卷 → 輸入「問卷」\n🎉 加入封測 → 輸入「封測」',
      },
    ]
  }

  if (/官網|網站|website/i.test(text)) {
    return [
      {
        type: 'text',
        text: `🌐 官方網站\n\n👉 ${SITE_URL}\n\n歡迎隨時來逛逛！`,
      },
    ]
  }

  if (/最新消息|新聞|news|更新/i.test(text)) {
    return [
      {
        type: 'text',
        text: '📢 最新消息\n\n目前正在進行問卷調查\n📋 歡迎填寫問卷，幫助我們打造更好的產品！\n🎉 填完問卷可加入封測名單\n\n我們會在有新消息時推播通知你 💛',
      },
    ]
  }

  if (/聯絡|聯繫|contact|客服|問題|幫助|help/i.test(text)) {
    const igLine = IG_URL ? `\n\n📸 Instagram：${IG_URL}` : ''
    return [
      {
        type: 'text',
        text: `💬 聯絡我們${igLine}\n\n有任何問題歡迎直接留言，我們會盡快回覆你！`,
      },
    ]
  }

  return [
    {
      type: 'text',
      text: `嗨～${branding.defaultReply}`,
    },
  ]
}

// ----- Reply API -----

async function replyMessage(
  replyToken: string,
  messages: LineTextMessage[],
  accessToken?: string
): Promise<void> {
  const token = accessToken || await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN') || ''
  if (!token) {
    console.error(
      '[LINE Official Reply] 略過回覆：未設定 OFFICIAL Channel Access Token（請檢查 DB line_configs 或 LINE_OFFICIAL_CHANNEL_ACCESS_TOKEN）',
    )
    return
  }

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ replyToken, messages }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[LINE Official Reply] Failed (${res.status}):`, body)
    }
  } catch (err) {
    console.error('[LINE Official Reply] Error:', err)
  }
}

// ----- 取得 LINE 使用者 Profile -----

async function getLineProfile(userId: string, accessToken?: string): Promise<string | null> {
  const token = accessToken || await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN') || ''
  if (!token) return null
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json() as { displayName?: string }
    return data.displayName ?? null
  } catch {
    return null
  }
}
