import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { queryOne, execute } from '@/lib/db'

interface PollRow extends Record<string, unknown> {
  id: string
  question: string
  option_a: string
  option_b: string
  votes_a: string
  votes_b: string
  my_choice: string | null
}

async function getAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return { userId: payload.sub as string }
}

/** GET /api/admin/social/stories/poll?pollId=<id> — 取得投票結果 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await getAuth()
  const pollId = req.nextUrl.searchParams.get('pollId')
  if (!pollId) return NextResponse.json({ error: '缺少 pollId' }, { status: 400 })

  const row = await queryOne<PollRow>(
    `SELECT p.id, p.question, p.option_a, p.option_b,
            (SELECT COUNT(*) FROM story_poll_votes WHERE poll_id = p.id AND choice = 'a')::text AS votes_a,
            (SELECT COUNT(*) FROM story_poll_votes WHERE poll_id = p.id AND choice = 'b')::text AS votes_b,
            (SELECT choice FROM story_poll_votes WHERE poll_id = p.id AND voter_id = $1 LIMIT 1) AS my_choice
     FROM story_polls p WHERE p.id = $2`,
    [auth?.userId ?? '00000000-0000-0000-0000-000000000000', pollId]
  )

  if (!row) return NextResponse.json({ error: '找不到投票' }, { status: 404 })

  const votesA = parseInt(row.votes_a, 10)
  const votesB = parseInt(row.votes_b, 10)
  const total = votesA + votesB

  return NextResponse.json({
    id: row.id,
    question: row.question,
    optionA: row.option_a,
    optionB: row.option_b,
    votesA, votesB, total,
    percentA: total > 0 ? Math.round((votesA / total) * 100) : 50,
    percentB: total > 0 ? Math.round((votesB / total) * 100) : 50,
    myChoice: row.my_choice,
  })
}

/** POST /api/admin/social/stories/poll — 投票 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const { pollId, choice } = await req.json() as { pollId: string; choice: 'a' | 'b' }
  if (!pollId || !['a', 'b'].includes(choice)) {
    return NextResponse.json({ error: '參數錯誤' }, { status: 400 })
  }

  await execute(
    `INSERT INTO story_poll_votes (poll_id, voter_id, choice) VALUES ($1, $2, $3)
     ON CONFLICT (poll_id, voter_id) DO UPDATE SET choice = EXCLUDED.choice`,
    [pollId, auth.userId, choice]
  )

  return NextResponse.json({ ok: true })
}
