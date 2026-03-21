import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { createHash, randomInt } from 'crypto'
import { sendEmail, buildVerificationEmail } from '@/lib/email'
import { sendVerificationSms, isValidPhone, formatPhoneE164 } from '@/lib/sms'

/** SHA-256 hash */
function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => null)
    const email = (body?.email as string)?.trim().toLowerCase() || ''
    const phone = (body?.phone as string)?.trim() || ''
    const purpose = (body?.purpose as string) || 'register'
    const channel = phone ? 'phone' : 'email' // 自動判斷通道

    // ── 驗證 ──
    if (!['register', 'login_2fa', 'reset_password'].includes(purpose)) {
      return NextResponse.json({ error: '無效的用途' }, { status: 400 })
    }

    if (channel === 'email') {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: '請輸入有效的 Email' }, { status: 400 })
      }
    } else {
      if (!isValidPhone(phone)) {
        return NextResponse.json({ error: '請輸入有效的手機號碼' }, { status: 400 })
      }
    }

    const identifier = channel === 'email' ? email : formatPhoneE164(phone)

    // ── 註冊時檢查是否已被使用 ──
    if (purpose === 'register') {
      const field = channel === 'email' ? 'email' : 'phone'
      const existing = await queryOne(
        `SELECT id FROM admin_users WHERE ${field} = $1`,
        [identifier],
      )
      if (existing) {
        const label = channel === 'email' ? 'Email' : '手機號碼'
        return NextResponse.json({ error: `此 ${label} 已註冊，請直接登入` }, { status: 409 })
      }
    }

    // ── 發送頻率限制：60 秒內只能一次 ──
    const recentField = channel === 'email' ? 'email' : 'phone'
    const recent = await queryOne(
      `SELECT id FROM email_verification_codes
       WHERE ${recentField} = $1 AND purpose = $2 AND created_at > now() - INTERVAL '60 seconds'`,
      [identifier, purpose],
    )
    if (recent) {
      return NextResponse.json({ error: '驗證碼已發送，請稍候 60 秒再重試' }, { status: 429 })
    }

    // ── 生成 6 位數驗證碼 ──
    const code = randomInt(100000, 999999).toString()
    const codeHashed = hashCode(code)

    // ── 舊碼作廢 ──
    await query(
      `UPDATE email_verification_codes SET verified = true
       WHERE ${recentField} = $1 AND purpose = $2 AND verified = false`,
      [identifier, purpose],
    )

    // ── 存入 DB（10 分鐘過期） ──
    const insertFields = channel === 'email'
      ? '(email, code_hash, purpose, expires_at)'
      : '(phone, code_hash, purpose, expires_at)'

    const row = await queryOne<{ id: string }>(
      `INSERT INTO email_verification_codes ${insertFields}
       VALUES ($1, $2, $3, now() + INTERVAL '10 minutes')
       RETURNING id`,
      [identifier, codeHashed, purpose],
    )

    // ── 發送驗證碼 ──
    if (channel === 'email') {
      const result = await sendEmail({
        to: email,
        subject: 'SnowRealm Insight Engine — 您的驗證碼',
        html: buildVerificationEmail(code),
      })
      if (!result.success) {
        console.error('[Send Code] Email delivery failed:', result.error)
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ error: '驗證碼寄送失敗，請稍後再試' }, { status: 500 })
        }
      }
    } else {
      const result = await sendVerificationSms(phone, code)
      if (!result.success) {
        console.error('[Send Code] SMS delivery failed:', result.error)
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ error: '簡訊發送失敗，請稍後再試' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true, codeId: row?.id, channel })
  } catch (err) {
    console.error('[Send Code Error]', err)
    return NextResponse.json({ error: '系統錯誤，請稍後再試' }, { status: 500 })
  }
}
