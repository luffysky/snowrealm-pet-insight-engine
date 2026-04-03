import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdminRequest } from '@/lib/superAdminAuth'
import { execute, query, queryOne } from '@/lib/db'
import { createHmac } from 'crypto'

const HMAC_SECRET = process.env.INVITE_HMAC_SECRET || 'yukiboard_dev_2026'

const TYPE_CONFIG: Record<string, { char: string; dailyTokens: number; maxUses: number }> = {
  standard:  { char: 'S', dailyTokens: 5000,    maxUses: 1 },
  kol:       { char: 'K', dailyTokens: 20000,   maxUses: 50 },
  permanent: { char: 'P', dailyTokens: 99999,   maxUses: 999 },
}

function generateCode(typeChar: string, yearMonth: string, index: number): string {
  const payload = `${typeChar}${yearMonth}${index.toString().padStart(4, '0')}`
  const signature = createHmac('sha256', HMAC_SECRET)
    .update(payload)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase()
  return `YUKI-${payload}-${signature}`
}

/** GET — 列出所有邀請碼 */
export async function GET(request: NextRequest) {
  const payload = await verifySuperAdminRequest(request)
  if (!payload) return NextResponse.json({ error: '權限不足' }, { status: 403 })

  try {
    const codes = await query<{
      id: string
      code: string
      type: string
      daily_token_limit: number
      max_uses: number
      used_count: number
      is_active: boolean
      created_at: string
      expires_at: string | null
      note: string | null
    }>(
      `SELECT id, code, type, daily_token_limit, max_uses, used_count,
              is_active, created_at, expires_at, note
       FROM yukiboard_invite_codes
       ORDER BY created_at DESC
       LIMIT 500`,
    )
    return NextResponse.json({ codes })
  } catch (error) {
    console.error('[YukiBoard Invite] GET error:', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

/** POST — 批量產生邀請碼 */
export async function POST(request: NextRequest) {
  const payload = await verifySuperAdminRequest(request)
  if (!payload) return NextResponse.json({ error: '權限不足' }, { status: 403 })

  try {
    const body = await request.json()
    const { type = 'standard', count = 10, note = '' } = body as {
      type?: string
      count?: number
      note?: string
    }

    const config = TYPE_CONFIG[type]
    if (!config) return NextResponse.json({ error: '無效的類型' }, { status: 400 })
    if (count < 1 || count > 500) return NextResponse.json({ error: '數量 1~500' }, { status: 400 })

    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '')

    // 取得目前這個月+類型的最大 index
    const maxRow = await queryOne<{ max_index: number }>(
      `SELECT COUNT(*) AS max_index FROM yukiboard_invite_codes WHERE code LIKE $1`,
      [`YUKI-${config.char}${yearMonth}%`],
    )
    let startIndex = (maxRow?.max_index ?? 0)

    const generated: string[] = []
    for (let i = 0; i < count; i++) {
      const code = generateCode(config.char, yearMonth, startIndex + i)
      await execute(
        `INSERT INTO yukiboard_invite_codes (code, type, daily_token_limit, max_uses, created_by, note)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (code) DO NOTHING`,
        [code, type, config.dailyTokens, config.maxUses, payload.sub, note || null],
      )
      generated.push(code)
    }

    return NextResponse.json({ ok: true, count: generated.length, codes: generated })
  } catch (error) {
    console.error('[YukiBoard Invite] POST error:', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

/** PATCH — 啟用/停用邀請碼 */
export async function PATCH(request: NextRequest) {
  const payload = await verifySuperAdminRequest(request)
  if (!payload) return NextResponse.json({ error: '權限不足' }, { status: 403 })

  try {
    const body = await request.json()
    const { id, is_active } = body as { id: string; is_active: boolean }

    if (!id || typeof is_active !== 'boolean') {
      return NextResponse.json({ error: '缺少參數' }, { status: 400 })
    }

    await execute(
      `UPDATE yukiboard_invite_codes SET is_active = $1 WHERE id = $2`,
      [is_active, id],
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[YukiBoard Invite] PATCH error:', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
