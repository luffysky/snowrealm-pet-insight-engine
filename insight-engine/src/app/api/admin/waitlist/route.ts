import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(): Promise<NextResponse> {
  try {
    const [entries, totalRow] = await Promise.all([
      query<{
        id: string
        email: string
        nickname: string
        contact_info: string
        response_id: string | null
        source: string | null
        created_at: string
      }>(
        'SELECT id, email, nickname, contact_info, response_id, source, created_at FROM waitlist ORDER BY created_at DESC'
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

/** 新增封測名單 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const email = (body.email ?? '').trim().toLowerCase()
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: '請輸入有效的 email' }, { status: 400 })
    }

    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM waitlist WHERE email = $1', [email]
    )
    if (existing) {
      return NextResponse.json({ error: '此 email 已存在' }, { status: 409 })
    }

    const nickname = (body.nickname ?? '').trim().slice(0, 50)
    const contactInfo = (body.contact_info ?? '').trim().slice(0, 100)
    const source = (body.source ?? 'admin').trim().slice(0, 50)

    await query(
      'INSERT INTO waitlist (id, email, nickname, contact_info, source) VALUES ($1, $2, $3, $4, $5)',
      [uuidv4(), email, nickname, contactInfo, source]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/waitlist] POST failed:', error)
    return NextResponse.json({ error: '新增失敗' }, { status: 500 })
  }
}

/** 更新封測名單 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { id } = body
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: '缺少有效 id' }, { status: 400 })
    }

    const sets: string[] = []
    const vals: unknown[] = []
    let idx = 1

    if (body.email !== undefined) {
      const email = body.email.trim().toLowerCase()
      if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json({ error: '無效的 email' }, { status: 400 })
      }
      sets.push(`email = $${idx++}`)
      vals.push(email)
    }
    if (body.nickname !== undefined) {
      sets.push(`nickname = $${idx++}`)
      vals.push(body.nickname.trim().slice(0, 50))
    }
    if (body.contact_info !== undefined) {
      sets.push(`contact_info = $${idx++}`)
      vals.push(body.contact_info.trim().slice(0, 100))
    }
    if (body.source !== undefined) {
      sets.push(`source = $${idx++}`)
      vals.push(body.source.trim().slice(0, 50))
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: '無更新欄位' }, { status: 400 })
    }

    vals.push(id)
    await query(
      `UPDATE waitlist SET ${sets.join(', ')} WHERE id = $${idx}`,
      vals
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/waitlist] PUT failed:', error)
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}

/** 刪除封測名單（支援批次） */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const ids: string[] = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : []

    if (ids.length === 0) {
      return NextResponse.json({ error: '缺少 id' }, { status: 400 })
    }
    if (ids.length > 200) {
      return NextResponse.json({ error: '單次最多刪除 200 筆' }, { status: 400 })
    }
    if (!ids.every((id) => UUID_REGEX.test(id))) {
      return NextResponse.json({ error: '包含無效 id' }, { status: 400 })
    }

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ')
    const result = await query(
      `DELETE FROM waitlist WHERE id IN (${placeholders})`,
      ids
    )
    return NextResponse.json({ success: true, deleted: (result as unknown[]).length ?? ids.length })
  } catch (error) {
    console.error('[admin/waitlist] DELETE failed:', error)
    return NextResponse.json({ error: '刪除失敗' }, { status: 500 })
  }
}
