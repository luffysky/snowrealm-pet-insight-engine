# 所有待辦任務（含 New 規格整合版）

> 最後更新：2026-03-30（緊急 bug 修復 + 接線確認 + BUG-F1/F2 完成）
> ~~刪除線~~ = 已完成
> 優先級：🔴 緊急 / 🟡 重要 / 🟢 一般 / ⚪ 未來
> 規格來源：docs/new/ 目錄下 14 份規格書

---

## 🔴 Bug 修復

### ~~BUG-3 OG 分享顯示 coverTitle 而非自訂 OG~~
- ~~診斷：`SELECT og_title FROM surveys WHERE slug = 'maoxingtianxia-mvp-survey'`~~
- ~~確認 `[org]/[slug]/page.tsx` 有 `export const dynamic = 'force-dynamic'`~~ ✅ dynamic 已存在

### ~~BUG-F1 限時動態：正在回覆時倒數不暫停~~ ✅
- ~~偵測到 reply input focus 時暫停倒數計時器，失去 focus 才繼續~~
- ~~涉及：Stories player 元件~~
- 修復：點「傳送回覆」時 `setPaused(true)`，關閉/送出後 `setPaused(false)`

### ~~BUG-F2 私訊懸浮視窗無法單一聯絡人~~ ✅
- ~~目標：像 FB Messenger 右下角懸浮泡泡，點個別聯絡人可獨立展開~~
- 修復：`FloatingChat.tsx` 重構，每個聯絡人獨立 `FloatingChatWindow`，最多 4 個同時開

### BUG-F4 限時動態文字功能重做
- 目標：像 IG 直接在畫布上打字，點擊可編輯，拖曳改位置
- 技術：TipTap + 拖曳定位

---

## 🔴 接線工作（後端做好但前端沒接上）

### ~~WIRE-1 故事報告沒有存 DB~~ ✅
- ~~`api/admin/ai-story/route.ts` return 前加 INSERT~~
- 已確認：route.ts 已有 INSERT + report_type

### ~~WIRE-2 洞察報告歷史不區分數據/故事~~ ✅
- ~~`ai-insight GET` 回傳加 `report_type`~~
- 已確認：GET 已回傳 report_type；insight 頁面已有 📊/📖 圖示

### ~~WIRE-3 故事牆管理頁無 Sidebar 入口~~ ✅
- ~~`layout.tsx` + `middleware.ts` 加 `'story-wall'`~~
- 已確認：layout 和 middleware 均已有；story-wall/page.tsx 存在

### ~~WIRE-4 問卷完成頁缺 Story Card + 分享按鈕~~ ✅
- ~~新增 `components/public/StoryCard.tsx`~~
- 已確認：StoryCard.tsx 存在；DoneClient.tsx 已匯入並 fetch

### ~~WIRE-5 Rich Menu 設定搬進後台~~ ✅
- ~~`lib/lineConfig.ts`：`LINE_CONFIG_KEYS` 新增 8 個 key~~
- 已確認：lineConfig.ts 有 POST_SURVEY_RICH_MENU_ID/LIFF_ID/LINE_LOGIN；line-settings 有 richmenu/login 分組

### ~~WIRE-6 洞察報告分享功能（公開連結）~~ ✅
- ~~DB：`share_slug`、`is_public`、`share_title`、`share_views` 欄位~~
- 已確認：ai-insight route 有 PATCH handler；report/[slug]/page.tsx 存在

---

## 🟡 功能補完（現有系統）

### FEAT-1 Dashboard 整合新指標
- 顯示：平均填答時間、數據品質分數、回覆速度長條圖、棄卷熱點標紅
- `funnel/page.tsx`：熱點題目標紅（isHotspot = true）

### FEAT-2 AI 對話生成問卷確認寫入 DB
- `AiSurveyChat.tsx`：parseSurveyJson → 預覽 → POST /api/admin/surveys → 建立題目

### FEAT-3 品牌化 PDF 報告匯出
- `api/admin/export-report/route.ts`（@react-pdf/renderer）
- `insight/page.tsx` 加「匯出 PDF」按鈕

### FEAT-4 公開故事牆頁補完
- 底部 CTA + 頂部統計 + 關鍵字標籤雲

### FEAT-5 貼圖個別圖片上傳
- `[packId]/stickers/route.ts` 改為 `application/octet-stream` 模式

### FEAT-6 問卷模板系統
- DB：`survey_templates` + `template_ratings`
- `lib/surveyTemplates.ts`（行業預設模板）
- API：`/api/admin/survey-templates/`（CRUD + use + rate + publish）
- 頁面：`insight-admin/survey-templates/page.tsx`（平台/我的/市集 tab）
- `surveys/page.tsx` 加「從模板建立」+「存為模板」

### FEAT-8 AI 主動推送
- `api/cron/weekly-report`：加 AI 摘要
- 新增 `api/cron/ai-alerts`：NPS 下降/棄卷飆升/負面關鍵字預警

### FEAT-9 開放題情感分析
- `lib/sentimentAnalysis.ts`：批量情感分析（每 50 筆一批）
- `insight/page.tsx`：新增「開放題分析」圓餅圖 + 關鍵字標籤雲

---

## 🟡 P-URGENT 剩餘

### URG-2 服務狀態紅燈
- `api/admin/system/route.ts`：改呼叫 `getLineConfig()` 取代直接查 DB
- panel 頁確認 PostgreSQL / LINE / OpenAI 全綠

### URG-5 LINE 設定頁 Token 視覺化
- 未設定 → 灰色「尚未設定」
- DB → 綠色標籤；ENV → 橘色標籤
- 連線失敗 → 紅叉 + 錯誤訊息

### URG-6 連結缺組織名稱導致 404
- Sidebar 所有導航連結確認帶 tenant slug
- Middleware 若無 slug 自動 redirect 到第一個 tenant

---

## 🟡 總後台（Super Admin）

### FEAT-7a 平台公告通知系統
- DB：`platform_notifications` + `notification_reads`
- API：`/api/super-admin/notifications/`（CRUD + send）
- 頁面：`snowrealm-insight-ctrl/notifications/page.tsx`
- 管道：LINE + Dashboard + Email；支援草稿/排程/立即發送

