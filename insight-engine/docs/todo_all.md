# 所有待辦任務

> 最後更新：2026-03-29
> 優先級：🔴 緊急 / 🟡 重要 / 🟢 一般 / ⚪ 未來

---

## 🔴 Bug 修復（阻礙功能正常運作）

### BUG-1 分流邏輯壞了（19 題全顯示）
- 檔案：`src/hooks/useSurveyFlow.ts`
- 問題：選「沒有且暫時不考慮」仍顯示全部 19 題
- 修法：替換 `resolveRoutes` + `filterQuestions` 兩個函式（詳見 CLAUDE.md）
- 同時：確認 DB `surveys.branch_config` 非 NULL

### BUG-2 AI 對話建立問卷報錯 `ai_usage_logs_action_check`
- 需跑 SQL（Supabase）：
  ```sql
  ALTER TABLE ai_usage_logs DROP CONSTRAINT ai_usage_logs_action_check;
  ALTER TABLE ai_usage_logs ADD CONSTRAINT ai_usage_logs_action_check
    CHECK (action IN ('generate','regenerate','generate_meta','regenerate_meta','chat','insight','story','sentiment'));
  ```

### BUG-3 OG 分享顯示 coverTitle 而非自訂 OG
- 診斷：`SELECT og_title FROM surveys WHERE slug = 'maoxingtianxia-mvp-survey'`
- 確認 `[org]/[slug]/page.tsx` 有 `export const dynamic = 'force-dynamic'`

### BUG-4 3 個 admin API 缺 `requireRole`
- `ai-sentiment/route.ts` → `requireRole('viewer')`
- `responses/[id]/route.ts` → `requireRole('viewer')`
- `line/test/route.ts` → `requireRole('admin')`

---

## 🔴 接線工作（後端做好但前端沒接上）

### WIRE-1 故事報告沒有存 DB
- 檔案：`src/app/api/admin/ai-story/route.ts`
- 在 return 前加 `INSERT INTO ai_insight_reports`（`report_type = 'story'`）
- DB：`ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'data'`

### WIRE-2 洞察報告歷史不區分數據/故事
- `ai-insight GET` 回傳加 `report_type`
- `insight/page.tsx` 歷史列表加 📊/📖 圖示，點擊切換對應 tab
- 報告生成成功顯示「✅ 已自動保存」toast

### WIRE-3 故事牆管理頁無 Sidebar 入口
- `layout.tsx` + `middleware.ts` 加 `'story-wall'`
- 新增 `insight-admin/story-wall/page.tsx`（審核/隱藏/置頂/篩選）

### WIRE-4 問卷完成頁缺 Story Card + 分享按鈕
- 新增 `components/public/StoryCard.tsx`
- 新增 `components/public/ShareButtons.tsx`
- 修改 `app/(public)/done/DoneClient.tsx`：呼叫 story-card API → 渲染卡片 → 分享按鈕
- `submit route`：`allow_story_wall` 預設 `false`，由完成頁勾選

### WIRE-5 Rich Menu 設定搬進後台 LINE 設定頁面
- `lib/lineConfig.ts`：`LINE_CONFIG_KEYS` 新增 `POST_SURVEY_RICH_MENU_ID` 等 8 個 key
- `lib/lineNotify.ts`：`switchUserRichMenu()` 改用 `getLineConfig`
- `line-settings/page.tsx`：新增 Rich Menu / LIFF / LINE Login 區塊
- `listLineConfigs()`：group 從定義讀取，非 key 前綴判斷

### WIRE-6 洞察報告分享功能（公開連結 + 分享小卡）
- DB migration：`share_slug`、`is_public`、`share_title`、`share_views` 欄位
- `ai-insight route` 新增 PATCH handler（`share`/`unshare`/`update_title`）
- 新增 `app/api/report/[slug]/route.ts`（公開 API，不需登入）
- 新增 `app/report/[slug]/page.tsx`（公開報告頁 + OG Meta + CTA）
- 新增 `components/admin/ShareCard.tsx`（插畫 + 摘要 + 儲存 PNG）
- 新增 `components/admin/ShareCardModal.tsx`
- `insight/page.tsx` 加「📤 分享」按鈕 → 開 ShareCardModal
- 安裝：`npm install html2canvas`

---

## 🟡 功能補完

### FEAT-1 Dashboard 頁面整合新指標
- 確認 `page.tsx` 顯示：平均填答時間、數據品質分數、回覆速度長條圖、棄卷熱點標紅
- `funnel/page.tsx`：熱點題目標紅（`isHotspot = true`）

