# SnowRealm Insight Engine — 開發路線圖 v2
> 最後更新：2026-03-28（與程式碼 + DB 完整比對後重寫）
> 依據：implementation-plan.md / pending-tasks.md / project-status-2026-03-28.md / roadmap.md + 實際 codebase 掃描

---

## ✅ 已完成（全部確認）

### 核心問卷系統
- [x] 問卷 CRUD + 題目編輯 + 分流設定 (branch_config)
- [x] 分流邏輯 `useSurveyFlow.ts` — resolveRoutes + filterQuestions 正確
- [x] 9 種主題風格 (default/game/cyber/ancient/sakura/ocean/forest/candy/noir)
- [x] A/B 比較測試
- [x] 問卷排程 (scheduled_start/end)
- [x] 封測名單管理 (waitlist)
- [x] 密碼鎖問卷
- [x] 問卷模板系統 (survey_templates + API + 後台頁面 + seed)

### 填答系統
- [x] 多題型：單選/多選/文字/評分/星級/日期/上傳
- [x] 答題指紋 (fingerprint) 防重複
- [x] 中途儲存 (progress)
- [x] 點擊追蹤 (click events)
- [x] UTM 追蹤
- [x] **BUG 修復：填答詳情題目/答案對不上** — getResponseDetail 補 survey_id 傳給 resolveQuestions ✅ 2026-03-28

### 統計分析
- [x] Dashboard 統計 + avgCompletionTime + responseVelocity + responseQuality
- [x] 漏斗分析 + hotspot 標記
- [x] 交叉分析 (crosstab)
- [x] 標籤統計 + 標籤規則引擎
- [x] UTM 來源分析
- [x] CSV 匯出

### AI 功能
- [x] AI 出題 (OpenAI + Anthropic 雙引擎)
- [x] AI 對話式問卷生成 (AiSurveyChat)
- [x] AI 洞察報告 — 數據模式 (insightEngine)
- [x] AI 洞察報告 — 故事模式 (storyEngine)，已存 DB (report_type='story')
- [x] AI 情感分析 (sentimentAnalysis)
- [x] AI Key 管理（加密存儲 + 額度控制）
- [x] AI 使用日誌（action CHECK 約束已修正含 chat/insight/story/sentiment）

### 報告分享 + 故事系統
- [x] 報告公開連結 (share_slug + is_public + PATCH share/unshare)
- [x] ShareCard.tsx + ShareCardModal.tsx
- [x] 公開報告頁 `/report/[slug]` SSR + OG Meta ✅ 2026-03-28
- [x] storyCardEngine.ts + API `/api/story-card/[responseId]`
- [x] 公開故事卡片頁 `/story/[responseId]` SSR + OG ✅ 2026-03-28
- [x] storyWallEngine.ts + API `/api/story-wall/[surveySlug]`
- [x] 公開故事牆 `/story-wall/[surveySlug]` 瀑布流 + CTA ✅ 2026-03-28
- [x] 故事牆後台管理 `/insight-admin/story-wall`
- [x] 問卷完成頁 DoneClient.tsx 整合故事卡片 + 分享按鈕

### LINE 深度整合
- [x] LINE Bot 對話式填答 (lineBotEngine.ts)
- [x] LINE 管理員數據查詢 Bot (lineAdminBot.ts)
- [x] LINE Quick Reply 按鈕
- [x] Rich Menu 自動切換（POST_SURVEY_RICH_MENU_ID 已移入 lineConfig DB 管理）
- [x] LINE 推播 + 廣播
- [x] LINE 設定後台（含 Rich Menu ID / LIFF / LINE Login 設定欄位）
- [x] Official Bot 自動回覆（已用 tenantBranding.ts，無毛行天下硬編碼）✅ 2026-03-28
- [x] LINE OAuth 登入
- [x] system/route.ts 服務狀態改用 getLineConfig（不再紅燈）

### 多租戶 + 安全性
- [x] JWT 認證 + Cookie session
- [x] 租戶路由 rewrite (middleware)
- [x] 租戶品牌解耦 (tenantBranding.ts)
- [x] super_admin 總後台
- [x] 49/52 admin API 已加 requireRole
- [x] super_admin API 有 verifyToken + 角色檢查
- [x] 審計日誌 (auditLog.ts)
- [x] 計劃限制 (planLimits.ts)
- [x] Super Admin 登入 rate limiting

