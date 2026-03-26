# SnowRealm Insight Engine — Cursor 總任務包

> 合併：Bug 修復 + 稱號系統 + AI 靈感 + 封面圖片 + Emoji + AI 模型
> + 簽到任務 + 廣告 + 儲值 + Prompt 分享 + 密碼鎖 + 協作 + 鉤子模板
> V4/V5/V6/V7/V8/V9 全融合

---

# 一、DB SQL（先跑）

```sql
-- 封面圖片
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- 密碼鎖
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS access_password TEXT;

-- 簽到任務
CREATE TABLE IF NOT EXISTS daily_task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_task_logs (user_id, completed_at);

-- Prompt 分享
CREATE TABLE IF NOT EXISTS shared_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  prompt_text TEXT NOT NULL,
  survey_title TEXT,
  category TEXT DEFAULT 'general',
  likes INT DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 二、Bug 修復（最緊急）

## Bug 1：「已經填過問卷」偵測錯誤

填過任何一份問卷，所有問卷都顯示「你似乎已經填過了」。
原因：progress API 只查 fingerprint，沒加 survey_id。

```
🔧 src/app/api/surveys/progress/route.ts

把 survey 查詢移到 existing 查詢之前，然後加 survey_id 條件：

  // 先查 survey
  const survey = await queryOne<{ id: string; tenant_id: string }>(
    'SELECT id, tenant_id FROM surveys WHERE slug = $1', [surveySlug]
  )

  // 檢查是否已提交過「這份問卷」（不是所有問卷）
  const existing = await queryOne<{ id: string; status: string }>(
    'SELECT id, status FROM responses WHERE fingerprint = $1 AND survey_id = $2 AND status = $3 LIMIT 1',
    [fingerprint, survey?.id, 'completed']
  )
```

## Bug 2：AiSurveyChat 按 Enter 視窗跳動

```
🔧 src/components/admin/AiSurveyChat.tsx

加 chatContainerRef，scrollIntoView 改成只在接近底部時才觸發：

  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

對話容器加 ref：
  <div ref={chatContainerRef} className="h-96 overflow-y-auto px-6 py-4 space-y-4">
```

## Bug 3：AiSurveyChat AI 回覆被截斷消失

stripSurveyJson 移除 JSON 後，displayContent 為空 → 氣泡消失。

```
🔧 src/components/admin/AiSurveyChat.tsx

把：
  if (!displayContent && msg.role === 'assistant') return null

改成：
  if (!displayContent && msg.role === 'assistant') {
    return (
      <div key={i} className="flex gap-3 justify-start">
        <div className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">🤖</div>
        <div className="bg-slate-700/60 rounded-xl px-4 py-3 text-sm text-cyan-400/80">
          ✅ AI 已完成問卷設計，請查看下方預覽
        </div>
      </div>
    )
  }
```

---

# 三、AI 出題：resultConfig + Emoji + 靈感

## 3a. AI prompt 強制生成 resultConfig + 選項 Emoji

```
🔧 src/lib/aiSurveyPrompt.ts

system prompt 加上：

1. 每個選項要帶 emoji：
   "options": [
     { "label": "主動跟大家聊天", "value": "主動跟大家聊天", "emoji": "💬" },
     ...
   ]
   emoji 要直覺好辨識，不重複。

2. 測驗型問卷必須生成 resultConfig：
   如果問卷目的是讓填答者得到「你是什麼類型」的結果，必須包含 resultConfig。

   "resultConfig": {
     "scoringRules": {
       "q1": { "選項A value": "typeKey1", "選項B value": "typeKey2" }, ...
     },
     "resultTypes": [
       {
         "key": "typeKey1",
         "name": "毒舌系真心話王",    ← 有趣具體，6-10字
         "emoji": "😈",              ← 每個不同
         "description": "你說話直接、不拐彎抹角，朋友都知道你是那個會說真話的人。",
         "traits": ["直接", "真誠", "不怕得罪人"]
       },
       ... 至少 4-6 個結果
     ]
   }

   稱號格式：「X系 + Y者/王/家」

AiGeneratedSurvey interface 加：
  resultConfig?: {
    scoringRules: Record<string, Record<string, string>>
    resultTypes: Array<{ key: string; name: string; emoji: string; description: string; traits?: string[] }>
  }

parseSurveyJson() 解析時加上 resultConfig 欄位。
```

## 3b. AiSurveyChat 傳 resultConfig + emoji

```
🔧 src/components/admin/AiSurveyChat.tsx

