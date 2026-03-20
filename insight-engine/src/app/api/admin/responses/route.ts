import { NextRequest, NextResponse } from 'next/server'
import { getResponseList } from '@/lib/stats'
import { query } from '@/lib/db'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import { getTenantContext } from '@/lib/tenant'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId } = await getTenantContext()
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10))
    )

    const status = searchParams.get('status') || undefined
    const source = searchParams.get('source') || undefined
    const surveyId = searchParams.get('surveyId') || undefined

    const [result, clickStats] = await Promise.all([
      getResponseList(page, pageSize, { status, source }, tenantId, surveyId),
      query<{ event_type: string; cnt: string }>(
        `SELECT event_type, COUNT(DISTINCT response_id)::text AS cnt FROM click_events GROUP BY event_type`
      ),
    ])

    const lineClicks = parseInt(clickStats.find((r) => r.event_type === 'line_friend')?.cnt ?? '0', 10)
    const igClicks = parseInt(clickStats.find((r) => r.event_type === 'instagram')?.cnt ?? '0', 10)

    return NextResponse.json({ ...result, lineClicks, igClicks })
  } catch (error) {
    console.error('[admin/responses] Failed:', error)
    return NextResponse.json(
      { error: '取得填答列表失敗' },
      { status: 500 }
    )
  }
}

/** 批次刪除填答 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { ids?: unknown }
    const ids = body.ids

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '請提供要刪除的 ID 陣列' }, { status: 400 })
    }

    if (ids.length > 200) {
      return NextResponse.json({ error: '單次最多刪除 200 筆' }, { status: 400 })
    }

    const validIds = ids.filter((id): id is string => typeof id === 'string' && UUID_REGEX.test(id))
    if (validIds.length === 0) {
      return NextResponse.json({ error: '無有效的 ID' }, { status: 400 })
    }

    // 先刪子表再刪主表
    await query(`DELETE FROM click_events WHERE response_id = ANY($1)`, [validIds])
    await query(`DELETE FROM user_tags WHERE response_id = ANY($1)`, [validIds])
    await query(`DELETE FROM answers WHERE response_id = ANY($1)`, [validIds])
    const result = await query<{ id: string }>(
      `DELETE FROM responses WHERE id = ANY($1) RETURNING id`,
      [validIds]
    )

    return NextResponse.json({ success: true, deletedCount: result.length })
  } catch (error) {
    console.error('[admin/responses DELETE] Failed:', error)
    return NextResponse.json(
      { error: '批次刪除失敗' },
      { status: 500 }
    )
  }
}
