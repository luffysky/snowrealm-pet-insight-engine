import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'

/*
  DB Migration (run once in Supabase):

  ALTER TABLE blog_comments ADD COLUMN IF NOT EXISTS like_count INT NOT NULL DEFAULT 0;

  CREATE TABLE IF NOT EXISTS blog_comment_likes (
    comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
    fingerprint TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (comment_id, fingerprint)
  );
*/

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params
  const body = await req.json().catch(() => null) as { fingerprint?: string } | null
  const fingerprint = (body?.fingerprint ?? '').trim()
  if (!fingerprint) {
    return NextResponse.json({ error: 'missing fingerprint' }, { status: 400 })
  }

  try {
    const existing = await queryOne<{ comment_id: string }>(
      `SELECT comment_id FROM blog_comment_likes WHERE comment_id = $1 AND fingerprint = $2`,
      [commentId, fingerprint]
    )

    if (existing) {
      await execute(
        `DELETE FROM blog_comment_likes WHERE comment_id = $1 AND fingerprint = $2`,
        [commentId, fingerprint]
      )
      await execute(
        `UPDATE blog_comments SET like_count = GREATEST(0, like_count - 1) WHERE id = $1`,
        [commentId]
      )
      return NextResponse.json({ liked: false })
    } else {
      await execute(
        `INSERT INTO blog_comment_likes (comment_id, fingerprint) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [commentId, fingerprint]
      )
      await execute(
        `UPDATE blog_comments SET like_count = like_count + 1 WHERE id = $1`,
        [commentId]
      )
      return NextResponse.json({ liked: true })
    }
  } catch (err) {
    console.error('[comment like]', err)
    return NextResponse.json({ error: '操作失敗' }, { status: 500 })
  }
}