createSurveyFromAi() 的 patchBody 加：
  if (data.resultConfig) {
    patchBody.result_config = data.resultConfig
  }

建立題目時帶 emoji：
  options: q.options?.map(opt => ({
    label: opt.label, value: opt.value, emoji: opt.emoji || ''
  })) ?? []
```

## 3c. 前端優先用選項自帶 emoji

```
🔧 src/components/survey/QuestionSingle.tsx
🔧 src/components/survey/QuestionMultiple.tsx

  const emoji = option.emoji || getOptionEmoji(option.value)

🔧 src/types/survey.ts
  QuestionOption 確認有：emoji?: string
```

## 3d. Prompt 靈感按鈕

```
🔧 src/components/admin/AiSurveyChat.tsx

在 {/* Input */} 之前，只在 messages.length <= 1 時顯示：

const PROMPT_INSPIRATIONS = [
  { icon: '🪞', label: '朋友眼中的你', prompt: '幫我設計一份「朋友眼中的你」人格測驗，10題，每題4個選項，結果要有有趣的稱號，讓人想截圖分享' },
  { icon: '💕', label: '戀愛致命弱點', prompt: '設計一份「你的戀愛致命弱點」測驗，10題，有點刺但不傷人，結果要讓人覺得被看穿' },
  { icon: '🐾', label: '你是哪種動物', prompt: '設計一份「你是哪種動物」娛樂型人格測驗，10題，結果是具象的動物角色' },
  { icon: '😈', label: '隱藏黑暗面', prompt: '設計一份「你的隱藏黑暗人格」測驗，10題，結果是暗黑角色如「溫柔系操控者」' },
  { icon: '💼', label: '職場人設保質期', prompt: '設計一份「你的職場人設能撐到幾歲」測驗，8題，帶黑色幽默' },
  { icon: '🔮', label: '未來人生路線', prompt: '設計一份「你的未來人生路線」預測型測驗，10題，結果是一段微小說' },
  { icon: '✨', label: '隱藏天賦', prompt: '設計一份「你被低估的隱藏實力」測驗，10題，結果要具體不空洞' },
  { icon: '🤝', label: '朋友契合度', prompt: '設計一份「跟我當朋友你能撐多久」友誼測驗，8題，帶點挑釁但好笑' },
  { icon: '👀', label: '第一印象反差', prompt: '設計一份「第一印象vs真正的你」反差測驗，10題，結果呈現反差感' },
  { icon: '💑', label: '情侶吵架', prompt: '設計一份「你們吵架時誰比較可怕」情侶測驗，8題，有趣不引戰' },
  { icon: '🥶', label: '關係變淡了？', prompt: '設計一份「我們是不是在變淡了？」關係體溫計，8題，結果是關係溫度+AI診斷+回溫建議' },
  { icon: '😤', label: '你忍了我什麼', prompt: '設計一份「你忍了我哪些事？」匿名真心話問卷，8題，讓人有安全感才敢說真話' },
  { icon: '🏢', label: '公司不敢說的話', prompt: '設計一份「公司裡大家不敢說的真話」匿名調查，8題，題目包含最大問題、效率卡點、想離開的原因' },
]

UI：
  {messages.length <= 1 && (
    <div className="px-6 pb-2">
      <p className="text-xs text-slate-400 mb-2">💡 不知道怎麼開始？試試這些：</p>
      <div className="flex flex-wrap gap-2">
        {PROMPT_INSPIRATIONS.slice(0, showAllInspirations ? undefined : 8).map(p => (
          <button key={p.label}
            onClick={() => setInput(p.prompt)}
            className="px-3 py-1.5 text-xs bg-slate-700/60 hover:bg-slate-600/80 text-slate-300 rounded-full transition-colors cursor-pointer">
            {p.icon} {p.label}
          </button>
        ))}
        {!showAllInspirations && PROMPT_INSPIRATIONS.length > 8 && (
          <button onClick={() => setShowAllInspirations(true)}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 cursor-pointer">
            查看更多 ▼
          </button>
        )}
      </div>
    </div>
  )}

加 state：const [showAllInspirations, setShowAllInspirations] = useState(false)
```

## 3e. 分享 Prompt 功能

```
🔧 src/components/admin/AiSurveyChat.tsx

問卷建立成功後（handleCreate 成功）顯示：
  ☐ 把我的 prompt 分享給其他人參考
  勾選 → POST /api/admin/shared-prompts { promptText, surveyTitle }

靈感區加 tab：[💡 推薦靈感] [🌐 大家的靈感]
「大家的靈感」→ GET /api/admin/shared-prompts → 顯示列表 + 👍 按讚

