import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'
import { createHash } from 'crypto'
import { hashPassword } from '@/lib/auth'
import { formatPhoneE164 } from '@/lib/sms'

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const email = (body?.email as string)?.trim().toLowerCase() || ''
    const phone = (body?.phone as string)?.trim() || ''
    const codeId = body?.codeId as string
    const code = body?.code as string
    const newPassword = body?.newPassword as string
    const channel = phone ? 'phone' : 'email'
    const phoneE164 = phone ? formatPhoneE164(phone) : ''

    if ((!email && !phone) || !codeId || !code || !newPassword) {
      return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: '密碼至少 6 個字元' }, { status: 400 })
    }

    // 驗證碼檢查
    const record = await queryOne<{ id: string; code_hash: string; email: string; phone: string }>(
      `SELECT id, code_hash, email, phone FROM email_verification_codes
       WHERE id = $1 AND purpose = 'reset_password' AND verified = false AND expires_at > NOW()`,
      [codeId]
    )

    if (!record) {
      return NextResponse.json({ error: '驗證碼無效或已過期' }, { status: 400 })
    }

    if (record.code_hash !== hashCode(code)) {
      return NextResponse.json({ error: '驗證碼不正確' }, { status: 400 })
    }

    // 比對 email 或 phone
    if (channel === 'email' && record.email !== email) {
      return NextResponse.json({ error: '驗證碼與 Email 不符' }, { status: 400 })
    }
    if (channel === 'phone' && record.phone !== phoneE164) {
      return NextResponse.json({ error: '驗證碼與手機號碼不符' }, { status: 400 })
    }

    // 找使用者
    const user = channel === 'email'
      ? await queryOne<{ id: string }>(`SELECT id FROM admin_users WHERE email = $1`, [email])
      : await queryOne<{ id: string }>(`SELECT id FROM admin_users WHERE phone = $1`, [phoneE164])

    if (!user) {
      const label = channel === 'email' ? 'Email' : '手機號碼'
      return NextResponse.json({ error: `此 ${label} 尚未註冊` }, { status: 404 })
    }

    // 更新密碼
    const pwHash = await hashPassword(newPassword)
    await query(`UPDATE admin_users SET password_hash = $1 WHERE id = $2`, [pwHash, user.id])

    // 標記驗證碼已使用
    await query(`UPDATE email_verification_codes SET verified = true WHERE id = $1`, [codeId])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Reset Password Error]', err)
    return NextResponse.json({ error: '系統錯誤，請稍後再試' }, { status: 500 })
  }
}
