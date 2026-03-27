import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { signToken, verifyToken } from '@/lib/jwt'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // Rate limit: max 5 PIN attempts per IP per 10 minutes
  const rl = checkRateLimit(`sa-pin:${ip}`, 5, 600_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: '嘗試次數過多，請等待 10 分鐘後再試' }, { status: 429 })
  }

  try {
    const body = await request.json() as { pin?: string }
    const { pin } = body

    if (!pin) return NextResponse.json({ error: '請輸入 PIN 碼' }, { status: 400 })

    // Verify pending token (sub=adminUserId, name=lineUserId, role='sa_pending')
    const pendingToken = request.cookies.get('sa_pending')?.value
    if (!pendingToken) return NextResponse.json({ error: '驗證已過期，請重新登入' }, { status: 401 })

    const payload = await verifyToken(pendingToken)
    if (!payload || payload.role !== 'sa_pending') {
      return NextResponse.json({ error: '驗證已過期，請重新登入' }, { status: 401 })
    }

    const adminUserId = payload.sub

    // Verify PIN against env var
    const correctPin = process.env.SUPER_ADMIN_PIN
    if (!correctPin) {
      return NextResponse.json({ error: '系統未設定 PIN，請聯繫技術人員' }, { status: 500 })
    }

    if (pin !== correctPin) {
      // Log failed attempt
      try {
        await execute(
          `INSERT INTO audit_logs (action, actor_id, details, created_at)
           VALUES ('super_admin_pin_failed', $1, $2, NOW())`,
          [adminUserId, JSON.stringify({ ip })]
        )
      } catch { /* ignore */ }
      return NextResponse.json({ error: 'PIN 碼錯誤' }, { status: 401 })
    }

    // PIN correct — find user and issue full JWT
    const user = await queryOne<{
      id: string; tenant_id: string; role: string; display_name: string
    }>(
      `SELECT id, tenant_id, role, display_name FROM admin_users WHERE id = $1 AND role = 'super_admin'`,
      [adminUserId],
    )
    if (!user) return NextResponse.json({ error: '帳號不存在' }, { status: 401 })

    // Log successful login
    try {
      await execute(
        `INSERT INTO audit_logs (action, actor_id, actor_name, details, created_at)
         VALUES ('super_admin_login_success', $1, $2, $3, NOW())`,
        [user.id, user.display_name, JSON.stringify({ ip })]
      )
    } catch { /* ignore */ }

    // Issue full JWT — only 2 hours for super admin (7200 seconds)
    const jwt = await signToken({
      sub: user.id,
      tid: user.tenant_id,
      role: 'super_admin',
      name: user.display_name,
    }, 7200)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = NextResponse.json({ ok: true, redirectTo: `${baseUrl}/snowrealm-insight-ctrl` })
    response.cookies.set('admin_session', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/',
    })
    response.cookies.delete('sa_pending')
    return response
  } catch (err) {
    console.error('[Super Admin PIN Confirm Error]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
