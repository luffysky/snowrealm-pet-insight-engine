import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { query, queryOne } from '@/lib/db'
import { generateInviteToken } from '@/lib/auth'

const CHANNEL_SECRET = process.env.LINE_INSIGHT_CHANNEL_SECRET ?? ''
const CHANNEL_ACCESS_TOKEN = process.env.LINE_INSIGHT_CHANNEL_ACCESS_TOKEN ?? ''
const PASSCODE = '我要當足跡管理員'

/**
 * LINE Insight (問卷帳號) Webhook
 * @762wxvfb — 口令觸發註冊連結，取消追蹤則停用
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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
    console.warn('[LINE Insight Webhook] Signature mismatch')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const body = JSON.parse(rawBody)
  const events = body.events ?? []
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight-engine-sonwrealm-pet.zeabur.app'

  for (const event of events) {
    const userId = event.source?.userId as string | undefined

    // 文字訊息
    if (event.type === 'message' && event.message?.type === 'text' && userId) {
      const text = (event.message.text as string).trim()
      const replyToken = event.replyToken as string

      // 口令：「我要當足跡管理員」→ 產生一次性註冊連結
      if (text === PASSCODE) {
        // 檢查是否已有帳號
        const existing = await queryOne(
          `SELECT id FROM admin_users WHERE line_user_id = $1 AND username IS NOT NULL`,
          [userId],
        )
        if (existing) {
          await replyMessage(replyToken, '你已經有管理員帳號了！\n直接到後台登入即可 🔑')
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
          const displayName = await getLineDisplayName(userId)
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
        )
        continue
      }

      // 退出管理員
      if (/^退出管理員$/.test(text)) {
        await query(
          `UPDATE line_admins SET active = false WHERE line_user_id = $1`,
          [userId],
        )
        await replyMessage(replyToken, '已退出管理員通知，之後不會再收到問卷通知。\n如需重新加入，請再次輸入口令。')
        continue
      }

      // 其他訊息 → 提示
      await replyMessage(replyToken, '📊 問卷系統管理帳號\n\n輸入正確口令即可取得註冊連結，成為管理員。\n\n點選下方選單可查看後台數據。')
    }

    // 加好友 → 歡迎訊息
    if (event.type === 'follow' && event.replyToken) {
      await replyMessage(event.replyToken, '👋 歡迎！這是毛行天下問卷系統的管理帳號。\n\n輸入口令即可取得註冊連結，成為管理員 📋')
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

/** 回覆訊息 */
async function replyMessage(replyToken: string, text: string): Promise<void> {
  if (!CHANNEL_ACCESS_TOKEN) return
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }],
    }),
  }).catch(() => {})
}

/** 取得 LINE 使用者名稱 */
async function getLineDisplayName(userId: string): Promise<string | null> {
  if (!CHANNEL_ACCESS_TOKEN) return null
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const profile = await res.json() as { displayName?: string }
    return profile.displayName ?? null
  } catch {
    return null
  }
}


