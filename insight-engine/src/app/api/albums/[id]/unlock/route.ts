import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'

/**
 * POST /api/albums/[id]/unlock
 * 驗證相簿密碼後設定 HttpOnly cookie
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json() as { password?: string }

  if (!body.password) {
    return NextResponse.json({ error: '請輸入密碼' }, { status: 400 })
  }

  const album = await queryOne<{ id: string; password_hash: string | null }>(
    `SELECT id, password_hash FROM user_albums WHERE id = $1`,
    [id]
  )

  if (!album) return NextResponse.json({ error: '找不到相簿' }, { status: 404 })
  if (!album.password_hash) return NextResponse.json({ error: '此相簿不需要密碼' }, { status: 400 })

  const valid = await verifyPassword(body.password, album.password_hash)
  if (!valid) return NextResponse.json({ error: '密碼錯誤' }, { status: 401 })

  const response = NextResponse.json({ ok: true })
  response.cookies.set(`album_unlock_${album.id}`, '1', {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 86400,
  })
  return response
}