### FEAT-7b 總後台 Rich Menu 管理
- 新增 `snowrealm-insight-ctrl/rich-menu/page.tsx`
- 管理 Official Bot 和 Insight Bot 的全域預設 Rich Menu

### FEAT-7c 總後台通知樣式管理
- DB：`platform_notification_styles`（11 種事件類型 + Flex Message 模板）
- 新增 `snowrealm-insight-ctrl/notification-styles/page.tsx`
- 修改 `lib/lineNotify.ts`：從 DB 讀模板替代硬編碼 Flex Message

### FEAT-7d 總後台導覽更新
- `layout.tsx` NAV_ITEMS 加：平台通知、Rich Menu、通知樣式

---

## 🟡 總後台安全架構（Admin-Backend-Security-Spec.md）

### ADMIN-1 RBAC 五角色系統
- 新增角色：`moderator`（內容審核）、`analyst`（唯讀數據）、`support`（客服）
- 目前只有 `super_admin` / `admin`，需擴充 `admin_users.role` CHECK constraint
- DB：`ALTER TABLE admin_users DROP CONSTRAINT ... ADD CONSTRAINT ... CHECK (role IN ('super_admin','admin','moderator','analyst','support'))`
- `lib/auth.ts`：`requireRole()` 支援陣列多角色
- 每個角色的 `maxCount` 限制

### ADMIN-2 超級後台總覽儀表板
- 全平台：總用戶數、DAU/MAU、今日新增、留存率
- 問卷：總問卷/回覆數、今日活躍數
- Z幣：今日發放/消耗/儲值收入
- AI：今日成本、月累計、剩餘預算比例
- 系統：DB 連線、API 回應時間、錯誤率
- 位置：`snowrealm-insight-ctrl/page.tsx`（擴充現有 Dashboard）

### ADMIN-3 使用者管理
- 搜尋（email/名稱/userId）、篩選（角色/狀態/入會日）
- 操作：查看詳情、封禁/解封、重置密碼、調整 Z 幣、查看歷史
- 位置：`snowrealm-insight-ctrl/users/page.tsx`
- API：`/api/super-admin/users/`（CRUD + ban + adjust-zcoin）

### ADMIN-4 全數據監控中心
- 跨租戶的問卷/回覆/AI 使用統計
- 每日趨勢、問卷完成率排行、最活躍租戶
- 位置：`snowrealm-insight-ctrl/analytics/page.tsx`

### ADMIN-5 內容審核系統
- 待審內容列表（故事/留言/圖片）
- 批量操作：通過/隱藏/刪除/警告用戶
- AI 自動標記（敏感詞/違規圖片）
- 位置：`snowrealm-insight-ctrl/moderation/page.tsx`
- API：`/api/super-admin/moderation/`

### ADMIN-6 Z 幣經濟監控
- 全平台 Z 幣總量、每日發放/消耗趨勢
- 通膨警戒：Z 幣總量年增率 > 20% 觸發警告
- Top 50 持幣用戶（防異常囤積）
- 異常交易偵測（短時間大量賺取）

### ADMIN-7 AI 成本監控面板
- 本月累計成本 + 預算進度條
- 日成本折線圖、各模型佔比餅圖、各意圖佔比
- Top 10 最貴對話（debug 用）
- 預算告警設定（50%/80%/90%/100%）
- 位置：`snowrealm-insight-ctrl/ai-cost/page.tsx`（見 COST 區塊）

### ADMIN-8 金流訂單管理
- 所有 LINE Pay / 藍新 / Stripe 訂單列表
- 篩選：狀態/金額/付款方式/日期區間
- 操作：查看詳情、手動退款
- 位置：`snowrealm-insight-ctrl/orders/page.tsx`

### ADMIN-9 反詐騙防線
- 異常登入偵測（多地點/VPN/短時間多帳號）
- Z 幣異常賺取警報（超過每日上限的可疑帳號）
- 封禁名單管理（IP/裝置/帳號）
- 審計日誌（`audit_logs` 表，已有 `lib/auditLog.ts`）

---

## 🟡 AI 成本控制（AI-Cost-Control-Spec.md）

### COST-1 LLM 路由引擎
- 新增 `lib/llm/router.ts`：規則匹配 → 意圖分類 → GPT-4o-mini / Claude Sonnet
- 意圖：chitchat / feature_help / zcoin_support → GPT-4o-mini
- 意圖：result_explain / tour / bug_report → Claude Sonnet
- 第一層規則匹配（0 token），第二層 GPT-4o-mini 分類（~50 token）

### COST-2 Anthropic Prompt Caching
- system prompt（雪凜人設 + 功能文檔）加 `cache_control: { type: 'ephemeral' }`
- 預估節省 67% input token 成本

### COST-3 Token 用量上限
- 新增 `lib/llm/limits.ts`：依意圖不同的 maxInput / maxOutput 設定
- chitchat: 800/200；result_explain: 2000/500

### COST-4 使用者日上限
- free_user：20 輪/天，TTS 3000 字/天，深度解讀 3 次/天
- premium_user：100 輪/天，TTS 15000 字/天，深度解讀 20 次/天
- 達上限：「今天跟你聊太多啦～明天再來找我！」

### COST-5 月預算硬上限 + 自動降級
- `AI_MONTHLY_BUDGET` 環境變數（預設 $200）
- 90% → 全走 GPT-4o-mini（自動降級）
- 100% → 每人每天限 5 輪

### COST-6 成本記錄表
- DB：`ai_cost_log (provider, model, intent, input_tokens, output_tokens, tts_characters, cost_usd, user_id)`
- View：`monthly_ai_cost`

### COST-7 後台成本監控面板
- 位置：`snowrealm-insight-ctrl/ai-cost/page.tsx`（同 ADMIN-7）
- 告警規則：50% 通知、90% 降級、100% 限流

### COST-8 TTS 成本控制
- 語音開關預設關（省 70%）
- 預錄 7 個常用句子（/voice/greeting.mp3 等）
- 短句（< 5 字）不觸發 TTS
- 合併短句成一次 TTS 呼叫
- 安裝：`npm install howler`（音效管理）

---

