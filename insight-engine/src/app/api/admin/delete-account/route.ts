import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_session')?.value
    if (!token) return NextResponse.json({ error: '未授權' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: '未授權' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const password = body?.password as string
    const confirmText = body?.confirmText as string

    if (!password || confirmText !== '刪除我的帳號') {
      return NextResponse.json({ error: '請輸入密碼並確認刪除' }, { status: 400 })
    }

    const user = await queryOne<{ id: string; password_hash: string; tenant_id: string }>(
      `SELECT id, password_hash, tenant_id FROM admin_users WHERE id = $1`,
      [payload.sub]
    )
    if (!user || !user.password_hash) {
      return NextResponse.json({ error: '找不到帳號或此帳號使用第三方登入' }, { status: 400 })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: '密碼不正確' }, { status: 400 })
    }

    const adminCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM admin_users WHERE tenant_id = $1 AND deleted_at IS NULL`,
      [user.tenant_id]
    )
    if (Number(adminCount?.count ?? 0) <= 1) {
      return NextResponse.json(
        { error: '你是此組織唯一的管理員，無法刪除帳號。請先邀請其他管理員。' },
        { status: 400 }
      )
    }

    // 軟刪除：標記 deleted_at，30 天後由 cron 真正清除
    await query(
      `UPDATE admin_users SET deleted_at = NOW(), display_name = display_name || ' [已刪除]' WHERE id = $1`,
      [user.id]
    )
    await query(`DELETE FROM tenant_users WHERE user_id = $1`, [user.id])

    const response = NextResponse.json({
      success: true,
      message: '帳號已標記刪除，30 天內可聯繫管理員恢復。',
    })
    response.cookies.set('admin_session', '', { maxAge: 0, path: '/' })
    return response
  } catch (err) {
    console.error('[Delete Account Error]', err)
    return NextResponse.json({ error: '系統錯誤' }, { status: 500 })
  }
}
