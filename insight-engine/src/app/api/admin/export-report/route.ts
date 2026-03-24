import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { queryOne } from '@/lib/db'

interface ReportRow extends Record<string, unknown> {
  id: string
  report: Record<string, unknown>
  report_type: string
  created_at: string
  meta: Record<string, unknown> | null
}

interface SurveyRow extends Record<string, unknown> {
  title: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function buildDataReportMarkdown(
  surveyTitle: string,
  reportDate: string,
  r: Record<string, unknown>
): string {
  const lines: string[] = [
    `# ${surveyTitle}`,
    `## AI 數據洞察報告`,
    `產生日期：${reportDate}`,
    `平台：SnowRealm Insight Engine`,
    '',
    '---',
    '',
  ]

  if (typeof r.summary === 'string') {
    lines.push('## 整體洞察')
    lines.push(r.summary)
    lines.push('')
  }

  const highlights = r.highlights
  if (Array.isArray(highlights) && highlights.length > 0) {
    lines.push('## 重點發現')
    for (const h of highlights as Array<{ type?: string; title?: string; detail?: string }>) {
      const icon = h.type === 'positive' ? '✅' : h.type === 'negative' ? '⚠️' : '📌'
      lines.push(`### ${icon} ${h.title ?? ''}`)
      if (h.detail) lines.push(h.detail)
      lines.push('')
    }
  }

  const recs = r.recommendations
  if (Array.isArray(recs) && recs.length > 0) {
    lines.push('## 優化建議')
    for (const rec of recs as Array<{ priority?: string; action?: string; reason?: string }>) {
      const badge = rec.priority === 'high' ? '🔴 高優先' : rec.priority === 'medium' ? '🟡 中優先' : '🟢 低優先'
      lines.push(`### ${badge}：${rec.action ?? ''}`)
      if (rec.reason) lines.push(rec.reason)
      lines.push('')
    }
  }

  if (typeof r.funnelInsight === 'string') {
    lines.push('## 漏斗洞察')
    lines.push(r.funnelInsight)
    lines.push('')
  }

  if (typeof r.audienceInsight === 'string') {
    lines.push('## 受眾洞察')
    lines.push(r.audienceInsight)
    lines.push('')
  }

  lines.push('---')
  lines.push('Powered by SnowRealm Insight Engine · insight.snowrealm.pet')

  return lines.join('\n')
}

function buildStoryReportMarkdown(
  surveyTitle: string,
  reportDate: string,
  r: Record<string, unknown>
): string {
  const lines: string[] = [
    `# ${surveyTitle}`,
    `## AI 故事洞察報告`,
    `產生日期：${reportDate}`,
    `平台：SnowRealm Insight Engine`,
    '',
    '---',
    '',
  ]

  if (typeof r.storyTitle === 'string') {
    lines.push(`## ${r.storyTitle}`)
    lines.push('')
  }

  if (typeof r.shareableOneLiner === 'string') {
    lines.push(`> ✨ ${r.shareableOneLiner}`)
    lines.push('')
  }

  if (typeof r.storyBody === 'string') {
    lines.push('## 故事敘事')
    lines.push(r.storyBody)
    lines.push('')
  }

  const quotes = r.pullQuotes
  if (Array.isArray(quotes) && quotes.length > 0) {
    lines.push('## 填答者的聲音')
    for (const q of quotes as string[]) {
      lines.push(`> 「${q}」`)
    }
    lines.push('')
  }

  const points = r.keyDataPoints
  if (Array.isArray(points) && points.length > 0) {
    lines.push('## 數據支撐')
    for (const p of points as string[]) {
      lines.push(`- ${p}`)
    }
    lines.push('')
  }

  if (typeof r.unexpectedInsight === 'string') {
    lines.push('## 出人意料的發現')
    lines.push(r.unexpectedInsight)
    lines.push('')
  }

  lines.push('---')
  lines.push('Powered by SnowRealm Insight Engine · insight.snowrealm.pet')

  return lines.join('\n')
}

/**
 * POST /api/admin/export-report
 * 匯出 AI 洞察報告為 Markdown 文字檔
 * body: { reportId: string, surveyId?: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck

  try {
    const body = await request.json() as { reportId?: string; surveyId?: string }
    const { reportId, surveyId } = body

    if (!reportId) {
      return NextResponse.json({ error: '缺少 reportId' }, { status: 400 })
    }

    const report = await queryOne<ReportRow>(
      `SELECT id, report, report_type, created_at, meta
       FROM ai_insight_reports
       WHERE id = $1 AND tenant_id = $2`,
      [reportId, tenantId]
    )

    if (!report) {
      return NextResponse.json({ error: '找不到報告，或無權存取' }, { status: 404 })
    }

    const survey = surveyId
      ? await queryOne<SurveyRow>(`SELECT title FROM surveys WHERE id = $1`, [surveyId])
      : null

    const r = report.report
    const isStory = report.report_type === 'story'
    const surveyTitle = survey?.title ?? '問卷報告'
    const reportDate = formatDate(report.created_at)
    const shortId = reportId.slice(0, 8)

    const markdown = isStory
      ? buildStoryReportMarkdown(surveyTitle, reportDate, r)
      : buildDataReportMarkdown(surveyTitle, reportDate, r)

    const filename = `insight-report-${shortId}.md`
    const buffer = Buffer.from(markdown, 'utf-8')

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (error) {
    console.error('[export-report] Failed:', error)
    return NextResponse.json({ error: '匯出失敗' }, { status: 500 })
  }
}