### FEAT-2 AI 對話生成問卷確認能寫入 DB
- `AiSurveyChat.tsx` 流程：`parseSurveyJson` → 預覽 → `POST /api/admin/surveys` → 建立題目
- 目前可能只做到顯示 JSON 預覽，未寫入 DB

### FEAT-3 品牌化 PDF 報告匯出
- 新增 `api/admin/export-report/route.ts`（用 `@react-pdf/renderer`）
- `insight/page.tsx` 加「匯出 PDF」按鈕

### FEAT-4 公開故事牆頁面補完
- 底部 CTA：「💛 看完他們的故事，也來分享你的？」→ 問卷連結
- 頂部統計：總故事數
- 關鍵字標籤雲

### FEAT-5 貼圖個別圖片上傳
- `[packId]/stickers/route.ts` 目前仍用 `req.formData()`
- 需改為 `application/octet-stream` 模式，避免重蹈 ZIP 問題

---

## 🟡 總後台（Super Admin）

### FEAT-7a 平台公告通知系統
- DB：`platform_notifications` + `notification_reads`
- API：`/api/super-admin/notifications/`（CRUD + send）
- 頁面：`snowrealm-insight-ctrl/notifications/page.tsx`
- 功能：草稿/排程/立即發送、LINE + Dashboard + Email 管道

### FEAT-7b 總後台 Rich Menu 管理
- 新增 `snowrealm-insight-ctrl/rich-menu/page.tsx`
- 管理 Official Bot 和 Insight Bot 的全域預設 Rich Menu

### FEAT-7c 總後台通知樣式管理
- DB：`platform_notification_styles`（事件類型 + Flex Message 模板）
- 新增 `snowrealm-insight-ctrl/notification-styles/page.tsx`
- 修改 `lib/lineNotify.ts`：從 DB 讀模板替代硬編碼 Flex Message

### FEAT-7d 總後台導覽更新
- `layout.tsx` NAV_ITEMS 加：平台通知、Rich Menu、通知樣式

---

## 🟡 Phase 3 功能

### FEAT-6 問卷模板系統
- DB：`survey_templates` + `template_ratings`
- `lib/surveyTemplates.ts`（行業預設模板定義）
- API：`/api/admin/survey-templates/`（CRUD + use + rate + publish）
- 頁面：`insight-admin/survey-templates/page.tsx`（平台/我的/市集 tab）
- `surveys/page.tsx` 加「從模板建立」+「存為模板」
- `scripts/seed-templates.ts`（seed 平台預設模板）

### FEAT-8 AI 主動推送
- `api/cron/weekly-report`：加 AI 摘要（NPS 趨勢、棄卷率異常、建議問卷）
- 新增 `api/cron/ai-alerts`：每日檢查 NPS 下降 / 棄卷飆升 / 負面關鍵字 → LINE 預警

### FEAT-9 開放題情感分析
- `lib/sentimentAnalysis.ts`：批量情感分析（每 50 筆一批）
- `api/admin/ai-sentiment/route.ts`：已有，需加 `requireRole('viewer')`（見 BUG-4）
- `insight/page.tsx`：新增「開放題分析」區塊（圓餅圖 + 關鍵字標籤雲）

---

## 🟡 P-URGENT 剩餘

### URG-2 服務狀態紅燈
- `api/admin/system/route.ts` 第 62-98 行
- 改為呼叫 `getLineConfig()` 而非直接查 DB（自動 fallback DB → ENV）
- 確認 panel 頁 PostgreSQL / LINE / OpenAI 全綠

### URG-5 LINE 設定頁 Token 視覺化
- 未設定 → 灰色「尚未設定」
- ENV → 橘色標籤 ✓（已有）
- DB → 綠色標籤
- 連線失敗 → 紅叉 + 錯誤訊息

### URG-6 連結缺組織名稱導致 404
- 確認 Sidebar 所有導航連結帶上 tenant slug
- Middleware 若無 slug 自動 redirect 到用戶第一個 tenant

---

## 🟢 一般功能

### 訊息系統
- Comment @mention（留言 @提及用戶，通知對方）
- 訊息已讀回條（✓✓）對外部用戶也生效（目前只有自己能看到）

### 客服系統（supportEngine.ts 已建，需接線）
- `api/admin/support/route.ts`（CRUD + reply）
- `insight-admin/support/page.tsx`（工單列表 + 對話視窗）
- `line/webhook/official/route.ts`：整合客服關鍵字觸發 + 工單追加
- `middleware.ts` + `layout.tsx`：加 `'support'`

### 問卷引擎
- `useSurveyFlow.ts` 分流邏輯修復（見 BUG-1）
- `seed_branching.js` 加 `ON CONFLICT (survey_id, key) DO NOTHING` 防重複

