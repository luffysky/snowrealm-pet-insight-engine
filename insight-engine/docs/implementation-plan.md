# 完整功能實作計畫

## 優先順序總覽

```
P0（緊急安全性修復）
  ↓
P1（RBAC 後端權限驗證）
  ↓
P2（訂閱系統 + 藍新金流）
  ↓
P3（AI 洞察報告儲存）
  ↓
P4（總後台強化）
  ↓
P5（新題型 + 檔案上傳）
  ↓
P6（問卷連結格式）
  ↓
P7（額外功能建議）
```

---

## P0：緊急安全性修復（立即執行）

### 0.1 修復總後台客服 API 認證漏洞

`src/app/api/super-admin/support/route.ts` **完全沒有認證檢查** — 任何人都能讀寫全平台客服工單。

- 加入 JWT 驗證 + `super_admin` 角色檢查（與 `stats/route.ts` 相同模式）

### 0.2 在 middleware 統一攔截 `/api/super-admin/*`

目前 `middleware.ts` 的 matcher 沒有涵蓋 `/api/super-admin` 路由，完全依賴各 handler 自行驗證（容易遺漏）。

- 在 middleware 攔截所有 `/api/super-admin/*` 請求
- 驗證 JWT + `super_admin` 角色
- 不合格一律回 403

### 0.3 總後台操作審計紀錄

建立 `audit_logs` 資料表，記錄所有總後台操作（登入、租戶變更、方案修改、客服操作）：

- 資料表：`audit_logs (id, actor_id, action, target_type, target_id, details JSONB, ip, created_at)`
- 在所有 super-admin API 的 POST/PATCH/DELETE 寫入紀錄
- 新增總後台頁面：`/snowrealm-insight-ctrl/audit` 顯示完整操作軌跡

### 0.4 總後台 API 限流

為 `/api/super-admin/*` 加入記憶體內限流（基於 `x-forwarded-for`），防止暴力攻擊。

---

## P1：RBAC 後端權限驗證

審查並為所有 `/api/admin/*` 路由加上角色檢查。目前大多數路由只驗「有登入」，不驗 `admin` vs `editor` vs `viewer`。

`src/lib/tenant.ts` 已經有 `hasMinRole()` 函式但**專案內從未被任何 API 呼叫**。

- 為每支 API 加上 `requireMinRole('admin')` / `requireMinRole('editor')` 守衛
- **Viewer（檢視者）**：僅讀取（GET 填答、統計、標籤），封鎖所有寫入
- **Editor（編輯者）**：可建立/編輯問卷、題目，封鎖系統設定、團隊管理
- **Admin（管理員）**：完整存取

影響範圍：`src/app/api/admin/` 下約 25 個檔案。

---

## P2：訂閱系統 + 藍新金流整合

### 方案定價建議

根據台灣 SaaS 問卷平台市場分析：

| | Free 免費版 | Pro 專業版 | Business 商業版 |
|---|---|---|---|
| 價格 | NT$0 | NT$490/月 | NT$1,290/月 |
| 每月回覆數 | 1,000 | 10,000 | 50,000 |
| 問卷數量 | 3 份 | 無限 | 無限 |
| 管理員人數 | 1 位 | 5 位 | 無限 |
| AI 額度 | 每類 3 次 | 每日 50 次 | 無限 |
| LINE 整合 | 基礎 | 完整 | 完整 |
| A/B 測試 | 否 | 是 | 是 |
| Webhook | 1 個 | 10 個 | 無限 |
| 自訂網域 | 否 | 否 | 是 |
| 技術支援 | Email | Email + LINE | 專屬支援 |
| 年繳優惠 | - | NT$4,900/年（省 17%） | NT$12,900/年（省 17%） |

### 2.1 資料庫設計

