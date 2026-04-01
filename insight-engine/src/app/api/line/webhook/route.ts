import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { query, queryOne } from '@/lib/db'
import { generateInviteToken } from '@/lib/auth'
import { getLineConfig } from '@/lib/lineConfig'
import { isLineAdmin, handleAdminCommand } from '@/lib/lineAdminBot'
import { getTenantBranding } from '@/lib/tenantBranding'
import { getPlatformKey } from '@/lib/aiService'
import {
  classifyIntent,
  buildSystemPrompt,
  parseGuideResponse,
  type GuideContext,
} from '@/lib/guideEngine'
import { buildYukirinFlexMessage } from '@/lib/proactive/pushEngine'
import { handleSlashCommand, isSlashCommand } from '@/lib/agent/slashCommands'
import { getOwnerData } from '@/lib/ownerData'

const DEFAULT_TENANT = process.env.DEFAULT_TENANT_SLUG || 'default'
const PASSCODE_FALLBACK = '我要成為管理員'

/**
 * LINE Insight (問卷帳號) Webhook
 * @762wxvfb — 口令觸發註冊連結，取消追蹤則停用
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const CHANNEL_SECRET = await getLineConfig('INSIGHT_CHANNEL_SECRET') ?? ''
  const CHANNEL_ACCESS_TOKEN = await getLineConfig('INSIGHT_CHANNEL_ACCESS_TOKEN') ?? ''
  if (!CHANNEL_SECRET) {
    return NextResponse.json({ error: 'LINE Insight not configured' }, { status: 500 })
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
    console.warn('[LINE Insight Webhook] Signature mismatch — secret首4碼:', CHANNEL_SECRET.slice(0, 4), '長度:', CHANNEL_SECRET.length)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const body = JSON.parse(rawBody)
  const events = body.events ?? []
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'

  for (const event of events) {
    const userId = event.source?.userId as string | undefined

    // 文字訊息
    if (event.type === 'message' && event.message?.type === 'text' && userId) {
      const text = (event.message.text as string).trim()
      const replyToken = event.replyToken as string

      // 斜線指令（老闆 + 管理員）
      if (isSlashCommand(text)) {
        const isOwner = await isLineUserOwner(userId)
        const lineState = {
          userId, nickname: '', isAdmin: true, isOwner,
          selectedCharacter: 'yukirin' as const, presenceMode: 'chat' as const, characterSize: 1,
          currentPage: 'line', timeOnPage: 0, scrollPosition: 0, scrollSpeed: 'idle' as const,
          isTyping: false, lastClickTarget: '', pageVisitCount: 0,
          currentSurveyId: null, currentQuestionIndex: 0, totalQuestions: 0,
          isGuideOpen: true, currentSessionRounds: 0,
          visitCount: 1, surveysCompleted: 0, zcoinBalance: 0, streakDays: 0, daysSinceLastVisit: 0,
          currentHour: new Date().getHours(), dayOfWeek: new Date().getDay(), isWeekend: [0, 6].includes(new Date().getDay()),
        }
        const slashResult = handleSlashCommand(text, lineState)
        if (slashResult) {
          // fetch_owner_data 指令 → 查真實 DB 數據
          if (slashResult.action?.type === 'fetch_owner_data' && isOwner) {
            const data = await getOwnerData(slashResult.action.target)
            if (data) {
              const flex = buildYukirinFlexMessage(data, 'happy')
              await replyMessages(replyToken, [flex as unknown as { type: string; [key: string]: unknown }], CHANNEL_ACCESS_TOKEN)
              continue
            }
          }
          // 一般斜線指令 → 回傳靜態文字
          const replyText = slashResult.yukirin?.text || slashResult.riku?.text || '指令已執行'
          const replyMood = slashResult.yukirin?.mood || 'happy'
          const flex = buildYukirinFlexMessage(replyText, replyMood)
          await replyMessages(replyToken, [flex as unknown as { type: string; [key: string]: unknown }], CHANNEL_ACCESS_TOKEN)
          continue
        }
      }

      // 管理員指令（舊版：今日報告 / 漏斗 / 標籤，不用 / 前綴）
      if (await isLineAdmin(userId)) {
        const adminMessages = await handleAdminCommand(userId, text, 'default')
        if (adminMessages !== null) {
          await replyMessages(replyToken, adminMessages, CHANNEL_ACCESS_TOKEN)
          continue
        }
      }

      // 口令：從 DB site_settings 讀取，未設定時 fallback 到 PASSCODE_FALLBACK
      const branding = await getTenantBranding(DEFAULT_TENANT)
      const effectivePasscode = branding.adminPasscode || PASSCODE_FALLBACK

      // 口令正確 → 產生一次性管理員註冊連結
      if (text === effectivePasscode) {
        // 檢查是否已有帳號
        const existing = await queryOne(
          `SELECT id FROM admin_users WHERE line_user_id = $1 AND username IS NOT NULL`,
          [userId],
        )
        if (existing) {
          await replyMessage(replyToken, '你已經有管理員帳號了！\n直接到後台登入即可 🔑', CHANNEL_ACCESS_TOKEN)
          continue
        }

        // 檢查是否有未過期的邀請
        const pendingInvite = await queryOne<{ token: string }>(
          `SELECT token FROM admin_invites WHERE line_user_id = $1 AND used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
          [userId],
        )

        let token: string
        if (pendingInvite) {
          token = pendingInvite.token
        } else {
          token = generateInviteToken()
          const displayName = await getLineDisplayName(userId, CHANNEL_ACCESS_TOKEN)
          await query(
            `INSERT INTO admin_invites (token, line_user_id, display_name, expires_at)
             VALUES ($1, $2, $3, NOW() + INTERVAL '30 minutes')`,
            [token, userId, displayName],
          )
        }

        const registerUrl = `${baseUrl}/register?token=${token}`
        await replyMessage(
          replyToken,
          `🎉 口令正確！請點擊以下連結註冊你的管理員帳號：\n\n${registerUrl}\n\n⏰ 連結有效期限：30 分鐘\n📝 請自行設定帳號與密碼`,
          CHANNEL_ACCESS_TOKEN,
        )
        continue
      }

      // 退出管理員
      if (/^退出管理員$/.test(text)) {
        await query(
          `UPDATE line_admins SET active = false WHERE line_user_id = $1`,
          [userId],
        )
        await replyMessage(replyToken, '已退出管理員通知，之後不會再收到問卷通知。\n如需重新加入，請再次輸入口令。', CHANNEL_ACCESS_TOKEN)
        continue
      }

      // 其他訊息 → 雪凜 AI 對話
      const aiReply = await handleYukirinChat(text, userId, CHANNEL_ACCESS_TOKEN)
      if (aiReply) {
        await replyMessages(replyToken, [aiReply], CHANNEL_ACCESS_TOKEN)
      } else {
        await replyMessage(replyToken, '📊 問卷系統管理帳號\n\n輸入正確口令即可取得註冊連結，成為管理員。\n\n點選下方選單可查看後台數據。', CHANNEL_ACCESS_TOKEN)
      }
    }

    // 加好友 → 歡迎訊息
    if (event.type === 'follow' && event.replyToken) {
      await replyMessage(event.replyToken, '👋 歡迎！這是問卷系統的管理帳號。\n\n輸入口令即可取得註冊連結，成為管理員 📋', CHANNEL_ACCESS_TOKEN)
    }

    // 取消追蹤 → 停用管理員
    if (event.type === 'unfollow' && userId) {
      await query(
        `UPDATE line_admins SET active = false WHERE line_user_id = $1`,
        [userId],
      )
      console.log(`[LINE Insight] Admin deactivated: ${userId}`)
    }
  }

  return NextResponse.json({ ok: true })
}

/** 回覆多則訊息（最多 5 則） */
async function replyMessages(
  replyToken: string,
  messages: { type: string; [key: string]: unknown }[],
  accessToken?: string
): Promise<void> {
  const token = accessToken || await getLineConfig('INSIGHT_CHANNEL_ACCESS_TOKEN') || ''
  if (!token) return
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  }).catch(() => {})
}

