import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
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
}

export async function GET(): Promise<NextResponse> {
  const ctx = await getTenantContext()
  const user = await queryOne<UserRow>(
    `SELECT id, username, display_name, email, phone, role, created_at FROM admin_users WHERE id = $1`,
    [ctx.userId],
  )
  if (!user) return NextResponse.json({ error: '找不到帳號' }, { status: 404 })

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
  })
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const ctx = await getTenantContext()
  const body = await request.json().catch(() => null)
  const action = body?.action as string

  if (action === 'update-profile') {
    const displayName = (body?.displayName as string)?.trim()
    if (!displayName) return NextResponse.json({ error: '顯示名稱不能為空' }, { status: 400 })
    if (displayName.length > 50) return NextResponse.json({ error: '顯示名稱不能超過 50 字' }, { status: 400 })

    await queryOne(
      `UPDATE admin_users SET display_name = $1 WHERE id = $2 RETURNING id`,
      [displayName, ctx.userId],
    )
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
    await queryOne(
      `UPDATE admin_users SET password_hash = $1 WHERE id = $2 RETURNING id`,
      [newHash, ctx.userId],
    )
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: '未知操作' }, { status: 400 })
}
