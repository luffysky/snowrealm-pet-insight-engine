import { NextRequest, NextResponse } from 'next/server'
import { updateQuestion, deleteQuestion } from '@/lib/surveyRepo'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ qid: string }> }
): Promise<NextResponse> {
  const { qid } = await params
  const body = await request.json()
  const affected = await updateQuestion(qid, body)
  if (affected === 0) return NextResponse.json({ error: '題目不存在' }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ qid: string }> }
): Promise<NextResponse> {
  const { qid } = await params
  const affected = await deleteQuestion(qid)
  if (affected === 0) return NextResponse.json({ error: '題目不存在' }, { status: 404 })
  return NextResponse.json({ success: true })
}