```sql
-- 訂閱記錄
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(slug),
  plan TEXT NOT NULL DEFAULT 'free',           -- free, pro, business, enterprise
  status TEXT NOT NULL DEFAULT 'active',       -- active, past_due, cancelled, trialing
  period TEXT DEFAULT 'monthly',               -- monthly, yearly
  current_period_start TIMESTAMPTZ,            -- 目前計費週期開始
  current_period_end TIMESTAMPTZ,              -- 目前計費週期結束
  newebpay_trade_no TEXT,                      -- 藍新交易編號
  amount INT DEFAULT 0,                        -- 金額（新台幣）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 付款紀錄
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),
  trade_no TEXT,                               -- 藍新交易編號
  amount INT NOT NULL,
  status TEXT NOT NULL,                        -- success, failed, pending
  provider TEXT DEFAULT 'newebpay',
  raw_response JSONB,                          -- 藍新原始回傳
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 方案額度定義

新檔案：`src/lib/planLimits.ts`

```typescript
export const PLAN_LIMITS = {
  free:       { responses: 1000,  surveys: 3,  admins: 1,  aiDaily: 3,  webhooks: 1 },
  pro:        { responses: 10000, surveys: -1, admins: 5,  aiDaily: 50, webhooks: 10 },
  business:   { responses: 50000, surveys: -1, admins: -1, aiDaily: -1, webhooks: -1 },
  enterprise: { responses: -1,    surveys: -1, admins: -1, aiDaily: -1, webhooks: -1 },
}
// -1 代表無限
```

### 2.3 方案額度強制執行

在關鍵 API 路由加入方案限制檢查：

- `src/app/api/surveys/submit/route.ts` — 檢查每月回覆數 vs 方案上限
- 問卷建立 — 檢查問卷數 vs 方案上限
- 團隊邀請 — 檢查管理員人數 vs 方案上限
- AI 生成 — 檢查每日 AI 用量 vs 方案上限

### 2.4 藍新金流串接

需要的環境變數：

```
NEWEBPAY_MERCHANT_ID=商店代號
NEWEBPAY_HASH_KEY=HashKey
NEWEBPAY_HASH_IV=HashIV
NEWEBPAY_MODE=production
```

新增檔案：

- `src/lib/newebpay.ts` — AES 加密、交易資訊產生、回傳驗證
- `src/app/api/payment/create/route.ts` — 建立付款請求
- `src/app/api/payment/notify/route.ts` — 藍新 server-to-server 回呼
- `src/app/api/payment/return/route.ts` — 使用者付款後導回

付款流程：

```
使用者 → 點擊「升級為 Pro」
  ↓
管理後台 → POST /api/payment/create
  ↓
付款 API → 建立 pending 付款紀錄 → 導向藍新結帳頁面
  ↓
藍新金流 → 顯示付款表單 → 使用者輸入信用卡
  ↓
藍新金流 → POST /api/payment/notify（伺服器回呼）
  ↓
付款 API → 更新訂閱 + 付款紀錄
  ↓
藍新金流 → 導回 /api/payment/return
  ↓
管理後台 → 顯示成功 + 更新後的方案
```

### 2.5 訂閱管理頁面

新增管理後台頁面：`/insight-admin/{slug}/subscription`（加入系統導覽群組）

顯示內容：

- 目前方案名稱 + 標籤
- 用量儀表板（回覆已用/上限、問卷已用/上限、管理員已用/上限、AI 已用/每日上限）
- 方案比較表
- 「升級」/「降級」按鈕
- 付款歷史紀錄表
- 取消訂閱（含確認流程）

---

## P3：AI 洞察報告儲存

### 3.1 資料庫

```sql
CREATE TABLE IF NOT EXISTS ai_insight_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  survey_id UUID NOT NULL REFERENCES surveys(id),
  report JSONB NOT NULL,       -- 完整的 InsightReport 物件
  meta JSONB,                  -- 供應商、模型、token 數等
  generated_by TEXT,           -- 產生報告的管理員 user ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_insight_reports_survey ON ai_insight_reports (survey_id, created_at DESC);
