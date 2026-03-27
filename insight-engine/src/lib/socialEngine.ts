import { query, queryOne, execute } from '@/lib/db'

// ===== Types =====

export interface SocialPost {
  id: string
  tenantId: string
  userId: string
  type: 'post' | 'article'
  title: string | null
  content: string
  images: PostImage[]
  videoUrl?: string | null
  videoThumbnailUrl?: string | null
  tags: string[]
  status: 'published' | 'draft'
  isPublic: boolean
  likesCount: number
  commentsCount: number
  viewsCount: number
  createdAt: string
  updatedAt: string
  // joined
  authorName?: string
  authorAvatar?: string
  myReaction?: string | null
  isBookmarked?: boolean
}

export interface PostImage {
  url: string
  alt?: string
}

export interface SocialComment {
  id: string
  postId: string
  userId: string
  parentId: string | null
  content: string
  gifUrl: string | null
  createdAt: string
  updatedAt: string
  // joined
  authorName?: string
  authorAvatar?: string
  replies?: SocialComment[]
}

// ===== Posts =====

interface PostRow extends Record<string, unknown> {
  id: string
  tenant_id: string
  user_id: string
  type: string
  title: string | null
  content: string
  images: PostImage[] | null
  video_url: string | null
  video_thumbnail_url: string | null
  tags: string[] | null
  status: string
  is_public: boolean
  likes_count: number
  comments_count: number
  views_count: number
  created_at: string
  updated_at: string
  author_name: string | null
  author_avatar: string | null
  my_reaction: string | null
  is_bookmarked?: boolean
}

function rowToPost(row: PostRow): SocialPost {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    type: row.type as 'post' | 'article',
    title: row.title,
    content: row.content,
    images: (row.images as PostImage[]) ?? [],
    videoUrl: row.video_url,
    videoThumbnailUrl: row.video_thumbnail_url,
    tags: row.tags ?? [],
    status: row.status as 'published' | 'draft',
    isPublic: row.is_public,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    viewsCount: row.views_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: row.author_name ?? undefined,
    authorAvatar: row.author_avatar ?? undefined,
    myReaction: row.my_reaction,
    isBookmarked: row.is_bookmarked ?? false,
  }
}

export async function getPosts({
  tenantId,
  userId,
  viewerId,
  type,
  limit = 20,
  offset = 0,
}: {
  tenantId?: string
  userId?: string
  viewerId?: string
  type?: string
  limit?: number
  offset?: number
}): Promise<SocialPost[]> {
  const conditions: string[] = ['p.status = $1', 'p.is_public = true']
  const params: unknown[] = ['published']
  let i = 2

  if (tenantId) { conditions.push(`p.tenant_id = $${i++}`); params.push(tenantId) }
  if (userId) { conditions.push(`p.user_id = $${i++}`); params.push(userId) }
  if (type) { conditions.push(`p.type = $${i++}`); params.push(type) }

  let viewerReactionExpr = 'NULL::text AS my_reaction'
  let viewerBookmarkExpr = 'false AS is_bookmarked'
  if (viewerId) {
    viewerReactionExpr = `(SELECT type FROM social_reactions WHERE user_id = $${i++} AND post_id = p.id LIMIT 1) AS my_reaction`
    params.push(viewerId)
    viewerBookmarkExpr = `EXISTS(SELECT 1 FROM social_bookmarks sb WHERE sb.post_id = p.id AND sb.user_id = $${i++}) AS is_bookmarked`
    params.push(viewerId)
  }
  params.push(limit, offset)

  const rows = await query<PostRow>(
    `SELECT p.*,
      COALESCE(u.display_name, u.username) AS author_name,
      u.avatar_url AS author_avatar,
      ${viewerReactionExpr},
      ${viewerBookmarkExpr}
     FROM social_posts p
     JOIN admin_users u ON u.id = p.user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY p.created_at DESC
     LIMIT $${i} OFFSET $${i + 1}`,
    params
  )

  return rows.map(rowToPost)
}

export async function getPost(postId: string, viewerId?: string): Promise<SocialPost | null> {
  const params: unknown[] = [postId]
  let viewerReactionExpr = 'NULL::text AS my_reaction'
  let viewerBookmarkExpr = 'false AS is_bookmarked'
  if (viewerId) {
    viewerReactionExpr = `(SELECT type FROM social_reactions WHERE user_id = $2 AND post_id = p.id LIMIT 1) AS my_reaction`
    viewerBookmarkExpr = `EXISTS(SELECT 1 FROM social_bookmarks sb WHERE sb.post_id = p.id AND sb.user_id = $3) AS is_bookmarked`
    params.push(viewerId, viewerId)
  }

  const row = await queryOne<PostRow>(
    `SELECT p.*,
      COALESCE(u.display_name, u.username) AS author_name,
      u.avatar_url AS author_avatar,
      ${viewerReactionExpr},
      ${viewerBookmarkExpr}
     FROM social_posts p
     JOIN admin_users u ON u.id = p.user_id
     WHERE p.id = $1`,
    params
  )
  if (!row) return null

  await execute(`UPDATE social_posts SET views_count = views_count + 1 WHERE id = $1`, [postId])
  return rowToPost(row)
}

