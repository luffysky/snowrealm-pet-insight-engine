# 緊急任務：稱號系統接線 + AI 出題靈感

> 稱號系統的引擎和 UI 都已完成（quizResultEngine.ts + ResultCard.tsx + DoneClient 整合）
> 但 AI 對話出題不會生成 result_config，手動建問卷也沒有 UI 設定 result_config
> 所以稱號永遠不會顯示

---

## 任務 1：AiSurveyChat 生成 resultConfig

AI 對話建立問卷時，如果是人格/測驗類問卷，要同時生成 `result_config`。

### 修改 AI Prompt

```
🔧 src/lib/aiSurveyPrompt.ts

在 system prompt 裡加上（告訴 AI 要生成 resultConfig）：

  如果這是一份人格測驗 / 心理測驗 / 類型測驗，請額外生成 resultConfig：
  
  "resultConfig": {
    "scoringRules": {
      "q1": { "選項A的value": "typeKey1", "選項B的value": "typeKey2", ... },
      "q2": { ... },
      ...
    },
    "resultTypes": [
      {
        "key": "typeKey1",
        "name": "稱號名稱（如「毒舌系真心話王」）",
        "emoji": "😈",
        "description": "2-3 句描述",
        "traits": ["直接", "真誠", "不怕得罪人"]
      },
      ...
    ]
  }

  scoringRules 的邏輯：每個選項對應一個 typeKey，最後累加最多的 typeKey 就是結果。
  resultTypes 至少要有 4-6 個不同的結果類型，每個要有：
    - key: 英文 ID
    - name: 中文稱號（要有趣、具體、讓人想分享）
    - emoji: 一個代表性 emoji
    - description: 2-3 句話描述這個類型
    - traits: 3-5 個特質標籤
```

### 修改 AiSurveyChat 建立流程

```
🔧 src/components/admin/AiSurveyChat.tsx

在 createSurveyFromAi() 的 patchBody 裡加：

  // 如果 AI 有生成 resultConfig → 存入
  if (data.resultConfig) {
    patchBody.result_config = data.resultConfig
  }
```

### 修改 parseSurveyJson

```
🔧 src/lib/aiSurveyPrompt.ts

AiGeneratedSurvey interface 加：
  resultConfig?: {
    scoringRules: Record<string, Record<string, string>>
    resultTypes: Array<{
      key: string
      name: string
      emoji: string
      description: string
      traits?: string[]
    }>
  }

parseSurveyJson() 解析時加上 resultConfig 欄位
```

### 確認 API 支援 result_config

```
🔧 src/lib/surveyRepo.ts

確認 allowed 陣列有 'result_config'（已有 ✅）
確認 toSurveyConfig 映射 resultConfig（已有 ✅）
```

---

## 任務 2：手動建問卷的 resultConfig 設定 UI

讓不用 AI 的使用者也能設定稱號。

### 修改

```
🔧 src/app/(admin)/insight-admin/surveys/page.tsx

在問卷設定區塊（「設定」tab）新增「🏆 結果稱號設定」區塊：

  ☐ 啟用結果稱號（測驗型問卷）

  啟用後顯示：

  ── 結果類型 ──
  
  [+ 新增結果類型]
  
  結果 #1：
    Key: [adventurer    ]
    稱號: [熱血系全能冒險者]
    Emoji: [⭐]
    描述: [你積極、熱情、什麼都想嘗試！]
    特質標籤: [積極] [熱情] [冒險] [+ 新增]
    [刪除]
  
  結果 #2：
    Key: [healer         ]
    稱號: [文藝系治癒者   ]
    ...

  ── 計分規則 ──
  
  自動生成模式：
    [🤖 AI 自動分配計分規則]
    → 呼叫 AI 根據題目和結果類型，自動生成每個選項對應哪個 typeKey
  
  手動模式：
    q1 的選項：
      「選項A」→ [▼ adventurer]
      「選項B」→ [▼ healer   ]
      ...
    q2 的選項：
      ...

存到 surveys.result_config JSONB
```

---

## 任務 3：AI 對話出題的 Prompt 靈感功能

使用者不知道怎麼跟 AI 說？給他們「看看別人怎麼問」。

### 修改

