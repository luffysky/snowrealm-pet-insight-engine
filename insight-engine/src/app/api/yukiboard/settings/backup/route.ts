import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'
import { requireYukiBoardAuth } from '@/lib/yukiboard-auth'

/** POST /api/yukiboard/settings/backup — 備份鍵盤設定 */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireYukiBoardAuth(req)
    if (!userId) {
      return NextResponse.json({ error: '需要登入' }, { status: 401 })
    }

    const { theme_id, keyboard_height_ratio, keyboard_opacity } = await req.json()

    await execute(
      `INSERT INTO yukiboard_user_settings (user_id, theme_id, keyboard_height_ratio, keyboard_opacity, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         theme_id = EXCLUDED.theme_id,
         keyboard_height_ratio = EXCLUDED.keyboard_height_ratio,
         keyboard_opacity = EXCLUDED.keyboard_opacity,
         updated_at = NOW()`,
      [userId, theme_id ?? '', keyboard_height_ratio ?? 0.35, keyboard_opacity ?? 1.0],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Settings Backup]', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
