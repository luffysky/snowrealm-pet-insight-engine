import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { query, queryOne } from '@/lib/db'
import { generateInviteToken } from '@/lib/auth'
import { getLineConfig } from '@/lib/lineConfig'
import { isLineAdmin, handleAdminCommand } from '@/lib/lineAdminBot'
import { getTenantBranding } from '@/lib/tenantBranding'

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
    console.warn('[LINE Insight Webhook] Signature mismatch')
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

      // 管理員指令：今日報告 / 漏斗 / 標籤
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

      // 其他訊息 → 提示
      await replyMessage(replyToken, '📊 問卷系統管理帳號\n\n輸入正確口令即可取得註冊連結，成為管理員。\n\n點選下方選單可查看後台數據。', CHANNEL_ACCESS_TOKEN)
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


