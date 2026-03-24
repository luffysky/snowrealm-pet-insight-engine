import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { getStoryWallItems, getStoryWallCount } from '@/lib/storyWallEngine'

interface SurveyExistRow extends Record<string, unknown> {
  id: string
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

    const [items, total] = await Promise.all([
      getStoryWallItems(surveySlug, pageSize, offset),
      getStoryWallCount(surveySlug),
    ])

    return NextResponse.json({ items, total, page, pageSize })
  } catch (error) {
    console.error('[story-wall] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
