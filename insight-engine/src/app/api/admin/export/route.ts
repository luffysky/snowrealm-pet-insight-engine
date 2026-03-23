import { NextRequest, NextResponse } from 'next/server'
import { getResponsesCsv } from '@/lib/stats'
import { getTenantContext } from '@/lib/tenant'
import { query } from '@/lib/db'

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`
  return '\uFEFF' + [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(','))
  ].join('\n')
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId } = await getTenantContext()
    const type = request.nextUrl.searchParams.get('type') || 'responses'
    const surveyId = request.nextUrl.searchParams.get('surveyId') || undefined
    const date = new Date().toISOString().slice(0, 10)

    let csv: string
    let filename: string

    switch (type) {
      case 'surveys': {
        interface SurveyExportRow extends Record<string, unknown> {
          slug: string; title: string; status: string; question_count: string; response_count: string; created_at: string
        }
        const rows = await query<SurveyExportRow>(
          `SELECT s.slug, s.title, s.status,
            (SELECT COUNT(*)::TEXT FROM questions WHERE survey_id = s.id) AS question_count,
            (SELECT COUNT(*)::TEXT FROM responses WHERE survey_id = s.id) AS response_count,
            s.created_at::TEXT
           FROM surveys s WHERE s.tenant_id = $1 ORDER BY s.created_at DESC LIMIT 10000`,
          [tenantId]
        )
        csv = toCSV(
          ['Slug', '標題', '狀態', '題數', '回覆數', '建立時間'],
          rows.map(r => [r.slug, r.title, r.status, r.question_count, r.response_count, r.created_at])
        )
        filename = `surveys_${date}.csv`
        break
      }
      case 'tags': {
        interface TagRow extends Record<string, unknown> { tag: string; count: string }
        const rows = await query<TagRow>(
          `SELECT tag, COUNT(*)::TEXT AS count FROM response_tags
           WHERE response_id IN (SELECT id FROM responses WHERE survey_id IN (SELECT id FROM surveys WHERE tenant_id = $1))
           GROUP BY tag ORDER BY count DESC LIMIT 10000`,
          [tenantId]
        )
        csv = toCSV(['標籤', '數量'], rows.map(r => [r.tag, r.count]))
        filename = `tags_${date}.csv`
        break
      }
      default: {
        csv = await getResponsesCsv(tenantId, surveyId)
        if (!csv.startsWith('\uFEFF')) csv = '\uFEFF' + csv
        filename = `responses_${date}.csv`
      }
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[admin/export] Failed:', error)
    return NextResponse.json({ error: '匯出 CSV 失敗' }, { status: 500 })
  }
}
