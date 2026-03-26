import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { getGapSnapshots, generateGapSnapshot, getOverallGapLevel } from '@/lib/cognitiveGapEngine'

export const dynamic = 'force-dynamic'

interface SurveyRow extends Record<string, unknown> { id: string }

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const surveySlug = searchParams.get('surveySlug')
    const refresh = searchParams.get('refresh') === 'true'

    if (!userId || !surveySlug) {
      return NextResponse.json({ error: '缺少 userId 或 surveySlug' }, { status: 400 })
    }

    const survey = await queryOne<SurveyRow>(
      `SELECT id FROM surveys WHERE slug = $1`, [surveySlug]
    )
    if (!survey) return NextResponse.json({ error: '問卷不存在' }, { status: 404 })

    const snapshots = refresh
      ? await generateGapSnapshot(userId, survey.id)
      : await getGapSnapshots(userId, survey.id)

    return NextResponse.json({
      snapshots,
      overallGapLevel: getOverallGapLevel(snapshots),
      hasData: snapshots.length > 0,
    })
  } catch (error) {
    console.error('[cognitive-gap/snapshot] Failed:', error)
    return NextResponse.json({ error: '取得快照失敗' }, { status: 500 })
  }
}
