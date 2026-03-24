import { NextRequest, NextResponse } from 'next/server'
import { getActiveAiKey, getPlatformKey, logAiUsage } from '@/lib/aiService'
import { requireRole, getTenantContext } from '@/lib/tenant'
import { buildInsightSummary, generateInsightReport } from '@/lib/insightEngine'
import { queryOne, query, execute } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

interface InsightRequest {
  surveyId: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as InsightRequest
  const { surveyId } = body

  if (!surveyId) {
    return NextResponse.json({ error: '缺少 surveyId' }, { status: 400 })
  }

  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck

  let aiKey = await getActiveAiKey(tenantId)
  let isFree = false

  if (!aiKey) {
    aiKey = getPlatformKey()
    if (!aiKey) {
      return NextResponse.json(
        { error: '請先在「AI 設定」中新增 API Key 才能產生洞察報告' },
        { status: 402 }
      )
    }
    isFree = true
  }

  try {
    const summary = await buildInsightSummary(surveyId, tenantId)
    const { report, promptTokens, completionTokens } = await generateInsightReport(summary, aiKey)

    await logAiUsage({
      tenantId,
      action: 'generate',
      keySource: aiKey.keySource,
      provider: aiKey.provider,
      model: aiKey.model,
      surveyId,
      promptTokens,
      completionTokens,
      isFree,
    })

    const reportMeta = {
      provider: aiKey.provider,
      model: aiKey.model,
      keySource: aiKey.keySource,
      generatedAt: new Date().toISOString(),
    }

    const saved = await queryOne<{ id: string }>(
      `INSERT INTO ai_insight_reports (tenant_id, survey_id, report, meta, generated_by, report_type)
       VALUES ($1, $2, $3, $4, $5, 'data') RETURNING id`,
      [tenantId, surveyId, JSON.stringify(report), JSON.stringify(reportMeta), roleCheck.userId]
    )

    return NextResponse.json({ report, reportId: saved?.id, meta: reportMeta })
  } catch (error) {
    console.error('[ai-insight] Failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '產生洞察報告失敗' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { tenantId } = await getTenantContext()
  const { searchParams } = new URL(request.url)
  const surveyId = searchParams.get('surveyId')

  if (!surveyId) {
    return NextResponse.json({ error: '缺少 surveyId' }, { status: 400 })
  }

  try {
    interface ReportRow extends Record<string, unknown> {
      id: string
      survey_id: string
      report: unknown
      meta: unknown
      generated_by: string | null
      created_at: string
      report_type: string
      is_public: boolean
      share_slug: string | null
      share_views: number
    }
    const reports = await query<ReportRow>(
      `SELECT id, survey_id, report, meta, generated_by, created_at,
              COALESCE(report_type, 'data') as report_type,
              COALESCE(is_public, false) as is_public,
              share_slug, COALESCE(share_views, 0) as share_views
       FROM ai_insight_reports
       WHERE tenant_id = $1 AND survey_id = $2
       ORDER BY created_at DESC
       LIMIT 20`,
      [tenantId, surveyId]
    )
    return NextResponse.json({ data: reports })
  } catch (error) {
    console.error('[ai-insight GET] Failed:', error)
    return NextResponse.json({ error: '取得歷史報告失敗' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck

  let body: { reportId?: string; action?: string; shareTitle?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: '無效的 JSON' }, { status: 400 }) }

  const { reportId, action, shareTitle } = body
  if (!reportId || !action) return NextResponse.json({ error: '缺少 reportId 或 action' }, { status: 400 })

  const existing = await queryOne<{ id: string; is_public: boolean }>(
    `SELECT id, is_public FROM ai_insight_reports WHERE id = $1 AND tenant_id = $2`,
    [reportId, tenantId]
  )
  if (!existing) return NextResponse.json({ error: '找不到報告' }, { status: 404 })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''

  if (action === 'share') {
    const slug = `rpt-${uuidv4().replace(/-/g, '').slice(0, 8)}`
    await execute(
      `UPDATE ai_insight_reports SET is_public = true, share_slug = COALESCE(share_slug, $1) WHERE id = $2`,
      [slug, reportId]
    )
    const updated = await queryOne<{ share_slug: string }>(
      `SELECT share_slug FROM ai_insight_reports WHERE id = $1`, [reportId]
    )
    const shareUrl = `${baseUrl}/report/${updated?.share_slug}`
    return NextResponse.json({ ok: true, shareUrl, shareSlug: updated?.share_slug })
  }

  if (action === 'unshare') {
    await execute(`UPDATE ai_insight_reports SET is_public = false WHERE id = $1`, [reportId])
    return NextResponse.json({ ok: true })
  }

  if (action === 'update_title') {
    await execute(`UPDATE ai_insight_reports SET share_title = $1 WHERE id = $2`, [shareTitle ?? null, reportId])
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: '不支援的 action' }, { status: 400 })
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck

  const { searchParams } = new URL(request.url)
  const reportId = searchParams.get('id')
  if (!reportId) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  await queryOne(
    `DELETE FROM ai_insight_reports WHERE id = $1 AND tenant_id = $2 RETURNING id`,
    [reportId, tenantId]
  )
  return NextResponse.json({ ok: true })
}
