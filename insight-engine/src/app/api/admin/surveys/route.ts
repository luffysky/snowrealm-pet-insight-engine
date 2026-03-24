import { NextRequest, NextResponse } from 'next/server'
import { listSurveys, createSurvey, setPrimarySurvey, reorderSurveys } from '@/lib/surveyRepo'
import { getTenantContext, requireRole } from '@/lib/tenant'
import { checkSurveyLimit } from '@/lib/planLimits'
import { isUserPlatformUnlimited } from '@/lib/platformUnlimited'

export async function GET(): Promise<NextResponse> {
  const { tenantId } = await getTenantContext()
  const surveys = await listSurveys(tenantId)
  return NextResponse.json(surveys)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck
  const body = await req.json() as { title?: string; slug?: string }
  const title = body.title?.trim()
  const slug = body.slug?.trim()

  if (!title || !slug) {
    return NextResponse.json({ error: '標題和 slug 為必填' }, { status: 400 })
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'slug 只能包含小寫英數字和 -' }, { status: 400 })
  }

  const platformUnlimited = await isUserPlatformUnlimited(roleCheck.userId)
  if (!platformUnlimited) {
    const surveyLimit = await checkSurveyLimit(tenantId)
    if (!surveyLimit.allowed) {
      return NextResponse.json({ error: '已達方案問卷數量上限，請升級方案' }, { status: 403 })
    }
  }

  try {
    const survey = await createSurvey({ title, slug, tenantId })
    return NextResponse.json(survey, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return NextResponse.json({ error: '此 slug 已被使用' }, { status: 409 })
    }
    return NextResponse.json({ error: '建立失敗' }, { status: 500 })
  }
}

/** PATCH /api/admin/surveys — 設定主問卷 */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck
  const body = await req.json() as { action?: string; surveyId?: string; orderedIds?: string[] }

  if (body.action === 'set-primary' && body.surveyId) {
    await setPrimarySurvey(body.surveyId, tenantId)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'reorder' && Array.isArray(body.orderedIds)) {
    await reorderSurveys(body.orderedIds, tenantId)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: '不支援的操作' }, { status: 400 })
}
