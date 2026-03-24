import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'

interface ReportRow extends Record<string, unknown> {
  id: string
  report: unknown
  meta: unknown
  share_title: string | null
  report_type: string
  created_at: string
  share_views: number
}

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params

  const row = await queryOne<ReportRow>(
    `SELECT id, report, meta, share_title, COALESCE(report_type, 'data') as report_type,
            created_at, COALESCE(share_views, 0) as share_views
     FROM ai_insight_reports
     WHERE share_slug = $1 AND is_public = true`,
    [slug]
  )

  if (!row) return NextResponse.json({ error: '報告不存在或未公開' }, { status: 404 })

  // 更新瀏覽次數（非阻塞）
  execute(
    `UPDATE ai_insight_reports SET share_views = share_views + 1 WHERE id = $1`,
    [row.id]
  ).catch(() => {})

  return NextResponse.json({
    report: row.report,
    meta: row.meta,
    shareTitle: row.share_title,
    reportType: row.report_type,
    createdAt: row.created_at,
    shareViews: row.share_views,
  })
}
