// lib/skills/skillEngine.ts — 雪凜技能執行引擎

import { query, queryOne, execute } from '@/lib/db'
import { getPlatformKey } from '@/lib/aiService'
import { sendProactivePush, buildYukirinFlexMessage, sendLineUserPush, getLineUserIdFromPlatformId } from '@/lib/proactive/pushEngine'

// ── 技能定義 ──────────────────────────────────────────────────────────────

export interface Skill {
  id: string
  name: string
  description: string
  trigger: 'chat' | 'auto' | 'scheduled' | 'event'
  enabled: boolean
}

export interface SkillResult {
  executed: boolean
  message?: string
  mood?: string
  action?: { type: string; target: string }
}

export const BUILTIN_SKILLS: Skill[] = [
  { id: 'survey_recommend',    name: '問卷推薦師',   description: '根據歷史推薦問卷',         trigger: 'chat',      enabled: true },
  { id: 'survey_reminder',     name: '問卷追蹤員',   description: '填完一週後追問感受',       trigger: 'scheduled', enabled: true },
  { id: 'result_comparator',   name: '結果比較師',   description: '比較不同時期的結果',       trigger: 'chat',      enabled: true },
  { id: 'social_digest',       name: '社群摘要師',   description: '整理熱門故事和話題',       trigger: 'scheduled', enabled: true },
  { id: 'trending_detector',   name: '趨勢偵測員',   description: '爆量問卷即時通知',         trigger: 'event',     enabled: true },
  { id: 'story_coach',         name: '故事教練',     description: '引導分享更好的故事',       trigger: 'chat',      enabled: true },
  { id: 'zcoin_advisor',       name: 'Z 幣理財師',   description: '追蹤 Z 幣收支建議',        trigger: 'chat',      enabled: true },
  { id: 'zcoin_goal_tracker',  name: 'Z 幣目標追蹤', description: '追蹤購買目標進度',         trigger: 'auto',      enabled: true },
  { id: 'shop_alert',          name: '商城新品通知', description: '新品上架或限定下架通知',   trigger: 'event',     enabled: true },
  { id: 'weekly_reporter',     name: '週報生成師',   description: '每週個人化成長週報',       trigger: 'scheduled', enabled: true },
  { id: 'achievement_coach',   name: '成就教練',     description: '距下一成就差距鼓勵',       trigger: 'auto',      enabled: true },
  { id: 'mood_tracker',        name: '心情追蹤師',   description: '從對話追蹤情緒趨勢',       trigger: 'auto',      enabled: true },
  { id: 'personality_evolution', name: '性格進化師', description: '追蹤多次問卷性格變化',     trigger: 'scheduled', enabled: true },
  { id: 'reminder',            name: '提醒小助手',   description: '設定任何提醒',             trigger: 'chat',      enabled: true },
  { id: 'daily_task_master',   name: '每日任務大師', description: '每天三個小任務引導探索',   trigger: 'scheduled', enabled: true },
  { id: 'greeting_master',     name: '問候大師',     description: '個人化問候生成',           trigger: 'auto',      enabled: true },
  { id: 'admin_morning_brief', name: '老闆晨報',     description: '每天給管理員平台摘要',     trigger: 'scheduled', enabled: true },
  { id: 'anomaly_detector',    name: '異常偵測員',   description: '可疑行為主動通知管理員',   trigger: 'event',     enabled: true },
  { id: 'cost_watchdog',       name: '成本看門狗',   description: 'AI 成本接近預算預警',      trigger: 'auto',      enabled: true },
]

/** 取得技能啟用狀態（從 DB） */
export async function getEnabledSkills(): Promise<Set<string>> {
  try {
    const rows = await query<{ skill_id: string; enabled: boolean }>(
      `SELECT skill_id, enabled FROM skill_settings`
    )
    const enabled = new Set<string>()
    for (const row of rows) {
      if (row.enabled) enabled.add(row.skill_id)
    }
    // fallback: 如果 DB 沒有資料，全部啟用
    if (enabled.size === 0) BUILTIN_SKILLS.forEach(s => enabled.add(s.id))
    return enabled
  } catch {
    return new Set(BUILTIN_SKILLS.map(s => s.id))
  }
}

// ── AI 呼叫工具 ───────────────────────────────────────────────────────────

