import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdminRequest } from '@/lib/superAdminAuth'
import { execute, query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const payload = await verifySuperAdminRequest(request)
  if (!payload) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  try {
    const users = await query<{
      id: string
      username: string
      display_name: string
      yukiboard_privilege: boolean
      yukiboard_privilege_note: string | null
    }>(
      `SELECT id, username,
              COALESCE(display_name, username) AS display_name,
              COALESCE(yukiboard_privilege, false) AS yukiboard_privilege,
              yukiboard_privilege_note
       FROM admin_users
       ORDER BY yukiboard_privilege DESC, username ASC`,
    )

    return NextResponse.json({ users })
  } catch (error) {
    console.error('[Super Admin YukiBoard] GET error:', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const payload = await verifySuperAdminRequest(request)
  if (!payload) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { userId, hasPrivilege, note } = body as {
      userId: string
      hasPrivilege: boolean
      note?: string
    }

    if (!userId || typeof hasPrivilege !== 'boolean') {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 })
    }

    const affected = await execute(
      `UPDATE admin_users
       SET yukiboard_privilege = $1, yukiboard_privilege_note = $2
       WHERE id = $3`,
      [hasPrivilege, note ?? null, userId],
    )

    if (affected === 0) {
      return NextResponse.json({ error: '使用者不存在' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Super Admin YukiBoard] PATCH error:', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
