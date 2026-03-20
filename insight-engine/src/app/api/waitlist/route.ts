import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { fireWebhooks } from '@/lib/webhook'
import { notifyWaitlistJoined } from '@/lib/line'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { email?: string; nickname?: string; contactInfo?: string; responseId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '無效的請求格式' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: '請輸入有效的 email' }, { status: 400 })
  }

  if (email.length > 320) {
    return NextResponse.json({ error: 'email 長度超過限制' }, { status: 400 })
  }

  const nickname = (body.nickname ?? '').trim().slice(0, 50)
  const contactInfo = (body.contactInfo ?? '').trim().slice(0, 100)

  try {
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM waitlist WHERE email = $1',
      [email]
    )

    if (existing) {
      // 已存在就更新暱稱和聯繫方式（使用者可能當時沒填）
      if (nickname || contactInfo) {
        await query(
          `UPDATE waitlist SET
            nickname = CASE WHEN $1 = '' THEN nickname ELSE $1 END,
            contact_info = CASE WHEN $2 = '' THEN contact_info ELSE $2 END
           WHERE email = $3`,
          [nickname, contactInfo, email]
        )
      }
      return NextResponse.json({ success: true, message: '你已經在名單中了' })
    }

    // Derive tenant from response if available
    let tenantId = 'maoxingtianxia'
    if (body.responseId) {
      const resp = await queryOne<{ tenant_id: string }>(
        'SELECT tenant_id FROM responses WHERE id = $1', [body.responseId]
      )
      if (resp?.tenant_id) tenantId = resp.tenant_id
    }

    await query(
      'INSERT INTO waitlist (id, email, nickname, contact_info, response_id, source, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        uuidv4(),
        email,
        nickname,
        contactInfo,
        body.responseId || null,
        'survey_done_page',
        tenantId,
      ]
    )

    // Fire webhooks (non-blocking)
    fireWebhooks('waitlist.joined', { email, nickname })

    // LINE 推播通知
    notifyWaitlistJoined({ email, nickname })

    return NextResponse.json({ success: true, message: '成功加入封測名單！' })
  } catch (error) {
    console.error('[waitlist] Failed:', error)
    return NextResponse.json({ error: '儲存失敗，請稍後再試' }, { status: 500 })
  }
}
