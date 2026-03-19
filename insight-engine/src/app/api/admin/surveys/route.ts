import { NextRequest, NextResponse } from 'next/server'
import { listSurveys, createSurvey } from '@/lib/surveyRepo'

export async function GET(): Promise<NextResponse> {
  const surveys = await listSurveys()
  return NextResponse.json(surveys)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as { title?: string; slug?: string }
  const title = body.title?.trim()
  const slug = body.slug?.trim()

  if (!title || !slug) {
    return NextResponse.json({ error: '標題和 slug 為必填' }, { status: 400 })
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'slug 只能包含小寫英數字和 -' }, { status: 400 })
  }

  try {
    const survey = await createSurvey({ title, slug })
    return NextResponse.json(survey, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return NextResponse.json({ error: '此 slug 已被使用' }, { status: 409 })
    }
    return NextResponse.json({ error: '建立失敗' }, { status: 500 })
  }
}
