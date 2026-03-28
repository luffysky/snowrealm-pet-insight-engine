# SnowRealm Insight Engine — 開發路線圖

> 最後更新：2026-03-28（Session 2 更新）
> 本文件整合所有已完成、待實作、規劃中的項目。

---

## ✅ 已完成

| 項目 | 說明 |
|------|------|
| SQL 架構升級 | N+1 修復、17 個複合索引、連線池調整 |
| Bug 2：分享小卡儲存 | `link.click()` 加入 DOM 再觸發，修正無法下載問題 |
| Bug 3：LINE 分享 OG | `force-dynamic` + `og:url` + `og:siteName`，LINE 爬蟲可正確抓取 |
| Bug 4：登入死循環 | `LoginPrompt` 加 `?redirect=` 參數，登入後返回原頁 |
| Bug 4b：追蹤按鈕死循環 | 修正 `meId` 讀 `d.id` 應為 `d.userId`，登入後追蹤按鈕正常顯示 |
| Bug 5：手機按鈕溢出 | 用戶名稱加 `truncate`、Z 幣 badge 手機版隱藏、nav 加 `overflow-hidden` |
| Bug 6：Z 幣商店未登入 | `/api/zcoin` 改為直接讀 JWT cookie，不依賴 middleware header |
| Feature 1：個人頁面相簿 | DB + API + 元件，3 欄網格 + Lightbox + 公開/私人切換 |
| 共用認證修正 | `register/page.tsx` 支援 `?redirect=` 參數 |
| SOCIAL-1：Bottom Nav | `BottomNav.tsx` 完成，掛入 `layout.tsx`，未讀 DM badge 輪詢，create modal |
| SOCIAL-1：訊息頁面 | `/messages` 對話列表 + 即時聊天（SSE），手機/桌面響應式 |
| SOCIAL-2：限時動態 Stories | DB 4 張表（stories/story_views/story_polls/story_poll_votes）+ 創作頁 `/story/create` + 播放器 `/story/view` + StoryCircles 整合進 `/articles` |
| SOCIAL-3：懸浮訊息泡泡 | `FloatingChat.tsx` 完成，掛入根 `layout.tsx`，React Portal + 拖移 + 迷你視窗 |
| SOCIAL-4：通知 API | `social_notifications` 表 + API（GET/PATCH），通知頁面 `/notifications` |
| 未讀訊息 API | `/api/admin/social/messages/unread` |
| 私訊系統 | 10 種主題 + 背景效果 + 濾鏡，轉傳/刪除/收回，真實 DB message ID |
| 分享小卡 CORS 修正 | `/api/img-proxy` 代理 R2/S3 圖片，PostShareCard 全部走代理 |
| 公開故事卡片頁 | `/story/[responseId]` SSR + OG Meta，LINE/複製連結分享 |
| 公開故事牆 | `/story-wall/[surveySlug]` 瀑布流 + 關鍵字標籤 + CTA |
| 公開 AI 報告頁 | `/report/[slug]` SSR + OG，數據/故事模式，瀏覽計數 |
| AI 報告分享系統 | `share_slug`/`is_public` 欄位，PATCH share/unshare/update_title，ShareCardModal |
| DB Migrations | phase33（報告分享）、phase34（Bot 口令）、phase35（平台通知）全部執行 ✅ |
| BUG-C：登入死循環掃描 | 全專案確認無問題 ✅ |
| BUG-2：ai_usage_logs 約束 | ALTER TABLE 直接修正，支援 chat/insight/story/sentiment |
| PWA manifest.json | `public/manifest.json` 基礎設定完成（standalone mode、icons、shortcuts） |

---

## 🔴 Bug 待修（高優先）

### BUG-A：分享小卡 OG 圖裁切/位置問題
- **問題**：分享時 OG 圖只顯示背景，寵物圖沒露出來
- **原因**：html2canvas 跨域圖片無法渲染（CORS）
- **修法**：後端產生 OG 圖（Satori + resvg），或提供圖片裁切/位置調整 UI
- **檔案**：`src/components/social/PostShareCard.tsx` + `src/app/api/og/route.tsx`

