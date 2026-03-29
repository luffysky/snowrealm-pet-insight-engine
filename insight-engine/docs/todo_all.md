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
- 公開報告頁 `app/report/[slug]/page.tsx` 已完成（4 種渲染模式） ✅
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
- 同樣需要改為 `application/octet-stream` 模式，避免重蹈 ZIP 問題

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
