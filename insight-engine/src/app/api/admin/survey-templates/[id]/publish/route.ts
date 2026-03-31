import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { requireRole } from '@/lib/tenant'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * POST /api/admin/survey-templates/[id]/publish
 * 將租戶自訂模板公開到模板市集（is_public = true，source = 'marketplace'）
 * 或取消公開（body: { publish: false }）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck

  const { tenantId } = roleCheck
  const { id } = await params

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: '無效的模板 ID 格式' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({})) as { publish?: boolean }
  const publish = body.publish !== false  // 預設 true（公開）

  const existing = await queryOne<{ tenant_id: string | null; source: string; name: string }>(
    `SELECT tenant_id, source, name FROM survey_templates WHERE id = $1 AND is_active = true`,
    [id]
  )

  if (!existing) {
    return NextResponse.json({ error: '模板不存在' }, { status: 404 })
  }

  // 平台模板已是公開的，無需操作
  if (existing.source === 'platform') {
    return NextResponse.json({ error: '平台模板無法變更公開狀態' }, { status: 403 })
  }

  // 只有模板擁有者可以公開/取消
  if (existing.tenant_id !== tenantId) {
    return NextResponse.json({ error: '無權限操作此模板' }, { status: 403 })
  }

  try {
    await execute(
      `UPDATE survey_templates
       SET is_public = $1,
           source = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [publish, publish ? 'marketplace' : 'tenant', id]
    )

    return NextResponse.json({
      ok: true,
      isPublic: publish,
      message: publish ? `「${existing.name}」已公開到模板市集` : `「${existing.name}」已取消公開`,
    })
  } catch (err) {
    console.error('[survey-templates/[id]/publish POST]', err)
    return NextResponse.json({ error: '更新公開狀態失敗' }, { status: 500 })
  }
}