### BUG-B：貼文分享連結無 OG 預覽（連結貼上）
- **問題**：貼文編輯器貼入外部 URL 時，沒有自動抓取 OG 預覽卡
- **修法**：偵測文字框貼上 URL → 呼叫 `/api/og-fetch?url=` → 顯示預覽卡
- **檔案**：`src/app/write/page.tsx` + 新增 `src/app/api/og-fetch/route.ts`

### URG-1：毛行天下租戶重複顯示
- **問題**：租戶選單出現兩筆「毛行天下」
- **診斷 SQL**：`SELECT id, slug, name, is_active FROM tenants WHERE name LIKE '%毛行天下%';`
- **修法**：刪除/設 inactive 重複那筆，register route 加名稱唯一檢查

### URG-3：super_admin 看到所有組織
- **問題**：`/api/auth/me` 對 super_admin 回傳全部 tenant
- **修法**：加 `?scope=super` 參數，一般後台只回傳自己有權限的租戶
- **檔案**：`src/app/api/auth/me/route.ts`

### URG-4：Official Bot 文案硬編碼
- **問題**：歡迎語/回覆文案寫死「毛行天下」
- **修法**：改用 `tenantBranding.ts` 的 `getTenantBranding()` 讀取
- **檔案**：`src/app/api/line/webhook/official/route.ts`

---

## ✅ 已完成社群功能（2026-03-28 確認）

### SOCIAL-1：Bottom Navigation Bar ✅
- `BottomNav.tsx` + `FloatingChat.tsx` 均掛入根 `layout.tsx`
- 未讀 DM badge 輪詢，create modal

### SOCIAL-2：限時動態（Stories）✅
- DB 4 張表：stories / story_views / story_polls / story_poll_votes
- 創作頁 `/story/create`（595 行，canvas 編輯器）
- 播放器 `/story/view`（418 行，全螢幕 + 投票）
- `StoryCircles.tsx` 整合進 `/articles` 社群 feed 頁頂部

### SOCIAL-3：懸浮訊息泡泡 ✅
- `FloatingChat.tsx` 完成，掛入根 `layout.tsx`
- React Portal + 拖移 + 迷你聊天視窗

### SOCIAL-4：通知系統 ✅
- `social_notifications` 表 + API + 通知頁面 `/notifications`

---

## 🟡 PWA（Progressive Web App）— 部分完成

### 已完成
- `public/manifest.json` 基礎設定（standalone、icons、shortcuts、`start_url: /explore`）

### 待完成
1. `npm install next-pwa`（或直接 `next-pwa` 設定 service worker）
2. 修改 `next.config.ts`（5 行）
3. `layout.tsx` 加 `<link rel="manifest">` meta 標籤（確認有加）
4. Web Push API：VAPID keys + DB 存訂閱 + `web-push` 套件

### 注意
- Service Worker 排除 `/api/*` 快取
- iOS 16.4+ 才支援 Web Push

---

## 🔵 付費功能（Feature 7）

### 需要開通的功能
- 藍新金流（已有 `payment/notify` 路由，TradeSha 簽章已實作）
- 訂閱方案頁面 `/subscription`
- 升級頁面 `/upgrade`（試用到期時導向）

### 付費牆項目
| 功能 | 免費限制 | Pro |
|------|---------|-----|
| 問卷數量 | 3 份 | 無限 |
| 回覆數 | 100 筆 | 無限 |
| AI 洞察報告 | 鎖定（模糊預覽） | 無限 |
| 故事牆 | 關閉 | 開啟 |
| 匯出 CSV/PDF | 關閉 | 開啟 |
| 團隊成員 | 1 人 | 5 人 |

### 藍新金流串接
- 環境變數：`NEWEBPAY_MERCHANT_ID` / `NEWEBPAY_HASH_KEY` / `NEWEBPAY_HASH_IV`
- 已有：`src/app/api/payment/notify/route.ts`（簽章驗證 ✅）
- 待做：前端結帳頁、訂單建立 API、付款成功後升級 plan

---

## 🟣 成就 / 升級系統（Feature 9）

### 設計原則
- **有意義的成就**，不是花錢買的
- 行動觸發經驗值，累積升等

