import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { proposeThemeSync } from '@/lib/dmEventStore'

/** POST /api/admin/social/messages/theme-sync  body: { toUserId, themeKey } */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck

  const body = await req.json() as { toUserId?: string; themeKey?: string }
  if (!body.toUserId || !body.themeKey) {
    return NextResponse.json({ error: 'toUserId and themeKey required' }, { status: 400 })
  }

  proposeThemeSync(roleCheck.userId, body.toUserId, body.themeKey)
  return NextResponse.json({ ok: true })
}
