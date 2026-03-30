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

interface AlbumRow extends Record<string, unknown> {
  id: string
  user_id: string
  author_name: string | null
  author_avatar: string | null
  name: string
  description: string | null
  cover_image: string | null
  is_public: boolean
  photo_count: string
  created_at: string
  updated_at: string | null
}

interface AlbumPhotoRow extends Record<string, unknown> {
  id: string
  url: string
  caption: string | null
  is_public: boolean
  display_order: number
  created_at: string
}

interface AlbumPhotoRow extends Record<string, unknown> {
  id: string
  url: string
  caption: string | null
  is_public: boolean
  display_order: number
  created_at: string
}

interface BlogRow extends Record<string, unknown> {
  id: string
  user_id: string
  author_name: string | null
  author_avatar: string | null
  title: string
  slug: string
  summary: string | null
  cover_image: string | null
  is_public: boolean
  view_count: number
  tags: string | null
  published_at: string
}

/** GET /api/super-admin/social?tab=posts|dms|users|reports|stats */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSuperAdmin()
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const tab = req.nextUrl.searchParams.get('tab') ?? 'reports'

  if (tab === 'stats') {
    const [rPending, rPosts, rDms, rUsers, rAlbumPhotos, rBlogs, rAlbums] = await Promise.all([
      query<{ cnt: string }>(`SELECT COUNT(*) as cnt FROM social_reports WHERE status = 'pending'`),
      query<{ cnt: string }>(`SELECT COUNT(*) as cnt FROM social_posts`),
      query<{ cnt: string }>(`SELECT COUNT(DISTINCT CONCAT(LEAST(from_user_id::text,to_user_id::text),'_',GREATEST(from_user_id::text,to_user_id::text))) as cnt FROM direct_messages`),
      query<{ cnt: string }>(`SELECT COUNT(*) as cnt FROM admin_users`),
      query<{ cnt: string }>(`SELECT COUNT(*) as cnt FROM user_album_photos`).catch(() => [{ cnt: '0' }]),
      query<{ cnt: string }>(`SELECT COUNT(*) as cnt FROM user_blog_articles`).catch(() => [{ cnt: '0' }]),
      query<{ cnt: string }>(`SELECT COUNT(*) as cnt FROM user_albums`).catch(() => [{ cnt: '0' }]),
    ])
    return NextResponse.json({
      stats: {
        pendingReports:   parseInt(rPending[0]?.cnt ?? '0'),
        totalPosts:       parseInt(rPosts[0]?.cnt ?? '0'),
        totalDms:         parseInt(rDms[0]?.cnt ?? '0'),
        totalUsers:       parseInt(rUsers[0]?.cnt ?? '0'),
        totalAlbumPhotos: parseInt(rAlbumPhotos[0]?.cnt ?? '0'),
        totalBlogs:       parseInt(rBlogs[0]?.cnt ?? '0'),
        totalAlbums:      parseInt(rAlbums[0]?.cnt ?? '0'),
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
      `SELECT sp.id, sp.user_id, up.display_name as author_name, up.avatar_url as author_avatar,
              sp.type, sp.title, sp.content, sp.images::text,
              array_to_json(sp.tags)::text AS tags,
              sp.is_public, sp.created_at,
              sp.likes_count, sp.comments_count
       FROM social_posts sp
       LEFT JOIN user_profiles up ON up.user_id = sp.user_id
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
    // Return conversations grouped by user pair, ordered by latest message
    const convRows = await query<{
      user1_id: string; user2_id: string;
      user1_name: string | null; user2_name: string | null;
      user1_avatar: string | null; user2_avatar: string | null;
      message_count: string; last_at: string;
      last_encrypted: string; last_iv: string; last_tag: string;
    }>(
      `SELECT
         LEAST(dm.from_user_id::text, dm.to_user_id::text) AS user1_id,
         GREATEST(dm.from_user_id::text, dm.to_user_id::text) AS user2_id,
         u1.display_name AS user1_name, u2.display_name AS user2_name,
         u1.avatar_url AS user1_avatar, u2.avatar_url AS user2_avatar,
         COUNT(*)::text AS message_count,
         MAX(dm.created_at)::text AS last_at,
         (ARRAY_AGG(dm.encrypted_content ORDER BY dm.created_at DESC))[1] AS last_encrypted,
         (ARRAY_AGG(dm.iv ORDER BY dm.created_at DESC))[1] AS last_iv,
         (ARRAY_AGG(dm.tag ORDER BY dm.created_at DESC))[1] AS last_tag
       FROM direct_messages dm
       LEFT JOIN admin_users u1 ON u1.id::text = LEAST(dm.from_user_id::text, dm.to_user_id::text)
       LEFT JOIN admin_users u2 ON u2.id::text = GREATEST(dm.from_user_id::text, dm.to_user_id::text)
       GROUP BY
         LEAST(dm.from_user_id::text, dm.to_user_id::text),
         GREATEST(dm.from_user_id::text, dm.to_user_id::text),
         u1.display_name, u2.display_name, u1.avatar_url, u2.avatar_url
       ORDER BY MAX(dm.created_at) DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    )

    const dms = convRows.map(row => {
      let lastContent = '[無法解密]'
      try { lastContent = decryptApiKey({ encrypted: row.last_encrypted, iv: row.last_iv, tag: row.last_tag }) } catch {}
      return {
        user1Id: row.user1_id,
        user2Id: row.user2_id,
        user1Name: row.user1_name ?? '未知',
        user2Name: row.user2_name ?? '未知',
        user1Avatar: row.user1_avatar,
        user2Avatar: row.user2_avatar,
        messageCount: parseInt(row.message_count),
        lastAt: row.last_at,
        lastContent,
      }
    })
    return NextResponse.json({ dms })
  }

  if (tab === 'dm_detail') {
    const u1 = req.nextUrl.searchParams.get('u1')
    const u2 = req.nextUrl.searchParams.get('u2')
    if (!u1 || !u2) return NextResponse.json({ error: '缺少參數' }, { status: 400 })
    const rows = await query<DmRow>(
      `SELECT dm.id, dm.from_user_id, dm.to_user_id,
              f.display_name as from_name, t.display_name as to_name,
              dm.encrypted_content, dm.iv, dm.tag, dm.created_at
       FROM direct_messages dm
       LEFT JOIN admin_users f ON f.id::text = dm.from_user_id::text
       LEFT JOIN admin_users t ON t.id::text = dm.to_user_id::text
       WHERE (dm.from_user_id::text = $1 AND dm.to_user_id::text = $2)
          OR (dm.from_user_id::text = $2 AND dm.to_user_id::text = $1)
       ORDER BY dm.created_at ASC
       LIMIT 100`,
      [u1, u2]
    )
    const messages = rows.map(row => {
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
    return NextResponse.json({ messages })
  }

  if (tab === 'albums') {
    try {
      const rows = await query<AlbumRow>(
        `SELECT ua.id, ua.user_id::text,
                up.display_name as author_name, up.avatar_url as author_avatar,
                ua.name, ua.description,
                (SELECT url FROM user_album_photos WHERE album_id = ua.id ORDER BY display_order ASC, created_at ASC LIMIT 1) AS cover_image,
                ua.is_public, ua.created_at, ua.updated_at,
                COUNT(uap.id)::text as photo_count
         FROM user_albums ua
         LEFT JOIN user_profiles up ON up.user_id = ua.user_id
         LEFT JOIN user_album_photos uap ON uap.album_id = ua.id
         GROUP BY ua.id, up.display_name, up.avatar_url, ua.user_id, ua.name, ua.description, ua.is_public, ua.created_at, ua.updated_at
         ORDER BY ua.created_at DESC
         LIMIT $1 OFFSET $2`,
        [pageSize, offset]
      )
      return NextResponse.json({ albums: rows })
    } catch {
      return NextResponse.json({ albums: [] })
    }
  }

  if (tab === 'album_detail') {
    const albumId = req.nextUrl.searchParams.get('albumId')
    if (!albumId) return NextResponse.json({ error: '缺少 albumId' }, { status: 400 })
    try {
      const photos = await query<AlbumPhotoRow>(
        `SELECT id, url, caption, is_public, display_order, created_at
         FROM user_album_photos
         WHERE album_id = $1
         ORDER BY display_order ASC, created_at ASC`,
        [albumId]
      )
      return NextResponse.json({ photos })
    } catch {
      return NextResponse.json({ photos: [] })
    }
  }

  if (tab === 'blogs') {
    try {
      const rows = await query<BlogRow>(
        `SELECT uba.id, uba.user_id::text, up.display_name as author_name, up.avatar_url as author_avatar,
                uba.title, uba.slug, uba.summary, uba.cover_image,
                uba.is_public, uba.view_count, uba.published_at,
                array_to_json(uba.tags)::text as tags
         FROM user_blog_articles uba
         LEFT JOIN user_profiles up ON up.user_id = uba.user_id
         ORDER BY uba.published_at DESC
         LIMIT $1 OFFSET $2`,
        [pageSize, offset]
      )
      return NextResponse.json({
        blogs: rows.map(r => ({
          ...r,
          tags: r.tags ? JSON.parse(r.tags) as string[] : [],
        }))
      })
    } catch {
      return NextResponse.json({ blogs: [] })
    }
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

  const body = await req.json() as {
    reportId?: string; status?: string; reviewNote?: string;
    deletePostId?: string; deleteAlbumId?: string; deleteBlogId?: string
  }

  if (body.deletePostId) {
    await execute(`DELETE FROM social_posts WHERE id = $1`, [body.deletePostId])
    return NextResponse.json({ ok: true })
  }

  if (body.deleteAlbumId) {
    await execute(`DELETE FROM user_albums WHERE id = $1`, [body.deleteAlbumId])
    return NextResponse.json({ ok: true })
  }

  if (body.deleteBlogId) {
    await execute(`DELETE FROM user_blog_articles WHERE id = $1`, [body.deleteBlogId])
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