### 社群系統 (Social)
- [x] 貼文 + 留言 + 按讚 + 收藏 + 書籤
- [x] 追蹤/被追蹤系統
- [x] 私訊 DM (10 種主題 + 背景效果 + 濾鏡 + 轉傳/刪除/收回)
- [x] 文章/貼圖/影片上傳
- [x] 封鎖/檢舉系統
- [x] 分享卡片 (PostShareCard + img-proxy 解決 R2 CORS)
- [x] BottomNav + FloatingChat 掛入根 layout.tsx
- [x] 限時動態 Stories（DB 4 張表 + 創作頁 + 播放器 + StoryCircles）
- [x] 通知系統 `/notifications`
- [x] 未讀訊息 API
- [x] **BUG 修復：相簿導航後消失** — UserAlbum useEffect 同步 initialPhotos ✅ 2026-03-28
- [x] **BUG 修復：貼文顯示 HTML 標籤** — stripHtml() + 文章縮圖提取 ✅ 2026-03-28

### 客服系統
- [x] supportEngine.ts + 後台 `/insight-admin/support` + API `/api/admin/support`
- [x] LINE Bot 整合接收客服訊息

### 平台功能 (Super Admin)
- [x] 平台通知 (platform_notifications)
- [x] 通知樣式 (platform_notification_styles)
- [x] Rich Menu 管理
- [x] 審計日誌頁面

### 遊戲化 / 成長系統
- [x] Z幣系統 (zcoinEngine.ts) + Z幣商店 + 錢包
- [x] 每日任務 (dailyTaskEngine.ts)
- [x] 定價頁面 `/pricing`

### 支付系統
- [x] 藍新金流 (newebpay.ts + payment/notify 簽章驗證)
- [x] Z幣儲值頁面

### PWA 基礎
- [x] `public/manifest.json`（standalone mode、icons、shortcuts）
- [x] `layout.tsx` 加 manifest link + theme-color + apple-touch-icon

### 貼文編輯器
- [x] **BUG-B 修復：URL OG 預覽** — `/api/og-fetch` + write/page.tsx onPaste ✅ 2026-03-28

### DB Migrations（全部執行完畢）
- [x] phase33（報告分享欄位）
- [x] phase34（Bot 口令）
- [x] phase35（平台通知）
- [x] 社群系統 6 張表（social/follow_dm/bookmarks/reports/bans_blocks/message_management）
- [x] 64 張表全部成功（2 筆 index already exists 安全忽略）

---

## 🔴 待完成（高優先）

### BUG-A：分享小卡 OG 圖裁切
- **問題**：html2canvas 無法渲染 R2/S3 跨域圖片，匯出圖片只有背景沒有寵物圖
- **方案**：後端用 Satori + @resvg-js/resvg-wasm 生成 PNG
  - 新增 `src/app/api/og/route.tsx` — React 元件 → SVG → PNG
  - 或：前端改用 server-side 圖片代理後再送 html2canvas
- **檔案**：`src/components/social/PostShareCard.tsx`

### PWA Service Worker
- **待做**：
  1. `npm install next-pwa`
  2. `next.config.ts` 包 withPWA（排除 `/api/*` 快取）
  3. Web Push API：VAPID keys + DB 存訂閱 + `web-push` 套件（iOS 16.4+）

---

## 🟡 待完成（中優先）

### 付款流程前端
- 訂單建立 API（已有 notify，缺 create）
- 前端結帳頁（已有 `/pricing` 定價頁，缺付款觸發）
- 付款成功後升級 plan 邏輯

### 成就/升級系統前端
- XP 累積 + 等級制度（Lv1~10）
- 成就徽章 UI
- 個人頁顯示成就/等級

### 社群頁面完善
- 社群列表頁 `/communities`
- 社群詳情頁 `/c/[slug]`
- 社群管理後台

---

## ⚪ 規劃中（低優先 / 未排期）

- OG 圖裁切編輯器（react-image-crop）
- 進階相簿（分組、說明、標記人物）
- 探索頁升級（標籤篩選、排行榜、推薦用戶）
- 小卡收集系統（稀有度機制）
- PDF 報告匯出（@react-pdf/renderer）
- 自動化觸發引擎（automationEngine.ts 已有骨架）
- AI 週報主動推送

---

## 環境 / 部署快照

| 項目 | 值 |
|------|-----|
| 部署平台 | Zeabur |
| 正式域名 | https://insight.snowrealm.pet |
| DB | PostgreSQL @ 43.167.237.37:30465（64 張表）|
| GitHub | https://github.com/luffysky/snowrealm-pet-insight-engine |
| CDN | Cloudflare（Bot Fight Mode 開）|
| 圖片儲存 | Cloudflare R2 |
| 框架 | Next.js 16 App Router + TypeScript + Tailwind 4 |
