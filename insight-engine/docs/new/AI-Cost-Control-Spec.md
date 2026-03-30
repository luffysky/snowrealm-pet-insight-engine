# SnowRealm Insight — AI 成本控制總策略

> 所有 AI 相關的成本優化集中在這份文件
> 版本：v1.0 | 日期：2026-03-30
> 目標：讓 AI 成本隨用戶數線性成長，不失控

---

## 一、成本總覽

### 1.1 月成本公式

```
月成本 = LLM 對話成本 + TTS 語音成本 + 現有問卷 AI 成本

其中：
- LLM 對話成本 = (GPT-4o-mini 用量) + (Claude Sonnet 用量)
- TTS 語音成本 = (Azure TTS 字元數 - 快取命中) × 單價
- STT = $0（Web Speech API 免費）
```

### 1.2 預算參考表（每天活躍用戶 DAU）

| DAU | LLM | TTS | 月總計 USD | 月總計 NTD |
|-----|-----|-----|-----------|-----------|
| 100 | $8 | $5 | ~$13 | ~NT$420 |
| 500 | $41 | $25 | ~$66 | ~NT$2,100 |
| 1,000 | $82 | $50 | ~$132 | ~NT$4,200 |
| 5,000 | $410 | $250 | ~$660 | ~NT$21,000 |
| 10,000 | $820 | $500 | ~$1,320 | ~NT$42,000 |

---

## 二、LLM 模型選擇與路由

### 2.1 可用模型定價

| 模型 | Input/1M | Output/1M | 用途 |
|------|----------|-----------|------|
| GPT-4o-mini | $0.15 | $0.60 | 閒聊、功能說明、Z幣客服、意圖分類 |
| Claude Haiku 4.5 | $1.00 | $5.00 | 備選：中等複雜度任務 |
| Claude Sonnet 4.6 | $3.00 | $15.00 | 結果解讀、導覽腳本、Bug 整理 |
| Claude Opus 4.6 | $5.00 | $25.00 | 不使用（太貴，Sonnet 夠用） |

### 2.2 路由決策樹

```
使用者訊息進來
    │
    ▼
[第一層：規則分類] ← 不花 token，0 成本
    │
    ├── 命中關鍵字 → 直接分類
    │   ├── /導覽|新手|怎麼用/  → tour     → Claude Sonnet
    │   ├── /bug|壞了|錯誤/     → bug      → Claude Sonnet
    │   ├── /z幣|儲值|商城/     → zcoin    → GPT-4o-mini
    │   ├── /結果|分析|分數/    → result   → Claude Sonnet
    │   ├── /怎麼|如何|功能/    → feature  → GPT-4o-mini
    │   └── 都不是              → 進入第二層
    │
    ▼
[第二層：LLM 分類] ← 花 ~50 token，約 $0.000008/次
    │
    └── GPT-4o-mini 判斷意圖 → 分類後路由到對應模型
```

### 2.3 為什麼不全用 Claude

```
同樣 1,000 DAU × 5 輪/天 × 30 天：

全用 Claude Sonnet 4.6：
  Input:  1000 × 5 × 500 × 30 = 75M tokens × $3/1M = $225
  Output: 1000 × 5 × 300 × 30 = 45M tokens × $15/1M = $675
  月成本 = ~$900 ← 太貴！

80% 走 GPT-4o-mini + 20% 走 Claude Sonnet：
  GPT-4o-mini: 60M input × $0.15 + 36M output × $0.60 = ~$31
  Claude:      15M input × $3 + 9M output × $15 = ~$180
  月成本 = ~$211 ← 但 Claude 部分還是偏高

加上 Prompt Caching + token 上限：
  實際月成本 = ~$82 ← 這是目標
```

### 2.4 實際路由代碼

```
路由邏輯已移至 Yukirin-AI-Guide-Spec.md 第三章「分層模型路由引擎」

摘要：
- 管理員：閒聊永遠走 Claude Sonnet（無限額度）
- 一般使用者：每天 5 則 Premium 閒聊走 Claude Sonnet
  → 雪凜自動判斷哪些對話值得升級（情緒性、深度、長訊息）
  → 用完後無感降回 GPT-4o-mini
- 問卷分析/結果解讀：永遠走 Claude Sonnet，不佔聊天額度
- 導覽/功能/Z幣客服：永遠走 GPT-4o-mini，不佔額度
- Bug 回報：走 Claude Sonnet，不佔額度（鼓勵回報）

成本影響：
  每天 1000 DAU × 平均 2 則 premium 閒聊 × 800 tokens = 1.6M tokens
  Claude Sonnet: 1.6M × $3 input + 1M × $15 output ≈ $20/月（增加）
  但 5 則上限封頂了最大成本，不會失控

  1000 DAU 新月成本估算：
  GPT-4o-mini（Standard 閒聊 + 功能 + 客服）: ~$35
  Claude Sonnet（Premium 閒聊 5則/天/人）: ~$20
  Claude Sonnet（結果解讀 + 故事卡，獨立）: ~$35
  意圖分類: ~$2
  合計: ~$92（vs 原本 $82，多 $10 但品質大幅提升）
```

