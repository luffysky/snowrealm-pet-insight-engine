import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { execute } from '@/lib/db'
import { encryptApiKey } from '@/lib/aiCrypto'

export const THEME_SYNC_PREFIX = '[THEME_SYNC]:'

/** POST /api/admin/social/messages/theme-sync  body: { toUserId, themeKey } */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck

  const body = await req.json() as { toUserId?: string; themeKey?: string; bgId?: string }
  if (!body.toUserId || !body.themeKey) {
    return NextResponse.json({ error: 'toUserId and themeKey required' }, { status: 400 })
  }

  const fromId = roleCheck.userId
  // Encode as JSON so we can carry both theme and background in the same message
  const payload = JSON.stringify({ t: body.themeKey, bg: body.bgId ?? null })
  const content = `${THEME_SYNC_PREFIX}${payload}`
  const { encrypted, iv, tag } = encryptApiKey(content)

  // Persist to DB so recipient gets it even if they're not currently online.
  // Sender is added to deleted_for immediately so it doesn't appear in their chat.
  await execute(
    `INSERT INTO direct_messages (from_user_id, to_user_id, encrypted_content, iv, tag, deleted_for)
     VALUES ($1, $2, $3, $4, $5, ARRAY[$1::text])`,
    [fromId, body.toUserId, encrypted, iv, tag]
  )

  return NextResponse.json({ ok: true })
}
