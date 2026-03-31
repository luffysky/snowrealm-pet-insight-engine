import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { requireRole } from '@/lib/tenant'
import { isUserPlatformUnlimited } from '@/lib/platformUnlimited'
import { hashPassword, verifyPassword } from '@/lib/auth'

interface UserRow extends Record<string, unknown> {
  id: string
  username: string
  display_name: string | null
  email: string | null
  phone: string | null
  role: string
  created_at: string
  password_hash: string | null
  line_id: string | null
  tenant_id: string | null
}

interface TenantRow extends Record<string, unknown> {
  slug: string
  name: string
}

function detectLoginProvider(user: UserRow): 'password' | 'line' | 'google' {
  if (user.password_hash) return 'password'
  if (user.line_id) return 'line'
  return 'google'
}

export async function GET(): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const ctx = roleCheck

  const user = await queryOne<UserRow>(
    `SELECT id, username, display_name, email, phone, role, created_at,
            password_hash, line_id, tenant_id
     FROM admin_users WHERE id = $1`,
    [ctx.userId],
  )
  if (!user) return NextResponse.json({ error: '找不到帳號' }, { status: 404 })

  const tenant = await queryOne<TenantRow>(
    `SELECT slug, name FROM tenants WHERE slug = $1`,
    [ctx.tenantId],
  )

  const platformPartner = await isUserPlatformUnlimited(ctx.userId)

  return NextResponse.json({
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.created_at,
    platformPartner,
    loginProvider: detectLoginProvider(user),
    tenant: tenant
      ? { slug: tenant.slug, name: tenant.name }
      : { slug: ctx.tenantId, name: ctx.tenantId },
  })
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const ctx = roleCheck
  const body = await request.json().catch(() => null)
  const action = body?.action as string

  if (action === 'update-profile') {
    const displayName = (body?.displayName as string | undefined)?.trim()
    const email = (body?.email as string | undefined)?.trim() || null
    const phone = (body?.phone as string | undefined)?.trim() || null

    if (displayName !== undefined && displayName.length > 50) {
      return NextResponse.json({ error: '顯示名稱不能超過 50 字' }, { status: 400 })
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email 格式不正確' }, { status: 400 })
    }

    // Check email uniqueness if changed
    if (email) {
      const existing = await queryOne<{ id: string } & Record<string, unknown>>(
        `SELECT id FROM admin_users WHERE email = $1 AND id != $2`,
        [email, ctx.userId],
      )
      if (existing) return NextResponse.json({ error: '此 Email 已被其他帳號使用' }, { status: 409 })
    }

    await execute(
      `UPDATE admin_users
       SET display_name = COALESCE($1, display_name),
           email = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE email END,
           phone = CASE WHEN $3::text IS NOT NULL THEN $3 ELSE phone END
       WHERE id = $4`,
      [displayName ?? null, email, phone, ctx.userId],
    )
    return NextResponse.json({ success: true })
  }

  if (action === 'update-tenant-name') {
    // Only admin+ can rename their org
    if (!['admin', 'super_admin'].includes(ctx.role)) {
      return NextResponse.json({ error: '權限不足' }, { status: 403 })
    }
    const name = (body?.name as string)?.trim()
    if (!name) return NextResponse.json({ error: '組織名稱不能為空' }, { status: 400 })
    if (name.length > 50) return NextResponse.json({ error: '組織名稱不能超過 50 字' }, { status: 400 })

    const updated = await queryOne<{ slug: string } & Record<string, unknown>>(
      `UPDATE tenants SET name = $1, updated_at = NOW() WHERE slug = $2 RETURNING slug`,
      [name, ctx.tenantId],
    )
    if (!updated) return NextResponse.json({ error: '找不到組織' }, { status: 404 })
    return NextResponse.json({ success: true })
  }

  if (action === 'change-password') {
    const currentPassword = body?.currentPassword as string
    const newPassword = body?.newPassword as string

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '請填寫完整' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密碼至少 6 個字元' }, { status: 400 })
    }

    const user = await queryOne<{ password_hash: string } & Record<string, unknown>>(
      `SELECT password_hash FROM admin_users WHERE id = $1`, [ctx.userId],
    )
    if (!user?.password_hash) {
      return NextResponse.json({ error: '此帳號使用第三方登入，無法修改密碼' }, { status: 400 })
    }

    const valid = await verifyPassword(currentPassword, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: '目前密碼不正確' }, { status: 400 })
    }

    const newHash = await hashPassword(newPassword)
    await execute(
      `UPDATE admin_users SET password_hash = $1 WHERE id = $2`,
      [newHash, ctx.userId],
    )
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: '未知操作' }, { status: 400 })
}