## 🟡 ShareCard v2（ShareCard-v2-Spec.md）

> 取代現有的 ShareCard / ShareButtons，四種戰術版型

### CARD-1 EmotionalCard（情緒爆發卡）
- 路由：`/done`（問卷完成頁）
- 設計：360×640px，深紫星空，發光文字，星星 twinkle
- 內容：resultTitle + 3 行語錄 + CTA
- 新增：`components/share-cards/cards/EmotionalCard.tsx`

### CARD-2 IdentityCard（人格投射卡）
- 路由：`/story/[responseId]`
- 設計：暖金 IG 風，頭像 + 語錄 + 標籤 + 數據對比條
- 新增：`components/share-cards/cards/IdentityCard.tsx`

### CARD-3 AuthorityCard（權威數據卡）
- 路由：`/insight-admin/insight`
- 設計：暗黑科技，大數字跳動，掃描線，橘色漸層
- 新增：`components/share-cards/cards/AuthorityCard.tsx`

### CARD-4 ProfessionalCard（專業背書卡）
- 路由：`/report/[slug]`（公開報告頁）
- 設計：純白極簡，白皮書風格，頂線伸展動畫
- 新增：`components/share-cards/cards/ProfessionalCard.tsx`

### CARD-5 ShareCardRenderer + ShareCardModal
- 新增 `components/share-cards/ShareCardRenderer.tsx`（根據 type 分派）
- 新增 `components/share-cards/ShareCardModal.tsx`
- 新增 `components/share-cards/types.ts`（共用型別）

### CARD-6 PNG 高清匯出
- 安裝：`npm install modern-screenshot`（取代 html2canvas，解決模糊問題）
- `utils/exportPng.ts`：scale 3x + freeze 動畫後截圖
- 避雷：backdrop-filter 截圖用純色替代、background-clip text 用 modern-screenshot

### CARD-7 MP4/WebM 匯出
- `utils/exportMp4.ts`：MediaRecorder + canvas.captureStream()，錄製 4 秒
- 重播動畫 → 錄製 → 下載 WebM（IG 限動支援）

### CARD-8 各頁面整合
- `/done`：`EmotionalCard`（resultTitle 來自 AI 生成語錄）
- `/story/[responseId]`：`IdentityCard`
- `/insight-admin/insight`：`AuthorityCard`（取代舊 ShareCard）
- `/report/[slug]`：`ProfessionalCard`

### CARD-9 AI 文案生成 API
- 新增 `api/admin/share-card/generate-copy/route.ts`
- 情緒卡：根據 personalityType 生成 resultTitle + quote 3 行
- 權威卡：根據問卷統計生成 headlineNumber + bars + insightQuote

---

## 🟡 雪凜 AI 嚮導系統（Yukirin-AI-Guide-Spec.md）

> 有個性、有表情、活在畫面裡的 AI 角色

### YUKIRIN-1 情境感知引擎
- 新增 `lib/yukirin/contextEngine.ts`
- 追蹤：當前頁面、停留時間、填答進度、問卷結果
- 觸發規則：新使用者/停留 30 秒/填到一半放棄/結果頁出來

### YUKIRIN-2 意圖分類器 + LLM 路由
- 新增 `lib/yukirin/intentRouter.ts`
- 第一層：規則 regex 匹配（0 token）
- 第二層：GPT-4o-mini 分類（~50 token）
- 意圖：tour / feature_help / result_explain / zcoin / bug_report / chitchat

### YUKIRIN-3 六大職責模組
- `lib/yukirin/modules/tourModule.ts`：帶領導覽（6 個頁面的腳本）
- `lib/yukirin/modules/surveyModule.ts`：問卷出題陪伴（表情連動）
- `lib/yukirin/modules/resultModule.ts`：結果解讀（Claude Sonnet）
- `lib/yukirin/modules/zcoinModule.ts`：Z幣說明 + 招財呼叫（GPT-4o-mini）
- `lib/yukirin/modules/supportModule.ts`：客服 / Bug 回報
- `lib/yukirin/modules/chitchatModule.ts`：閒聊（GPT-4o-mini，限流）

### YUKIRIN-4 對話 UI
- 新增 `components/yukirin/YukirinFloat.tsx`（右下角浮動圖示）
- 新增 `components/yukirin/YukirinPanel.tsx`（展開的對話面板）
- 新增 `components/yukirin/ChatBubble.tsx`（打字機效果氣泡）
- 主動觸發：「需要幫忙嗎？」/ 「讓我幫你解讀！」
- API：`api/guide/chat/route.ts`（已有 `guide_chat_messages` 表）

### YUKIRIN-5 記憶系統前端接線
- `guide_chat_messages` 表已建立（Phase 54 migration 已執行）
- 前端需讀取歷史對話，讓雪凜記得之前聊過的事
- 新增 `lib/yukirin/memoryManager.ts`（讀/寫對話歷史 + 使用者畫像摘要）

### YUKIRIN-6 使用者畫像
- DB：`guide_user_profiles (user_key, preferences, survey_history_summary, personality_type, last_updated)`
- 每 5 輪對話後用 GPT-4o-mini batch 更新一次畫像
- 雪凜回覆時帶入畫像讓回應更個人化

### YUKIRIN-7 VRM 表情連動
- API 回覆帶 `mood` 欄位：`happy / surprised / relaxed / neutral / thinking / wink / excited`
- 前端根據 mood 呼叫 VRM expressionManager 切換表情
- 新增 `lib/yukirin/moodMapper.ts`（mood → VRM expression name）

### YUKIRIN-8 導覽系統（Guided Tour）
- 新增 `lib/yukirin/tourScripts.ts`：每個頁面的導覽腳本（highlight element + 說明文字）
- 支援元素高亮、自動跳轉、步驟追蹤
- API 回覆可帶 `action: { type: 'navigate' | 'highlight', target: string }`

### YUKIRIN-9 後台管理面板
- 對話統計：今日對話數、各意圖分布、平均輪數
- 使用者畫像分布（個性分類統計）
- 位置：`insight-admin/ai-guide/page.tsx`（或整合進 ai-settings）

