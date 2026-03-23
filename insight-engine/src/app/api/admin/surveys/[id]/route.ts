import { NextRequest, NextResponse } from 'next/server'
import { getSurveyById, updateSurvey } from '@/lib/surveyRepo'
import { requireRole } from '@/lib/tenant'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const survey = await getSurveyById(id)
  if (!survey) return NextResponse.json({ error: '問卷不存在' }, { status: 404 })
  return NextResponse.json(survey)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { id } = await params
  const body = await request.json()
  const affected = await updateSurvey(id, body)
  if (affected === 0) return NextResponse.json({ error: '更新失敗' }, { status: 404 })
  const updated = await getSurveyById(id)
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const roleCheck = await requireRole('editor')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { id } = await params
  
  // import { deleteSurvey } from '@/lib/surveyRepo'
  const { deleteSurvey } = await import('@/lib/surveyRepo')

  const success = await deleteSurvey(id)
  if (!success) {
    return NextResponse.json({ error: '找不到該問卷或刪除失敗' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
