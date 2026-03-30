# 總後台升級任務包

> 基於現有 16 個頁面 → 升級到 Admin-Backend-Security-Spec 完整版
> 給 Claude Code 的具體執行指令
> 日期：2026-03-30

---

## 現有 vs 目標 對照表

| 現有頁面 | 狀態 | 要做什麼 |
|---------|------|---------|
| dashboard/ | ✅ 有 | 大幅升級 |
| analytics/ | ✅ 有 | 補即時數據 |
| audit/ | ✅ 有 | 補 LINE 通知 |
| health/ | ✅ 有 | 大幅升級 |
| users/ | ✅ 有 | 大幅升級 |
| tenants/ | ✅ 有 | 小改 |
| support/ | ✅ 有 | 整合到 users |
| notifications/ | ✅ 有 | OK 不動 |
| notification-styles/ | ✅ 有 | OK 不動 |
| plans/ | ✅ 有 | OK 不動 |
| rich-menu/ | ✅ 有 | OK 不動 |
| site-settings/ | ✅ 有 | OK 不動 |
| stickers/ | ✅ 有 | OK 不動 |
| marketplace/ | ✅ 有 | OK 不動 |
| usage/ | ✅ 有 | 整合進 analytics |
| social/ | ✅ 有 | 拆分 + 升級 |
| ai-settings/ | ✅ 有 | 補測試面板 |
| **moderation/** | ❌ 缺 | **新建** |
| **ai-cost/** | ❌ 缺 | **新建** |
| **orders/** | ❌ 缺 | **新建** |
| **live-feed/** | ❌ 缺 | **新建** |
| **security/** | ❌ 缺 | **新建** |
| **files/** | ❌ 缺 | **新建** |
| **conversations/** | ❌ 缺 | **新建** |

---

## 一、Dashboard 升級

### 現有
- KPI 6 格、功能排行、租戶列表

### 升級成

```
dashboard/page.tsx

新增區塊：

1. 即時在線人數（Supabase Realtime 訂閱 presence）
   顯示：「目前 89 人在線」即時更新

2. 警報中心（置頂）
   從 system_alerts 表拉未確認的警報
   紅色：待處理檢舉、服務異常
   黃色：AI 成本超預算、退款申請
   綠色：系統正常
   點擊可跳轉到對應管理頁面

3. 最近活動流（簡化版，完整版在 live-feed/）
   從 activity_log 表拉最近 10 筆
   即時推送（Supabase Realtime）
   格式：「09:32 小美 完成了「寵物默契測驗」」
   「09:31 系統 封鎖了帳號 user_xxx（自動偵測）」

4. 今日營收卡片
   從 payment_orders 表加總今日 completed 訂單
   顯示：NT$2,180（+15% vs 昨天）

5. KPI 補充
   原有 6 格 + 新增：今日營收、在線人數、待處理檢舉數、AI 月成本

API 新增：
  GET /api/super-admin/alerts（未確認警報）
  GET /api/super-admin/live-feed?limit=10（最近活動）
  GET /api/super-admin/revenue/today（今日營收）
```

---

## 二、Users 大幅升級

### 現有
- 搜尋/篩選/封禁解封、顯示 email/角色/狀態

### 升級成

```
users/page.tsx — 列表頁升級

新增搜尋欄位：
  - LINE ID 搜尋
  - IP 搜尋
  - 裝置指紋搜尋
  - Z 幣餘額範圍篩選

新增列表欄位：
  - 暱稱（user_profiles.nickname）
  - 最後活躍時間
  - 問卷完成數
  - Z 幣餘額
  - 風險分數（user_profiles.risk_score）
  - 觀察名單標記（⚠️）

新增批量操作：
  - 批量封鎖
  - 批量發送通知
  - 匯出 CSV

---

users/[userId]/page.tsx — 新建使用者詳情頁（目前沒有）

分頁 Tab 設計：

Tab 1: 基本資料
  - 頭像、暱稱、Email、手機、LINE ID
  - 註冊日期、最後活躍、裝置列表
  - IP 記錄（最近 10 筆）
  - 帳號狀態 + 風險分數
  - 操作按鈕：封鎖/解封/警告/禁言/強制登出/刪除帳號

Tab 2: 活動時間線
  - 從 activity_log 拉該使用者所有動作
  - 按時間倒序排列
  - 篩選：全部/登入/問卷/故事/Z幣/金流/上傳
  - 格式：「09:32 完成問卷「寵物默契」」「09:28 上傳照片 cat.jpg」

Tab 3: 問卷記錄
  - 填過的所有問卷列表
  - 每份可展開看回答內容

Tab 4: 故事 & 留言
  - 發過的故事列表
  - 留言列表
  - 可直接刪除/隱藏

Tab 5: Z 幣明細
  - 從 zcoin_transactions 拉全部交易
  - 收入/支出分開顯示
  - 手動調整 Z 幣按鈕（需輸入原因，記錄到 audit log）

Tab 6: 金流記錄
  - 從 payment_orders 拉該使用者的訂單
  - 可操作退款

Tab 7: AI 對話
  - 從 guide_messages 拉所有雪凜對話記錄
  - 完整對話內容可展開

Tab 8: 上傳檔案
  - 該使用者上傳的所有圖片/影片
  - 縮圖預覽 + 可刪除

Tab 9: 登入歷史
  - 登入時間、IP、裝置、地理位置
  - 異常標記（不同國家登入等）

Tab 10: 檢舉記錄
  - 被檢舉的記錄
  - 檢舉別人的記錄

API 新增：
  GET /api/super-admin/users/[userId]/detail
  GET /api/super-admin/users/[userId]/activity?page=1&category=all
  GET /api/super-admin/users/[userId]/surveys
  GET /api/super-admin/users/[userId]/stories
  GET /api/super-admin/users/[userId]/zcoin
  GET /api/super-admin/users/[userId]/orders
  GET /api/super-admin/users/[userId]/conversations
  GET /api/super-admin/users/[userId]/files
  GET /api/super-admin/users/[userId]/logins
  GET /api/super-admin/users/[userId]/reports
  POST /api/super-admin/users/[userId]/adjust-zcoin
  POST /api/super-admin/users/[userId]/ban
  POST /api/super-admin/users/[userId]/warn
  POST /api/super-admin/users/[userId]/force-logout
```

---

## 三、Health 大幅升級

### 現有
- DB 大小、各表資料量、ENV 狀態

### 升級成

```
health/page.tsx

新增：外部服務健康檢查
  每 5 分鐘自動 ping 所有外部服務，顯示：
  🟢/🔴 Web Server (Zeabur)
  🟢/🔴 Supabase Database
  🟢/🔴 Supabase Auth
  🟢/🔴 Supabase Storage
  🟢/🔴 OpenAI API
  🟢/🔴 Anthropic API
  🟢/🔴 Azure Speech
  🟢/🔴 LINE Pay (Sandbox/Production)
  🟢/🔴 Newebpay
  🟢/🔴 Cloudflare CDN
  🟢/🔴 LINE Messaging API
  最後檢查時間 + 手動重新檢查按鈕

新增：效能指標
  - API 平均回應時間（最近 1 小時）
  - 錯誤率（最近 1 小時）
  - DB 連線數 / 上限
  - Storage 用量 / 上限

新增：服務異常時自動 LINE 通知你
  任何服務 🔴 → 即時發 LINE Notify
  （參考 Admin-Backend-Security-Spec 第十章）

API 新增：
  GET /api/super-admin/health/services（外部服務 ping）
  GET /api/super-admin/health/performance（效能指標）
  POST /api/super-admin/health/check（手動觸發全部檢查）
```

---

## 四、Social 拆分升級

### 現有
- 870 行巨大頁面，6 個 tab 全塞在一起

### 拆分成

```
原本 social/page.tsx 的 6 個 tab 拆成獨立子頁面：

social/
├── page.tsx              → 社群總覽（各分類的數量統計 + 快速入口）
├── reports/page.tsx      → 檢舉管理（從 social 搬出來）→ 併入 moderation/
├── posts/page.tsx        → 貼文管理
├── albums/page.tsx       → 相簿監控
├── blogs/page.tsx        → 部落格管理
├── dms/page.tsx          → 私訊監控
└── users/page.tsx        → 社群用戶管理（併入主 users/）

每個子頁面獨立 API、獨立分頁、獨立篩選
社群總覽頁顯示：
  今日新貼文: 23
  待處理檢舉: 3
  今日新相簿: 5
  私訊量: 147
  各區塊點擊跳轉到子頁面
```

---

## 五、Audit 補強

### 現有
- 操作篩選、審計日誌表、分頁

### 補強

```
audit/page.tsx

新增：敏感操作高亮
  以下操作用紅色高亮：
  users.ban, users.delete, zcoin.adjust,
  orders.refund, system.config_change, admin.role_change

新增：敏感操作自動 LINE 通知
  上述操作執行時，自動發 LINE Notify 給 super_admin
  格式：「⚠️ [管理員名稱] 執行了 [操作] 目標：[使用者]」

新增：匯出功能
  匯出選定時間範圍的 audit log 為 CSV

API 新增：
  POST /api/super-admin/audit/export
```

---

## 六、新建頁面 — live-feed/（即時活動流）

```
live-feed/page.tsx（全新）

所有使用者的所有動作即時串流顯示

技術：Supabase Realtime 訂閱 activity_log 表的 INSERT 事件
或用 SSE (Server-Sent Events)

UI：
  上方篩選列：
  [全部] [登入] [問卷] [故事] [留言] [Z幣] [金流] [上傳] [⚠️警報]

  下方即時串流：
  [09:32:15] 🟢 小美 完成了問卷「寵物默契測驗」
  [09:32:08] 📷 JK大叔 上傳了 1 張照片 [預覽]
  [09:31:55] 💰 花花 儲值 300 Z幣 via LINE Pay
  [09:31:30] 🔴 系統 自動封鎖 user_xyz（多帳號偵測）
  [09:31:20] 💬 阿明 在故事#456 留言

  每則可點擊跳轉到相關頁面（使用者詳情/故事/訂單等）
  警報類型用紅色背景高亮

API：
  GET /api/super-admin/live-feed?category=all&limit=50
  SSE /api/super-admin/live-feed/stream（即時推送）

資料來源：activity_log 表
需要先確保所有使用者動作都會寫入 activity_log
（參考 Admin-Backend-Security-Spec 第四章）
```

---

## 七、新建頁面 — moderation/（內容審核）

```
moderation/page.tsx（全新）

三個 Tab：
  [待審核] — AI 自動標記的內容
  [檢舉]   — 使用者主動檢舉的（從 social/reports 搬過來）
  [已處理] — 歷史記錄

待審核佇列：
  每則顯示：
  - 內容類型（故事/留言/私訊/圖片）
  - 作者
  - 內容預覽（文字前 100 字 / 圖片縮圖）
  - AI 標記原因 + 信心度
  - 操作按鈕：[✅通過] [❌刪除] [⚠️警告使用者] [🚫封鎖帳號]

檢舉佇列：
  每則顯示：
  - 檢舉者 / 被檢舉者
  - 檢舉原因（spam/fraud/harassment/sexual 等）
  - 被檢舉的內容
  - 操作按鈕同上 + [駁回檢舉]

API：
  GET /api/super-admin/moderation?tab=pending|reported|resolved
  POST /api/super-admin/moderation/[id]/resolve
  （action: pass / delete / warn / ban / dismiss）

資料來源：
  AI 標記 → content_moderation_queue 表（新建）
  使用者檢舉 → user_reports 表（已有定義在 Admin spec）
```

---

## 八、新建頁面 — ai-cost/（AI 成本監控）

```
ai-cost/page.tsx（全新）

顯示區塊：

1. 本月累計成本
   大數字 + 預算進度條
   「$87.50 / $150.00（58%）」
   顏色：<50% 綠、50-80% 黃、80-90% 橘、>90% 紅

2. 日成本趨勢（Recharts 折線圖）
   最近 30 天每日成本

3. 模型成本佔比（Recharts 餅圖）
   GPT-4o-mini vs Claude Sonnet vs Azure TTS

4. 任務類型成本佔比（Recharts 餅圖）
   閒聊 vs 結果解讀 vs 導覽 vs 審核 vs 其他

5. 最貴的 Top 10 對話
   表格：使用者 / 意圖 / 模型 / Token 數 / 成本 / 時間
   可點擊查看完整對話

6. 預算告警設定
   可修改月預算上限
   可修改各閾值（50%/80%/90%/100%）的動作

API：
  GET /api/super-admin/ai-cost/summary（本月摘要）
  GET /api/super-admin/ai-cost/daily（日趨勢）
  GET /api/super-admin/ai-cost/by-model（模型佔比）
  GET /api/super-admin/ai-cost/by-task（任務佔比）
  GET /api/super-admin/ai-cost/top-expensive（最貴對話）
  PUT /api/super-admin/ai-cost/budget（修改預算設定）

資料來源：ai_cost_log 表 + monthly_ai_cost view
（已定義在 AI-Cost-Control-Spec）
```

---

## 九、新建頁面 — orders/（金流訂單管理）

```
orders/page.tsx（全新）

篩選：
  - 訂單號搜尋
  - 使用者搜尋
  - 付款方式：LINE Pay / Newebpay / Stripe
  - 狀態：pending / completed / failed / cancelled / refunded
  - 日期範圍

表格欄位：
  | 訂單號 | 使用者 | 金額 | Z幣 | 方式 | 狀態 | 時間 | 操作 |

操作：
  - 查看詳情（展開：LINE Pay 回應 JSON、Z 幣發放記錄）
  - 退款（需輸入原因，通知 super_admin LINE）

底部統計：
  今日營收 / 本月營收 / 退款率 / 付款方式佔比

匯出：CSV 對帳單

API：
  GET /api/super-admin/orders?page=1&status=all&method=all
  POST /api/super-admin/orders/[orderId]/refund
  GET /api/super-admin/orders/export

資料來源：payment_orders 表
（已定義在 LINE-Pay-Integration-Spec）
```

---

## 十、新建頁面 — security/（安全總覽）

```
security/page.tsx（全新）

區塊 1：風險帳號
  風險分數 > 50 的帳號列表
  顯示：暱稱 / 風險分數 / 風險原因 / 操作

區塊 2：觀察名單
  從 watchlist 表拉
  顯示：使用者 / 原因 / 加入時間 / 由誰加入
  操作：移出觀察名單 / 封鎖

區塊 3：今日自動封鎖
  被行為偵測自動封鎖的帳號
  需要人工確認是否誤判
  操作：確認封鎖 / 解封（誤判）

區塊 4：裝置指紋異常
  同一個裝置指紋關聯多個帳號的列表
  顯示：指紋 / 關聯帳號數 / 帳號列表

區塊 5：IP 異常
  同一 IP 短時間大量註冊的記錄

API：
  GET /api/super-admin/security/risky-accounts
  GET /api/super-admin/security/watchlist
  GET /api/super-admin/security/auto-bans
  GET /api/super-admin/security/device-anomalies
  GET /api/super-admin/security/ip-anomalies
  POST /api/super-admin/security/watchlist/[id]/resolve

資料來源：
  user_profiles（risk_score, watchlist 欄位）
  watchlist 表
  device_fingerprints 表
  activity_log（registration 相關）
```

---

## 十一、新建頁面 — files/（檔案管理）

```
files/page.tsx（全新）

所有使用者上傳的檔案集中管理

篩選：
  [全部] [圖片] [影片] [文件]
  [待審核] [已審核] [已標記⚠️]

表格：
  | 預覽 | 檔名 | 類型 | 大小 | 上傳者 | 時間 | AI審核 | 操作 |

預覽：
  圖片直接顯示縮圖
  影片顯示第一幀
  點擊可放大查看原圖/播放

操作：
  刪除 / 封鎖（同時警告上傳者）

AI 審核狀態：
  ✅ 通過 / ⚠️ 待人工審核 / ❌ 已刪除

API：
  GET /api/super-admin/files?type=all&status=all&page=1
  DELETE /api/super-admin/files/[fileId]
  
資料來源：Supabase Storage + file_metadata 表（需新建）
```

---

## 十二、新建頁面 — conversations/（AI 對話記錄）

```
conversations/page.tsx（全新）

所有雪凜（和未來凜空）的 AI 對話記錄

篩選：
  - 使用者搜尋
  - 意圖類型：閒聊/導覽/結果解讀/Z幣/Bug/功能說明
  - LLM 模型：Claude / GPT-mini
  - 日期範圍

表格：
  | 使用者 | 意圖 | 輪數 | 模型 | 成本 | 時間 | 操作 |

點「查看」展開完整對話：
  雪凜：嗨嗨～
  使用者：Z幣怎麼賺
  雪凜：分享問卷就能賺 5 Z幣喔...

用途：
  - 監控使用者是否試圖 jailbreak 雪凜
  - 收集 bad case 改善 AI prompt
  - 客訴時查看對話內容

API：
  GET /api/super-admin/conversations?page=1&intent=all
  GET /api/super-admin/conversations/[conversationId]/messages

資料來源：guide_conversations + guide_messages 表
（已定義在 Yukirin-AI-Guide-Spec）
```

---

## 十三、需要新建的資料表

```sql
-- 活動記錄（即時活動流的核心）
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  action TEXT NOT NULL,
  category TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activity_user ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_category ON activity_log(category, created_at DESC);
CREATE INDEX idx_activity_time ON activity_log(created_at DESC);
ALTER TABLE activity_log REPLICA IDENTITY FULL;

-- 系統警報
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  details TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 內容審核佇列
CREATE TABLE IF NOT EXISTS content_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('story', 'comment', 'message', 'image')),
  content_id TEXT NOT NULL,
  content_preview TEXT,
  author_id UUID REFERENCES auth.users,
  ai_categories JSONB,
  ai_confidence FLOAT,
  ai_action TEXT CHECK (ai_action IN ('pass', 'flag', 'block')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'removed', 'warned', 'banned')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 觀察名單
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  reason TEXT NOT NULL,
  risk_signals JSONB,
  added_by TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID,
  resolved_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 裝置指紋
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  fingerprint TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_device_fp ON device_fingerprints(fingerprint);

-- 檔案元數據
CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  ai_moderation_status TEXT DEFAULT 'pending',
  ai_moderation_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_profiles 擴充欄位
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  risk_score INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  watchlist BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  device_fingerprints TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  known_ips INET[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  nickname TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  banned_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  banned_reason TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  banned_until TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  banned_by UUID;
```

---

## 十四、activity_log 寫入點

```
確保以下所有使用者動作都會寫入 activity_log：

auth.login          — 登入（Supabase Auth hook 或 middleware）
auth.logout         — 登出
auth.register       — 註冊
survey.start        — 開始填問卷
survey.complete     — 完成問卷
survey.share        — 分享問卷結果
story.create        — 發佈故事
story.edit          — 編輯故事
story.delete        — 刪除故事
comment.create      — 發留言
comment.delete      — 刪留言
reaction.add        — 按讚/共鳴
reaction.remove     — 取消讚
zcoin.earn          — 獲得 Z 幣
zcoin.spend         — 花費 Z 幣
zcoin.topup         — 儲值
file.upload         — 上傳檔案
file.delete         — 刪除檔案
profile.update      — 更新個人資料
profile.avatar      — 更換頭像
chat.message        — 跟雪凜對話
report.submit       — 檢舉

每筆記錄包含：user_id, action, category, details(JSON), ip, user_agent, timestamp
```

---

## 十五、執行優先順序

```
第一批（最重要）：
  1. 建立 activity_log 表 + 在所有關鍵動作插入 log
  2. dashboard 升級（警報 + 活動流 + 營收）
  3. users/[userId] 詳情頁（最核心的管理工具）
  4. security/ 安全總覽
  5. moderation/ 內容審核

第二批（營運必需）：
  6. ai-cost/ AI 成本監控
  7. orders/ 金流訂單
  8. live-feed/ 即時活動流
  9. health/ 升級（外部服務 ping）

第三批（完善）：
  10. files/ 檔案管理
  11. conversations/ AI 對話記錄
  12. social/ 拆分
  13. audit/ 補強
```
