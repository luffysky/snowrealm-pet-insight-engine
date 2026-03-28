import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { requireRole } from '@/lib/tenant'

interface ItemRow extends Record<string, unknown> {
  id: string
  type: string
  name: string
  description: string | null
  preview_url: string | null
  price_zcoin: number
  creator_name: string | null
  creator_revenue_pct: number
  ref_id: string | null
  is_featured: boolean
  is_official: boolean
  purchase_count: number
  rating_avg: string
  created_at: string
  tags: string | null
}

/** GET /api/marketplace  — 公開列表（不需登入可瀏覽，登入後標記已購買） */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const type = req.nextUrl.searchParams.get('type') ?? ''
  const featured = req.nextUrl.searchParams.get('featured') === '1'
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'))
  const pageSize = 30

  // Optional: get current user to mark owned items
  const authCheck = await requireRole('viewer').catch(() => null)
  const userId = authCheck && !(authCheck instanceof NextResponse) ? authCheck.userId : null

  const conditions: string[] = ['mi.is_active = true']
  const params: unknown[] = []
  if (type) { conditions.push(`mi.type = $${params.length + 1}`); params.push(type) }
  if (featured) { conditions.push('mi.is_featured = true') }

  params.push(pageSize, (page - 1) * pageSize)
  const limitIdx = params.length - 1
  const offsetIdx = params.length

  const rows = await query<ItemRow>(
    `SELECT mi.id, mi.type, mi.name, mi.description, mi.preview_url,
            mi.price_zcoin, mi.creator_name, mi.creator_revenue_pct,
            mi.ref_id, mi.is_featured, mi.is_official,
            mi.purchase_count, mi.rating_avg::text, mi.created_at,
            array_to_json(mi.tags)::text AS tags
     FROM marketplace_items mi
     WHERE ${conditions.join(' AND ')}
     ORDER BY mi.is_featured DESC, mi.purchase_count DESC, mi.sort_order ASC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  )

  // Get owned item ids for current user
  let ownedIds = new Set<string>()
  if (userId) {
    const owned = await query<{ item_id: string }>(
      `SELECT item_id::text FROM marketplace_purchases WHERE user_id = $1`,
      [userId]
    )
    ownedIds = new Set(owned.map(r => r.item_id))
  }

  const items = rows.map(r => ({
    ...r,
    tags: r.tags ? JSON.parse(r.tags) as string[] : [],
    ratingAvg: parseFloat(r.rating_avg),
    isOwned: r.price_zcoin === 0 || ownedIds.has(r.id),
  }))

  return NextResponse.json({ items })
}

/** POST /api/marketplace  — 購買商品 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck

  const { itemId } = await req.json() as { itemId?: string }
  if (!itemId) return NextResponse.json({ error: '缺少 itemId' }, { status: 400 })

  const userId = roleCheck.userId

  // Check already owned
  const existing = await queryOne(
    `SELECT id FROM marketplace_purchases WHERE user_id=$1 AND item_id=$2`,
    [userId, itemId]
  )
  if (existing) return NextResponse.json({ ok: true, alreadyOwned: true })

  // Get item
  const item = await queryOne<{ price_zcoin: number; creator_id: string | null; creator_revenue_pct: number; name: string }>(
    `SELECT price_zcoin, creator_id::text, creator_revenue_pct, name FROM marketplace_items WHERE id=$1 AND is_active=true`,
    [itemId]
  )
  if (!item) return NextResponse.json({ error: '商品不存在' }, { status: 404 })

  if (item.price_zcoin > 0) {
    // Deduct Z-coins
    const wallet = await queryOne<{ balance: number; id: string }>(
      `SELECT id, balance FROM zcoin_wallets WHERE user_id=$1`,
      [userId]
    )
    if (!wallet || wallet.balance < item.price_zcoin) {
      return NextResponse.json({ error: 'Z幣不足' }, { status: 402 })
    }

    await execute(
      `UPDATE zcoin_wallets SET balance=balance-$1, total_spent=total_spent+$1 WHERE id=$2`,
      [item.price_zcoin, wallet.id]
    )
    await execute(
      `INSERT INTO zcoin_transactions (wallet_id, amount, type, reason)
       VALUES ($1, $2, 'spend', $3)`,
      [wallet.id, -item.price_zcoin, `市集購買: ${item.name}`]
    )

    // Creator earnings
    if (item.creator_id) {
      const creatorEarning = Math.floor(item.price_zcoin * item.creator_revenue_pct / 100)
      if (creatorEarning > 0) {
        const creatorWallet = await queryOne<{ id: string }>(
          `SELECT id FROM zcoin_wallets WHERE user_id=$1`,
          [item.creator_id]
        )
        if (creatorWallet) {
          await execute(
            `UPDATE zcoin_wallets SET balance=balance+$1, total_earned=total_earned+$1 WHERE id=$2`,
            [creatorEarning, creatorWallet.id]
          )
        }
      }
    }
  }

  // Record purchase
  const purchase = await queryOne<{ id: string }>(
    `INSERT INTO marketplace_purchases (user_id, item_id, price_paid)
     VALUES ($1, $2, $3) RETURNING id`,
    [userId, itemId, item.price_zcoin]
  )

  // Creator earnings record
  if (item.creator_id && item.price_zcoin > 0 && purchase) {
    const creatorEarning = Math.floor(item.price_zcoin * item.creator_revenue_pct / 100)
    await execute(
      `INSERT INTO creator_earnings (creator_id, item_id, purchase_id, amount)
       VALUES ($1, $2, $3, $4)`,
      [item.creator_id, itemId, purchase.id, creatorEarning]
    )
  }

  // Update purchase count
  await execute(
    `UPDATE marketplace_items SET purchase_count=purchase_count+1 WHERE id=$1`,
    [itemId]
  )

  return NextResponse.json({ ok: true })
}
