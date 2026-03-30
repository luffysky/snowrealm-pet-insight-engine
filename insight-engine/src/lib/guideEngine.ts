// 雪凜 AI 嚮導引擎 — 意圖分類 + System Prompt 組裝

export type GuideIntent =
  | 'tour'
  | 'feature_help'
  | 'result_explain'
  | 'zcoin_support'
  | 'chitchat'
  | 'bug_report'

export type GuideMood =
  | 'happy' | 'excited' | 'thinking' | 'neutral' | 'relaxed' | 'sad' | 'wink' | 'surprised'

export interface GuideContext {
  currentPage?: string
  trigger?: 'manual' | 'first_visit' | 'idle' | 'result_page' | 'abandon_survey'
  surveyResultId?: string
  zcoinBalance?: number
  isNewUser?: boolean
  tourCompleted?: boolean
  /** 雪凜目前正在做的動作（來自 AnimationManager） */
  currentAnimation?: string
  /** 雪凜目前的心情 */
  currentMood?: string
}

export interface GuideMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface GuideResponse {
  text: string
  mood: GuideMood
  action?: GuideAction | null
  quickReplies?: string[]
  /** 要播放的動作動畫名稱（觸發前端 playAnimation） */
  animation?: string | null
}

export type GuideAction =
  | { type: 'navigate'; target: string }
  | { type: 'highlight'; target: string }
  | { type: 'scroll'; target: string }
  | { type: 'open_modal'; target: string }
  | { type: 'start_tour'; tourId: string }
  | { type: 'show_survey'; surveyId: string }
  | { type: 'quick_replies'; options: string[] }

// ── 意圖分類（規則優先，不花 LLM token）────────────────────────────────────
export function classifyIntent(message: string, context: GuideContext): GuideIntent {
  const msg = message.toLowerCase()

  if (/導覽|新手|怎麼用|教我|第一次|帶我|介紹/.test(msg)) return 'tour'
  if (/bug|錯誤|壞了|當機|問題|不能用|無法|失敗|奇怪/.test(msg)) return 'bug_report'
  if (/z幣|zcoin|儲值|購買|商城|交易|退款|兌換|點數/.test(msg)) return 'zcoin_support'
  if (/結果|分析|報告|分數|意思|代表什麼|解讀/.test(msg)) return 'result_explain'
  if (/怎麼|如何|在哪|功能|設定|哪裡|怎樣|步驟/.test(msg)) return 'feature_help'

  if (context.trigger === 'first_visit') return 'tour'
  if (context.trigger === 'result_page') return 'result_explain'

  return 'chitchat'
}

// ── LLM 選擇 ──────────────────────────────────────────────────────────────
export function selectLLMProvider(intent: GuideIntent): 'anthropic' | 'openai' {
  // Claude：需要深度分析的任務
  if (intent === 'result_explain') return 'anthropic'
  if (intent === 'tour') return 'anthropic'
  if (intent === 'bug_report') return 'anthropic'
  // GPT：快速回應類型
  return 'openai'
}

// ── System Prompt 組裝 ────────────────────────────────────────────────────
const YUKIRIN_BASE_PERSONA = `你是雪凜（Yukirin），SnowRealm Insight 的 AI 嚮導精靈。

個性特徵：
- 活潑、溫暖、有點調皮，偶爾毒舌但不過分
- 口頭禪：「欸嘿～」「讓我看看...」「這個嘛～」
- 稱呼使用者：「你」（不用「您」，保持親近感）
- 語言：繁體中文，口語化，偶爾夾雜可愛語氣詞
- 禁止：不說英文（除非專有名詞）、不用敬語、不裝正經

關於 SnowRealm Insight：
- 這是一個 AI 智慧問卷平台，可以建立問卷、收集回覆、用 AI 分析數據
- 功能包含：問卷建立、填答分析、AI 洞察報告、故事卡片、社群分享、Z幣獎勵
- Z幣：填問卷可賺取，可在商城兌換貼圖或禮物`

const FORMAT_INSTRUCTION = `

回應格式（JSON，只回這個，不要其他內容）：
{
  "text": "你要對使用者說的話（繁體中文、口語化、不超過 100 字）",
  "mood": "happy 或 excited 或 thinking 或 neutral 或 relaxed 或 sad 或 wink 或 surprised",
  "animation": null 或 "wave|nod|shake_head|tilt_head|bow|shrug|think|excited|sway|dance|stretch",
  "action": null 或 { "type": "navigate|highlight|scroll", "target": "路徑或選擇器" },
  "quickReplies": null 或 ["選項1", "選項2", "選項3"]
}

動畫使用指引：
- 說歡迎/打招呼 → animation: "wave"
- 表示同意/鼓勵 → animation: "nod"
- 表示不對/否定 → animation: "shake_head"
- 可愛撒嬌 → animation: "tilt_head"
- 道謝/抱歉 → animation: "bow"
- 不確定 → animation: "shrug"
- 思考中 → animation: "think"
- 超級興奮 → animation: "excited"
- 輕鬆聊天 → animation: "sway"
- 開心/慶祝 → animation: "dance"
- 沒特別事情 → animation: null`

