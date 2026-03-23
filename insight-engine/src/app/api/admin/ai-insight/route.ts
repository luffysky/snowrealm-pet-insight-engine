import { NextRequest, NextResponse } from 'next/server'
import { getActiveAiKey, getPlatformKey, logAiUsage } from '@/lib/aiService'
import { requireRole, getTenantContext } from '@/lib/tenant'
import { buildInsightSummary, generateInsightReport } from '@/lib/insightEngine'
import { queryOne, query } from '@/lib/db'

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

    await queryOne(
      `INSERT INTO ai_insight_reports (tenant_id, survey_id, report, meta, generated_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [tenantId, surveyId, JSON.stringify(report), JSON.stringify(reportMeta), roleCheck.userId]
    )

    return NextResponse.json({ report, meta: reportMeta })
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
    }
    const reports = await query<ReportRow>(
      `SELECT id, survey_id, report, meta, generated_by, created_at
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
