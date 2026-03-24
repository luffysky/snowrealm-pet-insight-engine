import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { requireRole } from '@/lib/tenant'

interface ResponseRow {
  [key: string]: unknown
  id: string
  survey_title: string
  survey_slug: string
  status: string
  submitted_at: string | null
  created_at: string
  answer_count: string
}

export async function GET(request: NextRequest) {
  const roleCheck = await requireRole('viewer')
  if (roleCheck instanceof NextResponse) return roleCheck

  const token = request.cookies.get('admin_session')?.value
  if (!token) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const responses = await query<ResponseRow>(
    `SELECT r.id, s.title AS survey_title, s.slug AS survey_slug,
            r.status, r.submitted_at, r.created_at,
            (SELECT COUNT(*) FROM answers a WHERE a.response_id = r.id)::text AS answer_count
     FROM responses r
     LEFT JOIN surveys s ON s.id = r.survey_id
     WHERE r.user_id = $1::uuid
     ORDER BY r.created_at DESC
     LIMIT 100`,
    [payload.sub]
  )

  return NextResponse.json({
    responses: (responses ?? []).map(r => ({
      id: r.id,
      surveyTitle: r.survey_title ?? '未知問卷',
      surveySlug: r.survey_slug ?? '',
      status: r.status,
      submittedAt: r.submitted_at,
      createdAt: r.created_at,
      answerCount: Number(r.answer_count),
    })),
  })
}