---

## 三、Prompt Caching（省 90% 重複 input）

### 3.1 原理

每次呼叫 LLM 都要送 system prompt（雪凜的人設 + 功能文檔 + 使用者畫像），這段每次都一樣但每次都要收費。Prompt Caching 讓這段只在第一次收費，之後讀快取只收 10% 的價格。

### 3.2 Anthropic Prompt Caching

```typescript
// Claude API 呼叫加上 cache_control

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6-20260218',
  max_tokens: 500,
  system: [
    {
      type: 'text',
      text: YUKIRIN_SYSTEM_PROMPT,  // ~2000 tokens 的人設
      cache_control: { type: 'ephemeral' },  // ← 這段會被快取
    },
    {
      type: 'text',
      text: FEATURE_DOCS,  // ~1000 tokens 的功能文檔
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages: [...],  // 使用者對話（這段不快取）
});

// 定價：
// 首次寫入快取：$3.75/1M tokens（比正常 $3 貴 25%）
// 之後讀取快取：$0.30/1M tokens（比正常 $3 便宜 90%！）
// TTL：5 分鐘（5 分鐘內同個 prompt prefix 都命中快取）
```

### 3.3 估算節省

```
假設：system prompt = 3000 tokens，每天每個使用者平均 5 輪對話

不用 Caching：
  3000 tokens × 5 輪 × 200 users × 30 天 = 90M tokens
  90M × $3/1M = $270

用 Caching（假設 80% 命中率）：
  首次：18M × $3.75/1M = $67.5
  快取：72M × $0.30/1M = $21.6
  合計 = $89.1

  節省：$270 - $89 = $181/月 → 省 67%
```

### 3.4 OpenAI 端也有類似機制

GPT-4o-mini 不支援 Anthropic 式的 prompt caching，但可以用其他方式省：
- 縮短 system prompt（閒聊不需要完整功能文檔）
- 共用 thread/assistant ID（OpenAI Assistants API 有上下文重用）

---

## 四、Token 用量上限

### 4.1 每次對話的 token 限制

```typescript
const TOKEN_LIMITS: Record<Intent, { maxInput: number; maxOutput: number }> = {
  chitchat:       { maxInput: 800,  maxOutput: 200 },  // 閒聊短就好
  feature_help:   { maxInput: 1000, maxOutput: 300 },
  zcoin_support:  { maxInput: 800,  maxOutput: 250 },
  result_explain: { maxInput: 2000, maxOutput: 500 },  // 結果解讀需要多一點
  tour:           { maxInput: 1500, maxOutput: 400 },
  bug_report:     { maxInput: 1200, maxOutput: 400 },
};
```

### 4.2 每個使用者的日上限

```typescript
const DAILY_LIMITS = {
  free_user: {
    totalRounds: 20,           // 每天最多 20 輪對話
    ttsCharacters: 3000,       // TTS 最多 3000 字元/天
    resultExplains: 3,         // 結果解讀最多 3 次/天
  },
  premium_user: {
    totalRounds: 100,
    ttsCharacters: 15000,
    resultExplains: 20,
  },
};

// 達到上限時雪凜的回應：
// 「今天跟你聊太多啦～明天再來找我吧！(´・ω・`)」
```

### 4.3 全局月預算上限

```typescript
// 環境變數設定月預算硬上限
const MONTHLY_BUDGET_LIMIT = parseFloat(process.env.AI_MONTHLY_BUDGET || '200'); // USD

// 每次 API 呼叫後累加成本
async function trackCost(provider: string, model: string, inputTokens: number, outputTokens: number) {
  const cost = calculateCost(provider, model, inputTokens, outputTokens);

  await supabase.from('ai_cost_log').insert({
    provider,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: cost,
    created_at: new Date().toISOString(),
  });

  // 檢查月累計
  const monthTotal = await getMonthlyTotal();
  if (monthTotal >= MONTHLY_BUDGET_LIMIT * 0.9) {
    // 通知管理員
    await sendAlert(`AI 成本已達月預算 90%：$${monthTotal.toFixed(2)}`);
  }
  if (monthTotal >= MONTHLY_BUDGET_LIMIT) {
    // 自動降級：關閉 Claude，全部走 GPT-4o-mini
    await setFlag('force_cheap_mode', true);
  }
}
```

---

## 五、TTS 成本控制

### 5.1 Azure TTS 定價

```
標準語音：$16 USD / 1,000,000 字元
中文字 = 2 字元
雪凜一句話 30 字 = 60 字元 ≈ $0.00096

