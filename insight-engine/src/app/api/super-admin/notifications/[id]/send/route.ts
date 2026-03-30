import { NextRequest, NextResponse } from 'next/server'
import { query, execute, queryOne } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { getLineConfig } from '@/lib/lineConfig'

export const dynamic = 'force-dynamic'

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const tenants =
    payload.tenants || (payload.tid ? [{ tid: payload.tid, role: payload.role || 'admin' }] : [])
  const isSuper =
    tenants.some((t: { role: string }) => t.role === 'super_admin') || payload.role === 'super_admin'
  if (!isSuper) return null
  return payload
}

interface NotificationRow extends Record<string, unknown> {
  id: string
  title: string
  content: string
  channels: string[]
  target: string
  target_tenant_ids: string[] | null
  status: string
}

interface LineUserRow extends Record<string, unknown> {
  line_user_id: string
}

/**
 * POST /api/super-admin/notifications/[id]/send
 * 實際發送通知給目標用戶（LINE push + 更新 DB 狀態）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { id } = await params

  const notification = await queryOne<NotificationRow>(
    `SELECT id, title, content, channels, target, target_tenant_ids, status
     FROM platform_notifications WHERE id = $1`,
    [id]
  )

  if (!notification) {
    return NextResponse.json({ error: '通知不存在' }, { status: 404 })
  }
  if (notification.status === 'sent') {
    return NextResponse.json({ error: '此通知已發送過' }, { status: 409 })
  }

  const channels = Array.isArray(notification.channels) ? notification.channels : ['dashboard']
  let lineSentCount = 0
  let errors: string[] = []

  // ── LINE 推播 ──────────────────────────────────────────────────────────
  if (channels.includes('line')) {
    try {
      const officialToken = await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN')
      if (!officialToken) {
        errors.push('缺少 OFFICIAL_CHANNEL_ACCESS_TOKEN，跳過 LINE 推播')
      } else {
        // 取得目標用戶的 LINE user ID
        let lineUsers: LineUserRow[] = []

        if (notification.target === 'all') {
          // 所有有 LINE 帳號的平台用戶
          lineUsers = await query<LineUserRow>(
            `SELECT DISTINCT lu.line_user_id
             FROM line_users lu
             WHERE lu.line_user_id IS NOT NULL
             ORDER BY lu.line_user_id`
          )
        } else if (notification.target === 'specific' && notification.target_tenant_ids?.length) {
          // 特定租戶用戶
          lineUsers = await query<LineUserRow>(
            `SELECT DISTINCT lu.line_user_id
             FROM line_users lu
             JOIN admin_users au ON au.line_user_id = lu.line_user_id
             JOIN tenant_users tu ON tu.user_id = au.id
             WHERE tu.tenant_id = ANY($1::text[])
               AND lu.line_user_id IS NOT NULL`,
            [notification.target_tenant_ids]
          )
        }

        // 批量推播（LINE 最多 Multicast 500 人/次）
        const lineIds = lineUsers.map((u) => u.line_user_id).filter(Boolean)
        const message = {
          type: 'text',
          text: `📢 ${notification.title}\n\n${notification.content}`,
        }

        const chunkSize = 500
        for (let i = 0; i < lineIds.length; i += chunkSize) {
          const chunk = lineIds.slice(i, i + chunkSize)
          const res = await fetch('https://api.line.me/v2/bot/message/multicast', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${officialToken}`,
            },
            body: JSON.stringify({ to: chunk, messages: [message] }),
          })
          if (res.ok) {
            lineSentCount += chunk.length
          } else {
            const errBody = await res.text()
            errors.push(`LINE multicast 錯誤 (chunk ${i / chunkSize + 1}): ${errBody}`)
          }
        }
      }
    } catch (err) {
      errors.push(`LINE 推播例外: ${String(err)}`)
    }
  }

  // ── 更新 DB 狀態 ────────────────────────────────────────────────────────
  const totalSent = lineSentCount
  await execute(
    `UPDATE platform_notifications
     SET status = 'sent',
         sent_at = NOW(),
         sent_count = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [totalSent, id]
  )

  return NextResponse.json({
    ok: true,
    sentCount: totalSent,
    channels,
    warnings: errors.length > 0 ? errors : undefined,
  })
}
