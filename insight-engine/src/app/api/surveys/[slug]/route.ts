import { NextRequest, NextResponse } from 'next/server'
import { getSurveyConfigBySlug, getRandomVariant } from '@/lib/surveyRepo'
import { MVP_SURVEY } from '@/lib/surveyConfig'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params
  const useAB = request.nextUrl.searchParams.get('ab') !== '0'

  // A/B 路由：如有 variant_group 則隨機選
  const config = useAB
    ? await getRandomVariant(slug)
    : await getSurveyConfigBySlug(slug)

  if (config) {
    return NextResponse.json(config)
  }

  // Fallback: 若 DB 無資料但 slug 吻合，回傳靜態 config
  if (slug === MVP_SURVEY.slug) {
    return NextResponse.json(MVP_SURVEY)
  }

  return NextResponse.json({ error: '問卷不存在' }, { status: 404 })
}
