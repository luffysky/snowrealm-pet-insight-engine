import { NextRequest, NextResponse } from 'next/server'
import { getQuestionsBySurveyId, createQuestion, reorderQuestions } from '@/lib/surveyRepo'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const questions = await getQuestionsBySurveyId(id)
  return NextResponse.json(questions)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const body = await request.json()

  const question = await createQuestion({
    survey_id: id,
    key: body.key,
    type: body.type ?? 'single',
    content: body.content,
    options: body.options ?? [],
    order_index: body.order_index ?? 0,
    is_required: body.is_required ?? true,
    max_selections: body.max_selections ?? null,
    route: body.route ?? 'all',
    emoji: body.emoji ?? null,
    narrative: body.narrative ?? null,
  })

  return NextResponse.json(question, { status: 201 })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const body = await request.json()

  if (!Array.isArray(body.orderedIds)) {
    return NextResponse.json({ error: 'orderedIds 必須是陣列' }, { status: 400 })
  }

  await reorderQuestions(id, body.orderedIds)
  return NextResponse.json({ success: true })
}