### 系統設定
- `site-settings` 頁面新增 Bot 文案設定區塊（welcome/intro/default_reply/completion）
- `tenantBranding.ts` 整合至 Official Bot（替換毛行天下硬編碼文案）

---

## 📚 部落格功能待辦

> 目前已完成：系列文章、留言區、Emoji 反應、閱讀進度條、分享卡、上/下一篇、麵包屑、瀏覽次數

### BLOG-1 文章目錄（Table of Contents）
- 自動從文章 h2/h3 標題生成浮動目錄（側邊欄或頂部展開）
- 點擊標題平滑捲動到對應段落
- 閱讀進度到達某段落時，目錄對應項目自動 highlight
- 對長文非常有用

### BLOG-2 閱讀完成提示
- 當閱讀進度 progress ≥ 95% 時，顯示「🎉 你讀完了！」小提示
- 可搭配增加反應的 nudge（「覺得這篇如何？」）

### BLOG-3 作者簡介卡
- 文章底部顯示作者頭像、bio、文章數
- 引導讀者繼續看其他文章（顯示最新 2-3 篇）
- 從 `user_blog_settings` 讀取 bio 欄位

### BLOG-4 相關文章推薦
- 依相同標籤推薦 3 篇，放在留言區上方
- `SELECT ... WHERE $1 = ANY(tags) AND id != $2 ORDER BY published_at DESC LIMIT 3`

### BLOG-5 標題錨點連結
- hover h2/h3 時，旁邊出現 `#` 圖示
- 點擊複製 URL + 跳轉到該段落的錨點連結
- 需要在 `article dangerouslySetInnerHTML` 的渲染後用 JS 動態加 id 和點擊事件

### BLOG-6 文章訂閱 / 通知
- 讀者輸入 email 訂閱作者新文章
- DB：`blog_subscribers (id, author_user_id, email, created_at)`
- 有新文章 `is_public = true` 時自動發信
- 作者後台可查看訂閱人數

### BLOG-7 草稿預覽連結（私密分享）
- `is_public = false` 的文章可生成帶 token 的預覽連結
- 用來分享給朋友審稿，不公開索引
- DB：`user_blog_articles` 加 `preview_token TEXT UNIQUE`
- 頁面：`/blogs/preview/[token]` 不需登入，不計瀏覽次數

### BLOG-8 封面圖 AI 生成
- 文章沒有封面時，點「✨ AI 生成封面」按鈕
- 根據文章標題 + 摘要自動產出封面圖（DALL-E 3 或 Cloudflare AI）
- 生成後上傳到 R2，存入 `cover_image`

### BLOG-9 文章統計頁（後台）
- 每篇文章的瀏覽趨勢折線圖（需 `blog_views` 日誌表）
- 反應分布圓餅圖
- 留言數趨勢
- 類似 Medium 的 per-article stats 頁面
- 位置：`insight-admin/social/blog/[id]/stats/page.tsx`

### BLOG-10 留言審核 + 關鍵字過濾
- `is_approved` 欄位已存在，加後台審核 UI
- 自訂關鍵字黑名單（`blog_comment_blocklist` 表）
- 留言包含黑名單關鍵字 → `is_approved = false`
- 後台通知：有待審留言時 badge 提示

### BLOG-11 部落格首頁版型切換
- 讀者瀏覽 `/blogs/{userSlug}` 時可切換三種版型：
  - 卡片牆（預設，目前格式）
  - 雜誌版（左大圖 + 右側文字列表）
  - 簡約列表（只顯示標題 + 日期）
- 作者在 `user_blog_settings` 設定預設版型
- 讀者可自行切換（存 localStorage）

### BLOG-12 Paywall 付費解鎖
- 文章可設定「前 N 字免費，後面需訂閱」
- DB：`user_blog_articles` 加 `is_paywall BOOLEAN`、`paywall_preview_chars INT`
- 整合 LINE Pay / 藍新金流
- 訂閱記錄：`blog_subscriptions (reader_email, author_user_id, expires_at)`

### BLOG-13 TipTap AI 輔助（選取文字後操作）
- 選取一段文字 → 浮動工具列出現 AI 選項：
  - ✨ 潤稿（改善表達）
  - 🌐 翻成英文
  - 📝 擴寫（增加細節）
  - ✂️ 精簡（縮短）
- 呼叫 `/api/admin/social/blog/ai-rewrite`
- 直接在 TipTap 中替換選取文字

