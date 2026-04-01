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
  {
    name: 'generate_email_campaign',
    description: '為產品或活動生成完整的 Email 行銷序列，包含歡迎信、培育信、促銷信、挽回信。',
    input_schema: {
      type: 'object' as const,
      properties: {
        product: { type: 'string', description: '產品或服務名稱' },
        goal: { type: 'string', description: '行銷目標（如：提高轉化率、喚回沉睡用戶、推廣新功能）' },
        emails_count: { type: 'number', description: '序列信件數量，預設 5' },
        tone: { type: 'string', enum: ['正式', '親切', '急迫', '故事性'], description: '文案風格' },
      },
      required: ['product'],
    },
  },
  {
    name: 'analyze_competitor',
    description: '抓取競品網站，分析其核心訴求、差異化賣點、CTA 策略，並提出反制建議。',
    input_schema: {
      type: 'object' as const,
      properties: {
        competitor_url: { type: 'string', description: '競品網站 URL' },
        my_product: { type: 'string', description: '我方產品名稱（用於對比分析）' },
        focus: {
          type: 'string',
          enum: ['定價策略', '功能對比', '文案風格', '目標受眾', '全面分析'],
          description: '分析重點',
        },
      },
      required: ['competitor_url'],
    },
  },
  {
    name: 'create_content_calendar',
    description: '根據主題與時程，生成社群媒體內容行事曆，含每日貼文主題、格式建議、最佳發布時間。',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: { type: 'string', description: '主要行銷主題或活動' },
        duration_days: { type: 'number', description: '規劃天數（7/14/30），預設 7' },
        platforms: {
          type: 'array',
          items: { type: 'string' },
          description: '目標平台列表（如 ["instagram", "facebook", "line"]）',
        },
        campaign_goal: { type: 'string', description: '活動目標（如：品牌知名度、導流、轉換）' },
      },
      required: ['topic'],
    },
  },
  {
    name: 'generate_landing_page_copy',
    description: '生成高轉化率的落地頁文案，包含 Hero、功能特色、用戶見證、FAQ、CTA 等區塊。',
    input_schema: {
      type: 'object' as const,
      properties: {
        product: { type: 'string', description: '產品或服務名稱' },
        target_audience: { type: 'string', description: '目標受眾描述' },
        main_benefit: { type: 'string', description: '核心價值主張（最重要的一個好處）' },
        pain_points: {
          type: 'array',
          items: { type: 'string' },
          description: '目標受眾的痛點列表',
        },
        cta_action: { type: 'string', description: 'CTA 行動（如：免費試用、立即購買、預約諮詢）' },
      },
      required: ['product', 'main_benefit'],
    },
  },
  {
    name: 'seo_content_plan',
    description: '根據主題，生成 SEO 關鍵字策略與內容規劃，包含主詞、長尾詞、文章大綱建議。',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: { type: 'string', description: '要攻略的主題或產業' },
        website_type: { type: 'string', description: '網站類型（部落格/電商/SaaS/本地商家）' },
        competitor_urls: {
          type: 'array',
          items: { type: 'string' },
          description: '競品網站 URL（可選，用於分析競爭態勢）',
        },
        language: { type: 'string', enum: ['zh-TW', 'zh-CN', 'en'], description: '目標語言，預設 zh-TW' },
      },
      required: ['topic'],
    },
  },
  {
    name: 'generate_ad_copy',
    description: '生成付費廣告文案，適用於 Google Ads、Facebook/Instagram 廣告、LINE 廣告等。',
    input_schema: {
      type: 'object' as const,
      properties: {
        product: { type: 'string', description: '廣告主題或產品' },
        platform: {
          type: 'string',
          enum: ['google', 'facebook', 'instagram', 'line', 'youtube'],
          description: '廣告平台',
        },
        budget_tier: { type: 'string', enum: ['低預算', '中預算', '高預算'], description: '預算層級（影響策略）' },
        usp: { type: 'string', description: '獨特賣點（Unique Selling Point）' },
        offer: { type: 'string', description: '優惠或誘因（如：首月免費、限時折扣）' },
      },
      required: ['product', 'platform'],
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

/** generate_email_campaign：Email 行銷序列 */
async function executeGenerateEmailCampaign(input: ToolInput): Promise<ToolResult> {
  const product = input.product as string
  const goal = (input.goal as string) ?? '提高轉化率'
  const emailsCount = (input.emails_count as number) ?? 5
  const tone = (input.tone as string) ?? '親切'

  return {
    success: true,
    data: {
      product, goal, emails_count: emailsCount, tone,
      instruction: `請為「${product}」生成 ${emailsCount} 封 Email 行銷序列。
目標：${goal}
風格：${tone}

每封信請包含：
- 信件編號與觸發時機（第 X 天）
- 主旨行（3個選項）
- 開頭鉤子（1-2 句）
- 正文（重點，不超過 200 字）
- CTA 按鈕文字
- P.S. 行（可選）

序列建議：1. 歡迎/導入信 2. 價值示範 3. 社群驗證 4. 痛點解決 5. 促銷/CTA`,
    },
  }
}

/** analyze_competitor：競品分析 */
async function executeAnalyzeCompetitor(input: ToolInput): Promise<ToolResult> {
  const url = input.competitor_url as string
  const myProduct = (input.my_product as string) ?? '我方產品'
  const focus = (input.focus as string) ?? '全面分析'

  // 先抓取競品網頁
  const fetchResult = await executeFetchUrl({ url, max_chars: 6000 })
  if (!fetchResult.success) {
    return { success: false, error: `無法讀取競品網站：${fetchResult.error}` }
  }

  return {
    success: true,
    data: {
      competitor_url: url,
      competitor_content: fetchResult.data,
      my_product: myProduct,
      focus,
      instruction: `根據以上競品網站內容，進行「${focus}」分析：
1. **核心訴求**：競品的主要價值主張是什麼？
2. **目標受眾**：他們在打誰？
3. **差異化賣點**：競品的獨特優勢？
4. **CTA 策略**：如何引導用戶？
5. **弱點/機會**：哪裡可以突破？
6. **反制建議**：「${myProduct}」應該如何定位對抗？`,
    },
  }
}

/** create_content_calendar：社群內容行事曆 */
async function executeCreateContentCalendar(input: ToolInput): Promise<ToolResult> {
  const topic = input.topic as string
  const durationDays = (input.duration_days as number) ?? 7
  const platforms = (input.platforms as string[]) ?? ['instagram', 'facebook']
  const campaignGoal = (input.campaign_goal as string) ?? '品牌知名度'

  return {
    success: true,
    data: {
      topic, duration_days: durationDays, platforms, campaign_goal: campaignGoal,
      instruction: `請為「${topic}」生成 ${durationDays} 天的社群內容行事曆。
平台：${platforms.join(', ')}
目標：${campaignGoal}

請用表格格式輸出，每天包含：
| 日期 | 平台 | 類型 | 主題 | 內文重點 | 最佳發布時間 | 搭配標籤 |

內容類型建議：教育型、娛樂型、互動型、促銷型（2:3:2:1 比例）
記得在關鍵日期（如週末、特定節日）規劃更強的內容`,
    },
  }
}

/** generate_landing_page_copy：落地頁文案 */
async function executeGenerateLandingPageCopy(input: ToolInput): Promise<ToolResult> {
  const product = input.product as string
  const targetAudience = (input.target_audience as string) ?? '一般消費者'
  const mainBenefit = input.main_benefit as string
  const painPoints = (input.pain_points as string[]) ?? []
  const ctaAction = (input.cta_action as string) ?? '免費試用'

  return {
    success: true,
    data: {
      product, target_audience: targetAudience, main_benefit: mainBenefit, pain_points: painPoints, cta_action: ctaAction,
      instruction: `請為「${product}」生成高轉化率的落地頁文案。
目標受眾：${targetAudience}
核心利益：${mainBenefit}
痛點：${painPoints.join('、') || '需自行判斷'}
CTA：${ctaAction}

請依序輸出以下區塊：
**Hero 區**：主標題（10字內）+ 副標題（25字內）+ CTA 按鈕文字
**社群驗證**：3條用戶見證（各一句話，含職稱/角色）
**核心功能**：3個功能+對應痛點解決（用「你是否曾...」帶出）
**對比表**：有我 vs 沒有我（5個對比項）
**FAQ**：5個最常見問題
**最終 CTA**：強化版標題 + 緊迫感文案 + 按鈕`,
    },
  }
}

/** seo_content_plan：SEO 內容規劃 */
async function executeSeoContentPlan(input: ToolInput): Promise<ToolResult> {
  const topic = input.topic as string
  const websiteType = (input.website_type as string) ?? '部落格'
  const language = (input.language as string) ?? 'zh-TW'

  return {
    success: true,
    data: {
      topic, website_type: websiteType, language,
      instruction: `請為「${topic}」（${websiteType}，目標語言：${language}）生成 SEO 內容策略：

1. **核心關鍵字**（3-5個）：搜尋量高、競爭度中等
2. **長尾關鍵字**（10-15個）：更具體、轉化率更高
3. **內容叢集規劃**（Pillar Page + Cluster Pages）：
   - 1 個支柱頁面（最全面的指南）
   - 5-8 個集群頁面（各個細分主題）
4. **文章大綱**（為支柱頁面提供詳細 H2/H3 結構）
5. **內部連結策略**：如何串聯各篇內容
6. **Meta 優化建議**：Title Tag 和 Description 模板`,
    },
  }
}

/** generate_ad_copy：廣告文案 */
async function executeGenerateAdCopy(input: ToolInput): Promise<ToolResult> {
  const product = input.product as string
  const platform = input.platform as string
  const budgetTier = (input.budget_tier as string) ?? '中預算'
  const usp = (input.usp as string) ?? '高品質、高效率'
  const offer = (input.offer as string) ?? ''

  return {
    success: true,
    data: {
      product, platform, budget_tier: budgetTier, usp, offer,
      instruction: `請為「${product}」在${platform}上生成廣告文案。
獨特賣點：${usp}
優惠誘因：${offer || '無特定優惠'}
預算層級：${budgetTier}

請生成：
**A版**（理性訴求）：強調功能/ROI
**B版**（感性訴求）：故事/痛點共鳴
**C版**（急迫訴求）：限時/稀缺性

每個版本包含：
- ${platform === 'google' ? '標題1+2（各30字）+ 說明（90字）' : ''}
- ${platform === 'facebook' || platform === 'instagram' ? '主文（125字）+ 標題（25字）+ 說明（25字）' : ''}
- ${platform === 'line' ? '訊息文案 + 按鈕文字' : ''}
- ${platform === 'youtube' ? '前5秒鉤子 + 完整腳本（60秒）' : ''}
預算建議與出價策略`,
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
  generate_email_campaign: executeGenerateEmailCampaign,
  analyze_competitor: executeAnalyzeCompetitor,
  create_content_calendar: executeCreateContentCalendar,
  generate_landing_page_copy: executeGenerateLandingPageCopy,
  seo_content_plan: executeSeoContentPlan,
  generate_ad_copy: executeGenerateAdCopy,
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
    || /行銷文案|廣告文案|Email.*序列|競品分析|內容行事曆|落地頁|SEO.*規劃|關鍵字策略/i.test(message)
    || /幫我寫.*廣告|幫我寫.*Email|幫我分析.*競品|幫我規劃.*社群|幫我做.*SEO/i.test(message)
}
