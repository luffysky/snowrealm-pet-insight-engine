import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { query, execute } from '@/lib/db'

export const runtime = 'nodejs'

const HISTORY_LIMIT = 60 // 最多載入 60 筆

function getUserKey(req: NextRequest, userId: string | null): string {
  if (userId) return `user:${userId}`
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  return `ip:${ip}`
}

/** GET /api/guide/history — 載入對話歷史 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value ?? null
  let userId: string | null = null
  if (token) {
    const payload = await verifyToken(token)
    userId = payload?.sub ?? null
  }

  // 未登入 → 不保存歷史，直接回空
  if (!userId) {
    return NextResponse.json({ messages: [] })
  }

  const userKey = getUserKey(req, userId)

  try {
    const rows = await query<{ id: string; role: string; content: string; mood: string | null; created_at: string }>(
      `SELECT id, role, content, mood, created_at
       FROM guide_chat_messages
       WHERE user_key = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userKey, HISTORY_LIMIT]
    )

    // 反轉回時間正序
    const messages = rows.reverse().map(r => ({
      id: r.id,
      role: r.role as 'user' | 'assistant',
      text: r.content,
      mood: r.mood ?? undefined,
    }))

    return NextResponse.json({ messages })
  } catch {
    return NextResponse.json({ messages: [] })
  }
}

/** POST /api/guide/history — 儲存一批訊息 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value ?? null
  let userId: string | null = null
  if (token) {
    const payload = await verifyToken(token)
    userId = payload?.sub ?? null
  }

  // 未登入 → 不儲存，靜默成功
  if (!userId) {
    return NextResponse.json({ ok: true })
  }

  const userKey = getUserKey(req, userId)

  const body = await req.json() as {
    messages: { role: 'user' | 'assistant'; text: string; mood?: string }[]
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ ok: true })
  }

  try {
    for (const msg of body.messages) {
      if (!msg.role || !msg.text?.trim()) continue
      await execute(
        `INSERT INTO guide_chat_messages (user_key, role, content, mood)
         VALUES ($1, $2, $3, $4)`,
        [userKey, msg.role, msg.text.trim(), msg.mood ?? null]
      )
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
