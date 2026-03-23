import {
  getDashboardStats,
  getFunnelStats,
  getTagDistribution,
  getUtmAnalytics,
} from '@/lib/stats'
import type { AiKeyResult } from '@/lib/aiService'
import type { DashboardStats, TagDistribution, UtmAnalytics } from '@/types'
import type { FunnelStep } from '@/lib/stats'

// ===== 報告型別 =====

export interface InsightHighlight {
  type: 'positive' | 'negative' | 'neutral'
  title: string
  detail: string
}

export interface InsightRecommendation {
  priority: 'high' | 'medium' | 'low'
  action: string
  reason: string
}

export interface InsightReport {
  summary: string
  highlights: InsightHighlight[]
  recommendations: InsightRecommendation[]
  funnelInsight: string
  audienceInsight: string
}

// ===== 輔助格式化 =====

function formatSeconds(seconds: number): string {
  if (seconds <= 0) return '無資料'
  const minutes = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return minutes > 0 ? `${minutes} 分 ${secs} 秒` : `${secs} 秒`
}

function formatBasicMetrics(stats: DashboardStats): string {
  const lines = [
    '## 基本指標',
    `- 總填答數：${stats.totalResponses}`,
    `- 完成數：${stats.completedResponses}（完成率 ${(stats.completionRate * 100).toFixed(1)}%）`,
    `- 今日新增：${stats.todayResponses}`,
    `- 平均填答時間：${formatSeconds(stats.avgCompletionTime)}`,
    '',
    '## 近 7 日趨勢',
    stats.dailyTrend.slice(-7).map((d) => `${d.date}: ${d.count}`).join(', '),
    '',
    '## 回覆速度分佈',
    ...stats.responseVelocity.map((v) => `- ${v.bucket}: ${v.count} 份`),
    '',
    '## 數據品質',
    `- 品質分數：${stats.responseQuality.score}/100`,
    `- 開放題空白：${stats.responseQuality.issues.emptyTextAnswers} 份`,
    `- 回覆過短：${stats.responseQuality.issues.shortAnswers} 份`,
    `- 同答案模式：${stats.responseQuality.issues.samePattern} 份`,
  ]
  return lines.join('\n')
}

function formatFunnelSection(funnelSteps: FunnelStep[]): string {
  const hotspots = funnelSteps.filter((s) => s.isHotspot)
  if (hotspots.length === 0) return '## 漏斗分析\n無明顯高跳出率題目。'

  const lines = ['## 漏斗熱點（跳出率 > 20%）']
  for (const h of hotspots) {
    lines.push(
      `- 第 ${h.step + 1} 題「${h.questionContent.slice(0, 30)}」：跳出率 ${(h.dropOffRate * 100).toFixed(1)}%，流失 ${h.dropOff} 人`
    )
  }
  return lines.join('\n')
}

function formatTagSection(tagDist: TagDistribution[]): string {
  const topTags = tagDist.slice(0, 8)
  if (topTags.length === 0) return ''
  const lines = ['## 受眾標籤分佈（前 8）']
  for (const t of topTags) {
    lines.push(`- ${t.tagKey}=${t.tagValue}: ${t.count} 人`)
  }
  return lines.join('\n')
}

function formatUtmSection(utm: UtmAnalytics): string {
  const topSources = utm.bySources.slice(0, 5)
  if (topSources.length === 0) return ''
  const lines = ['## 流量來源（前 5）']
  for (const s of topSources) {
    lines.push(`- ${s.source}: ${s.total} 份（完成率 ${(s.completionRate * 100).toFixed(1)}%）`)
  }
  return lines.join('\n')
}

// ===== 建立摘要（壓縮成 ~2000 tokens 給 AI） =====

export async function buildInsightSummary(surveyId: string, tenantId: string): Promise<string> {
  const [stats, funnelSteps, tagDist, utm] = await Promise.all([
    getDashboardStats(tenantId, surveyId),
    getFunnelStats(tenantId, surveyId),
    getTagDistribution(tenantId, surveyId),
    getUtmAnalytics(tenantId, surveyId),
  ])

  return [
    formatBasicMetrics(stats),
    formatFunnelSection(funnelSteps),
    formatTagSection(tagDist),
    formatUtmSection(utm),
  ]
    .filter(Boolean)
    .join('\n\n')
}

// ===== AI 產生洞察報告 =====

const INSIGHT_SYSTEM_PROMPT = `你是問卷數據分析師。根據提供的問卷數據摘要，輸出結構化洞察報告。

回傳純 JSON（不加 markdown code block）：
{
  "summary": "2-3 句整體洞察摘要",
  "highlights": [
    { "type": "positive", "title": "重點標題", "detail": "具體說明" }
  ],
  "recommendations": [
    { "priority": "high", "action": "建議行動", "reason": "行動理由" }
  ],
  "funnelInsight": "針對漏斗數據的洞察（若無資料則說明）",
  "audienceInsight": "針對受眾標籤的洞察（若無資料則說明）"
}

規則：
- highlights 類型：positive（正向）/ negative（需改善）/ neutral（觀察）
- priority 等級：high / medium / low
- highlights 最多 5 條，recommendations 最多 5 條
- 全部用繁體中文
- 洞察要具體，結合數字，避免空話`

async function callAiForInsight(
  aiKey: AiKeyResult,
  summary: string
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  if (aiKey.provider === 'anthropic') {
    return callAnthropic(aiKey.apiKey, aiKey.model, summary)
  }
  return callOpenAI(aiKey.apiKey, aiKey.model, summary)
}

async function callOpenAI(
  apiKey: string,
  model: string,
  summary: string
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
        { role: 'user', content: summary },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `OpenAI API 回傳 ${res.status}`)
  }

  const data = await res.json() as {
    choices?: { message?: { content?: string } }[]
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
  }
}

async function callAnthropic(
  apiKey: string,
  model: string,
  summary: string
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system: INSIGHT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: summary }],
      temperature: 0.5,
      max_tokens: 2000,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `Anthropic API 回傳 ${res.status}`)
  }

  const data = await res.json() as {
    content?: { text?: string }[]
    usage?: { input_tokens?: number; output_tokens?: number }
  }
  return {
    content: data.content?.[0]?.text ?? '',
    promptTokens: data.usage?.input_tokens ?? 0,
    completionTokens: data.usage?.output_tokens ?? 0,
  }
}

function parseInsightReport(raw: string): InsightReport {
  let jsonStr = raw.trim()

  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim()

  const objectMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (objectMatch) jsonStr = objectMatch[0]

  const parsed = JSON.parse(jsonStr) as InsightReport
  if (!parsed.summary || !Array.isArray(parsed.highlights)) {
    throw new Error('AI 回傳格式不符')
  }
  return parsed
}

export async function generateInsightReport(
  summary: string,
  aiKey: AiKeyResult
): Promise<{ report: InsightReport; promptTokens: number; completionTokens: number }> {
  const result = await callAiForInsight(aiKey, summary)
  const report = parseInsightReport(result.content)
  return { report, promptTokens: result.promptTokens, completionTokens: result.completionTokens }
}
