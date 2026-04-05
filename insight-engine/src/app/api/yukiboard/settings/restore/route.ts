import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { requireYukiBoardAuth } from '@/lib/yukiboard-auth'

/** GET /api/yukiboard/settings/restore — 恢復鍵盤設定 */
export async function GET(req: NextRequest) {
  try {
    const userId = await requireYukiBoardAuth(req)
    if (!userId) {
      return NextResponse.json({ error: '需要登入' }, { status: 401 })
    }

    const settings = await queryOne<{
      theme_id: string
      keyboard_height_ratio: number
      keyboard_opacity: number
    }>(
      `SELECT theme_id, keyboard_height_ratio, keyboard_opacity
       FROM yukiboard_user_settings
       WHERE user_id = $1`,
      [userId],
    )

    if (!settings) {
      return NextResponse.json({ restored: false })
    }

    return NextResponse.json({
      restored: true,
      theme_id: settings.theme_id,
      keyboard_height_ratio: settings.keyboard_height_ratio,
      keyboard_opacity: settings.keyboard_opacity,
    })
  } catch (error) {
    console.error('[Settings Restore]', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
