import { NextResponse } from 'next/server'
import { listSurveys } from '@/lib/surveyRepo'

export async function GET(): Promise<NextResponse> {
  const surveys = await listSurveys()
  return NextResponse.json(surveys)
}
