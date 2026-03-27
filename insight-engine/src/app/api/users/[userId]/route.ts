import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

interface UserRow extends Record<string, unknown> {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  banner_url: string | null
  profile_theme: string | null
  bio: string | null
  website_url: string | null
  instagram_handle: string | null
  twitter_handle: string | null
  is_profile_public: boolean
  followers: string
  following: string
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  const user = await queryOne<UserRow>(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, u.banner_url, u.profile_theme, u.bio, u.website_url,
            u.instagram_handle, u.twitter_handle,
            COALESCE(u.is_profile_public, true) AS is_profile_public,
            (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id)::int AS followers,
            (SELECT COUNT(*) FROM user_follows WHERE follower_id = u.id)::int AS following
     FROM admin_users u WHERE u.id = $1`,
    [userId]
  )

  if (!user) return NextResponse.json({ error: '用戶不存在' }, { status: 404 })

  // 讀取是否已追蹤
  const sessionToken = req.cookies.get('admin_session')?.value
  const auth = sessionToken ? await verifyToken(sessionToken).catch(() => null) : null
  let isFollowing = false
  if (auth?.sub && auth.sub !== userId) {
    const row = await queryOne<{ follower_id: string }>(
      `SELECT follower_id FROM user_follows WHERE follower_id = $1 AND following_id = $2`,
      [auth.sub, userId]
    )
    isFollowing = !!row
  }

  // 取最近貼文
  const posts = await query<{ id: string; type: string; title: string | null; content: string; created_at: string; likes_count: number; comments_count: number }>(
    `SELECT id, type, title, content, created_at, likes_count, comments_count
     FROM social_posts WHERE user_id = $1 AND status = 'published' AND is_public = true
     ORDER BY created_at DESC LIMIT 20`,
    [userId]
  )

  return NextResponse.json({
    id: user.id,
    name: user.display_name ?? user.username,
    avatar: user.avatar_url,
    bannerUrl: user.banner_url,
    profileTheme: user.profile_theme,
    bio: user.bio,
    websiteUrl: user.website_url,
    instagramHandle: user.instagram_handle,
    twitterHandle: user.twitter_handle,
    isProfilePublic: user.is_profile_public,
    followers: Number(user.followers),
    following: Number(user.following),
    isFollowing,
    posts: posts.map(p => ({
      id: p.id,
      type: p.type,
      title: p.title,
      content: p.content.slice(0, 200),
      createdAt: p.created_at,
      likesCount: p.likes_count,
      commentsCount: p.comments_count,
    })),
  })
}
