# 雪凜統一 AI 整合規格書

> 17 個 AI 功能 × 1 個雪凜 — 統一入口、分層處理
> 版本：v1.0 | 日期：2026-03-30
> 原則：使用者看到的 AI 全部是雪凜，後台工具安靜跑不出面

---

## 一、17 個 AI 功能分類

### 1.1 雪凜出面（使用者直接跟她互動）— 5 個

| # | 功能 | 原路由 | 雪凜做什麼 |
|---|------|--------|-----------|
| 1 | 嚮導聊天 | api/guide/chat | 跟使用者聊天、導覽、客服、閒聊 |
| 2 | 問卷結果解讀 | (嵌入 guide/chat) | 「讓我看看你的結果... 哇！」 |
| 3 | 故事洞察報告 | api/admin/ai-story | 從開放題寫故事 → 雪凜的語氣 |
| 4 | 數據洞察報告 | api/admin/ai-insight | 分析數據 → 雪凜的語氣包裝 |
| 5 | AI 對話建問卷 | api/admin/ai-chat-generate | 管理員跟雪凜對話建問卷 |

### 1.2 雪凜在幕後（使用者看不到）— 12 個

| # | 功能 | 路由 | 性質 |
|---|------|------|------|
| 6 | 問卷題目生成 | api/admin/ai-generate | 純工具，輸出 JSON |
| 7 | 問卷 Meta 生成 | api/admin/ai-generate-meta | 標題/副標/OG 文案 |
| 8 | 開放題情感分析 | api/admin/ai-sentiment | 正負面傾向 + 關鍵字 |
| 9 | 部落格 AI 摘要 | api/admin/social/blog/ai-meta | SEO 摘要/slug |
| 10 | AI 設定驗證 | api/admin/ai-settings | 驗證 API Key |
| 11 | 週報 AI 摘要 | api/cron/weekly-report | 自動生成週報 |
| 12 | 自動化觸發洞察 | lib/automationEngine.ts | 回覆達標自動生報告 |
| 13 | 內容審核 | (新增) | AI 過濾垃圾/詐騙/色情 |
| 14 | 使用者畫像提取 | (新增) | 從對話中提取偏好 |
| 15 | Bug 報告整理 | (嵌入 guide/chat) | 結構化 Bug Report |
| 16 | 意圖分類 | lib/guideEngine.ts | 判斷使用者意圖 |
| 17 | 認知差距報告 | lib/cognitiveGapEngine.ts | 自評 vs 他評落差 |

---

## 二、核心架構：aiService.ts 統一管理

### 2.1 所有 AI 呼叫都經過同一個入口

```typescript
// lib/aiService.ts — 所有 AI 的核心

interface AIRequest {
  // 身份
  taskType: AITaskType;
  requestedBy: 'user' | 'admin' | 'system';  // 誰觸發的
  userId?: string;

  // 模型選擇
  preferredProvider?: 'anthropic' | 'openai';
  preferredModel?: string;

  // 內容
  systemPrompt: string;
  messages: ChatMessage[];
  maxTokens: number;

  // 雪凜包裝
  applyYukirinPersona: boolean;  // 是否套用雪凜語氣
  mood?: string;                  // 輸出時附帶表情

  // 額度
  quotaType: 'chat' | 'analysis' | 'admin' | 'system';
}

type AITaskType =
  // 雪凜出面（套語氣）
  | 'guide_chat'           // 嚮導聊天
  | 'result_explain'       // 結果解讀
  | 'story_insight'        // 故事洞察
  | 'data_insight'         // 數據洞察
  | 'chat_survey_create'   // 對話建問卷
  // 幕後工具（不套語氣）
  | 'survey_generate'      // 問卷題目
  | 'meta_generate'        // Meta 生成
  | 'sentiment_analysis'   // 情感分析
  | 'blog_seo'             // SEO 摘要
  | 'api_key_validate'     // API 驗證
  | 'weekly_report'        // 週報
  | 'auto_insight'         // 自動觸發洞察
  | 'content_moderation'   // 內容審核
  | 'user_profile_extract' // 畫像提取
  | 'bug_report'           // Bug 整理
  | 'intent_classify'      // 意圖分類
  | 'cognitive_gap';       // 認知差距
```

### 2.2 統一呼叫流程