### 經驗值來源
| 行動 | XP |
|------|-----|
| 每日簽到 | +10 |
| 完成問卷填答 | +20 |
| 建立問卷 | +30 |
| 收到 10 筆回覆 | +25 |
| 發布貼文 | +15 |
| 貼文獲得 10 個讚 | +20 |
| 建立限時動態 | +10 |
| 他人收藏你的貼文 | +5 |
| 建立小卡並分享 | +15 |
| 收集他人 Story Card | +10 |
| 帶朋友加入（推薦） | +50 |

### 升等制度
| 等級 | 名稱 | 所需 XP | 解鎖 |
|------|------|---------|------|
| Lv 1 | 探索者 | 0 | 基本功能 |
| Lv 2 | 觀察者 | 100 | 自訂頭像框 |
| Lv 3 | 記錄者 | 300 | 貼文置頂一次/月 |
| Lv 5 | 創作者 | 800 | 建立公開社群 |
| Lv 8 | 引領者 | 2000 | 建立隱私社群 |
| Lv 10 | 雪境賢者 | 5000 | 建立匿名社群 + 特殊頭像框 |

### 成就徽章（部分）
- 🌱 **第一步**：完成第一份問卷
- 🔥 **連續 7 天**：連簽 7 天
- 📝 **說書人**：發布 10 篇貼文
- 💡 **洞察師**：生成 5 份 AI 報告
- 🤝 **社群之心**：追蹤 20 人且被 20 人追蹤
- 📸 **攝影師**：上傳 30 張相簿照片
- 🗳️ **民調王**：故事投票收到 100 票
- 🌍 **傳播者**：Story Card 被分享 50 次
- 👑 **開拓者**：建立第一個社群

### 社群開放條件
| 類型 | 需求 | 說明 |
|------|------|------|
| 公開社群 | Lv 5 | 任何人可加入、可搜尋 |
| 隱私社群 | Lv 8 | 需審核，不公開搜尋 |
| 匿名社群 | Lv 10 | 成員匿名，管理員可見真實身份 |

---

## ⚪ 規劃中（尚未排期）

### PLAN-1：社群頁面完善
- 社群列表頁 `/communities`
- 社群詳情頁 `/c/[slug]`
- 社群貼文 feed（獨立於個人 feed）
- 社群管理後台

### PLAN-2：小卡收集系統
- Story Card 可被他人收藏
- 個人頁「我的收藏」分頁
- 稀有度機制（回應特定問卷才能獲得限定小卡）

### PLAN-3：探索頁升級
- 依標籤 / 熱門 / 最新篩選
- 問卷排行榜
- 推薦用戶

### PLAN-4：進階相簿
- 相簿分組（多個相簿）
- 照片加說明、標記人物
- 相簿封面設定

### PLAN-5：OG 圖裁切編輯器
- 分享前可拖移圖片調整構圖
- `react-image-crop` 或自製 canvas 裁切工具

---

## 📋 DB Migration 狀態

```
supabase/migrations/20260327_user_album.sql              ✅ 已執行
supabase/migration_phase33_report_sharing.sql            ✅ 已執行（2026-03-28）
supabase/migration_phase34_bot_passcode.sql              ✅ 已執行（2026-03-28）
supabase/migration_phase35_platform_notifications.sql    ✅ 已執行（2026-03-28）
supabase/migration_social.sql                            ✅ 已確認
supabase/migration_follow_dm.sql                         ✅ 已確認
supabase/migration_social_bookmarks.sql                  ✅ 已確認
supabase/migration_social_reports.sql                    ✅ 已確認
supabase/migration_user_bans_blocks.sql                  ✅ 已確認
supabase/migration_phase44_message_management.sql        ✅ 已確認
```

---

## 🗓️ 建議開工順序（截至 2026-03-28 更新）

```
本週（剩餘）
├── BUG-A     分享小卡 OG 圖（Satori 後端方案）
├── BUG-B     貼文 URL OG 預覽（/api/og-fetch）
├── URG-1     毛行天下重複租戶（SQL 診斷 + 合併）
├── URG-3     super_admin 租戶範圍（me/route.ts）
├── URG-4     Official Bot 文案解耦（tenantBranding）
└── PWA       Service Worker（next-pwa 設定）

之後
├── 成就/升級系統前端
├── 付款功能（藍新金流前端結帳頁）
└── 社群頁面（communities、/c/[slug]）
```

---

> 本文件由 Claude Code 自動整理，如有遺漏請補充。