export async function createPost(data: {
  tenantId: string
  userId: string
  type: 'post' | 'article'
  title?: string
  content: string
  images?: PostImage[]
  videoUrl?: string
  videoThumbnailUrl?: string
  tags?: string[]
  isPublic?: boolean
  status?: 'published' | 'draft'
}): Promise<SocialPost> {
  const row = await queryOne<PostRow>(
    `INSERT INTO social_posts (tenant_id, user_id, type, title, content, images, video_url, video_thumbnail_url, tags, is_public, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *,
     (SELECT COALESCE(display_name, username) FROM admin_users WHERE id = $2) AS author_name,
     (SELECT avatar_url FROM admin_users WHERE id = $2) AS author_avatar,
     NULL::text AS my_reaction`,
    [
      data.tenantId, data.userId, data.type,
      data.title ?? null, data.content,
      JSON.stringify(data.images ?? []),
      data.videoUrl ?? null,
      data.videoThumbnailUrl ?? null,
      data.tags ?? [],
      data.isPublic ?? true,
      data.status ?? 'published',
    ]
  )
  return rowToPost(row!)
}

export async function updatePost(postId: string, userId: string, data: {
  title?: string
  content?: string
  images?: PostImage[]
  tags?: string[]
  isPublic?: boolean
  status?: string
}): Promise<SocialPost | null> {
  const fields: string[] = []
  const params: unknown[] = []
  let i = 1

  if (data.content !== undefined) { fields.push(`content = $${i++}`); params.push(data.content) }
  if (data.title !== undefined) { fields.push(`title = $${i++}`); params.push(data.title) }
  if (data.images !== undefined) { fields.push(`images = $${i++}`); params.push(JSON.stringify(data.images)) }
  if (data.tags !== undefined) { fields.push(`tags = $${i++}`); params.push(data.tags) }
  if (data.isPublic !== undefined) { fields.push(`is_public = $${i++}`); params.push(data.isPublic) }
  if (data.status !== undefined) { fields.push(`status = $${i++}`); params.push(data.status) }
  if (!fields.length) return getPost(postId)

  fields.push(`updated_at = NOW()`)
  params.push(postId, userId)

  const row = await queryOne<PostRow>(
    `UPDATE social_posts SET ${fields.join(', ')} WHERE id = $${i} AND user_id = $${i+1}
     RETURNING *,
     (SELECT COALESCE(display_name, username) FROM admin_users WHERE id = user_id) AS author_name,
     (SELECT avatar_url FROM admin_users WHERE id = user_id) AS author_avatar,
     NULL::text AS my_reaction`,
    params
  )
  return row ? rowToPost(row) : null
}

export async function deletePost(postId: string, userId: string): Promise<boolean> {
  const result = await queryOne<{ id: string }>(
    `DELETE FROM social_posts WHERE id = $1 AND user_id = $2 RETURNING id`,
    [postId, userId]
  )
  return !!result
}

// ===== Reactions =====

export async function toggleReaction(postId: string, userId: string, type: string): Promise<{ action: 'added' | 'removed' | 'changed'; likesCount: number }> {
  const existing = await queryOne<{ id: string; type: string }>(
    `SELECT id, type FROM social_reactions WHERE post_id = $1 AND user_id = $2`,
    [postId, userId]
  )

  if (existing) {
    if (existing.type === type) {
      await execute(`DELETE FROM social_reactions WHERE id = $1`, [existing.id])
      await execute(`UPDATE social_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1`, [postId])
      const p = await queryOne<{ likes_count: number }>(`SELECT likes_count FROM social_posts WHERE id = $1`, [postId])
      return { action: 'removed', likesCount: p?.likes_count ?? 0 }
    } else {
      await execute(`UPDATE social_reactions SET type = $1 WHERE id = $2`, [type, existing.id])
      const p = await queryOne<{ likes_count: number }>(`SELECT likes_count FROM social_posts WHERE id = $1`, [postId])
      return { action: 'changed', likesCount: p?.likes_count ?? 0 }
    }
  }

  await execute(`INSERT INTO social_reactions (post_id, user_id, type) VALUES ($1, $2, $3)`, [postId, userId, type])
  await execute(`UPDATE social_posts SET likes_count = likes_count + 1 WHERE id = $1`, [postId])
  const p = await queryOne<{ likes_count: number }>(`SELECT likes_count FROM social_posts WHERE id = $1`, [postId])
  return { action: 'added', likesCount: p?.likes_count ?? 0 }
}

