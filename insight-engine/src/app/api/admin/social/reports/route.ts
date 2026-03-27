import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { execute, query, queryOne } from '@/lib/db'
import { notifyReport } from '@/lib/lineNotify'

interface ReportRow extends Record<string, unknown> {
  id: string
  reporter_id: string
  reporter_name: string
  target_type: string
  target_id: string
  target_content: string | null
  target_author_id: string | null
  target_author_name: string | null
  reason: string
  description: string | null
  status: string
  reviewed_by: string | null
  created_at: string
}

const REASON_LABELS: Record<string, string> = {
  spam: '垃圾訊息', fraud: '詐騙', harassment: '騷擾',
  inappropriate: '不當內容', violence: '暴力', privacy: '隱私洩漏',
  copyright: '著作權侵犯', other: '其他',
}

/** GET /api/admin/social/reports — admin 查看所有舉報 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '30'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const rows = await query<ReportRow>(
    `SELECT * FROM social_reports WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [status, limit, offset]
  )

  return NextResponse.json({
    reports: rows.map(r => ({
      ...r,
      reasonLabel: REASON_LABELS[r.reason] ?? r.reason,
    })),
  })
}

/** PATCH /api/admin/social/reports — resolve/dismiss a report */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck

  const { id, action } = await req.json() as { id: string; action: 'resolve' | 'dismiss' }
  if (!id || !['resolve', 'dismiss'].includes(action)) {
    return NextResponse.json({ error: '無效的操作' }, { status: 400 })
  }

  const status = action === 'resolve' ? 'resolved' : 'dismissed'
  await execute(
    `UPDATE social_reports SET status = $1, reviewed_by = $2, updated_at = NOW() WHERE id = $3`,
    [status, roleCheck.userId, id]
  )

  return NextResponse.json({ ok: true, status })
}

/** POST /api/admin/social/reports — 提交檢舉 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { userId, userName } = roleCheck

  const body = await req.json() as {
    targetType?: string
    targetId?: string
    targetContent?: string
    targetAuthorId?: string
    targetAuthorName?: string
    reason?: string
    description?: string
  }

  const { targetType, targetId, targetContent, targetAuthorId, targetAuthorName, reason, description } = body

  if (!targetType || !targetId || !reason) {
    return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
  }

  const validTypes = ['post', 'comment', 'user', 'message']
  const validReasons = ['spam', 'fraud', 'harassment', 'inappropriate', 'violence', 'privacy', 'copyright', 'other']

  if (!validTypes.includes(targetType) || !validReasons.includes(reason)) {
    return NextResponse.json({ error: '無效的舉報類型或原因' }, { status: 400 })
  }

  // 防重複：同一用戶對同一目標 24 小時內只能舉報一次
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM social_reports
     WHERE reporter_id = $1 AND target_id = $2 AND created_at > NOW() - INTERVAL '24 hours'`,
    [userId, targetId]
  )
  if (existing) {
    return NextResponse.json({ error: '你已在 24 小時內舉報過此內容' }, { status: 429 })
  }

  await execute(
    `INSERT INTO social_reports
     (reporter_id, reporter_name, target_type, target_id, target_content, target_author_id, target_author_name, reason, description, tenant_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'default')`,
    [userId, userName ?? '匿名用戶', targetType, targetId, targetContent?.slice(0, 500) ?? null,
     targetAuthorId ?? null, targetAuthorName ?? null, reason, description?.trim() ?? null]
  )

  // 推送 LINE 通知給總管理員
  await notifyReport({
    reporterName: userName ?? '匿名用戶',
    targetType,
    targetId,
    targetContent: targetContent?.slice(0, 100),
    targetAuthorName,
    reason,
    description,
  }).catch(err => console.error('[report] LINE notify error:', err))

  return NextResponse.json({ ok: true })
}
