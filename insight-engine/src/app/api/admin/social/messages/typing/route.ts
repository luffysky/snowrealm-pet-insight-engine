import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { setTyping } from '@/lib/dmEventStore'

/** POST /api/admin/social/messages/typing  body: { toUserId } */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck

  const body = await req.json() as { toUserId?: string }
  if (!body.toUserId) return NextResponse.json({ error: 'toUserId required' }, { status: 400 })

  setTyping(roleCheck.userId, body.toUserId)
  return NextResponse.json({ ok: true })
}