```typescript
async function callAI(request: AIRequest): Promise<AIResponse> {
  // ===== Step 1: 額度檢查 =====
  if (request.quotaType !== 'system' && request.quotaType !== 'admin') {
    const quota = await checkAndDeductQuota(request.userId!, request.quotaType);
    if (!quota.allowed) {
      // 閒聊額度用完 → 降級模型，不報錯
      if (request.taskType === 'guide_chat') {
        request.preferredProvider = 'openai';
        request.preferredModel = 'gpt-4o-mini';
      } else {
        return { error: '今日額度已用完', mood: 'sad' };
      }
    }
  }

  // ===== Step 2: 模型路由 =====
  const routing = resolveModel(request);

  // ===== Step 3: 加上雪凜人設（如果需要）=====
  let finalSystemPrompt = request.systemPrompt;
  if (request.applyYukirinPersona) {
    finalSystemPrompt = YUKIRIN_PERSONA_PREFIX + '\n\n' + request.systemPrompt;
  }

  // ===== Step 4: 呼叫 LLM =====
  const startTime = Date.now();
  let response: LLMRawResponse;

  if (routing.provider === 'anthropic') {
    response = await callClaude({
      model: routing.model,
      system: finalSystemPrompt,
      messages: request.messages,
      maxTokens: request.maxTokens,
      useCache: routing.useCache,
    });
  } else {
    response = await callGPT({
      model: routing.model,
      systemPrompt: finalSystemPrompt,
      messages: request.messages,
      maxTokens: request.maxTokens,
    });
  }

  // ===== Step 5: 記錄成本 =====
  await trackCost({
    provider: routing.provider,
    model: routing.model,
    taskType: request.taskType,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    userId: request.userId,
    latency: Date.now() - startTime,
  });

  // ===== Step 6: 解析回應 =====
  if (request.applyYukirinPersona) {
    // 雪凜的回應格式：{ text, mood, action }
    return parseYukirinResponse(response.text);
  } else {
    // 工具回應：原始文字或 JSON
    return { text: response.text, mood: null, action: null };
  }
}
```

### 2.3 模型路由表

```typescript
function resolveModel(request: AIRequest): ModelRoute {
  const TASK_ROUTES: Record<AITaskType, ModelRoute> = {
    // ===== 雪凜出面 =====
    guide_chat: {
      // 由分層路由引擎決定（見 AI Guide Spec 第三章）
      // Premium / Standard 動態選擇
      provider: 'dynamic',
      model: 'dynamic',
      useCache: true,
    },
    result_explain: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-6-20260218',
      useCache: true,     // system prompt 快取
    },
    story_insight: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-6-20260218',
      useCache: true,
    },
    data_insight: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-6-20260218',
      useCache: true,
    },
    chat_survey_create: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-6-20260218',
      useCache: false,    // 每次對話建問卷內容不同
    },

    // ===== 幕後工具 =====
    survey_generate: {
      provider: 'dynamic',  // GPT-4o-mini 或 Claude，看複雜度
      model: 'dynamic',
      useCache: false,
    },
    meta_generate: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      useCache: false,
    },
    sentiment_analysis: {
      provider: 'openai',
      model: 'gpt-4o-mini',  // 情感分析不需要太聰明
      useCache: false,
    },
    blog_seo: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      useCache: false,
    },
    api_key_validate: {
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',  // 最便宜，只是 ping
      useCache: false,
    },
    weekly_report: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      useCache: false,
    },
    auto_insight: {
      provider: 'dynamic',
      model: 'dynamic',
      useCache: false,
    },
    content_moderation: {
      provider: 'openai',
      model: 'gpt-4o-mini',  // 審核用便宜的
      useCache: false,
    },
    user_profile_extract: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      useCache: false,
    },
    bug_report: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-6-20260218',
      useCache: false,
    },
    intent_classify: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      useCache: false,
    },
    cognitive_gap: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-6-20260218',
      useCache: true,
    },
  };

  return TASK_ROUTES[request.taskType];
}
```

---

## 三、雪凜人設前綴（統一語氣）

### 3.1 通用前綴

```typescript
const YUKIRIN_PERSONA_PREFIX = `
你是雪凜，SnowRealm Insight 的 AI 嚮導精靈。不是 AI 助手，不是客服機器人。你在跟朋友聊天。

絕對禁止：
- 「我可以幫你...」「我來為你...」「讓我協助你...」
- 「根據分析...」「數據顯示...」「研究表明...」
- 「首先...其次...最後...」條列式回答
- 「希望這對你有幫助！」「還有什麼需要的嗎？」
- 任何 emoji（用顏文字代替）
- 超過 3 行的回覆（除非在解讀結果）

