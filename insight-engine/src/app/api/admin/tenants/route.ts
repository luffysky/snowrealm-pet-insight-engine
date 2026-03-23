import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { getTenantContext, requireRole } from '@/lib/tenant'

interface TenantRow extends Record<string, unknown> {
  id: string
  name: string
  slug: string
  plan: string
  config: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

/** GET — 列出所有租戶（僅 super_admin） */
export async function GET(): Promise<NextResponse> {
  const ctx = await getTenantContext()
  if (ctx.role !== 'super_admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const tenants = await query<TenantRow>(
    `SELECT id, name, slug, plan, is_active, created_at, updated_at
     FROM tenants ORDER BY created_at ASC`,
  )
  return NextResponse.json({ tenants })
}

/** POST — 建立新租戶 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck

  const body = await request.json().catch(() => null)
  const name = (body?.name as string)?.trim()
  const slug = (body?.slug as string)?.trim()?.toLowerCase()
  const plan = (body?.plan as string) ?? 'free'

  if (!name || !slug) {
    return NextResponse.json({ error: '請填寫名稱和代號' }, { status: 400 })
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: '代號只允許小寫英文、數字、連字號' }, { status: 400 })
  }

  const existing = await queryOne<{ slug: string }>(
    `SELECT slug FROM tenants WHERE slug = $1`,
    [slug],
  )
  if (existing) {
    return NextResponse.json({ error: '此代號已被使用' }, { status: 409 })
  }

  const tenant = await queryOne<TenantRow>(
    `INSERT INTO tenants (name, slug, plan) VALUES ($1, $2, $3) RETURNING *`,
    [name, slug, plan],
  )

  return NextResponse.json({ tenant }, { status: 201 })
}

/** PATCH — 更新租戶 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck

  const body = await request.json().catch(() => null)
  const slug = body?.slug as string
  if (!slug) {
    return NextResponse.json({ error: '缺少 slug' }, { status: 400 })
  }

  const sets: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (body.name) { sets.push(`name = $${idx++}`); params.push(body.name) }
  if (body.plan) { sets.push(`plan = $${idx++}`); params.push(body.plan) }
  if (typeof body.is_active === 'boolean') { sets.push(`is_active = $${idx++}`); params.push(body.is_active) }
  if (body.config) { sets.push(`config = $${idx++}`); params.push(JSON.stringify(body.config)) }

  if (sets.length === 0) {
    return NextResponse.json({ error: '沒有要更新的欄位' }, { status: 400 })
  }

  sets.push(`updated_at = NOW()`)
  params.push(slug)

  const affected = await execute(
    `UPDATE tenants SET ${sets.join(', ')} WHERE slug = $${idx}`,
    params,
  )

  return NextResponse.json({ ok: true, affected })
}

/** DELETE — 停用租戶（不真正刪除） */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: '缺少 slug' }, { status: 400 })
  }

  await execute(
    `UPDATE tenants SET is_active = false, updated_at = NOW() WHERE slug = $1`,
    [slug],
  )

  return NextResponse.json({ ok: true })
}
