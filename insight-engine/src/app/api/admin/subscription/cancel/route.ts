import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { cancelSubscription, reinstateSubscription } from '@/lib/subscriptionEngine'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const roleCheck = await requireRole('admin')
    if (roleCheck instanceof NextResponse) return roleCheck
    const { tenantId } = roleCheck

    const body = await request.json().catch(() => ({})) as { action?: string; reason?: string }
    const action = body.action ?? 'cancel'

    if (action === 'reinstate') {
      await reinstateSubscription(tenantId)
      return NextResponse.json({ ok: true, action: 'reinstated' })
    }

    await cancelSubscription({ tenantId, reason: body.reason })
    return NextResponse.json({ ok: true, action: 'cancelled' })
  } catch (error) {
    console.error('[subscription/cancel] Failed:', error)
    return NextResponse.json({ error: '操作失敗' }, { status: 500 })
  }
}
