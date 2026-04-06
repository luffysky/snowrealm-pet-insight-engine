import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

async function verifySuperAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const tenants = payload.tenants || (payload.tid ? [{ role: payload.role || 'admin' }] : [])
  const isSuper = tenants.some((t: { role: string }) => t.role === 'super_admin') || payload.role === 'super_admin'
  if (!isSuper) return null
  return payload
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const intent = searchParams.get('intent') ?? 'all'
  const model = searchParams.get('model') ?? 'all'
  const offset = (page - 1) * 20

  try {
    // 實際對話存在 guide_chat_messages，以 user_key 分組為對話串
    const countRow = await queryOne<{ total: string }>(
      `SELECT COUNT(DISTINCT user_key)::TEXT AS total FROM guide_chat_messages`,
      []
    )
    const total = parseInt(countRow?.total ?? '0', 10)

    const rows = await query(
      `SELECT
         gcm.user_key AS id,
         CASE WHEN gcm.user_key LIKE 'user:%' THEN gcm.user_key::text ELSE NULL END AS user_id,
         'chat' AS intent_type,
         'claude' AS model,
         COUNT(*)::int AS message_count,
         0 AS total_tokens,
         MAX(gcm.created_at) AS created_at,
         gum.nickname,
         au.display_name,
         (SELECT content FROM guide_chat_messages WHERE user_key = gcm.user_key AND role = 'user' ORDER BY created_at DESC LIMIT 1) AS last_user_message,
         (SELECT content FROM guide_chat_messages WHERE user_key = gcm.user_key AND role = 'assistant' ORDER BY created_at DESC LIMIT 1) AS last_assistant_message
       FROM guide_chat_messages gcm
       LEFT JOIN admin_users au ON au.id::text = REPLACE(gcm.user_key, 'user:', '')
       LEFT JOIN guide_user_memory gum ON gum.user_key = gcm.user_key
       GROUP BY gcm.user_key, gum.nickname, au.display_name
       ORDER BY MAX(gcm.created_at) DESC
       LIMIT 20 OFFSET $1`,
      [offset]
    )

    return NextResponse.json({ data: rows, total })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') return NextResponse.json({ data: [], total: 0 })
    console.error('[conversations GET]', err)
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 })
  }
}
