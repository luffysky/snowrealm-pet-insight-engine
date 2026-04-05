import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/super-admin/conversations/lookup/messages?id=xxx
 * 用 query parameter 避開 dynamic path 的 URL 編碼問題（user_key 含冒號）。
 * 權限由 middleware /api/super-admin/* 驗證。
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const conversationId = request.nextUrl.searchParams.get('id')
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
    console.error('[conversations/lookup/messages GET]', err)
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 })
  }
}
