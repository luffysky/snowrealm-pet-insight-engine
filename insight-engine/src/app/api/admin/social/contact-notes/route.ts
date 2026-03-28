import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { queryOne, execute } from '@/lib/db'

interface NoteRow extends Record<string, unknown> {
  nickname: string
}

/** GET /api/admin/social/contact-notes?userId=xxx — 取得我對某人的備註名字 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { userId } = roleCheck

  const targetId = req.nextUrl.searchParams.get('userId')
  if (!targetId) return NextResponse.json({ error: '缺少 userId' }, { status: 400 })

  const row = await queryOne<NoteRow>(
    `SELECT nickname FROM user_contact_notes WHERE noter_id = $1 AND noted_user_id = $2`,
    [userId, targetId]
  )

  return NextResponse.json({ nickname: row?.nickname ?? null })
}

/** POST /api/admin/social/contact-notes — 新增或更新備註名字 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { userId } = roleCheck

  const body = await req.json() as { targetUserId: string; nickname: string }
  if (!body.targetUserId) return NextResponse.json({ error: '缺少 targetUserId' }, { status: 400 })
  if (userId === body.targetUserId) return NextResponse.json({ error: '不能備註自己' }, { status: 400 })

  const nickname = (body.nickname ?? '').trim()

  if (!nickname) {
    // 空字串 → 刪除備註
    await execute(
      `DELETE FROM user_contact_notes WHERE noter_id = $1 AND noted_user_id = $2`,
      [userId, body.targetUserId]
    )
    return NextResponse.json({ nickname: null })
  }

  await execute(
    `INSERT INTO user_contact_notes (noter_id, noted_user_id, nickname, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (noter_id, noted_user_id) DO UPDATE SET nickname = $3, updated_at = NOW()`,
    [userId, body.targetUserId, nickname]
  )

  return NextResponse.json({ nickname })
}