// ===== Comments =====

interface CommentRow extends Record<string, unknown> {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  content: string
  gif_url: string | null
  created_at: string
  updated_at: string
  author_name: string | null
  author_avatar: string | null
}

function rowToComment(row: CommentRow): SocialComment {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    parentId: row.parent_id,
    content: row.content,
    gifUrl: row.gif_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorName: row.author_name ?? undefined,
    authorAvatar: row.author_avatar ?? undefined,
  }
}

export async function getComments(postId: string): Promise<SocialComment[]> {
  const rows = await query<CommentRow>(
    `SELECT c.*,
      COALESCE(u.display_name, u.username) AS author_name,
      u.avatar_url AS author_avatar
     FROM social_comments c
     JOIN admin_users u ON u.id = c.user_id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    [postId]
  )

  const comments = rows.map(rowToComment)
  const topLevel = comments.filter(c => !c.parentId)
  const byParent = new Map<string, SocialComment[]>()
  for (const c of comments) {
    if (c.parentId) {
      const arr = byParent.get(c.parentId) ?? []
      arr.push(c)
      byParent.set(c.parentId, arr)
    }
  }
  for (const c of topLevel) {
    c.replies = byParent.get(c.id) ?? []
  }
  return topLevel
}

export async function createComment(data: {
  postId: string
  userId: string
  content: string
  gifUrl?: string
  parentId?: string
}): Promise<SocialComment> {
  const row = await queryOne<CommentRow>(
    `INSERT INTO social_comments (post_id, user_id, content, gif_url, parent_id)
     VALUES ($1,$2,$3,$4,$5) RETURNING *,
     (SELECT COALESCE(display_name, username) FROM admin_users WHERE id = $2) AS author_name,
     (SELECT avatar_url FROM admin_users WHERE id = $2) AS author_avatar`,
    [data.postId, data.userId, data.content, data.gifUrl ?? null, data.parentId ?? null]
  )
  await execute(`UPDATE social_posts SET comments_count = comments_count + 1 WHERE id = $1`, [data.postId])
  return rowToComment(row!)
}

export async function deleteComment(commentId: string, userId: string): Promise<boolean> {
  const c = await queryOne<{ post_id: string }>(
    `DELETE FROM social_comments WHERE id = $1 AND user_id = $2 RETURNING post_id`, [commentId, userId]
  )
  if (c) await execute(`UPDATE social_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = $1`, [c.post_id])
  return !!c
}

// ===== Profile =====

export interface UserProfile {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  websiteUrl: string | null
  instagramHandle: string | null
  twitterHandle: string | null
  isProfilePublic: boolean
}

interface ProfileRow extends Record<string, unknown> {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  website_url: string | null
  instagram_handle: string | null
  twitter_handle: string | null
  is_profile_public: boolean
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const row = await queryOne<ProfileRow>(
    `SELECT id, username, display_name, avatar_url, bio, website_url, instagram_handle, twitter_handle, is_profile_public
     FROM admin_users WHERE id = $1`,
    [userId]
  )
  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    websiteUrl: row.website_url,
    instagramHandle: row.instagram_handle,
    twitterHandle: row.twitter_handle,
    isProfilePublic: row.is_profile_public ?? true,
  }
}

export async function updateProfile(userId: string, data: Partial<Omit<UserProfile, 'id' | 'username'>>): Promise<UserProfile | null> {
  const fields: string[] = []
  const params: unknown[] = []
  let i = 1

  if (data.displayName !== undefined) { fields.push(`display_name = $${i++}`); params.push(data.displayName) }
  if (data.avatarUrl !== undefined) { fields.push(`avatar_url = $${i++}`); params.push(data.avatarUrl) }
  if (data.bio !== undefined) { fields.push(`bio = $${i++}`); params.push(data.bio) }
  if (data.websiteUrl !== undefined) { fields.push(`website_url = $${i++}`); params.push(data.websiteUrl) }
  if (data.instagramHandle !== undefined) { fields.push(`instagram_handle = $${i++}`); params.push(data.instagramHandle) }
  if (data.twitterHandle !== undefined) { fields.push(`twitter_handle = $${i++}`); params.push(data.twitterHandle) }
  if (data.isProfilePublic !== undefined) { fields.push(`is_profile_public = $${i++}`); params.push(data.isProfilePublic) }
  if (!fields.length) return getProfile(userId)

  params.push(userId)
  await execute(`UPDATE admin_users SET ${fields.join(', ')} WHERE id = $${i}`, params)
  return getProfile(userId)
}
