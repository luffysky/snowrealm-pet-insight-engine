import { NextRequest, NextResponse } from 'next/server'
import { getResponseDetail } from '@/lib/stats'
import { query } from '@/lib/db'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: '無效的 ID 格式' }, { status: 400 })
  }

  try {
    const detail = await getResponseDetail(id)

    if (!detail) {
      return NextResponse.json({ error: '找不到該填答' }, { status: 404 })
    }

    return NextResponse.json(detail)
  } catch (error) {
    console.error('[admin/responses/:id] Failed:', error)
    return NextResponse.json(
      { error: '取得填答詳情失敗' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: '無效的 ID 格式' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const sets: string[] = []
    const vals: unknown[] = []
    let idx = 1

    if (typeof body.notes === 'string') {
      sets.push(`notes = $${idx++}`)
      vals.push(body.notes.slice(0, 500))
    } else if (body.notes === null) {
      sets.push(`notes = $${idx++}`)
      vals.push(null)
    }

    if (body.status === 'completed' || body.status === 'in_progress') {
      sets.push(`status = $${idx++}`)
      vals.push(body.status)
    }

    if (typeof body.source === 'string') {
      sets.push(`utm_source = $${idx++}`)
      vals.push(body.source.slice(0, 200))
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: '無有效欄位' }, { status: 400 })
    }

    vals.push(id)
    await query(
      `UPDATE responses SET ${sets.join(', ')} WHERE id = $${idx}`,
      vals
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/responses/:id PATCH] Failed:', error)
    return NextResponse.json({ error: '更新備註失敗' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: '無效的 ID 格式' }, { status: 400 })
  }

  try {
    // 先刪子表再刪主表
    await query(`DELETE FROM click_events WHERE response_id = $1`, [id])
    await query(`DELETE FROM user_tags WHERE response_id = $1`, [id])
    await query(`DELETE FROM answers WHERE response_id = $1`, [id])
    const result = await query<{ id: string }>(`DELETE FROM responses WHERE id = $1 RETURNING id`, [id])

    if (result.length === 0) {
      return NextResponse.json({ error: '找不到該填答' }, { status: 404 })
    }

    return NextResponse.json({ success: true, deletedId: id })
  } catch (error) {
    console.error('[admin/responses/:id DELETE] Failed:', error)
    return NextResponse.json(
      { error: '刪除失敗' },
      { status: 500 }
    )
  }
}