```

### 3.2 API 修改

修改 `src/app/api/admin/ai-insight/route.ts`：

- POST：產生報告後自動儲存到 `ai_insight_reports`
- GET：新增處理器，列出某問卷的已儲存報告

### 3.3 前端修改

修改 `src/app/(admin)/insight-admin/insight/page.tsx`：

- 新增「歷史報告」側欄/分頁，顯示歷史報告及時間戳記
- 點擊歷史報告可查看內容
- 報告可以是「即時產生」或「從歷史載入」
- 新增刪除舊報告按鈕

---

## P4：總後台強化

### 4.1 更多資料蒐集與檢視

**強化使用者頁面**（`snowrealm-insight-ctrl/users`）：

- 移除 200 筆上限，加入真正分頁
- 顯示：最後登入時間、登入次數、帳號狀態（啟用/已刪除）、刪除日期
- 操作：停用/啟用帳號、重設密碼、以該使用者身份登入（impersonate）
- 匯出所有使用者 CSV

**強化租戶頁面**（`snowrealm-insight-ctrl/tenants`）：

- 顯示：訂閱狀態、方案、營收、儲存用量、API 呼叫次數
- 顯示：成員 email 和手機號碼（用於身份驗證）
- 操作：手動更改方案、延長試用、停用租戶、匯出租戶資料
- 新增「營收儀表板」區塊（MRR/ARR）

**新增：回覆瀏覽器**（`snowrealm-insight-ctrl/responses`）：

- 跨租戶回覆瀏覽與搜尋
- 檢視單筆回覆詳情（答案、中繼資料、標籤）
- 依租戶、問卷、日期範圍、標籤篩選
- 匯出功能

**新增：系統健康狀態**（`snowrealm-insight-ctrl/health`）：

- 資料庫大小、各資料表行數
- API 回應時間（從日誌擷取）
- 錯誤率追蹤
- Cron Job 執行狀態
- 環境變數檢查（哪些已設定/缺少）

**新增：分析儀表板**（`snowrealm-insight-ctrl/analytics`）：

- 每日/每週/每月活躍租戶數
- 回覆量趨勢
- AI 使用量與成本追蹤
- 使用者成長漏斗（註冊 → 建立問卷 → 收到回覆）
- 營收趨勢（金流上線後）

### 4.2 總後台安全性強化

- **Session 時效**：super-admin JWT 到期時間從 24 小時縮短為 4 小時
- **敏感操作二次驗證**：方案變更、使用者刪除等需重新 LINE 認證
- **IP 記錄**：每次 super-admin 操作都記錄 IP 到 audit_logs
- **當前 Session 顯示**：在 layout 頂部顯示目前 super-admin 的 session 資訊（IP、最後活動時間）

---

## P5：新題型 + 檔案上傳（原始 TODO #1 和 #7）

- 新增題型：`rating`（1-5 星評分）、`scale`（1-10 滑桿）、`date`（日期選擇）、`file_upload`（檔案上傳）
- 擴展 `src/types/survey.ts` 的 `QuestionType`
- 在 `src/components/survey/` 建立對應渲染元件
- 檔案上傳題型存到 R2

---

## P6：問卷連結格式（原始 TODO）

將問卷公開 URL 從目前格式改為 `/{org-slug}/{survey-slug}`：

- `src/app/[org]/[slug]/page.tsx` 已部分完成
- 驗證 middleware 路由是否正確
- 更新所有內部連結產生器

---

## P7：額外功能建議

未來可考慮的功能：

- **Email 通知系統**：透過 Resend 發送問卷完成通知、每週報表（不只 LINE）
- **資料匯出中心**：集中匯出頁面，支援 CSV/Excel/PDF（問卷、回覆、分析報告）
- **多語言問卷**：支援中文/英文/日文問卷內容
- **問卷排程**：在指定日期自動開啟/關閉問卷
- **回覆去重**：偵測並標記重複回覆（依 IP、LINE ID、瀏覽器指紋）
- **嵌入式小工具**：JavaScript 程式碼片段，可嵌入外部網站
- **公開 API + API Key 管理**：讓 Pro/Business 使用者透過 REST API 存取資料
- **Webhook 重試佇列**：失敗的 webhook 自動以指數退避重試
- **深色/淺色模式切換**：目前管理後台僅有深色模式

---

## 需要提供的藍新金流資訊

請提供以下數值（可在藍新商店後台的「API 串接設定」找到）：

```
NEWEBPAY_MERCHANT_ID=商店代號
NEWEBPAY_HASH_KEY=HashKey
NEWEBPAY_HASH_IV=HashIV
```

---

## 目前已完成的功能（供參考）

### 核心功能（已上線）
- 問卷系統基本盤（建立、編輯、填答、統計）
- 多租戶架構（總後台/子後台）
- 超級管理員與一般管理員
- LINE Insight 整合與登入綁定
- AI 生成問卷
- UTM 與基本漏斗報表
- 交叉分析
- 標籤系統與標籤規則
- A/B 比較
- 問卷主題系統（9 種風格）
- LINE 大量推播（分眾、排程、分批）
- AI 洞察報告
- R2 圖片上傳（後台用）
- 客服系統（工單管理、模板回覆）
- 帳號設定（個人資料、改密碼、30天軟刪除）
- 通知規則 + 偏好設定
- Rich Menu 模板建立
- Google / LINE OAuth 登入
- 手機簡訊驗證（AWS SNS）
- Email 寄送（Resend）
- Webhook 整合
- 封測名單管理
