# SnowRealm Insight Engine — 開發路線圖

> 最後更新：2026-03-28
> 本文件整合所有已完成、待實作、規劃中的項目。

---

## ✅ 已完成（本 session）

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

### BUG-C：全專案還有哪些登入死循環
- **已知問題**：`/zcoin-shop`（已修）、`LoginPrompt`（已修）
- **待查**：搜尋全專案所有 `href="/login"` 沒帶 `redirect` 的地方
- **工具**：`grep -r 'href="/login"' src/`

---

## 🟠 社群 UX 全面升級（核心開發中）

### SOCIAL-1：Bottom Navigation Bar
底部導覽列，手機版專用（`md:hidden`）。

```
🏠 探索  |  🌐 社群  |  ⊕  |  💬 訊息  |  👤 我的
```

- **⊕ 中間按鈕**：點開底部選單 → 選「發布貼文」或「發布限時動態」
- **💬 訊息**：未讀數紅點 badge
- **👤 我的**：通知紅點 badge（讚/留言/追蹤）
- **實作範圍**：
  - `src/components/social/BottomNav.tsx`
  - 掛入所有社群公開頁面（`/articles`、`/u/[userId]`、`/explore` 等）
  - 頁面內容加 `pb-20` 不被擋住
  - iOS 安全區 `pb-[env(safe-area-inset-bottom)]`

---

### SOCIAL-2：限時動態（Stories）
完整類 IG 體驗，但有平台獨家功能。

#### DB（4 張表）
```sql
stories            -- 動態主體（canvas JSON + 背景 + 到期時間）
story_views        -- 誰看過（去重，作者可查）
story_polls        -- 投票貼圖
story_poll_votes   -- 投票記錄
```

#### Canvas 資料結構
```json
{
  "bg": { "type": "gradient", "value": "#667eea,#764ba2" },
  "layers": [
    { "type": "text", "content": "...", "font": "modern", "color": "#fff",
      "x": 50, "y": 30, "size": 28, "effect": "neon" },
    { "type": "storyCard", "responseId": "xxx", "x": 50, "y": 55 },
    { "type": "poll", "pollId": "yyy", "x": 50, "y": 75 },
    { "type": "emoji", "content": "✨", "x": 20, "y": 20, "size": 48 }
  ],
  "music": { "title": "晚安", "artist": "顏人中" },
  "expiresHours": 24
}
```

#### 創作頁 `/story/create`
- 背景：8 種漸層 + 上傳圖片
- 文字層：可拖移 + 縮放，4 種字型（現代/古典/手寫/打字機），顏色選擇，特效（閃亮/霓虹）
- 貼圖工具列：Story Card（測驗結果）、投票、Emoji、音樂顯示卡、#標籤
- 發布設定：24h / 72h / 永久 + 公開 / 粉絲限定

#### 瀏覽器 `/story/view`
- 全螢幕播放，頂部進度條
- 左/右點切換，長按暫停
- ❤️ 快速反應 + 💬 私訊回覆
- 作者可看誰看過（眼睛圖示 + 名單）
- 投票貼圖：即時圓餅圖動畫

#### 社群頁頂部動態圓圈列
```
🔵+    👤     👤     👤
你的   user1  user2  user3
(未看 = 漸層光環，已看 = 灰框)
```

#### 獨家功能（超越 IG）
- Story Card 貼圖：一鍵嵌入問卷測驗結果卡片
- 投票結果進 dashboard 分析
- 分享連結純 web，LINE 可直接看
- 精選動態 = 公開 URL，無需 app

---

### SOCIAL-3：懸浮訊息泡泡
不用離開當前頁面即可回覆訊息。

#### 三種狀態
```
泡泡（64px 圓形，可拖移）
  → 點一下 → 迷你聊天視窗（60vh 底部滑出）
  → 點「↗ 展開」→ 完整訊息頁
```

#### 觸發方式
- 收到新訊息 → 右下角自動滑入泡泡
- 訊息列表長按對話 → 選「懸浮此對話」

#### 手勢
| 動作 | 效果 |
|------|------|
| 拖移 | 自由移動到畫面任意位置 |
| 拖到右邊緣 | 半收起（省空間模式） |
| 迷你視窗往下滑 | 收回泡泡 |

#### 技術方案
- React Portal 渲染在 `document.body`（`z-index: 9999`）
- Zustand 管理全域狀態 `{ activeChat, isExpanded }`
- SSE 收到新訊息 → 自動觸發
- Touch events 實作拖移

---

### SOCIAL-4：通知系統
- `notifications` 表（type: like / comment / follow / story_reply / poll_result）
- 底部導覽 badge 實時更新
- `/notifications` 頁面
- 長按通知 → 標為已讀 / 刪除

---

## 🟡 PWA（Progressive Web App）

### 效益
- 手機加入主畫面，開啟像原生 app
- 全螢幕模式（無瀏覽器 UI，Stories / 底部導覽更沉浸）
- Push 通知（app 關閉也能收到 DM 通知）
- 離線快取

### 實作步驟
1. `npm install next-pwa`
2. 修改 `next.config.ts`（5 行）
3. 新增 `public/manifest.json` + 各尺寸 icon
4. `layout.tsx` 加 meta 標籤
5. Web Push API：VAPID keys + DB 存訂閱 + `web-push` 套件

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

## 📋 DB Migration 待執行清單

以下 SQL 已在 repo，需在 Supabase SQL Editor 手動執行：

```
supabase/migrations/20260327_user_album.sql         ✅ 已執行
supabase/migration_phase33_report_sharing.sql       ⬜ 待執行
supabase/migration_phase34_bot_passcode.sql         ⬜ 待執行
supabase/migration_phase35_platform_notifications.sql ⬜ 待執行
```

社群系統（若尚未執行）：
```
supabase/migration_social.sql                       ⬜ 確認
supabase/migration_follow_dm.sql                    ⬜ 確認
supabase/migration_social_bookmarks.sql             ⬜ 確認
supabase/migration_social_reports.sql               ⬜ 確認
supabase/migration_user_bans_blocks.sql             ⬜ 確認
supabase/migration_phase44_message_management.sql   ⬜ 確認
```

---

## 🗓️ 建議開工順序

```
本週
├── SOCIAL-1  Bottom Nav（1天）
├── SOCIAL-4  通知系統基礎（0.5天）
├── PWA       基礎設定（0.5天）
└── BUG-C     掃描所有登入死循環（0.5天）

下週
├── SOCIAL-2  限時動態（Stories）（3天）
│   ├── DB + API
│   ├── 創作頁面
│   └── 播放器
├── SOCIAL-3  懸浮訊息泡泡（1天）
└── PWA       Push 通知（1天）

之後
├── 成就/升級系統
├── 付款功能（藍新金流）
└── 社群頁面
```

---

> 本文件由 Claude Code 自動整理，如有遺漏請補充。
