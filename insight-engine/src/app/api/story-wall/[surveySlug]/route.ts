import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'
import { getStoryWallItems, getStoryWallCount } from '@/lib/storyWallEngine'

interface SurveyExistRow extends Record<string, unknown> {
  id: string
}

interface TagRow extends Record<string, unknown> {
  tag_value: string
  cnt: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ surveySlug: string }> }
): Promise<NextResponse> {
  const { surveySlug } = await params
  const { searchParams } = request.nextUrl

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)))
  const offset = (page - 1) * pageSize

  try {
    const survey = await queryOne<SurveyExistRow>(
      `SELECT id FROM surveys WHERE slug = $1 AND status = 'active'`,
      [surveySlug]
    )

    if (!survey) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const [items, total, tagRows] = await Promise.all([
      getStoryWallItems(surveySlug, pageSize, offset),
      getStoryWallCount(surveySlug),
      // 取高頻標籤值作為關鍵字標籤雲（只取首頁時）
      page === 1 ? query<TagRow>(
        `SELECT ut.tag_value, count(*) as cnt
         FROM user_tags ut
         JOIN responses r ON ut.response_id = r.id
         JOIN surveys s ON r.survey_id = s.id
         WHERE s.slug = $1 AND r.allow_story_wall = true
         GROUP BY ut.tag_value
         ORDER BY cnt DESC
         LIMIT 15`,
        [surveySlug]
      ) : Promise.resolve([]),
    ])

    const topKeywords = tagRows.map((t) => t.tag_value)

    return NextResponse.json({ items, total, page, pageSize, topKeywords })
  } catch (error) {
    console.error('[story-wall] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
