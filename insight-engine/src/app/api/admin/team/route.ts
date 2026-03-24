import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { generateInviteToken } from '@/lib/auth'
import { requireRole } from '@/lib/tenant'
import { checkAdminLimit } from '@/lib/planLimits'

// GET - 列出該 tenant 的所有管理員 + 待使用邀請
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')
  const userRole = request.headers.get('x-user-role')
  if (!tenantId) return NextResponse.json({ error: '未授權' }, { status: 401 })
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const members = await query<{
    id: string; display_name: string; email: string; role: string; created_at: string
  }>(
    `SELECT id, display_name, email, role, created_at
     FROM admin_users WHERE tenant_id = $1 ORDER BY created_at`,
    [tenantId],
  )

  const invites = await query<{
    id: string; email: string; role: string; used: boolean; expires_at: string; created_at: string
  }>(
    `SELECT id, email, role, used, expires_at, created_at
     FROM admin_invites WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId],
  )
  // 將 LINE 專用邀請的虛擬 Email 顯示為特殊標籤
  const mappedInvites = invites.map(inv => ({
    ...inv,
    // 加上空值保護，避免 inv.email 為 null 時報錯（強制觸發重新編譯）
    email: !inv.email ? '(通用邀請連結)' : inv.email.includes('@invite.local') ? '(LINE 邀請連結)' : inv.email
  }))

  return NextResponse.json({ members, invites: mappedInvites })
}

// POST - 建立邀請
export async function POST(request: NextRequest) {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck

  const body = await request.json().catch(() => null)
  const email = (body?.email as string)?.trim().toLowerCase()
  const role = (body?.role as string) || 'admin'
  const isLineInvite = body?.isLineInvite === true

  const adminLimit = await checkAdminLimit(tenantId, roleCheck.userId)
  if (!adminLimit.allowed) {
    return NextResponse.json({ error: '已達方案成員數量上限，請升級方案' }, { status: 403 })
  }

  if (!isLineInvite) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '請輸入有效的 Email' }, { status: 400 })
    }
    // 檢查是否已是成員
    const existing = await queryOne(
      `SELECT id FROM admin_users WHERE email = $1 AND tenant_id = $2`,
      [email, tenantId],
    )
    if (existing) {
      return NextResponse.json({ error: '此 Email 已是團隊成員' }, { status: 409 })
    }
  }

  // 檢查是否有未過期的邀請
  if (!isLineInvite) {
    const pendingInvite = await queryOne(
      `SELECT id FROM admin_invites WHERE email = $1 AND tenant_id = $2 AND used = false AND expires_at > NOW()`,
      [email, tenantId],
    )
    if (pendingInvite) {
      return NextResponse.json({ error: '此 Email 已有待使用的邀請' }, { status: 409 })
    }
  }

  const token = generateInviteToken()
  const insertEmail = isLineInvite ? `line_invite_${token.slice(0, 8)}@invite.local` : email

  await query(
    `INSERT INTO admin_invites (token, email, tenant_id, role, line_user_id, display_name, expires_at)
     VALUES ($1, $2, $3, $4, '', '', NOW() + INTERVAL '7 days')`,
    [token, insertEmail, tenantId, role],
  )

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
  const inviteUrl = `${baseUrl}/register?invite=${token}`

  return NextResponse.json({ success: true, inviteUrl })
}

// DELETE - 撤銷邀請
export async function DELETE(request: NextRequest) {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck

  const { searchParams } = new URL(request.url)
  const inviteId = searchParams.get('id')
  if (!inviteId) return NextResponse.json({ error: '缺少邀請 ID' }, { status: 400 })

  await query(
    `DELETE FROM admin_invites WHERE id = $1 AND tenant_id = $2`,
    [inviteId, tenantId],
  )

  return NextResponse.json({ success: true })
}
