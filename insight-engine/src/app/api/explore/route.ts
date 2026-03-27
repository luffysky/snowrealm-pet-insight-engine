import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface SurveyRow extends Record<string, unknown> {
  id: string
  slug: string
  title: string
  subtitle: string
  cover_title: string
  tenant_id: string
  tenant_name: string | null
  response_count: string
  created_at: string
}

interface StoryRow extends Record<string, unknown> {
  response_id: string
  survey_title: string
  survey_slug: string
  tenant_name: string | null
  one_liner: string | null
  created_at: string
}

interface UserRow extends Record<string, unknown> {
  id: string
  display_name: string | null
  avatar_url: string | null
  post_count: string
  follower_count: string
}

/** GET /api/explore?type=surveys|stories|users */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'surveys'
  const sort = searchParams.get('sort') ?? 'popular'
  const search = searchParams.get('q') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = 12
  const offset = (page - 1) * pageSize

  if (type === 'stories') {
    // 公開故事小卡：allow_story_wall = true 且有 one_liner
    const rows = await query<StoryRow>(
      `SELECT r.id AS response_id, s.title AS survey_title, s.slug AS survey_slug,
              t.name AS tenant_name,
              sc.one_liner, r.created_at
       FROM responses r
       JOIN surveys s ON s.id = r.survey_id
       LEFT JOIN tenants t ON t.slug = s.tenant_id
       LEFT JOIN story_cards sc ON sc.response_id = r.id
       WHERE r.allow_story_wall = true
         AND r.status = 'completed'
         AND sc.one_liner IS NOT NULL
       ORDER BY r.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    )
    return NextResponse.json({
      stories: rows.map(r => ({
        responseId: r.response_id,
        surveyTitle: r.survey_title,
        surveySlug: r.survey_slug,
        tenantName: r.tenant_name,
        oneLiner: r.one_liner,
        createdAt: r.created_at,
      })),
      page,
      pageSize,
    })
  }

  if (type === 'users') {
    // 熱門創作者：按粉絲數 + 貼文數排序
    const rows = await query<UserRow>(
      `SELECT au.id, au.display_name, au.avatar_url,
              (SELECT COUNT(*) FROM social_posts sp WHERE sp.user_id = au.id::text AND sp.is_public = true)::text AS post_count,
              (SELECT COUNT(*) FROM user_follows uf WHERE uf.following_id = au.id::text)::text AS follower_count
       FROM admin_users au
       WHERE au.is_active = true
         AND au.display_name IS NOT NULL
       ORDER BY follower_count DESC, post_count DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    )
    return NextResponse.json({
      users: rows.map(r => ({
        id: r.id,
        displayName: r.display_name,
        avatarUrl: r.avatar_url,
        postCount: parseInt(r.post_count, 10),
        followerCount: parseInt(r.follower_count, 10),
      })),
      page,
      pageSize,
    })
  }

  // 預設：surveys
  const orderBy = sort === 'new' ? 's.created_at DESC' : 'response_count DESC'
  const searchClause = search ? `AND (s.title ILIKE $3 OR s.subtitle ILIKE $3)` : ''
  const params: unknown[] = [pageSize, offset]
  if (search) params.push(`%${search}%`)

  const rows = await query<SurveyRow>(
    `SELECT s.id, s.slug, s.title, s.subtitle, s.cover_title, s.tenant_id,
            t.name AS tenant_name,
            COUNT(r.id)::text AS response_count, s.created_at
     FROM surveys s
     LEFT JOIN tenants t ON t.slug = s.tenant_id
     LEFT JOIN responses r ON r.survey_id = s.id AND r.status = 'completed'
     WHERE s.status IN ('active', 'published')
     ${searchClause}
     GROUP BY s.id, t.name
     ORDER BY ${orderBy}
     LIMIT $1 OFFSET $2`,
    params
  )

  return NextResponse.json({
    surveys: rows.map(r => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle,
      coverTitle: r.cover_title,
      tenantId: r.tenant_id,
      tenantName: r.tenant_name,
      responseCount: parseInt(r.response_count, 10),
      createdAt: r.created_at,
    })),
    page,
    pageSize,
  })
}
