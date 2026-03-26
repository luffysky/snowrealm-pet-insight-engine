# 任務：封面圖片 + 選項 Emoji + AI 模型切換

---

## 任務 1：問卷封面圖片上傳

問卷封面頁目前只有文字，需要加一張封面圖片。

### DB

```sql
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
```

### 修改

```
🔧 src/lib/surveyRepo.ts
   - allowed 加 'cover_image_url'
   - toSurveyConfig 映射 coverImageUrl
   - SurveyRow interface 加 cover_image_url

🔧 src/types/survey.ts
   SurveyConfig 加：coverImageUrl?: string

🔧 src/app/(admin)/insight-admin/surveys/page.tsx
   在問卷「設定」tab 加：
   
   封面圖片：
   ┌──────────────────────────────┐
   │  [拖曳上傳或點擊選擇圖片]    │
   │                              │
   │  📤 支援 JPG/PNG，建議尺寸    │
   │     1200x630                 │
   └──────────────────────────────┘
   [上傳] [移除圖片]
   
   上傳邏輯：呼叫現有的 /api/admin/upload API → R2 → 回傳 URL
   存到 surveys.cover_image_url

🔧 src/components/survey/SurveyShell.tsx（或封面頁元件）
   在封面頁顯示圖片：
   
   {config.coverImageUrl && (
     <img 
       src={config.coverImageUrl} 
       alt={config.title}
       className="w-full max-h-64 object-cover rounded-xl mb-4"
     />
   )}
   
   放在 coverTitle 上方

🔧 src/app/[org]/[slug]/OrgSurveyClient.tsx
   封面步驟（step === -1 時）也要顯示圖片

🔧 src/app/(public)/survey/[slug]/page.tsx
   同上
```

---

## 任務 2：AI 出題自動配選項 Emoji

目前每個選項都有 emoji（optionEmoji.ts），但 AI 生成的選項沒有帶 emoji。
讓 AI 在生成題目時順便為每個選項挑選合適的 emoji。

### 修改 AI Prompt

```
🔧 src/lib/aiSurveyPrompt.ts

在 system prompt 的 JSON 格式說明裡，options 格式改成：

  "options": [
    { "label": "主動跟大家聊天", "value": "主動跟大家聊天", "emoji": "💬" },
    { "label": "靜靜地觀察", "value": "靜靜地觀察", "emoji": "👀" },
    ...
  ]

加上指示：
  每個選項都要有一個 emoji 欄位，選擇最能代表該選項意義的 emoji。
  emoji 要直覺、好辨識，不要重複使用同一個。
  例如：
    開心 → 😊、難過 → 😢、思考 → 🤔、冒險 → 🏔️
    狗 → 🐕、貓 → 🐈、運動 → ⚽、音樂 → 🎵
```

### 修改 AiSurveyChat 建立題目時帶 emoji

```
🔧 src/components/admin/AiSurveyChat.tsx

在 createSurveyFromAi() 建立題目的 loop 裡：

  await fetch(`/api/admin/surveys/${surveyId}/questions`, {
    method: 'POST',
    body: JSON.stringify({
      ...
      options: q.options?.map(opt => ({
        label: opt.label,
        value: opt.value,
        emoji: opt.emoji || '',  // AI 生成的 emoji
      })) ?? [],
    }),
  })
```

### 修改基礎版 AI 出題也帶 emoji

```
🔧 src/components/admin/AiGeneratePanel.tsx（或 AiBasicGeneratePanel.tsx）

同上，AI 回傳的選項如果有 emoji 就帶上。

🔧 src/app/api/admin/ai-generate/route.ts

prompt 裡加上要求每個選項配一個 emoji。
```

### 同時確認前端元件能顯示 emoji

```
現有的 QuestionSingle.tsx 和 QuestionMultiple.tsx 已經用
getOptionEmoji(value) 從 optionEmoji.ts 查找 emoji。

但如果選項自帶 emoji（option.emoji），應該優先使用：

🔧 src/components/survey/QuestionSingle.tsx
🔧 src/components/survey/QuestionMultiple.tsx

  // 優先用選項自帶的 emoji，其次用 optionEmoji 自動匹配
  const emoji = option.emoji || getOptionEmoji(option.value)

🔧 src/types/survey.ts
  QuestionOption interface 確認有：emoji?: string
```

---

## 任務 3：AI 設定頁面 — API Key + 模型可編輯切換

目前 AI 設定頁面顯示已設定的 Provider，但不能即時切換模型。
使用者可能想在 gpt-4o-mini 和 gpt-4o 之間切換。

### 修改

```
🔧 src/app/(admin)/insight-admin/ai-settings/page.tsx

在已設定的 Provider 卡片裡加上：

  ┌──────────────────────────────────────────┐
  │ OpenAI  [主要] [啟用]                     │
  │                                           │
  │ 模型：[▼ gpt-4o-mini    ]  ← 下拉可切換  │
  │                                           │
  │ 可選模型：                                │
  │   gpt-4o-mini（便宜快速）                 │
  │   gpt-4o（更聰明）                        │
  │   gpt-4.1-mini（最新）                    │
  │   gpt-4.1（最強）                         │
  │                                           │
  │ API Key：sk-...****                       │
  │ [✏️ 更換 Key]                             │
  │                                           │
  │ [🔍 驗證] [⏸️ 停用] [🗑️ 刪除]            │
  └──────────────────────────────────────────┘

切換模型時呼叫 PATCH API 更新 default_model。
更換 Key 時重新加密存入。

模型選項定義：

const MODEL_OPTIONS: Record<string, Array<{ value: string; label: string; desc: string }>> = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: '便宜快速，適合一般出題' },
    { value: 'gpt-4o', label: 'GPT-4o', desc: '更聰明，適合複雜分析' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', desc: '最新小模型' },
    { value: 'gpt-4.1', label: 'GPT-4.1', desc: '最新最強' },
    { value: 'o4-mini', label: 'O4 Mini', desc: '推理模型，最適合深度分析' },
  ],
  anthropic: [
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', desc: '平衡型' },
    { value: 'claude-opus-4-6', label: 'Claude Opus 4.6', desc: '最強' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', desc: '快速便宜' },
  ],
  google: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: '快速' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', desc: '進階' },
  ],
}
```

### API 修改

```
🔧 src/app/api/admin/ai-settings/route.ts

PATCH handler 支援更新 default_model：

  if (body.default_model) {
    await execute(
      'UPDATE ai_provider_configs SET default_model = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3',
      [body.default_model, body.id, tenantId]
    )
  }

支援更新 API Key（重新加密）：

  if (body.newApiKey) {
    const { encrypted, iv, tag } = encryptApiKey(body.newApiKey)
    await execute(
      'UPDATE ai_provider_configs SET encrypted_api_key = $1, encryption_iv = $2, encryption_tag = $3, updated_at = NOW() WHERE id = $4 AND tenant_id = $5',
      [encrypted, iv, tag, body.id, tenantId]
    )
  }
```

---

## 執行順序

```
Step 1：DB SQL（cover_image_url）
Step 2：封面圖片上傳 + 顯示
Step 3：AI prompt 加 emoji 要求
Step 4：AI 設定頁面模型切換 + Key 更換
Step 5：測試
```
