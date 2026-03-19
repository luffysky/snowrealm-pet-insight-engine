import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET(): Promise<NextResponse> {
  try {
    const [entries, totalRow] = await Promise.all([
      query<{
        id: string
        email: string
        response_id: string | null
        source: string | null
        created_at: string
      }>(
        'SELECT id, email, response_id, source, created_at FROM waitlist ORDER BY created_at DESC'
      ),
      queryOne<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM waitlist'
      ),
    ])

    return NextResponse.json({
      data: entries,
      total: parseInt(totalRow?.count ?? '0', 10),
    })
  } catch (error) {
    console.error('[admin/waitlist] Failed:', error)
    return NextResponse.json(
      { error: '取得封測名單失敗' },
      { status: 500 }
    )
  }
}