免費額度：每月 500,000 字元（~8300 句中文免費）
```

### 5.2 五大省錢機制

**① 語音開關預設關**
```typescript
// 設定頁面
const DEFAULT_SETTINGS = {
  yukirinVoiceEnabled: false,  // 預設關閉，使用者手動開
};
// 預估只有 20-30% 使用者會開 → TTS 成本直接砍 70%
```

**② 預錄常用句子**
```typescript
// 這些句子出現頻率最高，預錄成 MP3 不花 API 錢
const CACHED_VOICE = {
  'greeting':     '/voice/greeting.mp3',      // 嗨嗨！
  'tour_start':   '/voice/tour-start.mp3',    // 讓我帶你逛逛～
  'thinking':     '/voice/thinking.mp3',      // 讓我想想...
  'bye':          '/voice/bye.mp3',           // 下次再來找我玩～
  'zcoin_earned': '/voice/zcoin.mp3',         // 恭喜獲得 Z 幣！
  'confirm':      '/voice/confirm.mp3',       // 好的！
  'error_sorry':  '/voice/sorry.mp3',         // 不好意思出錯了！
  'result_wow':   '/voice/result-wow.mp3',    // 哇！出來了！
};
// 這些佔對話的 ~30%，直接省 30% TTS 費用
```

**③ 短句不觸發 TTS**
```typescript
// 少於 5 個字的回覆不用語音（打字就能看到）
function shouldUseTTS(text: string): boolean {
  if (!userSettings.yukirinVoiceEnabled) return false;
  if (text.length < 5) return false;  // 「好的」「嗯嗯」不用唸
  if (CACHED_VOICE[text]) return false; // 有快取的不用 API
  return true;
}
```

**④ 合併短句**
```typescript
// 如果 LLM 回覆分成好幾段，合併成一次 TTS 呼叫
// 不要：「嗨嗨！」→ TTS → 「讓我看看...」→ TTS → 「找到了！」→ TTS
// 要：「嗨嗨！讓我看看... 找到了！」→ 一次 TTS
```

**⑤ 使用者閒置自動暫停**
```typescript
// 使用者 30 秒沒互動 → 雪凜接下來的主動觸發只用文字不用語音
// 避免使用者去上廁所但雪凜一直在那邊講話
```

### 5.3 TTS 最壞情況 vs 實際

```
最壞（所有人開語音，不快取）：~$144/月
實際（30%開語音 + 30%快取 + 短句跳過）：~$30-50/月
```

---

## 六、資料庫成本追蹤

### 6.1 成本記錄表

```sql
CREATE TABLE ai_cost_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,           -- 'openai' | 'anthropic' | 'azure_tts'
  model TEXT NOT NULL,              -- 模型名稱
  intent TEXT,                      -- 意圖分類
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  tts_characters INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) NOT NULL,
  user_id UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 月累計 view
CREATE VIEW monthly_ai_cost AS
SELECT
  date_trunc('month', created_at) AS month,
  provider,
  model,
  intent,
  COUNT(*) AS call_count,
  SUM(input_tokens) AS total_input_tokens,
  SUM(output_tokens) AS total_output_tokens,
  SUM(tts_characters) AS total_tts_chars,
  SUM(cost_usd) AS total_cost_usd
FROM ai_cost_log
GROUP BY 1, 2, 3, 4
ORDER BY 1 DESC, 7 DESC;
```

### 6.2 後台監控面板

```
/admin/ai-cost

