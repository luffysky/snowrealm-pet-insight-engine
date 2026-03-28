# SnowRealm Insight Engine — 開發路線圖 v2
> 最後更新：2026-03-29（與程式碼 + git log + codebase 完整比對）
> 依據：git log / 實際 codebase 掃描 / 部署確認

---

## ✅ 已完成（全部確認）

### 核心問卷系統
- [x] 問卷 CRUD + 題目編輯 + 分流設定 (branch_config)
- [x] 分流邏輯 `useSurveyFlow.ts` — resolveRoutes + filterQuestions 正確（已修，無硬編碼 A 路線）
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
- [x] BUG 修復：填答詳情題目/答案對不上 ✅ 2026-03-28

### 統計分析
- [x] Dashboard 統計 + avgCompletionTime + responseVelocity + responseQuality（頁面已顯示）
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
- [x] AI 情感分析 (sentimentAnalysis) + requireRole 已加
- [x] AI Key 管理（加密存儲 + 額度控制）
- [x] AI 使用日誌 action CHECK 約束已修正（含 chat/insight/story/sentiment）
- [x] 歷史報告列表區分 data/story（GET 回傳 report_type）

### 報告分享 + 故事系統
- [x] 報告公開連結 (share_slug + is_public + PATCH share/unshare/update_title)
- [x] ShareCard.tsx + ShareCardModal.tsx
- [x] 公開報告頁 `/report/[slug]` SSR + OG Meta
- [x] storyCardEngine.ts + API `/api/story-card/[responseId]`
- [x] 公開故事卡片頁 `/story/[responseId]` SSR + OG
- [x] storyWallEngine.ts + API `/api/story-wall/[surveySlug]`
- [x] 公開故事牆 `/story-wall/[surveySlug]` 瀑布流 + CTA
- [x] 故事牆後台管理 `/insight-admin/story-wall`（Sidebar 入口已加）
- [x] 問卷完成頁 DoneClient.tsx 整合故事卡片 + 分享按鈕

### LINE 深度整合
- [x] LINE Bot 對話式填答 (lineBotEngine.ts)
- [x] LINE 管理員數據查詢 Bot (lineAdminBot.ts)
- [x] LINE Quick Reply 按鈕
- [x] Rich Menu 自動切換（POST_SURVEY_RICH_MENU_ID 已移入 lineConfig DB 管理）
- [x] LINE 推播 + 廣播
- [x] LINE 設定後台（含 Rich Menu ID / LIFF / LINE Login 設定欄位）
- [x] Official Bot 自動回覆（tenantBranding.ts，無毛行天下硬編碼）
- [x] LINE OAuth 登入
- [x] system/route.ts 服務狀態改用 getLineConfig（不再紅燈）

### 多租戶 + 安全性
- [x] JWT 認證 + Cookie session
- [x] 租戶路由 rewrite (middleware)
- [x] 租戶品牌解耦 (tenantBranding.ts)
- [x] super_admin 總後台
- [x] 52/52 admin API 已加 requireRole（含 ai-sentiment / responses/[id] / line/test）
- [x] super_admin API 有 verifyToken + 角色檢查
- [x] 審計日誌 (auditLog.ts)
- [x] 計劃限制 (planLimits.ts)
- [x] Super Admin 登入 rate limiting

### 社群系統 (Social)
- [x] 貼文 + 留言 + 按讚 + 收藏 + 書籤
- [x] 追蹤/被追蹤系統
- [x] 私訊 DM 基礎（10 種主題 + 背景效果 + 濾鏡 + 轉傳/刪除/收回）
- [x] 私訊背景擴充：新增 7 種 CSS 動態背景（楓葉/暴雪/螢火蟲/極光/花瓣/雨滴/櫻花）✅ 2026-03-29
- [x] 私訊全部背景解鎖（所有 19 個背景 price=0，無 Z 幣限制）✅ 2026-03-29
- [x] 私訊背景/主題套用範圍切換（單一聊天室 / 全部聊天室）✅ 2026-03-29
- [x] 私訊貼圖面板加入「表情貼」sub-tab ✅ 2026-03-29
- [x] 文章/貼圖/影片上傳
- [x] 封鎖/檢舉系統
- [x] 分享卡片 (PostShareCard + img-proxy 解決 R2 CORS)
- [x] BottomNav + FloatingChat 掛入根 layout.tsx
- [x] 限時動態 Stories（DB 4 張表 + 創作頁 + 播放器 + StoryCircles）
- [x] 通知系統 `/notifications`
- [x] 未讀訊息 API
- [x] BUG 修復：相簿導航後消失 ✅ 2026-03-28
- [x] BUG 修復：貼文顯示 HTML 標籤 ✅ 2026-03-28
- [x] BUG 修復：貼圖上傳 500（adm-zip serverExternalPackages + formData try/catch）✅ 2026-03-29
- [x] BUG 修復：build 失敗 messages/page.tsx isMine 型別錯誤 ✅ 2026-03-29

### 貼圖 / 表情貼系統
- [x] 貼圖包 CRUD（ZIP 上傳 / 個別圖片上傳 / 拖曳排序 / 上下架）
- [x] 貼圖 API 支援 pack_type 過濾（`?type=sticker|emoji`）✅ 2026-03-29
- [x] 超級後台貼圖管理頁 tab 切換（🎨 貼圖包 / 😊 表情貼）✅ 2026-03-29
- [x] 建立貼圖包時 packType 參數傳入 DB ✅ 2026-03-29

