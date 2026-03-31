import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { queryOne } from '@/lib/db'
import { getLineConfig } from '@/lib/lineConfig'

/**
 * Insight Engine 對外帳號 Webhook
 * B2B 頻道 — 租戶管理員加入，接收平台公告、系統通知
 *
 * LINE Developers Console Webhook URL:
 *   https://insight.snowrealm.pet/api/line/webhook/insight
 * Token: LINE_INSIGHT_EXT_CHANNEL_ACCESS_TOKEN / LINE_INSIGHT_EXT_CHANNEL_SECRET
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const CHANNEL_SECRET = process.env.LINE_INSIGHT_EXT_CHANNEL_SECRET ?? ''
  const CHANNEL_ACCESS_TOKEN = process.env.LINE_INSIGHT_EXT_CHANNEL_ACCESS_TOKEN ?? ''

  if (!CHANNEL_SECRET) {
    console.error('[Insight Ext Webhook] LINE_INSIGHT_EXT_CHANNEL_SECRET 未設定')
    return NextResponse.json({ error: 'not configured' }, { status: 500 })
  }

  const signature = request.headers.get('x-line-signature')
  if (!signature) return NextResponse.json({ error: 'missing signature' }, { status: 400 })

  const rawBody = await request.text()
  const hash = crypto.createHmac('SHA256', CHANNEL_SECRET).update(rawBody).digest('base64')
  if (hash !== signature) return NextResponse.json({ error: 'invalid signature' }, { status: 403 })

  const body = JSON.parse(rawBody)
  const events = body.events ?? []
  if (events.length === 0) return NextResponse.json({ ok: true })

  for (const event of events) {
    const userId = event.source?.userId as string | undefined

    // 加好友 → 歡迎 + 綁定提示
    if (event.type === 'follow' && event.replyToken) {
      await reply(
        event.replyToken,
        '👋 歡迎使用 SnowRealm Insight Engine！\n\n📊 這是平台管理員專屬頻道\n\n你可以透過此帳號接收：\n• 平台公告與版本更新\n• 系統警報\n• 你的租戶 AI 週報\n\n🔗 管理後台：https://insight.snowrealm.pet',
        CHANNEL_ACCESS_TOKEN,
      )

      // 嘗試將此 LINE User ID 對應到租戶（如果 DB 有紀錄）
      if (userId) await bindTenantLineUser(userId)
    }

    // 文字指令
    if (event.type === 'message' && event.message?.type === 'text' && event.replyToken) {
      const text = (event.message.text as string).trim()

      if (/查詢|報告|數據/.test(text) && userId) {
        const tenant = await getTenantByLineUser(userId)
        if (tenant) {
          await reply(event.replyToken, `📊 ${tenant.name} 的報告功能即將開放\n\n請先至管理後台查看數據：\nhttps://insight.snowrealm.pet`, CHANNEL_ACCESS_TOKEN)
        } else {
          await reply(event.replyToken, '請先至管理後台登入，系統將自動綁定你的帳號。\n\nhttps://insight.snowrealm.pet', CHANNEL_ACCESS_TOKEN)
        }
      } else {
        await reply(event.replyToken, 'SnowRealm Insight Engine 平台通知帳號\n\n如需協助，請至管理後台或傳「查詢」', CHANNEL_ACCESS_TOKEN)
      }
    }

    // 取消追蹤
    if (event.type === 'unfollow' && userId) {
      console.log('[Insight Ext] Unfollowed:', userId)
    }
  }

  return NextResponse.json({ ok: true })
}

async function bindTenantLineUser(lineUserId: string): Promise<void> {
  try {
    await queryOne(
      `UPDATE admin_users SET insight_ext_line_id = $1 WHERE insight_ext_line_id IS NULL AND id = (
        SELECT au.id FROM admin_users au
        JOIN tenant_users tu ON tu.user_id = au.id
        WHERE au.insight_ext_line_id IS NULL LIMIT 1
      )`,
      [lineUserId]
    )
  } catch {
    // 欄位不存在時 silent fail，待 migration 後生效
  }
}

async function getTenantByLineUser(lineUserId: string): Promise<{ name: string } | null> {
  try {
    return await queryOne<{ name: string }>(
      `SELECT t.name FROM tenants t
       JOIN tenant_users tu ON tu.tenant_id = t.id
       JOIN admin_users au ON au.id = tu.user_id
       WHERE au.insight_ext_line_id = $1
       LIMIT 1`,
      [lineUserId]
    )
  } catch {
    return null
  }
}

async function reply(replyToken: string, text: string, accessToken: string): Promise<void> {
  if (!accessToken || !replyToken) return
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] }),
  }).catch(() => {})
}