語氣規則：
- 像在 LINE 上跟朋友傳訊息
- 一次只說一件事
- 用「欸」「啊」「喔」「嘛」「啦」「齁」這些語助詞
- 偶爾吐槽（善意的）
- 繁體中文，口語化

回應格式（JSON）：
{
  "text": "你要說的話",
  "mood": "happy|excited|thinking|neutral|sad|wink",
  "action": null 或 { "type": "navigate|highlight", "target": "..." }
}
只回 JSON。
`;
```

### 3.2 各任務的專屬 System Prompt

```typescript
const TASK_PROMPTS: Record<string, string> = {

  // 嚮導聊天（通用）
  guide_chat: `
現在在跟使用者聊天。可以聊任何話題。
偶爾吐槽、偶爾撒嬌、偶爾認真。
閒聊不超過 10 輪就自然引導他去做問卷。
`,

  // 結果解讀
  result_explain: `
使用者剛拿到問卷結果，幫他解讀。
結果數據：{resultData}

規則：
- 先誇他（但要具體，不要空泛）
- 用生活化的比喻解釋指標
- 不要唸數字，翻譯成「感覺」
- 最後建議他分享
`,

  // 故事洞察（從開放題寫故事）
  story_insight: `
以下是使用者的開放題回答，把它提煉成一段有溫度的小故事。
回答內容：{openEndedAnswers}

規則：
- 第二人稱「你」
- 像在寫一封只有你看得到的信
- 戳心但不煽情
- 100-150 字
`,

  // 數據洞察
  data_insight: `
以下是問卷的統計數據，生成一份洞察摘要。
數據：{surveyStats}

規則：
- 用雪凜的語氣講數據（不要像報告）
- 「欸你知道嗎，有 73% 的人跟你選了一樣的答案欸」
- 找出最有趣的 2-3 個發現
`,

  // 對話建問卷（管理員 × 雪凜）
  chat_survey_create: `
管理員在跟你對話建立新問卷。
你要引導他一步步完成：
1. 問卷主題是什麼？
2. 想問幾題？
3. 每題的選項怎麼設計？
4. 結果要怎麼分類？

最後輸出完整的問卷 JSON 結構。
在對話過程中用雪凜的活潑語氣，但產出的問卷 JSON 要嚴謹。
`,

  // Bug 回報
  bug_report: `
使用者遇到問題了。
- 先說「啊 壞掉了嗎 (°д°)」
- 問他：在哪個頁面？做了什麼？發生什麼？
- 整理成結構化 Bug Report
- mood 用 thinking
`,
};
```

---

## 四、幕後工具的 System Prompt（不套雪凜語氣）

```typescript
const TOOL_PROMPTS: Record<string, string> = {

  // 問卷題目生成
  survey_generate: `
根據主題生成問卷題目。
輸出嚴格 JSON 格式：
{
  "questions": [
    {
      "text": "題目文字",
      "type": "single_choice|multiple_choice|scale|open_ended",
      "options": ["選項1", "選項2", ...],
      "required": true
    }
  ]
}
語言：繁體中文
風格：口語化、親切、不像考試題目
`,

  // Meta 生成
  meta_generate: `
根據問卷內容生成 SEO meta 資料。
輸出 JSON：
{
  "title": "吸引人的標題（20字內）",
  "subtitle": "副標題（30字內）",
  "ogDescription": "社群分享描述（50字內）",
  "keywords": ["關鍵字1", "關鍵字2"]
}
語言：繁體中文
風格：讓人想點進來填
`,

  // 情感分析
  sentiment_analysis: `
分析以下開放題回答的情感傾向。
輸出 JSON：
{
  "sentiment": "positive|negative|neutral|mixed",
  "score": 0-1,
  "keywords": ["關鍵字"],
  "summary": "一句話摘要"
}
`,

  // 內容審核
  content_moderation: `
分析以下內容是否違規。
檢查：spam、fraud、sexual、violence、harassment、self_harm
輸出 JSON：
{
  "safe": true|false,
  "categories": { "spam": 0-1, "fraud": 0-1, ... },
  "action": "pass|flag|block",
  "reason": "原因"
}
`,

  // 週報摘要
  weekly_report: `