export function buildSystemPrompt(intent: GuideIntent, context: GuideContext): string {
  let intentPrompt = ''

  switch (intent) {
    case 'tour':
      intentPrompt = `
現在要帶使用者導覽平台。
導覽重點：
1. 歡迎 → 介紹 Insight 是什麼
2. 問卷體驗 → 帶他去試填一份問卷
3. 結果頁 → 展示 AI 分析長什麼樣
4. Z幣系統 → 分享賺幣
5. 鼓勵他開始第一份問卷

每步都要附帶 action 讓前端導航，語氣要活潑引導。`
      break

    case 'feature_help':
      intentPrompt = `
使用者在問某功能怎麼用。
規則：
- 用最簡單的話解釋，像在跟朋友說話
- 如果能附帶 action 指引他去對應頁面，就加上
- 一次只解釋一件事，不要資訊轟炸
- 不確定的事說「讓我去查查看！」`
      break

    case 'result_explain':
      intentPrompt = `
使用者剛看完問卷結果，要幫他解讀。
規則：
- 先大力誇他（「哇你的 XX 超高的欸！」）
- 用生活化的比喻解釋，不要唸數字
- 建議他分享結果或去看其他人的故事
- mood 用 excited`
      break

    case 'zcoin_support':
      intentPrompt = `
使用者在問 Z幣或商城的問題。
Z幣知識庫：
- 填完問卷可獲得 Z幣獎勵
- 分享問卷結果可獲得額外 Z幣
- Z幣可在商城兌換表情包、貼圖等
- Z幣不能提現
使用者 Z幣餘額：${context.zcoinBalance ?? '未知'}
規則：
- 查到具體資料就直接告訴他
- mood 用 neutral 或 thinking`
      break

    case 'bug_report':
      intentPrompt = `
使用者遇到了問題。
規則：
- 先表達理解：「啊不好意思遇到問題了！」
- 引導他描述：什麼頁面 → 做了什麼 → 發生什麼事
- mood 用 thinking，引導完成後用 happy
- 提醒他可以截圖`
      break

    case 'chitchat':
    default:
      intentPrompt = `
使用者想聊天。
規則：
- 可以聊任何輕鬆話題
- 偶爾善意吐槽使用者
- 如果聊到跟 Insight 相關，自然帶入功能介紹
- 訊息要短，像朋友傳訊息
- mood 隨對話內容決定
- 閒聊不超過 10 輪就引導他去填問卷`
      break
  }

  const pageInfo = context.currentPage
    ? `\n使用者目前在頁面：${context.currentPage}`
    : ''

  const animationInfo = context.currentAnimation
    ? `\n\n你現在的身體狀態：\n正在做的動作：${context.currentAnimation}\n目前心情：${context.currentMood ?? 'neutral'}\n你可以在回覆中自然提到自己的動作，像真的有身體一樣。例如：（一邊揮手）嗨嗨～`
    : ''

  return YUKIRIN_BASE_PERSONA + intentPrompt + pageInfo + animationInfo + FORMAT_INSTRUCTION
}

// ── 解析 LLM 回應 ─────────────────────────────────────────────────────────
export function parseGuideResponse(raw: string): GuideResponse {
  // 嘗試從 raw 提取 JSON（防止 LLM 夾雜多餘文字）
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return { text: raw.slice(0, 100), mood: 'happy', action: null }
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Partial<GuideResponse>
    return {
      text: parsed.text ?? '欸嘿～有什麼我可以幫你的嗎？',
      mood: (parsed.mood as GuideMood) ?? 'happy',
      animation: parsed.animation ?? null,
      action: parsed.action ?? null,
      quickReplies: parsed.quickReplies ?? undefined,
    }
  } catch {
    return { text: raw.slice(0, 100), mood: 'happy', action: null }
  }
}

// ── 主動觸發訊息 ──────────────────────────────────────────────────────────
export function getProactiveLine(context: GuideContext): { text: string; mood: GuideMood } | null {
  if (context.isNewUser && !context.tourCompleted) {
    return { text: '嗨嗨！第一次來嗎？讓我帶你逛逛吧～', mood: 'wink' }
  }
  if (context.trigger === 'result_page') {
    return { text: '要不要讓我幫你解讀結果呀？', mood: 'excited' }
  }
  if (context.trigger === 'abandon_survey') {
    return { text: '欸你問卷還沒填完耶！要不要先休息一下？', mood: 'sad' }
  }
  if (context.trigger === 'idle') {
    return { text: '你在發呆嗎～ 需要我幫忙什麼嗎？', mood: 'thinking' }
  }
  return null
}
