import { query, queryOne } from '@/lib/db'
import type { AiKeyResult } from '@/lib/aiService'

// ===== 型別 =====

export interface StoryInsightReport {
  storyTitle: string
  storyBody: string         // 500-800 字 markdown 敘事（繁體中文）
  pullQuotes: string[]      // 2-3 段匿名開放題引言
  keyDataPoints: string[]   // 3-5 條數據支撐的句子
  unexpectedInsight: string // 一個出人意料的發現
  shareableOneLiner: string // 一句可分享的標語
}

// ===== DB 查詢 =====

interface OpenTextAnswerRow extends Record<string, unknown> {
  value: unknown
}

interface SurveyStatsRow extends Record<string, unknown> {
  total: string
  completed: string
}

/** 取得該問卷的開放題回覆樣本（最多 50 筆，過濾空白和過短內容） */
export async function getOpenTextSamples(
  surveyId: string,
  tenantId: string
): Promise<string[]> {
  const rows = await query<OpenTextAnswerRow>(
    `SELECT a.value
     FROM answers a
     JOIN responses r ON r.id = a.response_id
     JOIN questions q ON q.survey_id = r.survey_id AND q.key = a.question_key
     WHERE r.survey_id = $1
       AND r.tenant_id = $2
       AND r.status = 'completed'
       AND q.type = 'text'
     ORDER BY r.submitted_at DESC
     LIMIT 50`,
    [surveyId, tenantId]
  )

  return rows
    .map((row) => {
      if (typeof row.value === 'string') return row.value
      if (Array.isArray(row.value)) return (row.value as string[]).join('、')
      return String(row.value ?? '')
    })
    .map((text) => text.trim())
    .filter((text) => text.length >= 5)
}

// ===== AI 呼叫（沿用 insightEngine.ts 的模式） =====

const STORY_SYSTEM_PROMPT = `你是一位擅長從數據中提煉人文故事的作者。
根據問卷數據與填答者的真實回覆，產出一份故事驅動的洞察報告。

核心原則：
- 先講故事，再放數字（故事是血肉，數據是骨架）
- 從開放題挑 2-3 個最有故事性的匿名引言
- 結尾給可行動的洞察，不只是數據結論
- 全部用繁體中文輸出
- storyBody 約 500-800 字，用 markdown 格式（段落間空一行）

回傳純 JSON（不加 markdown code block）：
{
  "storyTitle": "一個吸引人的標題（10-20 字）",
  "storyBody": "故事敘事正文（約 500-800 字 markdown）",
  "pullQuotes": ["引言 1（直接引用填答者的話，匿名）", "引言 2"],
  "keyDataPoints": ["數據句 1（含具體數字）", "數據句 2", "數據句 3"],
  "unexpectedInsight": "一個出人意料的發現（1-2 句）",
  "shareableOneLiner": "一句可分享到社群的標語（15 字以內）"
}

規則：
- pullQuotes 必須是填答者的原話或接近原話，不可捏造
- 如果開放題回覆不足，pullQuotes 可以少於 2 條
- keyDataPoints 必須有數字支撐
- shareableOneLiner 要有感情，不要只是數字`

async function callOpenAI(
  apiKey: string,
  model: string,
  userContent: string
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: STORY_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 2500,
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
  userContent: string
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
      system: STORY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
      temperature: 0.7,
      max_tokens: 2500,
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

// ===== 輸出驗證 =====

function parseStoryReport(raw: string): StoryInsightReport {
  let jsonStr = raw.trim()

  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim()

  const objectMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (objectMatch) jsonStr = objectMatch[0]

  const parsed = JSON.parse(jsonStr) as StoryInsightReport

  if (!parsed.storyTitle || !parsed.storyBody) {
    throw new Error('AI 回傳格式不符：缺少 storyTitle 或 storyBody')
  }
  if (!Array.isArray(parsed.pullQuotes)) parsed.pullQuotes = []
  if (!Array.isArray(parsed.keyDataPoints)) parsed.keyDataPoints = []
  if (!parsed.unexpectedInsight) parsed.unexpectedInsight = ''
  if (!parsed.shareableOneLiner) parsed.shareableOneLiner = ''

  return parsed
}

// ===== 建立給 AI 的 prompt 內容 =====

async function buildStoryPromptContent(
  surveyId: string,
  tenantId: string,
  openTextSamples: string[]
): Promise<string> {
  const statsRow = await queryOne<SurveyStatsRow>(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE status = 'completed') AS completed
     FROM responses
     WHERE survey_id = $1 AND tenant_id = $2`,
    [surveyId, tenantId]
  )

  const total = Number(statsRow?.total ?? 0)
  const completed = Number(statsRow?.completed ?? 0)
  const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0'

  const lines: string[] = [
    '## 問卷基本數據',
    `- 總填答數：${total} 筆`,
    `- 完成數：${completed} 筆（完成率 ${completionRate}%）`,
    '',
  ]

  if (openTextSamples.length > 0) {
    lines.push('## 填答者的真實聲音（開放題回覆，最多 50 筆）')
    openTextSamples.forEach((text, i) => {
      lines.push(`${i + 1}. 「${text}」`)
    })
  } else {
    lines.push('## 開放題回覆')
    lines.push('（本問卷無開放題回覆，請根據基本數據發揮故事性敘事）')
  }

  lines.push('')
  lines.push('請根據以上資料，產出一份故事驅動的洞察報告。')

  return lines.join('\n')
}

// ===== 主函式 =====

/** 生成故事洞察報告（約 $0.005/份） */
export async function generateStoryInsight(
  surveyId: string,
  tenantId: string,
  aiKey: AiKeyResult
): Promise<{ report: StoryInsightReport; promptTokens: number; completionTokens: number }> {
  const openTextSamples = await getOpenTextSamples(surveyId, tenantId)
  const promptContent = await buildStoryPromptContent(surveyId, tenantId, openTextSamples)

  const result =
    aiKey.provider === 'anthropic'
      ? await callAnthropic(aiKey.apiKey, aiKey.model, promptContent)
      : await callOpenAI(aiKey.apiKey, aiKey.model, promptContent)

  const report = parseStoryReport(result.content)

  return {
    report,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
  }
}
