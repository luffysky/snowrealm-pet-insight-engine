import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'

const VALID_EVENTS = ['line_friend', 'instagram']

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as { responseId?: string; eventType?: string }
  const { responseId, eventType } = body

  if (!responseId || !eventType || !VALID_EVENTS.includes(eventType)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  await execute(
    `INSERT INTO click_events (response_id, event_type) VALUES ($1, $2)`,
    [responseId, eventType]
  )

  return NextResponse.json({ ok: true })
}
