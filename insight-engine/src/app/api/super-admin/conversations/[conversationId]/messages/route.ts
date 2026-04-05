import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/super-admin/conversations/messages?id=xxx
 * 也相容舊路徑 /api/super-admin/conversations/[conversationId]/messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
): Promise<NextResponse> {
  // 權限由 middleware 處理（/api/super-admin/* 已驗 super_admin）

  const { conversationId: rawId } = await params
  const conversationId = decodeURIComponent(rawId)

  if (!conversationId) {
    return NextResponse.json({ data: [] })
  }

  try {
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