📄 src/app/api/admin/shared-prompts/route.ts
  GET — 列出公開 prompt（按 likes DESC）
  POST — 分享 prompt
  PATCH — 按讚（likes + 1）
```

---

# 四、封面圖片上傳

```
🔧 src/lib/surveyRepo.ts — allowed 加 'cover_image_url'，toSurveyConfig 映射 coverImageUrl
🔧 src/types/survey.ts — SurveyConfig 加 coverImageUrl?: string

🔧 src/app/(admin)/insight-admin/surveys/page.tsx
   設定 tab 加「封面圖片」上傳區（用現有 /api/admin/upload → R2）
   預覽 + [移除圖片]

🔧 src/components/survey/SurveyShell.tsx — 封面步驟 coverTitle 上方顯示圖片
🔧 src/app/[org]/[slug]/OrgSurveyClient.tsx — 同上
🔧 src/app/(public)/survey/[slug]/page.tsx — 同上
```

---

# 五、AI 設定：模型切換 + Key 編輯

```
🔧 src/app/(admin)/insight-admin/ai-settings/page.tsx

Provider 卡片加模型下拉和 Key 編輯：

const MODEL_OPTIONS = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: '便宜快速' },
    { value: 'gpt-4o', label: 'GPT-4o', desc: '更聰明' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', desc: '最新小模型' },
    { value: 'gpt-4.1', label: 'GPT-4.1', desc: '最新最強' },
    { value: 'o4-mini', label: 'O4 Mini', desc: '推理模型' },
  ],
  anthropic: [
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', desc: '平衡型' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', desc: '快速便宜' },
  ],
}

切換 → PATCH /api/admin/ai-settings { id, default_model }
更換 Key → PATCH /api/admin/ai-settings { id, newApiKey }

🔧 src/app/api/admin/ai-settings/route.ts
  PATCH 支援 default_model 和 newApiKey（重新加密）
```

---

# 六、密碼鎖問卷

```
🔧 src/lib/surveyRepo.ts — allowed 加 'access_password'，toSurveyConfig 映射

🔧 src/app/(admin)/insight-admin/surveys/page.tsx
   設定 tab 加：🔒 存取密碼 [____________]（留空 = 公開）

📄 src/app/api/surveys/verify-password/route.ts
   POST { surveySlug, password } → 比對 → 回傳 { valid: boolean }

🔧 src/components/survey/SurveyShell.tsx
🔧 src/app/[org]/[slug]/OrgSurveyClient.tsx
🔧 src/app/(public)/survey/[slug]/page.tsx

   載入時如果問卷有 access_password，先顯示密碼頁：
   ┌──────────────────────────────┐
   │ 🔒 這份問卷需要密碼         │
   │ [________________] [開始]    │
   └──────────────────────────────┘
   驗證通過 → sessionStorage 記住 → 進入問卷
```

---

# 七、多人協作問卷

```
🔧 src/lib/tenant.ts 的 requireRole
   確認 editor 角色可以操作問卷的 CRUD（新增/編輯/刪除題目）
   目前可能只有 admin 能改，需要把 editor 也放進去

🔧 src/app/(admin)/insight-admin/surveys/page.tsx
   設定 tab 加「👥 協作者」區塊：
   顯示有權限的團隊成員列表（從 tenant_users 查 role = admin 或 editor）
   [邀請新成員] → 跳到 team 頁面
```

---

# 八、簽到 + 任務系統 UI

dailyTaskEngine.ts 和 /api/zcoin/tasks 後端已完成，缺前端。

```
🔧 src/app/(admin)/insight-admin/zcoin/page.tsx
   或 src/app/(public)/wallet/page.tsx

   Z 幣餘額下方加每日任務列表：

   📅 每日任務                          2/5 完成
   ✅ 每日登入         +2 Z             [已完成]
   ☐  完成一份問卷     +1 Z             [去完成]
   ☐  分享結果         +5 Z             [去分享]
   ☐  邀請好友         +10 Z            [邀請]
   ☐  觀看廣告         +2 Z             [觀看]

   進入頁面時自動呼叫 POST /api/zcoin/tasks { taskId: 'daily_login' }
   任務列表用 GET /api/zcoin/tasks 取得
```

---

# 九、廣告系統（骨架版）

先不接真正的廣告 SDK，做假廣告骨架，之後替換。

```
📄 src/lib/adEngine.ts
   canWatchAd(userId) — 查今日已看次數 < 10
   recordAdWatch(userId) — 記錄 + 呼叫 completeTask('watch_ad')