### 市集系統
- [x] DB：marketplace_items / marketplace_purchases / creator_earnings / marketplace_ratings 4 張表 ✅ 2026-03-29
- [x] DB：sticker_packs 新增 pack_type 欄位（migration 已執行）✅ 2026-03-29
- [x] 市集 API `/api/super-admin/marketplace`（GET/POST/PATCH/DELETE）✅ 2026-03-29
- [x] 市集 API `/api/marketplace`（公開瀏覽 + Z 幣購買 + isOwned 標記）✅ 2026-03-29
- [x] 超級後台市集管理頁（上下架/精選/價格編輯/創作者格式規範/70-30 分潤說明）✅ 2026-03-29
- [x] 公開市集頁 `/marketplace`（類型篩選/搜尋/購買）✅ 2026-03-29
- [x] 超級後台 layout 加入「市集管理」導覽 ✅ 2026-03-29
- [x] Seed：19 個背景 + 10 個主題作為官方市集商品

### 客服系統
- [x] supportEngine.ts + 後台 `/insight-admin/support` + API `/api/admin/support`
- [x] LINE Bot 整合接收客服訊息

### 平台功能 (Super Admin)
- [x] 平台通知 (platform_notifications + API + 頁面)
- [x] 通知樣式 (platform_notification_styles + API + 頁面)
- [x] Rich Menu 管理
- [x] 審計日誌頁面

### 遊戲化 / 成長系統
- [x] Z 幣系統 (zcoinEngine.ts) + Z 幣商店 + 錢包
- [x] 每日任務 (dailyTaskEngine.ts)
- [x] 定價頁面 `/pricing`

### 支付系統
- [x] 藍新金流 (newebpay.ts + payment/notify 簽章驗證)
- [x] Z 幣儲值頁面

### PWA 基礎
- [x] `public/manifest.json`（standalone mode、icons、shortcuts）
- [x] `layout.tsx` 加 manifest link + theme-color + apple-touch-icon

### 貼文編輯器
- [x] BUG 修復：URL OG 預覽 ✅ 2026-03-28

### DB Migrations（全部執行完畢）
- [x] 64 張核心表（問卷/社群/AI/支付/貼圖等）
- [x] 市集 4 張表 + sticker_packs.pack_type ✅ 2026-03-29

---

## 🔴 待完成（緊急 / 高優先）

### 市集入口缺失
- [ ] **公開市集沒有 BottomNav 入口** — `/marketplace` 頁面已做但使用者找不到
  - 修改 `src/components/social/BottomNav.tsx` 加購物袋 icon + 連結

### 超級後台貼圖頁缺背景/主題 tab
- [ ] 目前只有「貼圖包 / 表情貼」兩個 tab
  - 背景和主題目前僅能透過市集管理頁操作，貼圖頁無獨立入口
  - 方案 A：貼圖頁加 🖼️ 背景 / 🎭 主題 tab（顯示 marketplace_items 對應類型 + 快速定價）
  - 方案 B：維持現狀（市集管理已涵蓋此功能）

### BUG-A：分享小卡 OG 圖裁切
- [ ] html2canvas 無法渲染 R2 跨域圖片，匯出圖片只有背景沒有圖片內容
  - 方案：後端 Satori + @resvg-js/resvg-wasm 生成 PNG
  - 檔案：`src/components/social/PostShareCard.tsx`

---

## 🟡 待完成（中優先）

### PWA Service Worker
- [ ] `npm install next-pwa`
- [ ] `next.config.ts` 包 withPWA（排除 `/api/*` 快取）
- [ ] Web Push API：VAPID keys + DB 訂閱表 + `web-push` 套件（iOS 16.4+）

### 付款流程前端
- [ ] 訂單建立 API（已有 notify，缺 create）
- [ ] 前端結帳頁（已有 `/pricing` 定價頁，缺付款觸發）
- [ ] 付款成功後升級 plan 邏輯

### 成就/升級系統前端
- [ ] XP 累積 + 等級制度（Lv1~10）
- [ ] 成就徽章 UI
- [ ] 個人頁顯示成就/等級

### 社群頁面完善
- [ ] 社群列表頁 `/communities`
- [ ] 社群詳情頁 `/c/[slug]`
- [ ] 社群管理後台

---

## ⚪ 規劃中（低優先 / 未排期）

- OG 圖裁切編輯器（react-image-crop）
- 進階相簿（分組、說明、標記人物）
- 探索頁升級（標籤篩選、排行榜、推薦用戶）
- 小卡收集系統（稀有度機制）
- PDF 報告匯出（@react-pdf/renderer）
- 自動化觸發引擎（automationEngine.ts 已有骨架）
- AI 週報主動推送
- 免費試用機制（30 天全功能 + 到期降級）

---

## 環境 / 部署快照

| 項目 | 值 |
|------|-----|
| 部署平台 | Zeabur（push to main 自動部署）|
| 正式域名 | https://insight.snowrealm.pet |
| DB | PostgreSQL @ 43.167.237.37:30465（68 張表）|
| GitHub | https://github.com/luffysky/snowrealm-pet-insight-engine |
| CDN | Cloudflare（Bot Fight Mode 開）|
| 圖片儲存 | Cloudflare R2 |
| 框架 | Next.js 16 App Router + TypeScript + Tailwind 4 |
| 最新 commit | f59867e feat: marketplace + emoji stickers + build fix |
