import { NextRequest, NextResponse } from 'next/server'
import { checkExpiredSubscriptions, getSubscriptionsNeedingReminder, markReminderSent } from '@/lib/subscriptionEngine'
import { query, queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface TenantRow extends Record<string, unknown> {
  name: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. 降級過期訂閱
    const expiredCount = await checkExpiredSubscriptions()

    // 2. 發到期提醒
    const reminders = await getSubscriptionsNeedingReminder()
    let reminderSent = 0

    for (const sub of reminders) {
      try {
        const tenant = await queryOne<TenantRow>(
          `SELECT name FROM tenants WHERE slug = $1`, [sub.tenantId]
        )
        const endDate = new Date(sub.periodEnd).toLocaleDateString('zh-TW')

        // 查管理員 LINE
        const admins = await query<{ line_user_id: string }>(
          `SELECT au.line_user_id FROM admin_users au
           JOIN tenant_users tu ON tu.user_id = au.id
           WHERE tu.tenant_id = $1 AND au.line_user_id IS NOT NULL`,
          [sub.tenantId]
        )

        if (admins.length > 0) {
          const { getLineConfig } = await import('@/lib/lineConfig')
          const token = await getLineConfig('INSIGHT_CHANNEL_ACCESS_TOKEN')
          if (token) {
            for (const admin of admins) {
              await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  to: admin.line_user_id,
                  messages: [{
                    type: 'text',
                    text: `⚠️ 訂閱到期提醒\n\n${tenant?.name ?? sub.tenantId} 的訂閱將於 ${endDate} 到期。\n\n若要繼續使用，請前往後台續訂。`
                  }]
                })
              }).catch(() => {})
            }
          }
        }

        await markReminderSent(sub.tenantId)
        reminderSent++
      } catch {
        // 單筆失敗不影響其他
      }
    }

    return NextResponse.json({
      ok: true,
      expiredDowngraded: expiredCount,
      remindersSent: reminderSent,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[cron/subscription-check] Failed:', error)
    return NextResponse.json({ error: '排程執行失敗' }, { status: 500 })
  }
}
