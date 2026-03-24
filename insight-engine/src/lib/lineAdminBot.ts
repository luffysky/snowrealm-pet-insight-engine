/**
 * LINE 管理員數據查詢 Bot
 * Insight Bot (@762wxvfb) 的管理員指令處理器
 */

import { queryOne } from '@/lib/db'
import { getDashboardStats, getFunnelStats, getTagDistribution } from '@/lib/stats'
import type { FunnelStep } from '@/lib/stats'
import type { TagDistribution, DashboardStats } from '@/types'

export interface LineMessage {
  type: string
  [key: string]: unknown
}

const NO_PRIMARY_SURVEY_MSG: LineMessage = {
  type: 'text',
  text: '⚠️ 找不到主要問卷，請先在後台設定主問卷',
}

// ===== 身份驗證 =====

/** 確認 LINE 用戶是否為已啟用的管理員 */
export async function isLineAdmin(lineUserId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM line_admins WHERE line_user_id = $1 AND active = true`,
    [lineUserId]
  )
  return !!row
}

// ===== 主問卷查詢 =====

async function getPrimarySurveyId(tenantId: string): Promise<string | null> {
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM surveys WHERE tenant_id = $1 AND is_primary = true LIMIT 1`,
    [tenantId]
  )
  return row?.id ?? null
}

// ===== 格式化工具 =====

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (mins === 0) return `${secs} 秒`
  return `${mins} 分 ${secs} 秒`
}

function formatCompletionRate(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

// ===== 指令處理器 =====

async function handleDailyReport(surveyId: string, tenantId: string): Promise<LineMessage> {
  const stats: DashboardStats = await getDashboardStats(tenantId, surveyId)
  const timeDisplay = stats.avgCompletionTime > 0
    ? formatSeconds(stats.avgCompletionTime)
    : 'N/A'

  const text = [
    '📊 今日問卷報告',
    '',
    `📝 總回覆：${stats.totalResponses} 筆`,
    `✅ 今日新增：${stats.todayResponses} 筆`,
    `📈 完成率：${formatCompletionRate(stats.completionRate)}`,
    `⏱ 平均填答：${timeDisplay}`,
  ].join('\n')

  return { type: 'text', text }
}

async function handleFunnel(surveyId: string, tenantId: string): Promise<LineMessage> {
  const steps: FunnelStep[] = await getFunnelStats(tenantId, surveyId)
  if (steps.length === 0) {
    return { type: 'text', text: '🔽 漏斗分析\n\n尚無足夠數據產生漏斗分析。' }
  }

  const sortedByDropOff = [...steps]
    .sort((a, b) => b.dropOffRate - a.dropOffRate)
    .slice(0, 3)

  const lines = ['🔽 漏斗分析 Top 3 落點', '']
  for (const step of sortedByDropOff) {
    const hotspot = step.isHotspot ? ' 🔥' : ''
    const dropPct = Math.round(step.dropOffRate * 100)
    lines.push(`${step.questionContent}：離開率 ${dropPct}%${hotspot}`)
  }

  return { type: 'text', text: lines.join('\n') }
}

async function handleTags(surveyId: string, tenantId: string): Promise<LineMessage> {
  const tags: TagDistribution[] = await getTagDistribution(tenantId, surveyId)
  if (tags.length === 0) {
    return { type: 'text', text: '🏷 標籤分布\n\n尚無標籤數據。' }
  }

  const total = tags.reduce((sum, t) => sum + t.count, 0)
  const top5 = tags.slice(0, 5)

  const lines = ['🏷 標籤分布 Top 5', '']
  for (const tag of top5) {
    const pct = total > 0 ? Math.round((tag.count / total) * 100) : 0
    lines.push(`${tag.tagKey}/${tag.tagValue}：${tag.count} 人 (${pct}%)`)
  }

  return { type: 'text', text: lines.join('\n') }
}

// ===== 公開 API =====

/**
 * 處理管理員指令，回傳 LINE 訊息陣列
 * 若指令無法辨識，回傳 null（由呼叫端處理 fallthrough）
 */
export async function handleAdminCommand(
  lineUserId: string,
  text: string,
  tenantId: string
): Promise<LineMessage[] | null> {
  const trimmed = text.trim()
  const isDailyReport = /^(今日報告|今天)$/.test(trimmed)
  const isFunnel = /^漏斗$/.test(trimmed)
  const isTags = /^標籤$/.test(trimmed)

  if (!isDailyReport && !isFunnel && !isTags) return null

  const surveyId = await getPrimarySurveyId(tenantId)
  if (!surveyId) return [NO_PRIMARY_SURVEY_MSG]

  try {
    if (isDailyReport) {
      const msg = await handleDailyReport(surveyId, tenantId)
      return [msg]
    }
    if (isFunnel) {
      const msg = await handleFunnel(surveyId, tenantId)
      return [msg]
    }
    if (isTags) {
      const msg = await handleTags(surveyId, tenantId)
      return [msg]
    }
  } catch (err) {
    console.error('[lineAdminBot] handleAdminCommand error:', err)
    return [{ type: 'text', text: '⚠️ 查詢時發生錯誤，請稍後再試。' }]
  }

  return null
}
