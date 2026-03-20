import { NextResponse } from 'next/server'
import { getPrimarySurveySlug } from '@/lib/surveyRepo'
import { MVP_SURVEY_SLUG } from '@/constants'

/**
 * GET /api/primary-survey?tenant=xxx
 * 回傳該租戶的主問卷 slug，若無則 fallback 到 MVP_SURVEY_SLUG
 */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenant') ?? 'maoxingtianxia'

  const slug = await getPrimarySurveySlug(tenantId)
  return NextResponse.json({ slug: slug ?? MVP_SURVEY_SLUG })
}
