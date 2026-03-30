import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { query, queryOne, execute } from '@/lib/db'
import { randomBytes } from 'crypto'

function generateToken(): string {
  return randomBytes(12).toString('base64url')
}

/** GET — 取得目前有效的 QR token（若無則建立） */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const myId = roleCheck.userId

  // 取最新且未過期的 token
  const existing = await queryOne<{ token: string; created_at: string }>(
    `SELECT token, created_at FROM friend_qr_tokens
     WHERE user_id = $1 AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [myId]
  )

  if (existing) {
    return NextResponse.json({ token: existing.token, createdAt: existing.created_at })
  }

  // 建立新 token
  const token = generateToken()
  await execute(
    `INSERT INTO friend_qr_tokens (user_id, token) VALUES ($1, $2)`,
    [myId, token]
  )
  return NextResponse.json({ token, createdAt: new Date().toISOString() })
}

/** POST — 強制刷新 QR token */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const myId = roleCheck.userId

  const token = generateToken()
  await execute(
    `INSERT INTO friend_qr_tokens (user_id, token)
     VALUES ($1, $2)`,
    [myId, token]
  )
  // 舊 token 不刪除（仍有效至 expires_at）
  return NextResponse.json({ token, createdAt: new Date().toISOString() })
}

/** 公開路由：透過 QR token 取得用戶 ID（掃碼後用） */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as { token: string }
  if (!body.token) return NextResponse.json({ error: '缺少 token' }, { status: 400 })

  const row = await queryOne<{ user_id: string }>(
    `SELECT user_id FROM friend_qr_tokens WHERE token = $1 AND expires_at > NOW()`,
    [body.token]
  )
  if (!row) return NextResponse.json({ error: '無效或已過期的 QR 碼' }, { status: 404 })

  return NextResponse.json({ userId: row.user_id })
}
