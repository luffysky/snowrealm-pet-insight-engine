import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'

interface PublicReportRow extends Record<string, unknown> {
  id: string
  report: unknown
  meta: unknown
  report_type: string
  share_title: string | null
  share_views: number
  created_at: string
  survey_title: string | null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params

  try {
    const row = await queryOne<PublicReportRow>(
      `SELECT r.id, r.report, r.meta, r.report_type, r.share_title,
              r.share_views, r.created_at,
              s.title AS survey_title
       FROM ai_insight_reports r
       LEFT JOIN surveys s ON s.id = r.survey_id
       WHERE r.share_slug = $1 AND r.is_public = true`,
      [slug]
    )

    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    execute(
      `UPDATE ai_insight_reports SET share_views = share_views + 1 WHERE id = $1`,
      [row.id]
    ).catch(() => {})

    return NextResponse.json({
      report: row.report,
      meta: row.meta,
      reportType: row.report_type ?? 'data',
      shareTitle: row.share_title,
      surveyTitle: row.survey_title,
      shareViews: row.share_views + 1,
      createdAt: row.created_at,
    })
  } catch (error) {
    console.error('[public report]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
