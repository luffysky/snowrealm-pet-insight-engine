import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { createHash, randomInt } from 'crypto'
import { sendEmail, buildVerificationEmail } from '@/lib/email'

/** SHA-256 hash */
function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => null)
    const email = (body?.email as string)?.trim().toLowerCase()
    const purpose = (body?.purpose as string) || 'register'

    // ── 驗證 ──
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '請輸入有效的 Email' }, { status: 400 })
    }
    if (!['register', 'login_2fa', 'reset_password'].includes(purpose)) {
      return NextResponse.json({ error: '無效的用途' }, { status: 400 })
    }

    // ── 註冊時檢查 email 是否已被使用 ──
    if (purpose === 'register') {
      const existing = await queryOne(
        `SELECT id FROM admin_users WHERE email = $1`,
        [email],
      )
      if (existing) {
        return NextResponse.json({ error: '此 Email 已註冊，請直接登入' }, { status: 409 })
      }
    }

    // ── 發送頻率限制：同一 email+purpose 60 秒內只能一次 ──
    const recent = await queryOne(
      `SELECT id FROM email_verification_codes
       WHERE email = $1 AND purpose = $2 AND created_at > now() - INTERVAL '60 seconds'`,
      [email, purpose],
    )
    if (recent) {
      return NextResponse.json({ error: '驗證碼已發送，請稍候 60 秒再重試' }, { status: 429 })
    }

    // ── 生成 6 位數驗證碼 ──
    const code = randomInt(100000, 999999).toString()
    const codeHashed = hashCode(code)

    // ── 將同 email+purpose 舊碼標記為已驗證（作廢） ──
    await query(
      `UPDATE email_verification_codes SET verified = true
       WHERE email = $1 AND purpose = $2 AND verified = false`,
      [email, purpose],
    )

    // ── 存入 DB（10 分鐘過期） ──
    const row = await queryOne<{ id: string }>(
      `INSERT INTO email_verification_codes (email, code_hash, purpose, expires_at)
       VALUES ($1, $2, $3, now() + INTERVAL '10 minutes')
       RETURNING id`,
      [email, codeHashed, purpose],
    )

    // ── 發送 Email ──
    const result = await sendEmail({
      to: email,
      subject: 'SnowRealm Insight Engine — 您的驗證碼',
      html: buildVerificationEmail(code),
    })

    if (!result.success) {
      console.error('[Send Code] Email delivery failed:', result.error)
      // 開發環境仍回傳成功（已 console.log 驗證碼）
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: '驗證碼寄送失敗，請稍後再試' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, codeId: row?.id })
  } catch (err) {
    console.error('[Send Code Error]', err)
    return NextResponse.json({ error: '系統錯誤，請稍後再試' }, { status: 500 })
  }
}