### YUKIRIN-10 認知差距報告（Cognitive Gap）— 新功能（memory.md）
- 新增 `lib/cognitiveGapEngine.ts`
- 比較使用者自評 vs 他人評價，找出差距最大的 3 個面向
- 使用 Claude Sonnet 4.6（`cognitive_gap` 任務路由）
- 扣 `analysis` 額度
- 輸出：差距分析 + 可能原因 + 建設性建議（繁體中文，溫和語氣）

### YUKIRIN-11 使用者暱稱記憶（memory.md）
- 第一次對話時雪凜問：「欸 我要怎麼叫你？」
- 存到 `user_profiles.nickname`（或 `guide_user_profiles.nickname`）
- 之後每次對話帶入：「{nickname} 你回來了！」
- 設定頁面可修改暱稱

### YUKIRIN-12 使用者畫像自動提取（memory.md）
- 每次對話後用 GPT-4o-mini 非阻塞提取：nickname / interests / pets（名字+品種）/ personality_tags / last_mood / visit_count
- DB：`guide_user_profiles` 擴充欄位：`interests JSONB`、`pets JSONB`、`personality_tags TEXT[]`、`last_mood TEXT`、`visit_count INT DEFAULT 0`
- System Prompt 注入格式（自然融入，不直接說「根據紀錄」）：
  - ✅ 「你家那隻叫麻糬的橘貓最近好嗎～」
  - ❌ 「根據我的記錄，你的寵物叫麻糬」

