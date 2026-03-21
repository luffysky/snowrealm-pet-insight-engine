import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { execute } from '@/lib/db'
import { createLineToken } from '@/lib/lineToken'
import { getLineConfig } from '@/lib/lineConfig'

const SURVEY_URL = process.env.NEXT_PUBLIC_BASE_URL
  ? `${process.env.NEXT_PUBLIC_BASE_URL}/`
  : 'https://insight.snowrealm.pet/'

const SITE_URL = 'https://snowrealm.pet'
const IG_URL = 'https://www.instagram.com/snowrealm.pet?igsh=Y2x1cTRiM3N3NGpw'

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
      const reply = getAutoReply(text, userId)
      await replyMessage(replyToken, reply, CHANNEL_ACCESS_TOKEN)
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

      await replyMessage(replyToken, [
        {
          type: 'text',
          text: '🐾 歡迎來到毛行天下！\n\n我們正在打造一個留下寵物足跡的平台。\n\n輸入「問卷」即可填寫，幫我們更了解你的需求 💛',
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

// ----- 關鍵字自動回覆邏輯 -----

/** 產生問卷連結（帶 LINE 身份簽名 + utm） */
function buildSurveyLink(userId?: string): string {
  const base = SURVEY_URL
  const params = new URLSearchParams({ utm_source: 'line', utm_medium: 'chat' })
  if (userId) {
    params.set('lt', createLineToken(userId))
  }
  return `${base}?${params.toString()}`
}

interface LineTextMessage {
  type: 'text'
  text: string
}

function getAutoReply(text: string, userId?: string): LineTextMessage[] {
  const surveyLink = buildSurveyLink(userId)

  // 問卷相關
  if (/問卷|填問卷|survey/i.test(text)) {
    return [
      {
        type: 'text',
        text: `📋 毛行天下 MVP 問卷\n\n花 2 分鐘填寫，幫助我們打造更好的寵物紀錄平台！\n\n👉 ${surveyLink}`,
      },
    ]
  }

  // 封測 / 名單
  if (/封測|內測|名單|waitlist/i.test(text)) {
    return [
      {
        type: 'text',
        text: `🎉 想加入封測？\n\n填完問卷後即可留下 email 加入封測名單，上線第一時間通知你！\n\n👉 ${surveyLink}`,
      },
    ]
  }

  // 關於毛行天下
  if (/毛行天下|你是誰|介紹/i.test(text)) {
    return [
      {
        type: 'text',
        text: '🐾 毛行天下 SnowRealm\n\n我們想做的，不只是紀錄，而是讓那些重要的存在，不那麼容易被時間沖淡。\n\n一個真正能留下寵物足跡的地方。',
      },
    ]
  }

  // 寵物 / 紀錄 / 回憶
  if (/寵物|毛小孩|毛孩|狗|貓|紀錄|回憶|足跡/i.test(text)) {
    return [
      {
        type: 'text',
        text: '🐾 毛行天下想幫你留下毛孩最珍貴的足跡\n\n我們正在打造一個寵物紀錄平台，讓那些日常的美好不會被遺忘。\n\n📋 填問卷讓我們更了解你 → 輸入「問卷」',
      },
    ]
  }

  // 功能 / 下載
  if (/功能|下載|app|平台|什麼時候/i.test(text)) {
    return [
      {
        type: 'text',
        text: '🚀 平台目前正在開發中！\n\n你可以先填問卷告訴我們你最期待的功能，封測開放後會第一時間通知你！\n\n📋 填問卷 → 輸入「問卷」\n🎉 加入封測 → 輸入「封測」',
      },
    ]
  }

  // 官網 (Rich Menu 觸發)
  if (/官網|網站|website/i.test(text)) {
    return [
      {
        type: 'text',
        text: `🌐 毛行天下官網\n\n👉 ${SITE_URL}\n\n歡迎隨時來逛逛 🐾`,
      },
    ]
  }

  // 最新消息 (Rich Menu 觸發)
  if (/最新消息|新聞|news|更新/i.test(text)) {
    return [
      {
        type: 'text',
        text: '📢 最新消息\n\n🐾 毛行天下目前正在進行 MVP 問卷調查\n📋 歡迎填寫問卷，幫助我們打造更好的產品！\n🎉 填完問卷可加入封測名單\n\n我們會在有新消息時推播通知你 💛',
      },
    ]
  }

  // 聯絡我們 (Rich Menu 觸發)
  if (/聯絡|聯繫|contact|客服|問題|幫助|help/i.test(text)) {
    return [
      {
        type: 'text',
        text: `💬 聯絡毛行天下\n\n📸 Instagram：${IG_URL}\n\n有任何問題歡迎直接留言，我們會盡快回覆你！🐾`,
      },
    ]
  }

  // 預設回覆 — 引導訊息
  return [
    {
      type: 'text',
      text: '嗨～我是毛行天下小助手 🐾\n\n你可以輸入：\n📋「問卷」— 填寫問卷\n🎉「封測」— 加入封測名單\n🐾「毛行天下」— 了解我們\n🌐「官網」— 前往官網\n📢「最新消息」— 查看動態\n💬「聯絡我們」— 聯繫方式',
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
  if (!token) return

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