📄 src/app/api/ad/watch/route.ts
   POST → 記錄觀看 → 回傳 { success, earned, remaining }

UI（暫時）：
   按 [看廣告 +2Z] → 顯示 3 秒倒數「廣告播放中...」→ 完成 → +2 Z 幣 toast
   之後接 AdMob/AdSense 只需替換倒數的部分
```

---

# 十、Z 幣儲值系統

```
📄 src/app/api/zcoin/recharge/route.ts
   POST → 建立藍新一次性付款訂單
   付款成功 callback → 加幣到 zcoin_wallets

📄 src/app/(public)/zcoin-shop/page.tsx

   🪙 Z 幣商店              目前餘額：42 Z
    30 Z    NT$30            [購買]
   100 Z    NT$90            [購買] ← 最划算
   350 Z    NT$290           [購買]
   900 Z    NT$690           [購買]
```

---

# 十一、手動 resultConfig 設定 UI

```
🔧 src/app/(admin)/insight-admin/surveys/page.tsx

設定 tab 加「🏆 結果稱號設定」：

  ☐ 啟用結果稱號（測驗型問卷）

  啟用後：
  ── 結果類型列表 ──
  [+ 新增結果類型]

  結果 #1：
    Key: [__________]  稱號: [____________]  Emoji: [__]
    描述: [________________________________]
    特質: [標籤1] [標籤2] [+ 新增]
    [刪除]

  ── 計分規則 ──
  [🤖 AI 自動分配] 或手動：每題每選項 → 下拉選 typeKey

  存到 surveys.result_config JSONB
```

---

# 十二、V8/V9 鉤子模板 Prompt

以下 prompt 用後台 AI 對話出題直接建立問卷。不需要寫程式碼。
情侶系列設密碼鎖，公開系列設 is_public_explore = true。

## 情侶私密系列（加密碼鎖）

```
設計一份「在你眼中我其實是怎樣的人？」的私密問卷，10題。
給情侶/好友互填，題目有點刺但不傷人。
包含：最放鬆的地方、最有壓力的地方、一直想說沒說的事、
最不自覺的缺點、最需要成長的地方、最喜歡的一點。
結果要有認知落差分析和有趣的稱號。
```

```
設計一份「我們到底卡在哪？」的情侶衝突問卷，6題。
吵完架冷靜後填。題目直接但不引戰。
結果要有衝突來源分析和修復建議。
```

```
設計一份「我們是不是在變淡了？」的關係體溫計，8題。
結果是「關係溫度」+ AI 診斷 + 回溫建議。
```

```
設計一份「你忍了我哪些事？」匿名真心話問卷，8題。
讓人有安全感才敢說真話。結果彙整成「大家想跟你說的話」。
```

## 自我認知系列（公開探索）

```
設計一份「為什麼有些人會慢慢遠離你？」人際盲點測驗，10題。
結果要有具體的人際盲點分析，讓人有「被說中」的感覺。
```

```
設計一份「你其實比自己想的更有距離感」認知落差測驗，10題。
結果呈現「你以為的自己」vs「別人眼中的你」的反差。
```

## 職場系列（B 端入口）

```
設計一份「公司裡大家不敢說的真話」匿名調查，8題。
員工匿名填。題目包含最大問題、效率卡點、想離開的原因。
結果要有問題排名和改善建議。
```

```
設計一份「你最想讓主管知道但不敢說的事」匿名問卷，6題。
語氣安全不會讓人怕被發現。結果給管理層看。
```

---

# 執行順序

```
★ 第一優先（今天）：
  1. 跑 SQL（第一節）
  2. Bug 1：填過問卷偵測
  3. Bug 2：Enter 跳動
  4. Bug 3：AI 內容截斷
  5. 任務 3a：AI prompt 生成 resultConfig + emoji

★ 第二優先（明天）：
  6. 任務 3d：Prompt 靈感按鈕
  7. 任務 4：封面圖片
  8. 任務 5：AI 模型切換
  9. 任務 6：密碼鎖問卷

★ 第三優先（後天）：
  10. 任務 7：協作問卷（確認 editor 權限）
  11. 任務 8：簽到 + 任務 UI
  12. 任務 9：廣告骨架
  13. 任務 10：Z 幣儲值

★ 第四優先（有空再做）：
  14. 任務 3e：Prompt 分享
  15. 任務 11：手動 resultConfig UI

★ 不需要寫程式（隨時做）：
  16. 用 AI 對話出題建立 V8/V9 鉤子模板問卷
```
