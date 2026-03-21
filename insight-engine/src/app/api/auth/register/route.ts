import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { signToken } from '@/lib/jwt'
import { createHash } from 'crypto'
import { formatPhoneE164 } from '@/lib/sms'
import { notifyNewRegistration } from '@/lib/lineNotify'

/** 將中文/英文組織名轉成 URL 安全 slug */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'org'
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => null)

    const email = (body?.email as string)?.trim().toLowerCase() || ''
    const phone = (body?.phone as string)?.trim() || ''
    const password = (body?.password as string)
    const displayName = (body?.displayName as string)?.trim()
    const orgName = (body?.orgName as string)?.trim()
    const customSlug = (body?.slug as string)?.trim().toLowerCase()
    const codeId = (body?.codeId as string)?.trim()
    const code = (body?.code as string)?.trim()
    const channel = phone ? 'phone' : 'email'
    const phoneE164 = phone ? formatPhoneE164(phone) : ''

    // ── 基本驗證 ──
    if (!password || !displayName || !orgName || !codeId || !code) {
      return NextResponse.json({ error: '請填寫完整資料並完成驗證' }, { status: 400 })
    }
    if (!email && !phone) {
      return NextResponse.json({ error: '請填寫 Email 或手機號碼' }, { status: 400 })
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '請輸入有效的 Email' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '密碼至少 6 個字元' }, { status: 400 })
    }
    if (orgName.length > 100) {
      return NextResponse.json({ error: '組織名稱不能超過 100 字' }, { status: 400 })
    }

    // ── 驗證碼檢查 ──
    const codeRow = await queryOne<{
      id: string; email: string; phone: string; code_hash: string; expires_at: string; verified: boolean; attempts: number
    }>(
      `SELECT id, email, phone, code_hash, expires_at, verified, attempts
       FROM email_verification_codes WHERE id = $1`,
      [codeId],
    )
    if (!codeRow) {
      return NextResponse.json({ error: '驗證碼無效，請重新取得' }, { status: 400 })
    }
    if (codeRow.verified) {
      return NextResponse.json({ error: '驗證碼已使用，請重新取得' }, { status: 400 })
    }
    if (new Date(codeRow.expires_at) < new Date()) {
      return NextResponse.json({ error: '驗證碼已過期，請重新取得' }, { status: 400 })
    }
    if (codeRow.attempts >= 5) {
      await query(`UPDATE email_verification_codes SET verified = true WHERE id = $1`, [codeId])
      return NextResponse.json({ error: '驗證碼嘗試次數過多，請重新取得' }, { status: 400 })
    }
    if (channel === 'email' && codeRow.email !== email) {
      return NextResponse.json({ error: 'Email 與驗證碼不符' }, { status: 400 })
    }
    if (channel === 'phone' && codeRow.phone !== phoneE164) {
      return NextResponse.json({ error: '手機號碼與驗證碼不符' }, { status: 400 })
    }

    // 比對 hash
    const inputHash = createHash('sha256').update(code).digest('hex')
    if (inputHash !== codeRow.code_hash) {
      await query(
        `UPDATE email_verification_codes SET attempts = attempts + 1 WHERE id = $1`,
        [codeId],
      )
      return NextResponse.json({ error: '驗證碼錯誤，請重新輸入' }, { status: 400 })
    }

    // 標記驗證碼已使用
    await query(`UPDATE email_verification_codes SET verified = true WHERE id = $1`, [codeId])

    // ── 重複檢查 ──
    if (email) {
      const existing = await queryOne(`SELECT id FROM admin_users WHERE email = $1`, [email])
      if (existing) return NextResponse.json({ error: '此 Email 已註冊，請直接登入' }, { status: 409 })
    }
    if (phoneE164) {
      const existing = await queryOne(`SELECT id FROM admin_users WHERE phone = $1`, [phoneE164])
      if (existing) return NextResponse.json({ error: '此手機號碼已註冊，請直接登入' }, { status: 409 })
    }

    // ── 建立 tenant ──
    let slug = customSlug || toSlug(orgName)
    // 驗證 slug 格式
    if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug)) {
      return NextResponse.json({ error: '後台網址只允許小寫英文、數字、連字號，3～30 字元' }, { status: 400 })
    }
    const slugExists = await queryOne(`SELECT id FROM tenants WHERE slug = $1`, [slug])
    if (slugExists) {
      return NextResponse.json({ error: `後台網址 "${slug}" 已被使用，請換一個` }, { status: 409 })
    }

    const tenant = await queryOne<{ id: string; slug: string }>(
      `INSERT INTO tenants (name, slug, plan, is_active)
       VALUES ($1, $2, 'free', true)
       RETURNING id, slug`,
      [orgName, slug],
    )
    if (!tenant) {
      return NextResponse.json({ error: '建立組織失敗' }, { status: 500 })
    }

    // ── 建立 admin 帳號 ──
    const pwHash = await hashPassword(password)
    const username = email || phoneE164
    const newUser = await queryOne<{ id: string }>(
      `INSERT INTO admin_users (username, password_hash, display_name, email, phone, role, tenant_id)
       VALUES ($1, $2, $3, $4, $5, 'admin', $6)
       RETURNING id`,
      [username, pwHash, displayName, email || null, phoneE164 || null, tenant.slug],
    )

    // ── 建立預設 site_settings ──
    await query(
      `INSERT INTO site_settings (tenant_id, site_title, site_description)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenant.slug, orgName, `${orgName} 問卷系統`],
    )

    // ── LINE Notify 通知管理員 ──
    notifyNewRegistration({
      method: phoneE164 ? 'phone' : 'email',
      email: email || undefined,
      phone: phoneE164 || undefined,
      displayName,
      orgName,
      slug: tenant.slug,
    })

    // ── 自動登入 → 簽發 JWT ──
    const jwt = await signToken({
      sub: newUser?.id ?? '',
      tid: tenant.slug,
      role: 'admin',
      name: displayName,
    })

    const response = NextResponse.json({ success: true, slug: tenant.slug })
    response.cookies.set('admin_session', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })
    return response
  } catch (err) {
    console.error('[Register API Error]', err)
    return NextResponse.json({ error: '系統錯誤，請稍後再試' }, { status: 500 })
  }
}
