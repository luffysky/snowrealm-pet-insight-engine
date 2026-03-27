import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { decryptApiKey } from '@/lib/aiCrypto'
import { headers } from 'next/headers'

async function requireSuperAdmin() {
  const h = await headers()
  const role = h.get('x-user-role')
  const userId = h.get('x-user-id')
  if (!userId || role !== 'super_admin') return null
  return { sub: userId, role }
}

interface ReportRow extends Record<string, unknown> {
  id: string
  reporter_name: string | null
  target_type: string
  target_id: string
  target_content: string | null
  target_author_name: string | null
  reason: string
  description: string | null
  status: string
  review_note: string | null
  reviewed_at: string | null
  created_at: string
}

interface PostRow extends Record<string, unknown> {
  id: string
  user_id: string
  author_name: string | null
  author_avatar: string | null
  type: string
  title: string | null
  content: string
  images: string | null
  tags: string | null
  is_public: boolean
  created_at: string
  likes_count: number
  comments_count: number
}

interface DmRow extends Record<string, unknown> {
  id: string
  from_user_id: string
  to_user_id: string
  from_name: string | null
  to_name: string | null
  encrypted_content: string
  iv: string
  tag: string
  created_at: string
}

interface UserRow extends Record<string, unknown> {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  role: string
  created_at: string
  tenant_id: string | null
  is_banned: boolean
  ban_reason: string | null
}

/** GET /api/super-admin/social?tab=posts|dms|users|reports|stats */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const tab = req.nextUrl.searchParams.get('tab') ?? 'reports'

  if (tab === 'stats') {
    const [rPending, rPosts, rDms, rUsers] = await Promise.all([
      query<{ cnt: string }>(`SELECT COUNT(*) as cnt FROM social_reports WHERE status = 'pending'`),
      query<{ cnt: string }>(`SELECT COUNT(*) as cnt FROM social_posts`),
      query<{ cnt: string }>(`SELECT COUNT(*) as cnt FROM direct_messages`),
      query<{ cnt: string }>(`SELECT COUNT(*) as cnt FROM admin_users`),
    ])
    return NextResponse.json({
      stats: {
        pendingReports: parseInt(rPending[0]?.cnt ?? '0'),
        totalPosts:     parseInt(rPosts[0]?.cnt ?? '0'),
        totalDms:       parseInt(rDms[0]?.cnt ?? '0'),
        totalUsers:     parseInt(rUsers[0]?.cnt ?? '0'),
      }
    })
  }
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'))
  const pageSize = 30
  const offset = (page - 1) * pageSize

  if (tab === 'reports') {
    try {
      const rows = await query<ReportRow>(
        `SELECT r.id, r.reporter_name, r.target_type, r.target_id, r.target_content,
                r.target_author_name, r.reason, r.description, r.status,
                r.review_note, r.reviewed_at, r.created_at
         FROM social_reports r
         ORDER BY CASE r.status WHEN 'pending' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END, r.created_at DESC
         LIMIT $1 OFFSET $2`,
        [pageSize, offset]
      )
      return NextResponse.json({ reports: rows })
    } catch {
      return NextResponse.json({ reports: [] })
    }
  }

  if (tab === 'posts') {
    const rows = await query<PostRow>(
      `SELECT sp.id, sp.user_id, au.display_name as author_name, au.avatar_url as author_avatar,
              sp.type, sp.title, sp.content, sp.images::text, sp.tags::text,
              sp.is_public, sp.created_at,
              sp.likes_count, sp.comments_count
       FROM social_posts sp
       LEFT JOIN admin_users au ON au.id::text = sp.user_id::text
       ORDER BY sp.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    )
    return NextResponse.json({
      posts: rows.map(r => ({
        ...r,
        images: r.images ? JSON.parse(r.images) : [],
        tags: r.tags ? JSON.parse(r.tags) : [],
      }))
    })
  }

  if (tab === 'dms') {
    const rows = await query<DmRow>(
      `SELECT dm.id, dm.from_user_id, dm.to_user_id,
              f.display_name as from_name, t.display_name as to_name,
              dm.encrypted_content, dm.iv, dm.tag, dm.created_at
       FROM direct_messages dm
       LEFT JOIN admin_users f ON f.id::text = dm.from_user_id::text
       LEFT JOIN admin_users t ON t.id::text = dm.to_user_id::text
       ORDER BY dm.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    )
    const dms = rows.map(row => {
      let content = '[無法解密]'
      try { content = decryptApiKey({ encrypted: row.encrypted_content, iv: row.iv, tag: row.tag }) } catch {}
      return {
        id: row.id,
        fromUserId: row.from_user_id,
        toUserId: row.to_user_id,
        fromName: row.from_name ?? '未知',
        toName: row.to_name ?? '未知',
        content,
        createdAt: row.created_at,
      }
    })
    return NextResponse.json({ dms })
  }

  if (tab === 'users') {
    const rows = await query<UserRow>(
      `SELECT au.id, au.username, au.display_name, au.avatar_url, au.role, au.created_at,
              au.is_banned, au.ban_reason, tu.tenant_id
       FROM admin_users au
       LEFT JOIN tenant_users tu ON tu.user_id = au.id
       ORDER BY au.is_banned DESC, au.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    )
    return NextResponse.json({ users: rows })
  }

  return NextResponse.json({ error: '無效的 tab' }, { status: 400 })
}

/** PATCH /api/super-admin/social — 處理檢舉（更新狀態） */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const body = await req.json() as { reportId?: string; status?: string; reviewNote?: string; deletePostId?: string }

  if (body.deletePostId) {
    await execute(`DELETE FROM social_posts WHERE id = $1`, [body.deletePostId])
    return NextResponse.json({ ok: true })
  }

  if (body.reportId && body.status) {
    const validStatuses = ['pending', 'reviewing', 'resolved', 'dismissed']
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: '無效狀態' }, { status: 400 })
    }
    await execute(
      `UPDATE social_reports
       SET status = $1, review_note = $2, reviewed_at = NOW()
       WHERE id = $3`,
      [body.status, body.reviewNote ?? null, body.reportId]
    )
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
}
