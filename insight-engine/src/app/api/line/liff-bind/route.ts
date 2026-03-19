import { NextRequest, NextResponse } from 'next/server'
import { execute, queryOne } from '@/lib/db'

/**
 * POST /api/line/liff-bind
 * LIFF 啟動後綁定 LINE userId 與 responseId
 * body: { lineUserId, displayName?, responseId? }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as {
    lineUserId?: string
    displayName?: string
    responseId?: string
  }

  const { lineUserId, displayName, responseId } = body
  if (!lineUserId) {
    return NextResponse.json({ error: 'lineUserId required' }, { status: 400 })
  }

  // Upsert line_users
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM line_users WHERE line_user_id = $1',
    [lineUserId]
  )

  if (existing) {
    // Update response_id if provided
    if (responseId) {
      await execute(
        'UPDATE line_users SET response_id = $1, display_name = COALESCE($2, display_name) WHERE line_user_id = $3',
        [responseId, displayName, lineUserId]
      )
    }
  } else {
    await execute(
      'INSERT INTO line_users (line_user_id, display_name, response_id) VALUES ($1, $2, $3)',
      [lineUserId, displayName ?? null, responseId ?? null]
    )
  }

  return NextResponse.json({ ok: true })
}
