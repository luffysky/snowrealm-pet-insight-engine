import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { requireRole } from '@/lib/tenant'
import { generateRawApiKey, hashApiKey } from '@/lib/ruleEngine'

interface ApiKeyRow extends Record<string, unknown> {
  id: string
  key_prefix: string
  name: string | null
  scopes: string[]
  is_active: boolean
  created_at: string
  last_used_at: string | null
}

/**
 * GET /api/admin/api-keys
 * 列出該租戶下所有 API Key（回傳 prefix/name/scopes，不回傳 hash）
 */
export async function GET(): Promise<NextResponse> {
  const ctx = await requireRole('admin')
  if (ctx instanceof NextResponse) return ctx

  const keys = await query<ApiKeyRow>(
    `SELECT id, key_prefix, name, scopes, is_active, created_at, last_used_at
     FROM api_keys
     WHERE tenant_id = $1 AND is_active = true
     ORDER BY created_at DESC`,
    [ctx.tenantId]
  )

  return NextResponse.json({ keys })
}

/**
 * POST /api/admin/api-keys
 * 建立新 API Key，rawKey 只顯示這一次
 * Body: { name?: string, scopes: string[] }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const ctx = await requireRole('admin')
  if (ctx instanceof NextResponse) return ctx

  const body = await request.json().catch(() => null)
  const name = (body?.name as string | undefined)?.trim() || null
  const scopes: string[] = Array.isArray(body?.scopes) ? (body.scopes as string[]) : []

  const validScopes = new Set(['rules:read', 'validate', 'submit'])
  const invalidScopes = scopes.filter(s => !validScopes.has(s))
  if (invalidScopes.length > 0) {
    return NextResponse.json(
      { error: `無效的 scope：${invalidScopes.join('、')}。有效值：${Array.from(validScopes).join('、')}` },
      { status: 400 }
    )
  }

  if (scopes.length === 0) {
    return NextResponse.json({ error: 'scopes 不可為空' }, { status: 400 })
  }

  const rawKey = generateRawApiKey()
  const keyHash = hashApiKey(rawKey)
  const keyPrefix = rawKey.slice(0, 8) // 'sie_' + 4 chars

  const inserted = await query<{ id: string }>(
    `INSERT INTO api_keys (tenant_id, key_hash, key_prefix, name, scopes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [ctx.tenantId, keyHash, keyPrefix, name, scopes]
  )

  const id = inserted[0]?.id ?? null

  return NextResponse.json({ rawKey, prefix: keyPrefix, id }, { status: 201 })
}

/**
 * DELETE /api/admin/api-keys?id=<uuid>
 * 停用指定的 API Key（軟刪除：is_active = false）
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const ctx = await requireRole('admin')
  if (ctx instanceof NextResponse) return ctx

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: '缺少 id 參數' }, { status: 400 })
  }

  const affected = await execute(
    `UPDATE api_keys SET is_active = false
     WHERE id = $1 AND tenant_id = $2`,
    [id, ctx.tenantId]
  )

  if (affected === 0) {
    return NextResponse.json({ error: '找不到此 API Key' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