顯示：
├── 本月累計成本（大數字 + 預算進度條）
├── 日成本趨勢折線圖
├── 各模型成本佔比（餅圖：GPT-mini vs Claude vs TTS）
├── 各意圖成本佔比（閒聊 vs 結果解讀 vs 導覽 ...）
├── Token 用量趨勢
├── 最貴的 Top 10 對話（debug 用）
└── 預算告警設定
```

### 6.3 告警規則

```typescript
const ALERTS = [
  {
    threshold: 0.5,   // 50%
    action: 'notify', // Slack/LINE 通知
    message: 'AI 月成本已過半',
  },
  {
    threshold: 0.8,   // 80%
    action: 'notify',
    message: '⚠️ AI 月成本達 80%',
  },
  {
    threshold: 0.9,   // 90%
    action: 'degrade',  // 自動降級
    message: '🚨 AI 月成本達 90%，自動切換全走 GPT-4o-mini',
    effect: () => {
      // 所有意圖都走 GPT-4o-mini
      // TTS 頻率降低（只有結果解讀才觸發語音）
    },
  },
  {
    threshold: 1.0,   // 100%
    action: 'throttle', // 限流
    message: '🛑 月預算用完，雪凜對話限制每人每天 5 輪',
    effect: () => {
      DAILY_LIMITS.free_user.totalRounds = 5;
      DAILY_LIMITS.premium_user.totalRounds = 20;
    },
  },
];
```

---

## 七、進階省錢技巧

### 7.1 使用者分群計費

```typescript
// 免費使用者：只用 GPT-4o-mini，不開語音
// 付費使用者：可以用 Claude + 語音
// 這樣免費使用者的 AI 成本趨近於零

function getRoutingForUser(user: User, intent: Intent): RoutingDecision {
  if (!user.isPremium) {
    return {
      provider: 'openai',
      model: 'gpt-4o-mini',
      maxTokens: 150,        // 免費用戶回覆更短
      useCache: false,
    };
  }
  return routeRequest(intent, user.context); // 正常路由
}
```

### 7.2 非即時任務用 Batch API（省 50%）

```typescript
// 使用者畫像更新、對話摘要生成 → 不需要即時
// 用 Anthropic Batch API 50% 折扣

// 每天凌晨批次處理：
// 1. 提取當天所有對話的使用者畫像
// 2. 生成每個問卷的 AI 洞察摘要
// 3. Bug report 分類和優先級排序
```

### 7.3 Response Streaming 減少感知延遲

```typescript
// 串流回應不會省錢，但讓使用者「覺得」更快
// 因此可以用更便宜的模型而不損失體驗

// GPT-4o-mini 串流 → 使用者覺得回覆很快
// 即使品質比 Claude 差一點，速度感補回來了
```

### 7.4 離線模式（$0 成本）

```typescript
// PWA 離線時，雪凜用預設回覆，不呼叫任何 API
const OFFLINE_RESPONSES: Record<string, string> = {
  default: '嗚嗚...我現在連不上網路，等有訊號再跟你聊～',
  tour: '離線的時候沒辦法帶你導覽，不過你可以先自己逛逛！',
  bug: '記下來了！等連上網路我會幫你回報的～',
};
```

---

## 八、每個環節的成本開關一覽表

| 環節 | 開關 | 預設 | 省多少 |
|------|------|------|--------|
| 意圖分類第一層 | 規則匹配 vs LLM | 規則優先 | 99% 不花 token |
| 閒聊模型 | GPT-4o-mini vs Claude | GPT-4o-mini | 省 80% |
| System Prompt | Prompt Caching | 開啟 | 省 67-90% |
| 回覆長度 | maxTokens 限制 | 依意圖不同 | 防止超長回覆 |
| TTS 語音 | 使用者開關 | 預設關 | 70% 使用者不花 TTS |
| 常用句快取 | 預錄 MP3 | 開啟 | 省 30% TTS |
| 短句跳過 | <5 字不觸發 TTS | 開啟 | 省 ~10% TTS |
| STT 語音輸入 | Web Speech API | 免費 | $0 |
| 非即時任務 | Batch API | 開啟 | 省 50% |
| 預算超限 | 自動降級 | 90% 觸發 | 防爆預算 |
| 免費 vs 付費 | 使用者分群 | 免費走便宜模型 | 免費用戶~$0 |

---

## 九、驗收清單

- [ ] LLM 路由邏輯正確（關鍵字→意圖→模型選擇）
- [ ] Anthropic Prompt Caching 生效（檢查 API response 的 cache_read_input_tokens）
- [ ] Token 上限正確生效（不超過 maxTokens）
- [ ] 每次 API 呼叫都記錄到 ai_cost_log
- [ ] 月累計 view 正確計算
- [ ] 後台成本面板正常顯示
- [ ] 50% / 80% / 90% / 100% 告警正確觸發
- [ ] 90% 時自動降級到全走 GPT-4o-mini
- [ ] 100% 時限流生效
- [ ] TTS 語音開關預設關
- [ ] 常用句快取命中正常
- [ ] 短句不觸發 TTS
- [ ] 免費/付費使用者分群路由正確
- [ ] 離線模式不呼叫任何 API
