import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
): Promise<NextResponse> {
  const auth = await verifySuperAdmin(request)
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { conversationId: rawId } = await params
  const conversationId = decodeURIComponent(rawId)

  try {
    // conversationId is the user_key from guide_chat_messages
    const rows = await query<{ sender: string; content: string; created_at: string; image_url: string | null }>(
      `SELECT role AS sender, content, created_at, image_url
       FROM guide_chat_messages
       WHERE user_key = $1
       ORDER BY created_at ASC`,
      [conversationId]
    )
    return NextResponse.json({ data: rows })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') return NextResponse.json({ data: [] })
    console.error('[conversations/messages GET]', err)
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 })
  }
}