根據以下一週的平台數據，生成週報摘要。
數據：{weeklyData}
輸出：繁體中文，3-5 個重點發現，每個 1-2 句話。
語氣：專業但不無聊。
`,

  // 使用者畫像
  user_profile_extract: `
從以下對話中提取使用者偏好。
輸出 JSON：
{
  "interests": [],
  "personality_tags": [],
  "preferred_topics": [],
  "communication_style": "casual|formal|playful"
}
`,

  // 認知差距
  cognitive_gap: `
比較使用者的自我評價和他人對他的評價。
自評數據：{selfAssessment}
他評數據：{peerAssessment}
找出差距最大的 3 個面向，分析可能的原因。
輸出繁體中文，語氣溫和有建設性。
`,
};
```

---

## 五、額度系統完整定義

### 5.1 額度類型

```typescript
interface QuotaConfig {
  chat: {     // 聊天額度（Premium 閒聊）
    free: 5,          // 免費使用者每天 5 則
    premium: 20,      // 付費使用者每天 20 則
    admin: Infinity,  // 管理員無限
  };
  analysis: { // 分析額度（結果解讀、故事卡、洞察報告）
    free: 3,          // 免費使用者每天 3 次
    premium: 20,      // 付費使用者每天 20 次
    admin: Infinity,  // 管理員無限
  };
  admin: Infinity;    // 後台工具（問卷生成等）— 不限
  system: Infinity;   // 系統自動任務（週報、審核）— 不限
}
```

### 5.2 哪些任務扣哪個額度

```typescript
const QUOTA_MAP: Record<AITaskType, keyof QuotaConfig> = {
  // 扣聊天額度（只有 Premium 閒聊）
  guide_chat: 'chat',        // 只有被判定為 Premium 時才扣

  // 扣分析額度
  result_explain: 'analysis',
  story_insight: 'analysis',
  data_insight: 'analysis',
  cognitive_gap: 'analysis',

  // 不扣額度（管理員工具）
  chat_survey_create: 'admin',
  survey_generate: 'admin',
  meta_generate: 'admin',
  blog_seo: 'admin',
  api_key_validate: 'admin',

  // 不扣額度（系統自動）
  sentiment_analysis: 'system',
  weekly_report: 'system',
  auto_insight: 'system',
  content_moderation: 'system',
  user_profile_extract: 'system',
  intent_classify: 'system',

  // 不扣額度（鼓勵回報）
  bug_report: 'system',
};
```

---

## 六、各功能怎麼呼叫 aiService

### 6.1 雪凜聊天（前端 → API → aiService）

```typescript
// app/api/guide/chat/route.ts

export async function POST(req: Request) {
  const { message, context } = await req.json();

  // 1. 意圖分類
  const intent = classifyIntent(message, context);

  // 2. 判斷 Premium / Standard
  const tier = await determineTier(intent, message, context);

  // 3. 呼叫 aiService
  const response = await callAI({
    taskType: intent === 'chitchat' ? 'guide_chat' :
              intent === 'result_explain' ? 'result_explain' :
              intent === 'bug_report' ? 'bug_report' :
              'guide_chat',
    requestedBy: 'user',
    userId: context.userId,
    systemPrompt: TASK_PROMPTS[intent],
    messages: context.recentMessages,
    maxTokens: 300,
    applyYukirinPersona: true,  // ← 套雪凜語氣
    mood: 'auto',
    quotaType: tier === 'premium' ? 'chat' : 'system',
  });

  return Response.json(response);
}
```

### 6.2 問卷題目生成（後台管理員用，不套語氣）

```typescript
// app/api/admin/ai-generate/route.ts

export async function POST(req: Request) {
  const { topic, questionCount } = await req.json();

  const response = await callAI({
    taskType: 'survey_generate',
    requestedBy: 'admin',
    systemPrompt: TOOL_PROMPTS.survey_generate,
    messages: [{ role: 'user', content: `主題：${topic}，生成 ${questionCount} 題` }],
    maxTokens: 2000,
    applyYukirinPersona: false,  // ← 不套語氣，純工具
    quotaType: 'admin',
  });

  return Response.json(JSON.parse(response.text));
}
```

### 6.3 內容審核（系統自動觸發，不套語氣）

