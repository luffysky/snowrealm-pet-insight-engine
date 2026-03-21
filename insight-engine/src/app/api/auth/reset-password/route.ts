import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'
import { createHash } from 'crypto'
import { hashPassword } from '@/lib/auth'

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const email = (body?.email as string)?.trim().toLowerCase()
    const codeId = body?.codeId as string
    const code = body?.code as string
    const newPassword = body?.newPassword as string

    if (!email || !codeId || !code || !newPassword) {
      return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: '密碼至少 6 個字元' }, { status: 400 })
    }

    // 驗證碼檢查
    const record = await queryOne<{ id: string; code_hash: string; email: string }>(
      `SELECT id, code_hash, email FROM email_verification_codes
       WHERE id = $1 AND purpose = 'reset_password' AND verified = false AND expires_at > NOW()`,
      [codeId]
    )

    if (!record) {
      return NextResponse.json({ error: '驗證碼無效或已過期' }, { status: 400 })
    }

    if (record.code_hash !== hashCode(code)) {
      return NextResponse.json({ error: '驗證碼不正確' }, { status: 400 })
    }

    if (record.email !== email) {
      return NextResponse.json({ error: '驗證碼與 Email 不符' }, { status: 400 })
    }

    // 檢查使用者存在
    const user = await queryOne<{ id: string }>(
      `SELECT id FROM admin_users WHERE email = $1`,
      [email]
    )
    if (!user) {
      return NextResponse.json({ error: '此 Email 尚未註冊' }, { status: 404 })
    }

    // 更新密碼
    const passwordHash = await hashPassword(newPassword)
    await query(
      `UPDATE admin_users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, user.id]
    )

    // 標記驗證碼已使用
    await query(
      `UPDATE email_verification_codes SET verified = true WHERE id = $1`,
      [codeId]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Reset Password Error]', err)
    return NextResponse.json({ error: '系統錯誤，請稍後再試' }, { status: 500 })
  }
}
