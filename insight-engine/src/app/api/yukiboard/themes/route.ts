import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { requireYukiBoardAuth } from '@/lib/yukiboard-auth'

/** GET /api/yukiboard/themes — 使用者擁有的主題清單 */
export async function GET(req: NextRequest) {
  try {
    const userId = await requireYukiBoardAuth(req)
    if (!userId) {
      return NextResponse.json({ error: '需要登入' }, { status: 401 })
    }

    // 取得用戶購買的主題 ID
    const purchases = await query<{ skin_id: string }>(
      `SELECT skin_id FROM skin_purchases WHERE user_id = $1`,
      [userId],
    )
    const purchasedIds = new Set(purchases.map(p => p.skin_id))

    // 取得所有主題
    const skins = await query<{
      id: string
      name: string
      preview_url: string
      price: number
      is_free: boolean
    }>(
      `SELECT id, name, COALESCE(preview_url, '') AS preview_url, COALESCE(price, 0) AS price, COALESCE(is_free, true) AS is_free
       FROM skins
       WHERE is_active = true
       ORDER BY sort_order, created_at`,
    )

    const themes = skins.map(skin => ({
      id: skin.id,
      name: skin.name,
      preview_url: skin.preview_url,
      is_free: skin.is_free,
      is_purchased: skin.is_free || purchasedIds.has(skin.id),
    }))

    return NextResponse.json({ themes })
  } catch (error) {
    console.error('[Themes]', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
