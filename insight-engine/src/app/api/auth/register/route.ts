import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { signToken } from '@/lib/jwt'

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

    const username = (body?.username as string)?.trim()
    const password = (body?.password as string)
    const displayName = (body?.displayName as string)?.trim()
    const orgName = (body?.orgName as string)?.trim()

    // ── 基本驗證 ──
    if (!username || !password || !displayName || !orgName) {
      return NextResponse.json({ error: '請填寫完整資料' }, { status: 400 })
    }
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json({ error: '帳號長度需 3～30 字元' }, { status: 400 })
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: '帳號只允許英文、數字、底線' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '密碼至少 6 個字元' }, { status: 400 })
    }
    if (orgName.length > 100) {
      return NextResponse.json({ error: '組織名稱不能超過 100 字' }, { status: 400 })
    }

    // ── 帳號重複檢查 ──
    const existing = await queryOne(
      `SELECT id FROM admin_users WHERE username = $1`,
      [username],
    )
    if (existing) {
      return NextResponse.json({ error: '帳號已被使用，請換一個' }, { status: 409 })
    }

    // ── 建立 tenant ──
    let slug = toSlug(orgName)
    const slugExists = await queryOne(`SELECT id FROM tenants WHERE slug = $1`, [slug])
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`
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
    const passwordHash = await hashPassword(password)
    const newUser = await queryOne<{ id: string }>(
      `INSERT INTO admin_users (username, password_hash, display_name, role, tenant_id)
       VALUES ($1, $2, $3, 'admin', $4)
       RETURNING id`,
      [username, passwordHash, displayName, tenant.slug],
    )

    // ── 建立預設 site_settings ──
    await query(
      `INSERT INTO site_settings (tenant_id, site_title, site_description)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenant.slug, orgName, `${orgName} 問卷系統`],
    )

    // ── 自動登入 → 簽發 JWT ──
    const jwt = await signToken({
      sub: newUser?.id ?? '',
      tid: tenant.slug,
      role: 'admin',
      name: displayName,
    })

    const response = NextResponse.json({ success: true })
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
