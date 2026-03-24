import { query, queryOne, execute } from '@/lib/db'

export interface StoryWallItem {
  responseId: string
  surveyTitle: string
  shareableOneLiner: string
  groupComparisons: string[]
  createdAt: string
  isPinned?: boolean
}

interface StoryWallRow extends Record<string, unknown> {
  id: string
  survey_title: string
  created_at: string
  is_pinned: boolean
}

interface CountRow extends Record<string, unknown> {
  total: string
}

/** 取得公開故事牆資料（僅 allow_story_wall = true 且 status = 'completed'） */
export async function getStoryWallItems(
  surveySlug: string,
  limit = 20,
  offset = 0
): Promise<StoryWallItem[]> {
  const rows = await query<StoryWallRow>(
    `SELECT r.id, s.title AS survey_title, r.created_at, r.is_pinned
     FROM responses r
     JOIN surveys s ON s.id = r.survey_id
     WHERE s.slug = $1
       AND r.allow_story_wall = true
       AND r.status = 'completed'
     ORDER BY r.is_pinned DESC, r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [surveySlug, limit, offset]
  )

  return rows.map((row) => ({
    responseId: row.id,
    surveyTitle: row.survey_title,
    shareableOneLiner: '在這裡分享了他的故事',
    groupComparisons: [],
    createdAt: String(row.created_at),
    isPinned: Boolean(row.is_pinned),
  }))
}

/** 取得故事牆總筆數（分頁用） */
export async function getStoryWallCount(surveySlug: string): Promise<number> {
  const row = await queryOne<CountRow>(
    `SELECT COUNT(*) AS total
     FROM responses r
     JOIN surveys s ON s.id = r.survey_id
     WHERE s.slug = $1
       AND r.allow_story_wall = true
       AND r.status = 'completed'`,
    [surveySlug]
  )
  return row ? parseInt(row.total, 10) : 0
}

/** 管理員：顯示或隱藏某篇故事（false = 設 allow_story_wall = false） */
export async function setStoryVisibility(responseId: string, visible: boolean): Promise<void> {
  await execute(
    `UPDATE responses SET allow_story_wall = $1 WHERE id = $2`,
    [visible, responseId]
  )
}

/** 管理員：置頂或取消置頂某篇故事 */
export async function pinStory(responseId: string, pinned: boolean): Promise<void> {
  await execute(
    `UPDATE responses SET is_pinned = $1 WHERE id = $2`,
    [pinned, responseId]
  )
}
