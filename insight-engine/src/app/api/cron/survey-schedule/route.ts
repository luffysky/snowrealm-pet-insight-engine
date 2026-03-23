import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface UpdateResult extends Record<string, unknown> { id: string }

export async function GET(): Promise<NextResponse> {
  try {
    const published = await query<UpdateResult>(
      `UPDATE surveys SET status = 'published', updated_at = NOW()
       WHERE scheduled_publish_at IS NOT NULL
       AND scheduled_publish_at <= NOW()
       AND status = 'draft'
       RETURNING id`
    )

    const archived = await query<UpdateResult>(
      `UPDATE surveys SET status = 'archived', updated_at = NOW()
       WHERE scheduled_close_at IS NOT NULL
       AND scheduled_close_at <= NOW()
       AND status = 'published'
       RETURNING id`
    )

    return NextResponse.json({ published: published.length, archived: archived.length })
  } catch (error) {
    console.error('[cron/survey-schedule]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