```
🔧 src/components/admin/AiSurveyChat.tsx

在輸入框上方加一個靈感區塊：

  ┌──────────────────────────────────────────┐
  │ 💡 不知道怎麼開始？試試這些：             │
  │                                           │
  │ [🪞 朋友眼中的你]  [💕 戀愛致命弱點]      │
  │ [🐾 你是哪種動物]  [😈 你的隱藏黑暗面]    │
  │ [💼 職場人設保質期] [🔮 未來人生路線]      │
  │ [✨ 隱藏天賦]      [🤝 朋友契合度]        │
  │                                           │
  │ [查看更多靈感 ▼]                          │
  └──────────────────────────────────────────┘

點擊任一個 → 自動填入對應的 prompt 到輸入框。

靈感 prompt 定義：

const PROMPT_INSPIRATIONS = [
  {
    icon: '🪞',
    label: '朋友眼中的你',
    prompt: '幫我設計一份「朋友眼中的你」人格測驗，10題，每題4個選項，結果要有有趣的稱號，讓人想截圖分享',
  },
  {
    icon: '💕',
    label: '戀愛致命弱點',
    prompt: '設計一份「你的戀愛致命弱點」測驗，10題，有點刺但不傷人，結果要讓人覺得被看穿然後忍不住傳給朋友',
  },
  {
    icon: '🐾',
    label: '你是哪種動物',
    prompt: '設計一份「你是哪種動物」娛樂型人格測驗，10題，簡短有趣，結果是具象的動物角色，適合做成故事卡分享',
  },
  {
    icon: '😈',
    label: '你的隱藏黑暗面',
    prompt: '設計一份「你的隱藏黑暗人格」測驗，10題，有心理測驗感但不嚴肅，結果是暗黑角色如「溫柔系操控者」',
  },
  {
    icon: '💼',
    label: '職場人設保質期',
    prompt: '設計一份「你的職場人設能撐到幾歲」測驗，8題，帶黑色幽默，結果告訴你人設保質期和崩塌預兆',
  },
  {
    icon: '🔮',
    label: '未來人生路線',
    prompt: '設計一份「你的未來人生路線」預測型測驗，10題，題目有畫面感，結果是一段微小說描述你的人生劇本',
  },
  {
    icon: '✨',
    label: '隱藏天賦',
    prompt: '設計一份「你被低估的隱藏實力」測驗，10題，結果要具體不空洞，讓人覺得「終於有人懂我」',
  },
  {
    icon: '🤝',
    label: '朋友契合度',
    prompt: '設計一份「跟我當朋友你能撐多久」友誼測驗，8題，帶點挑釁但好笑，結果用百分比加一句毒舌評語',
  },
  {
    icon: '👀',
    label: '第一印象 vs 真實的你',
    prompt: '設計一份「第一印象vs真正的你」反差測驗，10題，前5題測別人眼中的你，後5題測真正的你，結果呈現反差感',
  },
  {
    icon: '💑',
    label: '情侶吵架生存指南',
    prompt: '設計一份「你們吵架時誰比較可怕」情侶測驗，8題，有趣不引戰，兩個人分別填再對比結果',
  },
]
```

### 同時加「分享我的 Prompt」功能

```
🔧 src/components/admin/AiSurveyChat.tsx

在使用者輸入 prompt 並成功生成問卷後，顯示：

  ┌──────────────────────────────────────┐
  │ 🎉 問卷建立成功！                    │
  │                                      │
  │ ☐ 把我的 prompt 分享給其他人參考     │
  │                                      │
  │ [前往編輯問卷]                       │
  └──────────────────────────────────────┘

勾選後，把 prompt 存到 DB：

📄 新增表：
  CREATE TABLE IF NOT EXISTS shared_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES admin_users(id),
    prompt_text TEXT NOT NULL,
    survey_title TEXT,
    category TEXT DEFAULT 'general',
    likes INT DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

📄 新增 API：
  src/app/api/admin/shared-prompts/route.ts
    GET — 列出公開的 prompt（按 likes 排序）
    POST — 分享我的 prompt

在靈感區塊裡加一個 tab：
  [💡 推薦靈感] [🌐 大家的靈感]
  
  「大家的靈感」tab 顯示其他人分享的 prompt，可以 👍 按讚
```

---

## 任務 4：AI 出題 prompt 裡強制要求生成 resultConfig

目前 AI 生成問卷可能不會帶 resultConfig。需要在 prompt 裡明確要求。

```
🔧 src/lib/aiSurveyPrompt.ts

在 system prompt 的 JSON 格式說明裡加上：

  重要：如果問卷是測驗型（人格測驗、心理測驗、類型測驗），
  你「必須」在 JSON 裡包含 "resultConfig" 欄位。
  
  判斷標準：如果問卷的目的是讓填答者得到一個「你是什麼類型」的結果，
  就一定要有 resultConfig。
  
  resultConfig 格式：
  {
    "scoringRules": {
      "q1": { "選項A value": "typeKey", "選項B value": "typeKey2", ... },
      ...
    },
    "resultTypes": [
      {
        "key": "typeKey",
        "name": "有趣的中文稱號",
        "emoji": "代表性 emoji",
        "description": "2-3 句描述，讓人覺得被看穿",
        "traits": ["特質1", "特質2", "特質3"]
      },
      ...至少 4-6 個結果類型
    ]
  }
  
  稱號命名規則：
  - 格式：「X系 + Y者/王/家」（如「毒舌系真心話王」「佛系暖陽使者」）
  - 要有趣、具體、讓人想截圖分享
  - 不要太長（6-10 個字）
  - 每個結果的 emoji 要不同
```

---

## 執行順序

```
Step 1：改 aiSurveyPrompt.ts — prompt 強制生成 resultConfig（最重要）
Step 2：改 AiSurveyChat.tsx — 傳 result_config 到 PATCH API + 加靈感按鈕
Step 3：改 surveys/page.tsx — 手動 resultConfig 設定 UI
Step 4：建 shared_prompts 表 + API（分享 prompt 功能）
Step 5：測試：用 AI 對話建一份人格測驗 → 填答 → 看完成頁有沒有稱號
```
