import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/tenant'
import { getStoryWallItems, getStoryWallCount, setStoryVisibility, pinStory } from '@/lib/storyWallEngine'

interface PatchBody {
  responseId?: string
  action?: 'pin' | 'unpin' | 'hide'
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ctx = await requireRole('viewer')
  if (ctx instanceof NextResponse) return ctx

  const { searchParams } = request.nextUrl
  const surveySlug = searchParams.get('surveySlug')?.trim()

  if (!surveySlug) {
    return NextResponse.json({ error: 'surveySlug 為必填' }, { status: 400 })
  }

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)))
  const offset = (page - 1) * pageSize

  try {
    const [items, total] = await Promise.all([
      getStoryWallItems(surveySlug, pageSize, offset),
      getStoryWallCount(surveySlug),
    ])

    return NextResponse.json({ items, total, page, pageSize })
  } catch (error) {
    console.error('[admin/story-wall] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const ctx = await requireRole('admin')
  if (ctx instanceof NextResponse) return ctx

  const body = await request.json() as PatchBody
  const { responseId, action } = body

  if (!responseId || !action) {
    return NextResponse.json({ error: 'responseId 和 action 為必填' }, { status: 400 })
  }

  if (!['pin', 'unpin', 'hide'].includes(action)) {
    return NextResponse.json({ error: 'action 必須是 pin、unpin 或 hide' }, { status: 400 })
  }

  try {
    if (action === 'pin') {
      await pinStory(responseId, true)
    } else if (action === 'unpin') {
      await pinStory(responseId, false)
    } else {
      await setStoryVisibility(responseId, false)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/story-wall] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
