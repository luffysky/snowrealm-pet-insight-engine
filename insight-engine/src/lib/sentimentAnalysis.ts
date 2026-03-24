/**
 * 開放題情感分析
 * 批次呼叫 AI 分析問卷文字回覆的情感傾向與關鍵字
 */

import { query } from '@/lib/db'

// ===== 型別 =====

export interface SentimentResult {
  /** 正面情感百分比（0-100） */
  positive: number
  /** 負面情感百分比（0-100） */
  negative: number
  /** 中性情感百分比（0-100） */
  neutral: number
  topKeywords: string[]
  samplePositive: string
  sampleNegative: string
}

interface AiKey {
  apiKey: string
  model: string
  provider: string
}

interface AnswerRow extends Record<string, unknown> {
  value: string
}

// ===== 常數 =====

const BATCH_SIZE = 50
const MAX_RESPONSES = 500

// ===== DB 查詢 =====

/** 取得指定問卷的所有文字開放題回覆 */
export async function getOpenTextResponses(
  surveyId: string,
  tenantId: string
): Promise<string[]> {
  const rows = await query<AnswerRow>(
    `SELECT a.value FROM answers a
     JOIN responses r ON a.response_id = r.id
     JOIN questions q ON q.survey_id = r.survey_id AND q.key = a.question_key
     WHERE r.survey_id = $1
       AND r.tenant_id = $2
       AND q.type = 'text'
       AND r.status = 'completed'
     ORDER BY r.submitted_at DESC
     LIMIT ${MAX_RESPONSES}`,
    [surveyId, tenantId]
  )

  return rows
    .map((row) => {
      try {
        const parsed = JSON.parse(row.value)
        if (typeof parsed === 'string') return parsed.trim()
        if (Array.isArray(parsed) && typeof parsed[0] === 'string') return String(parsed[0]).trim()
        return String(parsed).trim()
      } catch {
        return String(row.value).trim()
      }
    })
    .filter((text) => text.length > 0)
}

// ===== AI 呼叫（私有）=====

function buildSentimentPrompt(texts: string[]): string {
  const list = texts.join('\n---\n')
  return `分析以下問卷開放題回覆的情感傾向和關鍵字。
回傳純 JSON（不要 markdown）：
{"sentiment":{"positive":65,"negative":15,"neutral":20},"topKeywords":["關鍵字1","關鍵字2"],"samplePositive":"正面範例","sampleNegative":"負面範例"}

回覆列表：
${list}`
}

async function callOpenAiSentiment(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `OpenAI API 回傳 ${res.status}`)
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  return data.choices?.[0]?.message?.content ?? ''
}

async function callAnthropicSentiment(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `Anthropic API 回傳 ${res.status}`)
  }

  const data = await res.json() as { content?: Array<{ text?: string }> }
  return data.content?.[0]?.text ?? ''
}

function parseSentimentResponse(raw: string): SentimentResult {
  let jsonStr = raw.trim()

  // 移除 markdown code block（防呆）
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim()

  // 擷取第一個 JSON 物件
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (objectMatch) jsonStr = objectMatch[0]

  const parsed = JSON.parse(jsonStr) as {
    sentiment?: { positive?: number; negative?: number; neutral?: number }
    topKeywords?: unknown[]
    samplePositive?: string
    sampleNegative?: string
  }

  const sentiment = parsed.sentiment ?? {}
  return {
    positive: typeof sentiment.positive === 'number' ? sentiment.positive : 0,
    negative: typeof sentiment.negative === 'number' ? sentiment.negative : 0,
    neutral: typeof sentiment.neutral === 'number' ? sentiment.neutral : 100,
    topKeywords: Array.isArray(parsed.topKeywords)
      ? parsed.topKeywords.map(String).slice(0, 10)
      : [],
    samplePositive: typeof parsed.samplePositive === 'string' ? parsed.samplePositive : '',
    sampleNegative: typeof parsed.sampleNegative === 'string' ? parsed.sampleNegative : '',
  }
}

/** 合併多批次結果（加權平均） */
function mergeSentimentResults(results: SentimentResult[]): SentimentResult {
  if (results.length === 0) {
    return { positive: 0, negative: 0, neutral: 100, topKeywords: [], samplePositive: '', sampleNegative: '' }
  }
  if (results.length === 1) return results[0]

  const count = results.length
  const merged: SentimentResult = {
    positive: Math.round(results.reduce((sum, r) => sum + r.positive, 0) / count),
    negative: Math.round(results.reduce((sum, r) => sum + r.negative, 0) / count),
    neutral: Math.round(results.reduce((sum, r) => sum + r.neutral, 0) / count),
    topKeywords: [...new Set(results.flatMap((r) => r.topKeywords))].slice(0, 10),
    samplePositive: results.find((r) => r.samplePositive)?.samplePositive ?? '',
    sampleNegative: results.find((r) => r.sampleNegative)?.sampleNegative ?? '',
  }
  return merged
}

// ===== 公開 API =====

/** 批次分析開放題回覆情感（每 50 筆一批） */
export async function analyzeOpenTextSentiment(
  texts: string[],
  aiKey: AiKey
): Promise<SentimentResult> {
  const batches: string[][] = []
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    batches.push(texts.slice(i, i + BATCH_SIZE))
  }

  const batchResults = await Promise.all(
    batches.map(async (batch) => {
      const prompt = buildSentimentPrompt(batch)
      let raw: string

      if (aiKey.provider === 'anthropic') {
        raw = await callAnthropicSentiment(aiKey.apiKey, aiKey.model, prompt)
      } else {
        raw = await callOpenAiSentiment(aiKey.apiKey, aiKey.model, prompt)
      }

      return parseSentimentResponse(raw)
    })
  )

  return mergeSentimentResults(batchResults)
}
