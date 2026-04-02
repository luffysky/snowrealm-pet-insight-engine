import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { queryOne } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授權' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token 無效或已過期' }, { status: 401 })
    }

    const user = await queryOne<{
      id: string
      username: string
      yukiboard_privilege: boolean
    }>(
      `SELECT id, username, COALESCE(yukiboard_privilege, false) AS yukiboard_privilege
       FROM admin_users WHERE id = $1`,
      [payload.sub],
    )

    if (!user) {
      return NextResponse.json({ error: '使用者不存在' }, { status: 401 })
    }

    return NextResponse.json({
      hasPrivilege: user.yukiboard_privilege,
      userId: user.id,
      username: user.username,
    })
  } catch (error) {
    console.error('[YukiBoard Privilege] Error:', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
