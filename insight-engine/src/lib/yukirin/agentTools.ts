/**
 * 雪凜 Agent 工具定義
 * 所有工具都是 Anthropic Tool Use 格式
 * 每個工具有：Anthropic schema 定義 + 對應的執行函式
 */

import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'

// ── 工具型別 ─────────────────────────────────────────────────────────────────

export interface ToolInput {
  [key: string]: unknown
}

export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
}

export type ToolExecutor = (input: ToolInput) => Promise<ToolResult>

// ── Anthropic Tool Schema 定義 ────────────────────────────────────────────────

export const AGENT_TOOLS_SCHEMA = [
  {
    name: 'fetch_url',
    description: '閱讀指定網頁的內容，提取正文文字（最多 8000 字）。可用於閱讀文章、產品頁、新聞等任何網頁。',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: '要閱讀的完整 URL（包含 https://）' },
        max_chars: { type: 'number', description: '最大字元數，預設 8000' },
      },
      required: ['url'],
    },
  },
  {
    name: 'summarize_text',
    description: '對給定的長文進行摘要，可指定摘要長度和重點面向。',
    input_schema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string', description: '要摘要的原始文字' },
        max_length: { type: 'number', description: '摘要字數上限，預設 300' },
        focus: { type: 'string', description: '摘要重點（如：技術細節 / 商業洞察 / 行銷觀點）' },
      },
      required: ['text'],
    },
  },
  {
    name: 'extract_links',
    description: '從網頁中提取所有連結，回傳標題 + URL 列表。',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: '目標網頁 URL' },
        filter_keyword: { type: 'string', description: '只保留包含此關鍵字的連結（可選）' },
        limit: { type: 'number', description: '最多回傳幾個連結，預設 10' },
      },
      required: ['url'],
    },
  },
  {
    name: 'generate_marketing_content',
    description: '根據描述生成行銷文案，包含：社群貼文、廣告文案（A/B/C 版）、Email 主旨、hashtag 組合。',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: { type: 'string', description: '要宣傳的主題或產品' },
        platform: {
          type: 'string',
          enum: ['instagram', 'facebook', 'line', 'twitter', 'email', 'all'],
          description: '目標平台',
        },
        tone: {
          type: 'string',
          enum: ['活潑', '專業', '感性', '幽默', '急迫'],
          description: '文案風格',
        },
        target_audience: { type: 'string', description: '目標受眾描述' },
      },
      required: ['topic'],
    },
  },
  {
    name: 'analyze_text_sentiment',
    description: '分析文字的情感傾向（正面/負面/中立），並提取關鍵主題。',
    input_schema: {
      type: 'object' as const,
      properties: {
        texts: {
          type: 'array',
          items: { type: 'string' },
          description: '要分析的文字列表（最多 50 條）',
        },
      },
      required: ['texts'],
    },
  },
] as const

// ── 工具執行函式 ──────────────────────────────────────────────────────────────

/** fetch_url：讀取網頁正文 */
async function executeFetchUrl(input: ToolInput): Promise<ToolResult> {
  const url = input.url as string
  const maxChars = (input.max_chars as number) ?? 8000

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SnowRealmBot/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const html = await res.text()
    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    if (!article) {
      // Readability 失敗，fallback 到純文字提取
      const plainText = dom.window.document.body?.textContent
        ?.replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxChars) ?? ''
      return { success: true, data: { title: url, content: plainText, url } }
    }

    return {
      success: true,
      data: {
        title: article.title,
        content: article.textContent?.replace(/\s+/g, ' ').trim().slice(0, maxChars),
        byline: article.byline,
        excerpt: article.excerpt,
        url,
      },
    }
  } catch (err) {
    return { success: false, error: `無法讀取 ${url}：${(err as Error).message}` }
  }
}

