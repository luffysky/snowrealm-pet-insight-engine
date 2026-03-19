import { NextRequest, NextResponse } from 'next/server'
import { getSurveyById, updateSurvey } from '@/lib/surveyRepo'

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
  const { id } = await params
  const body = await request.json()
  const affected = await updateSurvey(id, body)
  if (affected === 0) return NextResponse.json({ error: '更新失敗' }, { status: 404 })
  const updated = await getSurveyById(id)
  return NextResponse.json(updated)
}
