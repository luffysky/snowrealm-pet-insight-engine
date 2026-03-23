import { NextRequest, NextResponse } from 'next/server'
import {
  listLineConfigs,
  saveLineConfig,
  deleteLineConfig,
  testLineConnection,
  LINE_CONFIG_KEYS,
  type LineConfigKey,
} from '@/lib/lineConfig'
import { getTenantContext, requireRole } from '@/lib/tenant'

// ===== GET: 列出所有 LINE 設定（敏感值遮罩，前端安全） =====
export async function GET(): Promise<NextResponse> {
  const { tenantId } = await getTenantContext()
  const configs = await listLineConfigs(tenantId)
  return NextResponse.json({ configs })
}

// ===== POST: 新增或更新 LINE 設定 =====
export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck

  const body = await request.json()
  const { key, value } = body as { key?: string; value?: string }

  if (!key || !value) {
    return NextResponse.json({ error: '缺少 key 或 value' }, { status: 400 })
  }

  if (!(key in LINE_CONFIG_KEYS)) {
    return NextResponse.json({ error: '無效的 config key' }, { status: 400 })
  }
  await saveLineConfig(key as LineConfigKey, value, tenantId)
  return NextResponse.json({ success: true })
}

// ===== DELETE: 刪除指定 LINE 設定（回退到 env） =====
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key || !(key in LINE_CONFIG_KEYS)) {
    return NextResponse.json({ error: '無效的 config key' }, { status: 400 })
  }

  const deleted = await deleteLineConfig(key as LineConfigKey, (await getTenantContext()).tenantId)
  if (!deleted) {
    return NextResponse.json({ error: '無 DB 設定（已使用 ENV 備援）' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

// ===== PATCH: 測試 LINE API 連線 =====
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck

  const body = await request.json()
  const { channel } = body as { channel?: 'insight' | 'official' }

  if (!channel || !['insight', 'official'].includes(channel)) {
    return NextResponse.json({ error: '無效的 channel（insight / official）' }, { status: 400 })
  }

  const result = await testLineConnection(channel, tenantId)
  return NextResponse.json(result)
}