/** extract_links：從網頁提取連結 */
async function executeExtractLinks(input: ToolInput): Promise<ToolResult> {
  const url = input.url as string
  const filterKeyword = input.filter_keyword as string | undefined
  const limit = (input.limit as number) ?? 10

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SnowRealmBot/1.0)' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const html = await res.text()
    const dom = new JSDOM(html, { url })
    const anchors = Array.from(dom.window.document.querySelectorAll('a[href]'))

    const baseUrl = new URL(url)
    const links = anchors
      .map((a) => {
        try {
          const href = (a as HTMLAnchorElement).href
          const abs = href.startsWith('http') ? href : new URL(href, baseUrl).href
          const text = (a.textContent?.trim() ?? '').slice(0, 80)
          return { title: text || abs, url: abs }
        } catch { return null }
      })
      .filter(Boolean)
      .filter((l) => !filterKeyword || l!.title.includes(filterKeyword) || l!.url.includes(filterKeyword))
      .slice(0, limit)

    return { success: true, data: { links, count: links.length } }
  } catch (err) {
    return { success: false, error: `無法提取 ${url} 的連結：${(err as Error).message}` }
  }
}

/** summarize_text：使用 Claude 自身做摘要（由 agentExecutor 遞迴呼叫） */
async function executeSummarizeText(input: ToolInput): Promise<ToolResult> {
  // 這個工具的「執行」只是返回格式化好的輸入
  // 實際摘要由 Claude 在收到 tool_result 後自行完成
  const text = input.text as string
  const maxLength = (input.max_length as number) ?? 300
  const focus = (input.focus as string) ?? '重點資訊'

  return {
    success: true,
    data: {
      original_text: text.slice(0, 12000),
      instruction: `請將上方文字摘要成 ${maxLength} 字以內，重點聚焦在：${focus}`,
    },
  }
}

/** generate_marketing_content：生成行銷文案 */
async function executeGenerateMarketingContent(input: ToolInput): Promise<ToolResult> {
  // 返回格式化的請求，讓 Claude 真正生成文案
  const topic = input.topic as string
  const platform = (input.platform as string) ?? 'all'
  const tone = (input.tone as string) ?? '活潑'
  const targetAudience = (input.target_audience as string) ?? '一般大眾'

  return {
    success: true,
    data: {
      topic,
      platform,
      tone,
      target_audience: targetAudience,
      instruction: `請根據以下參數生成行銷內容：
主題：${topic}
平台：${platform}
風格：${tone}
目標受眾：${targetAudience}

需要輸出：
1. 社群貼文正文（150字以內）
2. 廣告文案 A/B/C 三個版本（各一句話）
3. hashtag 組合（中文5個 + 英文5個）
4. Email 主旨行（3個選項）`,
    },
  }
}

/** analyze_text_sentiment：情感分析 */
async function executeAnalyzeTextSentiment(input: ToolInput): Promise<ToolResult> {
  const texts = input.texts as string[]
  if (!Array.isArray(texts) || texts.length === 0) {
    return { success: false, error: '請提供至少一條文字' }
  }

  return {
    success: true,
    data: {
      texts: texts.slice(0, 50),
      instruction: `分析以上 ${texts.length} 條文字的情感傾向，回傳：
{ "positive": 百分比, "negative": 百分比, "neutral": 百分比,
  "topKeywords": ["關鍵詞1", "關鍵詞2"...],
  "summary": "一句話描述整體情感傾向" }`,
    },
  }
}

// ── 工具執行 Map ──────────────────────────────────────────────────────────────

const TOOL_EXECUTORS: Record<string, ToolExecutor> = {
  fetch_url: executeFetchUrl,
  extract_links: executeExtractLinks,
  summarize_text: executeSummarizeText,
  generate_marketing_content: executeGenerateMarketingContent,
  analyze_text_sentiment: executeAnalyzeTextSentiment,
}

/**
 * 執行指定工具
 * @param toolName  工具名稱
 * @param input     工具輸入
 * @returns         工具結果
 */
export async function executeTool(toolName: string, input: ToolInput): Promise<ToolResult> {
  const executor = TOOL_EXECUTORS[toolName]
  if (!executor) {
    return { success: false, error: `未知工具：${toolName}` }
  }
  try {
    return await executor(input)
  } catch (err) {
    return { success: false, error: `工具執行失敗：${(err as Error).message}` }
  }
}

/**
 * 判斷訊息是否含有 Agent 任務意圖（避免每次對話都呼叫工具）
 */
export function hasAgentIntent(message: string): boolean {
  return /幫我搜尋|幫我找|讀取這個|分析這|幫我讀|幫我整理|監控|爬|抓取|fetch|summarize|http:\/\/|https:\/\//i.test(message)
    || /\/搜尋|\/讀取|\/分析|\/巡邏|\/今日摘要/.test(message)
}
