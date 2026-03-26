import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { getGapSnapshots, generateGapReport, getLatestGapReport } from '@/lib/cognitiveGapEngine'
import { getTenantContext } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

interface SurveyRow extends Record<string, unknown> {
  id: string
  tenant_id: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const surveySlug = searchParams.get('surveySlug')
    const styleKey = searchParams.get('style') ?? undefined

    if (!userId || !surveySlug) {
      return NextResponse.json({ error: '缺少參數' }, { status: 400 })
    }

    const survey = await queryOne<SurveyRow>(
      `SELECT id, tenant_id FROM surveys WHERE slug = $1`, [surveySlug]
    )
    if (!survey) return NextResponse.json({ error: '問卷不存在' }, { status: 404 })

    const report = await getLatestGapReport(userId, survey.id, styleKey)
    if (!report) return NextResponse.json({ error: '尚無報告' }, { status: 404 })

    return NextResponse.json(report)
  } catch (error) {
    console.error('[cognitive-gap/report GET] Failed:', error)
    return NextResponse.json({ error: '取得報告失敗' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as {
      userId: string
      surveySlug: string
      styleKey?: 'A' | 'B' | 'C' | 'D' | 'E'
      isPartial?: boolean
    }

    if (!body.userId || !body.surveySlug) {
      return NextResponse.json({ error: '缺少參數' }, { status: 400 })
    }

    const ctx = await getTenantContext()
    const tenantId = ctx.tenantId ?? 'default'

    const survey = await queryOne<SurveyRow>(
      `SELECT id, tenant_id FROM surveys WHERE slug = $1`, [body.surveySlug]
    )
    if (!survey) return NextResponse.json({ error: '問卷不存在' }, { status: 404 })

    const snapshots = await getGapSnapshots(body.userId, survey.id)
    if (snapshots.length === 0) {
      return NextResponse.json({ error: '尚無認知落差數據' }, { status: 400 })
    }

    const report = await generateGapReport({
      userId: body.userId,
      surveyId: survey.id,
      snapshots,
      styleKey: body.styleKey ?? 'A',
      tenantId: (survey.tenant_id as string) || tenantId,
      isPartial: body.isPartial ?? true,
    })

    if (!report) return NextResponse.json({ error: 'AI 生成失敗' }, { status: 500 })

    return NextResponse.json(report)
  } catch (error) {
    console.error('[cognitive-gap/report POST] Failed:', error)
    return NextResponse.json({ error: '生成報告失敗' }, { status: 500 })
  }
}
