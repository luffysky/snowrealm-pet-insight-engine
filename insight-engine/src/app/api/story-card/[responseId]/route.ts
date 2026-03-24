import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { buildStoryCard } from '@/lib/storyCardEngine'

interface ResponseCheckRow extends Record<string, unknown> {
  id: string
  status: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
): Promise<NextResponse> {
  const { responseId } = await params

  if (!responseId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const response = await queryOne<ResponseCheckRow>(
      `SELECT id, status FROM responses WHERE id = $1`,
      [responseId]
    )

    if (!response || response.status !== 'completed') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const card = await buildStoryCard(responseId)
    if (!card) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(card)
  } catch (error) {
    console.error('[story-card] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
): Promise<NextResponse> {
  const { responseId } = await params

  if (!responseId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await request.json() as { allowStoryWall?: boolean }
    const allowStoryWall = body.allowStoryWall === true

    const response = await queryOne<ResponseCheckRow>(
      `SELECT id, status FROM responses WHERE id = $1`,
      [responseId]
    )

    if (!response || response.status !== 'completed') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await execute(
      `UPDATE responses SET allow_story_wall = $1 WHERE id = $2`,
      [allowStoryWall, responseId]
    )

    return NextResponse.json({ ok: true, allowStoryWall })
  } catch (error) {
    console.error('[story-card PATCH] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
