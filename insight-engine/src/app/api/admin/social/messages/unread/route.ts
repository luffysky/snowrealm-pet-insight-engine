import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { queryOne } from '@/lib/db'

interface CountRow extends Record<string, unknown> {
  count: string
}

async function getAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return { userId: payload.sub as string }
}

/** GET /api/admin/social/messages/unread — 未讀私訊總數 */
export async function GET(): Promise<NextResponse> {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ count: 0 })

  const row = await queryOne<CountRow>(
    `SELECT COUNT(*)::text AS count FROM direct_messages WHERE to_user_id = $1 AND read_at IS NULL`,
    [auth.userId]
  )

  return NextResponse.json({ count: parseInt(row?.count ?? '0', 10) })
}