### BLOG-14 部落格 RSS Feed
- 自動產生 RSS 2.0 / Atom feed
- 路徑：`/blogs/{userSlug}/feed.xml`
- 只包含 `is_public = true` 的文章
- 讓讀者可以用 RSS 閱讀器訂閱

### BLOG-15 文章封存 / 分類
- 在系列文章之外，支援輕量的「分類」標籤
- 作者可建立自訂分類（如「技術」「生活」「食記」）
- 部落格首頁可按分類篩選
- 與現有 `tags` 的差異：分類是作者定義的一級結構，tags 是多選自由標籤

### BLOG-16 深色/淺色模式切換
- 部落格文章頁支援讀者自行切換深色 / 淺色
- 目前全是深色（`bg-slate-950`），加一個 toggle 按鈕
- 淺色模式：白底、黑字、prose 預設色系

### BLOG-17 文章字型大小調整
- 讀者可調整文章字體大小（小 / 中 / 大）
- 存 localStorage，下次保持設定
- 改變 `article` 元素的 `text-sm` / `text-base` / `text-lg` class

### BLOG-18 程式碼區塊語法高亮 + 複製按鈕
- TipTap CodeBlock 目前沒有語法高亮
- 整合 `lowlight`（已是 TipTap 官方推薦）
- 程式碼區塊右上角加「複製」按鈕（`navigator.clipboard.writeText`）

### BLOG-19 文章預覽 OG 卡片測試工具
- 後台「SEO」頁面加一個「測試 OG 卡片」按鈕
- 呼叫 Facebook Sharing Debugger API 或直接顯示 og:image 預覽
- 讓作者確認分享出去的卡片長什麼樣子

### BLOG-20 部落格整體搜尋
- `/blogs` 首頁加搜尋框，可搜尋所有公開文章的標題 + 摘要
- PostgreSQL full-text search：`tsvector`（或 simple ILIKE）
- 支援作者篩選、標籤篩選、日期範圍

---

## ⚪ 未來

### 自動化觸發引擎
- DB：`automation_rules`
- `lib/automationEngine.ts`
- 觸發時機：回覆數達標、NPS 閾值、關鍵字、排程
- 自動化週期問卷（每月自動複製並推播）

### Rule Engine API
- `api/ai/rules/` + `api/ai/validate/`
- `lib/ruleEngine.ts`
- DB：`api_keys`（第三方 API Key 管理）
- `middleware.ts`：`/api/ai/*` 走獨立 API Key 認證

### 行業分析模板
- `lib/industryTemplates.ts`
- `insightEngine.ts` 整合行業 Prompt
- `insight/page.tsx` 新增行業選擇器

### 免費試用機制
- DB：`tenants.trial_started_at`、`trial_expires_at`、`plan`
- `lib/trialEngine.ts`
- `insight-admin/upgrade/page.tsx`（升級引導 + 資產清單）
- `middleware.ts`：trial expired → redirect 升級頁

### LINE 管理員數據查詢 Bot
- `lib/lineAdminBot.ts`
- 指令：今日報告、分析 q3、漏斗、匯出
- Flex Message 報告卡片

### LINE Bot 填答 Quick Reply
- `lineBotEngine.ts`：單選題改用 Quick Reply 按鈕
- Session 過期自動 abandon（`api/cron/cleanup-sessions`）

---

## Sidebar 入口確認清單

> 以下頁面確認存在於 Sidebar + middleware `KNOWN_ADMIN_PAGES`

- [x] Dashboard
- [x] 問卷管理（surveys）
- [x] 填答列表（responses）
- [x] 漏斗分析（funnel）
- [x] 交叉分析（crosstab）
- [x] 標籤統計（tags）
- [x] 標籤規則（tag-rules）
- [x] 來源分析（utm）
- [x] A/B 比較（ab）
- [x] AI 洞察報告（insight）
- [ ] 故事牆管理（story-wall） ← WIRE-3
- [ ] 客服中心（support） ← URG
- [x] LINE 推播（broadcast）
- [x] 通知規則（notification-rules）
- [x] 訊息模板（templates）
- [x] UTM 管理（utm-links）
- [x] Rich Menu（rich-menu）
- [x] LINE 設定（line-settings）
- [x] 通知樣式（notification-styles）
- [x] 封測名單（waitlist）
- [x] Webhook（webhooks）
- [x] Meta/OG（site-settings）
- [x] AI 設定（ai-settings）
- [x] 主題設定（theme-settings）
- [x] 管理員面板（panel）
- [x] 團隊管理（team）
- [x] 租戶管理（tenants，僅 super_admin）
- [x] 帳號設定（account）
- [ ] 問卷模板（survey-templates） ← FEAT-6
- [ ] 升級方案（upgrade） ← 未來