async function callYukirinAI(systemPrompt: string, userContent: string, maxTokens = 200): Promise<string> {
  const aiKey = getPlatformKey()
  if (!aiKey) return ''

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiKey.apiKey}`,
      },
      body: JSON.stringify({
        model: aiKey.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: maxTokens,
        temperature: 0.8,
      }),
    })
    if (!res.ok) return ''
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
    return data.choices?.[0]?.message?.content?.trim() ?? ''
  } catch {
    return ''
  }
}

// ── 個別技能實作 ─────────────────────────────────────────────────────────

async function recommendSurvey(userId: string): Promise<SkillResult> {
  try {
    const history = await query<{ title: string }>(
      `SELECT s.title FROM responses r
       JOIN surveys s ON s.id = r.survey_id
       WHERE r.user_id = $1 AND r.status = 'completed'
       ORDER BY r.submitted_at DESC LIMIT 5`,
      [userId]
    )
    const available = await query<{ id: string; title: string; subtitle: string }>(
      `SELECT id, title, subtitle FROM surveys WHERE status = 'active' LIMIT 10`
    )
    if (available.length === 0) return { executed: false }

    const historyText = history.map(h => h.title).join('、') || '（尚未填過）'
    const surveysText = available.map(s => `${s.title}（${s.subtitle ?? ''}）`).join('、')

    const prompt = `你是雪凜，SnowRealm Insight 的 AI 嚮導。個性活潑溫暖，說繁體中文口語。根據使用者的填答歷史，推薦 1 份最適合的問卷，說明為什麼適合，不超過 60 字。`
    const text = await callYukirinAI(prompt, `填過：${historyText}\n可選問卷：${surveysText}`, 150)
    if (!text) return { executed: false }

    return {
      executed: true,
      message: text,
      mood: 'excited',
      action: { type: 'navigate', target: '/' },
    }
  } catch {
    return { executed: false }
  }
}

async function adviseZcoin(userId: string): Promise<SkillResult> {
  try {
    const balance = await queryOne<{ balance: number }>(
      `SELECT COALESCE(SUM(CASE WHEN type = 'earn' THEN amount ELSE -amount END), 0) AS balance
       FROM zcoin_transactions WHERE user_id = $1`,
      [userId]
    )
    const bal = balance?.balance ?? 0
    const text = `你現在有 ${bal} Z幣喔～ 要不要去商城看看有什麼可以換？`
    return { executed: true, message: text, mood: 'happy', action: { type: 'navigate', target: '/shop' } }
  } catch {
    return { executed: false }
  }
}

async function checkAchievementProgress(userId: string): Promise<SkillResult> {
  try {
    const responseCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM responses WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    )
    const count = parseInt(responseCount?.count ?? '0', 10)

    const MILESTONES = [1, 5, 10, 25, 50, 100]
    const nextMilestone = MILESTONES.find(m => m > count)
    if (!nextMilestone) return { executed: false }

    const remaining = nextMilestone - count
    if (remaining > 2) return { executed: false }

    const text = `欸！你離「填答達人 ${nextMilestone} 份」只差 ${remaining} 份了！再填一份就達成了嗎？`
    return { executed: true, message: text, mood: 'excited', action: { type: 'navigate', target: '/' } }
  } catch {
    return { executed: false }
  }
}

async function generateSocialDigest(): Promise<SkillResult> {
  try {
    const trending = await query<{ title: string; count: string }>(
      `SELECT s.title, COUNT(r.id)::text AS count
       FROM responses r
       JOIN surveys s ON s.id = r.survey_id
       WHERE r.created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY s.id, s.title
       ORDER BY COUNT(r.id) DESC
       LIMIT 3`
    )
    if (trending.length === 0) return { executed: false }

    const top = trending[0]
    const text = `今天社群上最熱的話題是「${top.title}」！已經有 ${top.count} 人參與了耶～你也來看看？`
    return { executed: true, message: text, mood: 'excited', action: { type: 'navigate', target: '/' } }
  } catch {
    return { executed: false }
  }
}

async function generateMorningBrief(): Promise<SkillResult> {
  try {
    const stats = await queryOne<{ total: string; today: string; new_users: string }>(
      `SELECT
         (SELECT COUNT(*)::text FROM responses WHERE status = 'completed') AS total,
         (SELECT COUNT(*)::text FROM responses WHERE created_at >= CURRENT_DATE) AS today,
         (SELECT COUNT(*)::text FROM admin_users WHERE created_at >= CURRENT_DATE) AS new_users`
    )
    if (!stats) return { executed: false }

    const text = `老闆早～ 昨天共 ${stats.total} 份問卷，今日新增 ${stats.today} 份，新用戶 ${stats.new_users} 人。雪凜在這裡等你！`
    return { executed: true, message: text, mood: 'happy' }
  } catch {
    return { executed: false }
  }
}

async function checkZcoinGoals(userId: string): Promise<SkillResult> {
  try {
    const balance = await queryOne<{ balance: number }>(
      `SELECT COALESCE(SUM(CASE WHEN type = 'earn' THEN amount ELSE -amount END), 0) AS balance
       FROM zcoin_transactions WHERE user_id = $1`,
      [userId]
    )
    const bal = balance?.balance ?? 0

    const goal = await queryOne<{ item_name: string; target_amount: number }>(
      `SELECT item_name, target_amount FROM zcoin_goals
       WHERE user_id = $1 AND achieved = false
       ORDER BY created_at ASC LIMIT 1`,
      [userId]
    )
    if (!goal || bal < goal.target_amount) return { executed: false }

    // 標記達成
    await execute(
      `UPDATE zcoin_goals SET achieved = true WHERE user_id = $1 AND item_name = $2`,
      [userId, goal.item_name]
    )

    const text = `欸！你的 Z 幣夠買「${goal.item_name}」了！快去商城看看吧～`
    return { executed: true, message: text, mood: 'excited', action: { type: 'navigate', target: '/shop' } }
  } catch {
    return { executed: false }
  }
}

// ── 主執行函式 ────────────────────────────────────────────────────────────

export async function executeSkill(
  skillId: string,
  context: { userId: string; trigger: string; data?: Record<string, unknown> }
): Promise<SkillResult> {
  const enabledSkills = await getEnabledSkills()
  if (!enabledSkills.has(skillId)) return { executed: false }

  switch (skillId) {
    case 'survey_recommend':
      return recommendSurvey(context.userId)
    case 'zcoin_advisor':
      return adviseZcoin(context.userId)
    case 'achievement_coach':
      return checkAchievementProgress(context.userId)
    case 'social_digest':
      return generateSocialDigest()
    case 'admin_morning_brief':
      return generateMorningBrief()
    case 'zcoin_goal_tracker':
      return checkZcoinGoals(context.userId)
    default:
      return { executed: false }
  }
}

/** 為使用者執行 chat-triggered 技能（從對話偵測意圖） */
export async function executeSkillFromChat(
  message: string,
  userId: string
): Promise<SkillResult | null> {
  const msg = message.toLowerCase()

  if (/推薦.{0,5}問卷|有什麼問卷|填什麼/.test(msg)) {
    return executeSkill('survey_recommend', { userId, trigger: 'chat' })
  }
  if (/z幣|zcoin|幾點|餘額|有多少/.test(msg)) {
    return executeSkill('zcoin_advisor', { userId, trigger: 'chat' })
  }
  if (/成就|達成|進度/.test(msg)) {
    return executeSkill('achievement_coach', { userId, trigger: 'chat' })
  }

  return null
}

/** 批量推送技能結果給使用者（LINE） */
export async function pushSkillResult(
  userId: string,
  result: SkillResult,
  skillId: string
): Promise<void> {
  if (!result.executed || !result.message) return

  const lineUserId = await getLineUserIdFromPlatformId(userId)
  if (!lineUserId) return

  const flexMsg = buildYukirinFlexMessage(result.message, result.mood ?? 'happy', result.action) as Record<string, unknown>
  await sendLineUserPush(lineUserId, [flexMsg])

  // 記錄推送
  try {
    await execute(
      `INSERT INTO push_log (user_id, channel, message, mood, trigger_type, trigger_skill)
       VALUES ($1, 'line', $2, $3, 'skill', $4)`,
      [userId, result.message, result.mood ?? 'happy', skillId]
    )
  } catch {
    // non-fatal
  }
}