/** 回覆單則文字訊息 */
async function replyMessage(replyToken: string, text: string, accessToken?: string): Promise<void> {
  await replyMessages(replyToken, [{ type: 'text', text }], accessToken)
}

/** 取得 LINE 使用者名稱 */
async function getLineDisplayName(userId: string, accessToken?: string): Promise<string | null> {
  const token = accessToken || await getLineConfig('INSIGHT_CHANNEL_ACCESS_TOKEN') || ''
  if (!token) return null
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const profile = await res.json() as { displayName?: string }
    return profile.displayName ?? null
  } catch {
    return null
  }
}

// ----- 雪凜 AI 對話（Insight Bot） -----

/** 判斷 LINE 使用者是否為老闆 */
async function isLineUserOwner(lineUserId: string): Promise<boolean> {
  const allowedId = process.env.SUPER_ADMIN_LINE_USER_ID || process.env.LINE_YOUR_USER_ID
  if (allowedId && lineUserId === allowedId) return true
  try {
    const row = await queryOne<{ id: string }>(
      `SELECT id FROM admin_users WHERE line_id = $1 AND (role = 'super_admin' OR platform_unlimited = true) LIMIT 1`,
      [lineUserId]
    )
    return !!row
  } catch { return false }
}

/** Insight Bot 雪凜 AI 對話 */
async function handleYukirinChat(
  text: string,
  lineUserId: string,
  _accessToken: string
): Promise<{ type: string; [key: string]: unknown } | null> {
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
        max_tokens: 300,
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
    return buildYukirinFlexMessage(parsed.text, parsed.mood, action) as unknown as { type: string; [key: string]: unknown }
  } catch {
    return null
  }
}