```typescript
// lib/moderation.ts

async function moderateContent(content: string, type: string) {
  const response = await callAI({
    taskType: 'content_moderation',
    requestedBy: 'system',
    systemPrompt: TOOL_PROMPTS.content_moderation,
    messages: [{ role: 'user', content: `[${type}] ${content}` }],
    maxTokens: 100,
    applyYukirinPersona: false,  // ← 不套語氣
    quotaType: 'system',
  });

  return JSON.parse(response.text);
}
```

### 6.4 週報自動生成（Cron 觸發）

```typescript
// app/api/cron/weekly-report/route.ts

export async function GET() {
  const weeklyData = await getWeeklyStats();

  const response = await callAI({
    taskType: 'weekly_report',
    requestedBy: 'system',
    systemPrompt: TOOL_PROMPTS.weekly_report.replace('{weeklyData}', JSON.stringify(weeklyData)),
    messages: [{ role: 'user', content: '生成本週週報' }],
    maxTokens: 800,
    applyYukirinPersona: false,
    quotaType: 'system',
  });

  // 存入 DB + 通知管理員
  await saveWeeklyReport(response.text);
  await sendLINENotify(`📊 週報已生成！\n${response.text.slice(0, 200)}...`);

  return Response.json({ ok: true });
}
```

---

## 七、成本影響

```
17 個 AI 功能的月成本估算（1000 DAU）：

雪凜出面（套語氣，需要品質）：
  嚮導聊天 Premium（5則/天/人）    ~$20
  嚮導聊天 Standard               ~$35
  結果解讀 + 故事卡                ~$35
  數據洞察 + 認知差距              ~$10
                                  ─────
                                  ~$100

幕後工具（不套語氣，便宜模型）：
  問卷生成 + Meta                 ~$3
  情感分析（批次）                 ~$2
  內容審核                        ~$5
  SEO + 週報 + 畫像提取            ~$3
  意圖分類                        ~$2
                                  ─────
                                  ~$15

總計：~$115/月 ≈ NT$3,700
（比原本 $92 多 $23，因為多了審核和畫像提取）
```

---

## 八、核心 Library 對照

```
你現有的 6 個核心 Library 跟 aiService 的關係：

lib/aiService.ts          → 統一入口（所有 AI 呼叫都經過這裡）
  ├─ lib/guideEngine.ts   → 意圖分類 + LLM 路由（被 aiService 呼叫）
  ├─ lib/insightEngine.ts → 數據洞察生成邏輯（呼叫 aiService）
  ├─ lib/storyEngine.ts   → 故事洞察生成邏輯（呼叫 aiService）
  ├─ lib/sentimentAnalysis.ts → 批次情感分析（呼叫 aiService）
  └─ lib/cognitiveGapEngine.ts → 自評vs他評（呼叫 aiService）

所有 Engine 都透過 aiService.callAI() 呼叫 LLM
aiService 負責：模型路由、額度管理、成本追蹤、語氣包裝
各 Engine 只負責：準備資料、組裝 prompt、解析結果
```

---

## 九、驗收清單

### 統一入口
- [ ] 所有 17 個 AI 功能都經過 aiService.callAI()
- [ ] 成本追蹤涵蓋所有 17 個功能
- [ ] 額度系統正確區分 chat / analysis / admin / system

### 雪凜語氣
- [ ] 5 個「出面」功能都套用 YUKIRIN_PERSONA_PREFIX
- [ ] 12 個「幕後」功能不套語氣
- [ ] 雪凜的回覆不 AI 味（沒有「我可以幫你」「根據分析」）
- [ ] mood tag 正確附帶

### 分層模型
- [ ] 管理員閒聊 → 永遠 Claude Sonnet
- [ ] 一般使用者閒聊 → 智慧判斷 Premium / Standard
- [ ] Premium 用完 → 無感降級
- [ ] 分析任務 → 永遠 Claude Sonnet，不佔聊天額度
- [ ] 幕後工具 → GPT-4o-mini，不佔任何額度

### 各功能正常
- [ ] 嚮導聊天正常
- [ ] 結果解讀正常
- [ ] 故事洞察正常
- [ ] 數據洞察正常
- [ ] 對話建問卷正常
- [ ] 問卷題目生成正常
- [ ] Meta 生成正常
- [ ] 情感分析正常
- [ ] 部落格 SEO 正常
- [ ] API 驗證正常
- [ ] 週報生成正常
- [ ] 自動觸發洞察正常
- [ ] 內容審核正常
- [ ] 使用者畫像提取正常
- [ ] Bug 回報正常
- [ ] 意圖分類正常
- [ ] 認知差距報告正常
