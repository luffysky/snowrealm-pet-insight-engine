import { NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { sendProactivePush } from '@/lib/proactive/pushEngine'
import { executeSkill, pushSkillResult } from '@/lib/skills/skillEngine'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/yukirin-agent
 * 每小時執行：雪凜自主行動引擎
 */
export async function GET(): Promise<NextResponse> {
  try {
    let actions = 0

    // ① 取得最近 24 小時活躍使用者
    const activeUsers = await getRecentActiveUsers()

    for (const user of activeUsers) {
      // 成就快達成檢查
      const achievResult = await executeSkill('achievement_coach', { userId: user.id, trigger: 'auto' })
      if (achievResult.executed) {
        await pushSkillResult(user.id, achievResult, 'achievement_coach')
        actions++
      }

      // Z 幣目標達成檢查
      const zcoinResult = await executeSkill('zcoin_goal_tracker', { userId: user.id, trigger: 'auto' })
      if (zcoinResult.executed) {
        await pushSkillResult(user.id, zcoinResult, 'zcoin_goal_tracker')
        actions++
      }

      // 問卷填完一週後追蹤
      const weekOldSurveys = await getResultsFromDaysAgo(user.id, 7)
      for (const result of weekOldSurveys) {
        await sendProactivePush({
          userId: user.id,
          channel: 'line',
          message: `一週前你填了「${result.surveyTitle}」還記得嗎？現在回頭看那個結果，你覺得準嗎～`,
          mood: 'thinking',
          action: { type: 'navigate', target: `/done?id=${result.id}` },
          priority: 'low',
          triggerType: 'survey_followup',
          triggerSkill: 'survey_reminder',
        })
        await markFollowupSent(result.id)
        actions++
      }
    }

    // ② 回歸使用者（3 天沒登入）
    const inactiveUsers = await getInactiveUsers(3)
    for (const user of inactiveUsers) {
      await sendProactivePush({
        userId: user.id,
        channel: 'line',
        message: '你是不是把我忘了 (´;ω;`) 最近有新問卷上架了欸～快來看看！',
        mood: 'sad',
        action: { type: 'navigate', target: '/' },
        priority: 'low',
        triggerType: 'comeback',
      })
      actions++
    }

    // ③ 趨勢偵測
    const trending = await detectTrendingSurveys()
    if (trending) {
      // 廣播給活躍使用者（上限 20 人）
      const targets = activeUsers.slice(0, 20)
      for (const user of targets) {
        await sendProactivePush({
          userId: user.id,
          channel: 'line',
          message: `最近大家都在聊「${trending.title}」！已經有 ${trending.count} 人參與了，你要不要也來試試？`,
          mood: 'excited',
          action: { type: 'navigate', target: '/' },
          priority: 'low',
          triggerType: 'trending',
          triggerSkill: 'trending_detector',
        })
      }
      if (targets.length > 0) actions += targets.length
    }

    // ④ AI 成本看門狗
    await checkAiCostBudget()

    return NextResponse.json({ ok: true, actions })
  } catch (err) {
    console.error('[yukirin-agent] Error:', err)
    return NextResponse.json({ error: '自主行動引擎錯誤' }, { status: 500 })
  }
}

async function getRecentActiveUsers(): Promise<Array<{ id: string }>> {
  try {
    return query<{ id: string }>(
      `SELECT DISTINCT au.id
       FROM admin_users au
       JOIN activity_log al ON al.user_id = au.id
       WHERE al.created_at >= NOW() - INTERVAL '24 hours'
       LIMIT 50`
    )
  } catch {
    return []
  }
}

async function getInactiveUsers(days: number): Promise<Array<{ id: string }>> {
  try {
    return query<{ id: string }>(
      `SELECT au.id
       FROM admin_users au
       WHERE au.id NOT IN (
         SELECT DISTINCT user_id FROM activity_log
         WHERE created_at >= NOW() - INTERVAL '${days} days'
         AND user_id IS NOT NULL
       )
       AND au.created_at <= NOW() - INTERVAL '${days} days'
       LIMIT 30`
    )
  } catch {
    return []
  }
}

async function getResultsFromDaysAgo(
  userId: string,
  days: number
): Promise<Array<{ id: string; surveyTitle: string }>> {
  try {
    return query<{ id: string; surveyTitle: string }>(
      `SELECT r.id, s.title AS "surveyTitle"
       FROM responses r
       JOIN surveys s ON s.id = r.survey_id
       WHERE r.user_id = $1
         AND r.status = 'completed'
         AND r.submitted_at::date = CURRENT_DATE - INTERVAL '${days} days'
         AND (r.followup_sent IS NULL OR r.followup_sent = false)
       LIMIT 3`,
      [userId]
    )
  } catch {
    return []
  }
}

async function markFollowupSent(responseId: string): Promise<void> {
  try {
    await execute(
      `UPDATE responses SET followup_sent = true WHERE id = $1`,
      [responseId]
    )
  } catch {
    // non-fatal
  }
}

async function detectTrendingSurveys(): Promise<{ title: string; count: number } | null> {
  try {
    const row = await queryOne<{ title: string; count: string }>(
      `SELECT s.title, COUNT(r.id)::text AS count
       FROM responses r
       JOIN surveys s ON s.id = r.survey_id
       WHERE r.created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY s.id, s.title
       HAVING COUNT(r.id) >= 10
       ORDER BY COUNT(r.id) DESC
       LIMIT 1`
    )
    if (!row) return null
    return { title: row.title, count: parseInt(row.count, 10) }
  } catch {
    return null
  }
}

async function checkAiCostBudget(): Promise<void> {
  try {
    const row = await queryOne<{ month_total: string; budget: string }>(
      `SELECT
         COALESCE(SUM(total_cost_usd), 0)::text AS month_total,
         '100'::text AS budget
       FROM ai_cost_log
       WHERE created_at >= date_trunc('month', NOW())`
    )
    if (!row) return

    const pct = (parseFloat(row.month_total) / parseFloat(row.budget)) * 100
    if (pct < 80) return

    // 通知管理員（透過 pushLineMessage）
    const { pushLineMessage } = await import('@/lib/line')
    await pushLineMessage([{
      type: 'text',
      text: `⚠️ 成本看門狗：AI 費用已達本月預算的 ${pct.toFixed(1)}%！已花費 $${parseFloat(row.month_total).toFixed(2)}，預算 $${row.budget}。`,
    }])
  } catch {
    // non-fatal
  }
}