### YUKIRIN-13 管理員身份識別強化（memory.md）
- `admin_users` 表有記錄 → 雪凜知道是管理員
- 一般管理員登入：「{name} 今天有 {dau} 人在用喔 (≧∀≦)」
- super_admin（Luffysky）登入時，System Prompt 額外加上：
  - 叫「老闆」（語氣輕鬆）
  - 主動報告今日數據（DAU、新註冊、營收）
  - 偶爾撒嬌抱怨工作量：「老闆今天 247 人來找我欸 好累～」
  - 偶爾邀功：「你看我今天幫了 38 個人解讀結果喔 誇我！」
  - 深夜登入：「老闆你怎麼這麼晚還在... 要注意身體欸」
  - 很久沒來：「老闆你是不是把我忘了 (´;ω;`) 我一個人顧了三天欸」
- 實作：`lib/yukirin/contextEngine.ts` 的 `buildSystemPrompt()` 根據 role/userId 動態組裝

---

## 🟡 AI 統一架構（Yukirin-Unified-AI-Spec.md）

> 所有 17 個 AI 功能統一透過 `aiService.callAI()` 呼叫，不再直接打 API

### AI-UNIFIED-1 統一入口重構
- 擴展 `lib/aiService.ts`：新增 `AIRequest` / `AIResponse` / `AITaskType` 型別（17 種 taskType）
- 新增 `callAI(request: AIRequest)` 函式：額度檢查 → 模型路由 → 加雪凜人設 → 呼叫 LLM → 記錄成本 → 解析回應
- 所有 AI route 改為呼叫 `callAI()`，不再各自 `fetch` OpenAI/Anthropic
- `applyYukirinPersona: true` 時套入 `YUKIRIN_PERSONA_PREFIX` 並解析 `{ text, mood, action }` JSON 回應

### AI-UNIFIED-2 17 個任務路由表
- 雪凜出面（5 個，套語氣）：`guide_chat` / `result_explain` / `story_insight` / `data_insight` / `chat_survey_create`
- 幕後工具（12 個，不套語氣）：`survey_generate` / `meta_generate` / `sentiment_analysis` / `blog_seo` / `api_key_validate` / `weekly_report` / `auto_insight` / `content_moderation` / `user_profile_extract` / `bug_report` / `intent_classify` / `cognitive_gap`
- 模型路由：分析任務 → Claude Sonnet；幕後工具 → GPT-4o-mini；閒聊 → 動態
- 認知差距報告（`cognitive_gap`）：新功能，`lib/cognitiveGapEngine.ts`

### AI-UNIFIED-3 雪凜語氣禁令（YUKIRIN_PERSONA_PREFIX）
- 絕對禁止：「我可以幫你」「根據分析」「首先...其次」「希望這對你有幫助」任何 emoji
- 回應必須是 JSON：`{ "text": "...", "mood": "happy|excited|thinking|neutral|sad|wink", "action": null }`
- 回覆限 3 行內（解讀結果除外），用語助詞「欸」「啊」「喔」「嘛」

### AI-UNIFIED-4 額度系統更新
- 新增 `QuotaConfig`：chat（免費5/付費20/管理員∞）/ analysis（免費3/付費20/∞）/ admin∞ / system∞
- `QUOTA_MAP`：`guide_chat` 扣 chat；`result_explain/story_insight/data_insight/cognitive_gap` 扣 analysis；其他不扣
- 月成本估算更新：~$115/月（1000 DAU），比原估算 $92 多 $23（新增審核+畫像提取）

---

## 🟡 Liquid Glass CSS（liquid-glass.css）

> 五層動畫玻璃系統，可直接 import 使用

### CSS-GLASS-1 基礎 `.glass` 類
- 新增 `src/styles/liquid-glass.css`（來自 `docs/new/liquid-glass.css`）
- 5 個面板變體：`.glass--highlight`（紫色）/ `.glass--warm`（暖粉）/ `.glass--ice`（冰藍）/ `.glass--gold`（金色 Z 幣）/ `.glass--light`（後台用淺色）
- 五層動畫：光澤流動(::before sheen) + 邊緣呼吸(::after breathe) + 懸浮微顫(float 10s) + 觸碰漣漪(JS) + 數據條流光

### CSS-GLASS-2 元件類
- `.glass-tag`（10px 圓角，光掠動畫）
- `.glass-btn`（14px 圓角）/ `.glass-btn--primary`（實色漸層，紫→桃）
- `.glass-avatar`（48px，16px 圓角）
- `.glass-bar` / `.glass-bar__fill`（流光進度條）
- `.glass-input`（focus 紫色邊框）
- `.glass-divider`（漸層分隔線）
- `.glass-badge` + `.glass-badge__dot`（脈衝圓點）

### CSS-GLASS-3 效能 & 無障礙
- `.glass--static`：關閉所有動畫（低階裝置加此 class）
- `@media (prefers-reduced-motion: reduce)`：自動停用所有動畫
- `.glass--blur` / `.glass--blur-light`：backdrop-filter（可選，只在需要模糊時加）
- 所有動畫用 transform + opacity（GPU 加速，無 layout thrashing）

---

## 🟡 雪凜音訊系統（Yukirin-Audio-System-Spec.md）

### AUDIO-1 介面音效
- 13 個音效檔（tap/select/progress/complete/result/zcoin/share 等）
- 新增 `lib/audio/SoundManager.ts`（Howler.js 封裝）
- 新增 `hooks/useSound.ts`
- 安裝：`npm install howler`
- 音效風格：柔和夢幻，鋼片琴/風鈴/豎琴，避免金屬尖銳音

### AUDIO-2 Azure TTS
- 環境變數：`AZURE_SPEECH_KEY`、`AZURE_SPEECH_REGION`
- 安裝：`npm install microsoft-cognitiveservices-speech-sdk`
- 新增 `api/tts/route.ts`（SSML + Xiaoxiao Neural + 情緒風格）
- 新增 `api/tts-with-viseme/route.ts`（附帶嘴型時間軸）
- 新增 `hooks/useYukirinVoice.ts`（前端播放 hook）
- 推薦聲音：`zh-CN-XiaoxiaoNeural`（支援 cheerful/excited/empathetic 等）

### AUDIO-3 VRM 嘴型同步
- Azure viseme ID → VRM 母音 BlendShape（aa/ee/ih/oh/ou）
- 新增 `lib/audio/LipSyncController.ts`（每幀呼叫 update()）
- lerp 平滑過渡，說話時暫停自動眨眼
- Fallback：音量驅動嘴型（不用 Viseme）

### AUDIO-4 STT 語音輸入
- Web Speech API（免費，Chrome/Edge 支援）
- 新增 `hooks/useVoiceInput.ts`
- 對話輸入框右側加麥克風按鈕（長按錄音，放開送出）
- 錄音中雪凜做「認真聽」動作（歪頭 + neutral 表情）

---

## 🟡 雪凜 3D 角色（Yukirin-VRoid-ThreeJS-Guide.md）

### VRM-1 VRoid Studio 製作雪凜（非程式碼）
- 臉型：小臉圓潤，大紫色眼睛，濃密睫毛
- 頭髮：薰衣草紫雙馬尾，呆毛，蝴蝶結髮飾
- 服裝：白色水手服 + 紫色百褶裙 + 淺紫開衫
- 表情：預設 6 種 + 自訂 wink/excited/thinking
- 匯出：VRM 1.0，High 品質 → `public/models/yukirin.vrm`

### VRM-2 Three.js VRM 載入器
- 安裝：`npm install three @types/three @pixiv/three-vrm`
- 新增 `hooks/useVRM.ts`（GLTFLoader + VRMLoaderPlugin）
- VRM 載入後 `rotation.y = Math.PI`（面朝正確方向）
- 進度條顯示載入百分比

### VRM-3 自動眨眼 + 呼吸 + Idle 動畫
- 自動眨眼：3-7 秒隨機間隔，blinkDuration 150ms
- 呼吸：胸部 `chest.position.y` sin 波動（週期 4s）
- Idle：身體微搖（`spine.rotation.y` sin 波）
- 新增 `lib/yukirin/animationManager.ts`
- **MOOD_MAPPING**：LLM 回傳 mood → 同時切換 animation + expression
  - happy → wave + happy(0.8)
  - excited → excited + happy(1.0)
  - thinking → thinking + neutral(1.0)
  - neutral → idle + neutral(1.0)
  - sad → sad + sad(0.8)
  - wink → wave + wink(1.0)
- 特殊場景：`navigateWithAnimation()`（pointing → 說「跟我走」→ wave → 跳轉）
- 特殊場景：`celebrateResult()`（surprised → clapping → excited）
- 動畫檔案（public/animations/）：10 個 FBX，總計 ~1.1MB（按需載入）
  - 立即載入：idle + wave；閒置預載：thinking/excited/pointing/clapping 等

### VRM-4 SpringBone 物理
- `@pixiv/three-vrm` 原生支援 VRM SpringBone
- 每幀 `vrm.update(delta)` 自動計算頭髮/裙子飄動
- 注意：mid 效能等級關閉 SpringBone，low 等級整個用 PNG 替代

### VRM-5 眼睛跟隨滑鼠
- 桌面：`mousemove` → `vrm.lookAt.target` 設定目標位置
- 手機：`deviceorientation` → gamma/beta 映射
- 平滑追蹤：lerp factor 0.05

---

## 🟡 全站 UI 重構（Insight-UI-Redesign-Spec-v4.md ← 最新版）

> 雙層架構：Three.js WebGL 背景 + HTML/CSS/SVG UI
> v4 相較 v3 新增：Perlin Noise 驅動球體（需 `npm install simplex-noise`）

### UI-1 Three.js 背景層
- 安裝：（已有 `@react-three/fiber`，確認版本足夠）+ `npm install simplex-noise`
- 玻璃球體 6 顆：`MeshPhysicalMaterial`（transmission + clearcoat）
- 球體移動：**Perlin Noise**（`createNoise3D()`），不用 sin/cos，避免機械感
- 微光粒子 200 個：`PointsMaterial` + AdditiveBlending
- 柔和三點照明：Ambient(0xd0c0f8) + Key(0xf0e8ff) + Fill(0xffd0d0) + Rim(0xd0d0ff)
- 滑鼠視差 + 手機陀螺儀
- 新增 `components/three/ThreeBackground.tsx`
- 新增 `hooks/useVisibilityRendering.ts`（不可見時暫停）

### UI-2 VRM 角色整合
- 新增 `components/three/VRMCharacter.tsx`（整合 useVRM + 動畫）
- 新增 `components/three/CombinedScene.tsx`（背景 + 角色合一）
- 新增 `hooks/useThreeExport.ts`（截圖合成 Three.js + DOM 層）

### UI-3 玻璃 UI 元件庫
- 確認現有 CSS 類（lg-lavender-sharp / lg-dark 等）符合規格
- 新增 `components/ui/GlassPanel.tsx`（dark/light variant）
- 新增 `components/ui/GlassButton.tsx`（primary/secondary/glass）
- 新增 `components/ui/GlassInput.tsx`
- 新增 `components/ui/GlassProgress.tsx`
- Token 定義：`src/styles/tokens.ts`

### UI-4 效能分級系統
- 新增 `utils/performanceTier.ts`：`detectPerformanceTier()` → high/mid/low
- 新增 `utils/tierConfig.ts`：三級配置（球體數/粒子數/FPS/材質）
- 新增 `hooks/usePerformanceTier.ts`
- FPS 監控：avgFPS < 20 自動降級
- low 等級：CSS 漸層 blob + PNG 立繪替代

### UI-5 PWA 配置
- 安裝：`npm install next-pwa`
- 修改 `next.config.ts`：withPWA + runtimeCaching
- 新增 `public/manifest.json`
- 新增 `public/icons/icon-192.png` + `icon-512.png`
- 新增 `app/offline/page.tsx`（雪凜難過表情 + 等你回來）
- 新增 `hooks/useInstallPrompt.ts`
- VRM 快取：`requestIdleCallback` 背景預載

### UI-6 多角色系統架構
- 新增 `components/character/characters.ts`（`CHARACTERS` 設定）
- 新增 `components/character/useCharacter.ts`（動態切換 VRM）
- 新增 `components/character/LowTierCharacter.tsx`（PNG fallback）

#### 角色清單（目前 2 位）

| id | 名字 | VRM 檔 | themeColor | 個性 |
|----|------|--------|------------|------|
| yukirin | 雪凜 | `/models/yukirin.vrm` | `#b8a9e8`（薰衣草紫）| 活潑、溫暖、有點調皮 |
| riku | 凜空 | `/models/riku.vrm` | `#c94a4a`（紅色）| 溫柔可靠、偶爾耍帥、像學長 |

#### 凜空（Riku）新增項目
- VRoid Studio 製作：運動外套 + 銀灰髮色，accentColor `#a8a8b8`
- `public/models/riku.vrm` + `public/images/riku-neutral.png`（低階 fallback）
- 其他表情/動畫同雪凜規格（happy/thinking/surprised 等）

#### 角色選擇畫面（首次進入）
- 新增 `components/character/CharacterSelect.tsx`
- 觸發條件：user_profile 沒有 `chosen_character` 欄位（第一次使用）
- UI：全螢幕遮罩，「選一個夥伴陪你探索！」，左邊雪凜揮手、右邊凜空揮手
- 點選 → 儲存到 DB `guide_user_profiles.chosen_character`（或 `user_profiles`）
- 設定頁面（`/profile` 或 settings tab）可隨時切換
- 切換時呼叫 `switchCharacter(id)`，重新載入 VRM + 更新 DB

- 未來角色：麻糬（貓系慵懶）、小春（冷靜知性型）

---

## 🟡 雪凜 × 凜空 互動系統（roll.md）

> 雪凜和凜空是男女朋友，彼此會在對方值班時隨機出現打招呼

### ROLL-1 隨機冒出機制
- 觸發條件：值班角色閒聊中、10% 機率、5 分鐘冷卻
- 新增 `lib/yukirin/partnerInterrupt.ts`：判斷觸發條件 + 選台詞
- 台詞池（雪凜值班時凜空冒出）：
  - 閒聊中：「（凜空探頭）你又在偷懶了吧」→ 雪凜：「才沒有！我在工作！」
  - 解讀結果時：「（凜空小聲）她解讀得很認真的時候最可愛」
  - 使用者獲成就：「（凜空鼓掌）雪凜她超愛幫人慶祝的」
  - 深夜：「（凜空拿毯子）她如果打瞌睡的話跟我說」
- 台詞池（凜空值班時雪凜冒出）：
  - 閒聊中：「（雪凜探頭）凜空你有沒有好好照顧人家！」→ 凜空：「......有」
  - 解讀結果時：「（雪凜小聲）他講話很溫柔對吧 嘿嘿」
  - 使用者問感情問題：「（雪凜衝出來）這題我來！」→ 凜空：「......好吧」

### ROLL-2 畫面呈現
- 主角色置中，另一個從**畫面邊緣探出半個身子**
- 氣泡顏色：雪凜紫色 `#b8a9e8`、凜空紅色 `#c94a4a`
- 冒出後 3 秒自動退場（slide-out 動畫）
- 新增 `components/yukirin/PartnerPeek.tsx`（邊緣探頭 + 對話氣泡）
- 不影響使用者操作（pointer-events-none，不遮擋輸入）

### ROLL-3 設定開關
- 使用者可在個人設定關閉：「關閉角色互動彩蛋」
- 存到 `guide_user_profiles.disable_partner_peek BOOLEAN DEFAULT false`

---

## 🟡 Z 幣經濟系統（ZCoin-Economy-Spec.md）

### ZCOIN-1 招財吉祥物視覺
- 設計招財（金色布丁鼠，頰囊 + 星星帽）角色圖
- Z 幣圖示改為招財臉 + Z 字（圓形金色底）
- 新增 Lottie 動畫：獲得Z幣/花費Z幣/餘額不足/里程碑

### ZCOIN-2 Z 幣 DB 完整建立
```sql
-- 確認以下表是否存在，不存在則建立：
zcoin_accounts (user_id, balance, total_earned, total_spent)
zcoin_transactions (type CHECK 涵蓋所有 12 種賺取 + 10 種消費)
zcoin_shop_items (category, price, rarity, is_limited, available_until)
zcoin_user_items (user_id, item_id) UNIQUE
zcoin_user_equipped (user_id, slot, item_id) PK(user_id, slot)
daily_check_in (user_id, check_in_date, streak_days, zcoin_earned)
daily_tasks (user_id, task_date, task_type, zcoin_reward, completed)
referrals (inviter_id, invitee_id, invitee_completed_survey, zcoin_paid)
```

### ZCOIN-3 賺取管道補完（目前只有 share/survey_complete）
- ⓪ 註冊禮 +500（需手機/LINE 驗證防作弊）
- ③ 每日登入 +1（新增 daily_check_in 記錄）
- ④ 連續登入加碼（Day 3: +2, Day 7: +5, Day 30: +10）
- ⑤ 寫故事 +10（AI 內容品質審核，每天 3 篇上限）
- ⑥ 故事被按讚 +1/讚（每天上限 50，24h 延遲防互刷）
- ⑦ 邀請好友 +20（好友完成首份問卷才給，防同IP）
- ⑧ 首次綁定 LINE +10（一次性）
- ⑨ 完善個人資料 +5（一次性）
- ⑩ 填寫意見回饋 +8（每月一次）
- ⑪ 成就解鎖獎勵（依成就不同，+5 到 +50）
- ⑫ 雪凜每日任務（每天 3 個，隨機抽取，+3~+15）

### ZCOIN-4 商城頁面
- 新增 `app/(public)/shop/page.tsx`
- 招財坐在商城門口（迎賓動畫）
- Tab 切換：表情包 / 動態貼圖 / 主題 / 邊框 / 稱號 / 服裝 / 招財配件 / 問卷
- 商品卡片：預覽 + 價格 + 稀缺度（common/rare/epic/legendary）
- 限定商品：倒計時顯示剩餘時間
- API：`/api/zcoin/shop`（列表）、`/api/zcoin/purchase`（購買）

### ZCOIN-5 每日任務系統
- 新增 `lib/zcoin/dailyTaskEngine.ts`
- 任務池（10+ 種任務類型），每天隨機分配 3 個
- API：`/api/zcoin/daily-tasks`（GET 今日任務 / POST 完成任務）
- 前端：雪凜宣布每日任務（excited 表情）

### ZCOIN-6 邀請系統
- 新增 `app/(public)/invite/[code]/page.tsx`（邀請連結落地頁）
- API：`/api/zcoin/referral`（生成邀請碼 / 追蹤完成）
- 邀請碼格式：`INV_[userId前6碼]_[隨機4碼]`

### ZCOIN-7 招財配件系統
- 使用者購買後，Z 幣餘額旁的迷你招財穿戴配件
- 故事卡片上的 Z 幣標記也顯示招財配件
- 前端元件：`components/zcoin/ZaicaiIcon.tsx`（根據 equipped slot 渲染）

### ZCOIN-8 連續登入追蹤
- API：`/api/zcoin/check-in`（每日第一次開啟 app 呼叫）
- 計算 streak（連續天數），發放對應 Z 幣
- UI：首頁彈出招財打招呼 + 跑輪日曆

### ZCOIN-9 送禮系統
- API：`/api/zcoin/gift`（POST: to_user_id, amount）
- 手續費 10%（平台抽水）
- 最低 10 Z 幣
- UI：招財送禮動畫卡片

### ZCOIN-10 防作弊機制
- `lib/zcoin/antiCheat.ts`：
  - 按讚互刷：同對用戶 24h 內只算 1 次
  - 邀請：同 IP / 同設備指紋不算
  - 故事：AI 品質審核
  - 全局速率：每小時最多 30 Z 幣，每天最多 109 Z 幣

### ZCOIN-11 AI 深度解讀（Z 幣消費）
- 問卷結果頁：免費版（雪凜 3-5 句）→ 花 30 Z 幣獲得深度版（500+ 字）
- API：`/api/zcoin/deep-analysis`（扣 Z 幣 → 呼叫 Claude Sonnet → 精美報告）

---

## 🟡 LINE Pay 儲值（LINE-Pay-Integration-Spec.md）

### PAY-0 LINE Pay 商家帳號申請（非程式碼）
- 前往：https://pay.line.me/portal/tw/merchant-apply
- 選「線上商店」，準備公司設立登記表 + 身份證 + 存摺封面
- 商品說明寫：「平台虛擬代幣儲值服務」
- 審核約 2 週 ~ 1 個月
- 先用 Sandbox 開發：https://developers-pay.line.me

### PAY-1 LINE Pay Online API v3 串接
- 安裝：`npm install line-pay-merchant`
- 新增 `lib/payment/linePayClient.ts`
- 環境變數：`LINE_PAY_CHANNEL_ID` / `LINE_PAY_CHANNEL_SECRET` / `LINE_PAY_ENV`
- 新增 `api/line-pay/request/route.ts`（建立付款請求）
- 新增 `api/line-pay/confirm/route.ts`（確認付款 + 發放 Z 幣）
- 新增 `api/line-pay/cancel/route.ts`
- 新增 `api/line-pay/refund/route.ts`（管理員手動退款）
- DB：`payment_orders (order_id, user_id, plan_id, amount, zcoin_amount, provider, status, transaction_id)`

### PAY-2 Z 幣儲值頁面
- 新增 `app/(public)/topup/page.tsx`
- 招財坐在 Z 幣堆上（動畫），「要帶更多 Z 幣回家嗎！」
- 4 種方案卡片：100/300/500/1000 Z 幣
- 付款方式切換：LINE Pay / 藍新 / Stripe
- 首儲加碼 50% 標語
- 新增 `app/(public)/topup/success/page.tsx`（招財倒幣動畫）

### PAY-3 LIFF 內付款整合
- 偵測 `liff.isInClient()` → 用 appUrl 直接喚起 LINE Pay
- 瀏覽器環境 → 用 webUrl 跳轉

### PAY-4 定期核對過期訂單
- `pending` 超過 1 小時 → 自動標記 `cancelled`
- 新增 `api/cron/reconcile-orders/route.ts`

---

## 🟢 一般功能

### 訊息系統
- Comment @mention 通知
- 訊息已讀回條對外部用戶生效

### 客服系統（supportEngine.ts 已建，需接線）
- `api/admin/support/route.ts`（CRUD + reply）
- `insight-admin/support/page.tsx`（工單列表 + 對話視窗 + AI 草稿）
- `line/webhook/official/route.ts`：整合客服關鍵字觸發
- `middleware.ts` + `layout.tsx`：加 `'support'`

### 系統設定
- `site-settings` 頁面新增 Bot 文案設定區塊
- `tenantBranding.ts` 整合至 Official Bot（替換毛行天下硬編碼）

---

## 📚 部落格功能待辦（BLOG-1 ~ BLOG-20）

> 已完成：系列文章、留言區、Emoji 反應、閱讀進度、分享卡、上/下一篇、麵包屑、瀏覽次數

- **BLOG-1** 文章目錄（TOC）— 自動從 h2/h3 生成浮動目錄，捲動時高亮
- **BLOG-2** 閱讀完成提示 — progress ≥ 95% 顯示「🎉 你讀完了！」
- **BLOG-3** 作者簡介卡 — 底部頭像 + bio + 最新 3 篇
- **BLOG-4** 相關文章推薦 — 相同 tag 推 3 篇
- **BLOG-5** 標題錨點連結 — hover h2/h3 出現 # 圖示，點擊複製錨點 URL
- **BLOG-6** 文章訂閱通知 — email 訂閱新文章，DB: `blog_subscribers`
- **BLOG-7** 草稿預覽連結 — 帶 token 的私密分享連結（不索引）
- **BLOG-8** 封面圖 AI 生成 — DALL-E 3 / Cloudflare AI，上傳 R2
- **BLOG-9** 文章統計頁 — 瀏覽趨勢 + 反應分布 + 留言趨勢
- **BLOG-10** 留言審核 + 關鍵字過濾 — is_approved + 黑名單表
- **BLOG-11** 部落格首頁版型切換 — 卡片牆/雜誌版/簡約列表
- **BLOG-12** Paywall 付費解鎖 — 前 N 字免費，整合 LINE Pay
- **BLOG-13** TipTap AI 輔助 — 選取文字 → 潤稿/翻譯/擴寫/精簡
- **BLOG-14** RSS Feed — `/blogs/{userSlug}/feed.xml`
- **BLOG-15** 文章分類（一級結構，區別於多選 tags）
- **BLOG-16** 深色/淺色模式切換（讀者自行切換）
- **BLOG-17** 文章字型大小調整（小/中/大，存 localStorage）
- **BLOG-18** 程式碼語法高亮 + 複製按鈕（lowlight + TipTap）
- **BLOG-19** OG 卡片測試工具（後台 SEO tab 加測試按鈕）
- **BLOG-20** 部落格全站搜尋（標題 + 摘要 full-text search）

---

## ⚪ 未來

### 問卷相關
- 自動化觸發引擎（DB: `automation_rules`，回覆達標/NPS閾值/排程）
- 每月自動週期問卷（clone + 推播 + AI 比較上月）
- Rule Engine API（`/api/ai/rules` + DB: `api_keys`）
- 行業分析模板（`lib/industryTemplates.ts`）

### 免費試用機制
- DB：`tenants.trial_started_at` / `trial_expires_at` / `plan`
- `lib/trialEngine.ts`
- `insight-admin/upgrade/page.tsx`（升級引導 + 資產清單）
- middleware：trial expired → redirect 升級頁

### LINE Bot 強化
- 管理員數據查詢 Bot（`lib/lineAdminBot.ts`，今日報告/漏斗/匯出）
- LINE Bot 填答 Quick Reply（單選題改用按鈕，不用打數字）
- Session 過期自動 abandon（`api/cron/cleanup-sessions`）

### 角色系統擴展
- **✅ 凜空（Riku）已規劃**（見 UI-6，Add.md）
- 問卷主題綁定不同角色出題
- 未來角色：麻糬（貓系慵懶）、小春（冷靜知性）
- Wake word 觸發（喊角色名字）
- Stripe 多語言付款（國際版）

---

## Sidebar 入口確認清單

- [x] Dashboard / 問卷管理 / 填答列表 / 漏斗 / 交叉 / 標籤 / 標籤規則
- [x] 來源分析 / A/B 比較 / AI 洞察報告
- [ ] 故事牆管理（story-wall） ← WIRE-3
- [ ] 客服中心（support） ← 一般功能
- [x] LINE 推播 / 通知規則 / 訊息模板 / UTM 管理 / Rich Menu
- [x] LINE 設定 / 通知樣式 / 封測名單 / Webhook / Meta/OG
- [x] AI 設定 / 主題設定 / 管理員面板 / 團隊管理 / 帳號設定
- [ ] 問卷模板（survey-templates） ← FEAT-6
- [ ] AI 嚮導設定（ai-guide） ← YUKIRIN-9
- [ ] 升級方案（upgrade） ← 未來

---

## 規格書索引（docs/new/）

| 檔案 | 對應待辦區塊 | 備註 |
|------|------------|------|
| Admin-Backend-Security-Spec.md | ADMIN-1 ~ ADMIN-9 | 含 Sec.14 擴展策略、Sec.15 清單 |
| AI-Cost-Control-Spec.md | COST-1 ~ COST-8 | 含 Sec.7 進階省錢、Sec.8 開關表 |
| Insight-UI-Redesign-Spec-v4.md | UI-1 ~ UI-6、VRM-1 ~ VRM-5 | v4 最新，v3 已廢棄，新增 simplex-noise |
| LINE-Pay-Integration-Spec.md | PAY-0 ~ PAY-4 | 含 Sec.5 未來訂閱、Sec.7 安全 |
| liquid-glass.css | CSS-GLASS-1 ~ CSS-GLASS-3 | 五層動畫 CSS，直接 import 用 |
| ShareCard-v2-Spec.md | CARD-1 ~ CARD-9 | 含 Sec.7 ANIMATION_TIMINGS、Sec.8 頁面整合 |
| Yukirin-AI-Guide-Spec.md | YUKIRIN-1 ~ YUKIRIN-9 | 含 Sec.12.4 AR Mode、Sec.13 清單 |
| Yukirin-Audio-System-Spec.md | AUDIO-1 ~ AUDIO-4 | 含完整對話流程 orchestration |
| Yukirin-Unified-AI-Spec.md | AI-UNIFIED-1 ~ AI-UNIFIED-4 | 17 個 AI 功能統一入口，新規格 |
| Yukirin-VRoid-ThreeJS-Guide.md | VRM-1 ~ VRM-5 | 含 MOOD_MAPPING、動畫檔案清單 |
| ZCoin-Economy-Spec.md | ZCOIN-1 ~ ZCOIN-11 | 含 Sec.8 招財×雪凜互動、Sec.9 清單 |
