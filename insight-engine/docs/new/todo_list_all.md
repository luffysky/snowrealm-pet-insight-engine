# SnowRealm Insight Engine — 全任務清單（Phase 重排版）

> 最後更新：2026-03-31
> ~~刪除線~~ = 已完成 ✅
> 每項任務包含：新增檔案 + DB Migration + 修改檔案

---

## ✅ 已完成（歸檔）

| 類別 | 項目 |
|------|------|
| Bug | BUG-3 OG、BUG-F1 限動倒數、BUG-F2 私訊懸浮視窗 |
| 接線 | WIRE-1~6（故事報告/洞察歷史/故事牆/StoryCard/Rich Menu/分享連結） |
| 功能 | FEAT-1~4（Dashboard 指標/AI 建立問卷/PDF 匯出/故事牆CTA）、FEAT-9 情感分析 |
| 緊急 | URG-2 服務狀態、URG-5 LINE Token 視覺化 |
| 補完 | `api-keys/page.tsx`、`orders/export/route.ts` |
| 安全 | requireRole 補完、藍新簽章驗證、Super Admin 路由攔截 |
| Phase 1~3 | Story Card / Story Insight / Story Wall / Rule Engine / AI 洞察報告 |

---

## Phase 0 — 緊急 Bug 🔴

---

### BUG-F4 限時動態文字功能重做

**目標**：像 IG 在畫布上打字，點擊可編輯，拖曳改位置

**安裝**
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
```

**新增檔案**
```
components/stories/TextEditor.tsx       — TipTap 嵌入編輯器（點擊啟動）
components/stories/DraggableText.tsx    — 拖曳定位包裝元件
hooks/useDragPosition.ts               — 拖曳位置 state 管理
```

**修改檔案**
```
components/stories/StoryCanvas.tsx     — 整合 DraggableText
```

**DB** — 無

---

### URG-6 Sidebar 連結缺 tenant slug 導致 404 🔴

**問題根因**：`layout.tsx` 的導覽連結路徑不帶 tenantSlug，middleware rewrite 可能找不到頁面。

**修改檔案**
```
src/app/(admin)/layout.tsx
  - 確認所有 path 使用相對路徑（middleware rewrite 補前綴）
  - 或改為 /${tenantSlug}${path} 的絕對路徑
src/middleware.ts
  - 無 slug 時從 x-tenant-id header 自動 redirect 到正確路徑
```

**DB** — 無

---

## Phase 1 — 平台穩固 🟠

---

### 客服系統接線（supportEngine.ts 已建）

**DB Migration**
```sql
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  channel TEXT NOT NULL DEFAULT 'line',        -- 'line' | 'web'
  line_user_id TEXT,
  line_display_name TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'open',         -- 'open' | 'in_progress' | 'resolved' | 'closed'
  priority TEXT NOT NULL DEFAULT 'normal',     -- 'low' | 'normal' | 'high' | 'urgent'
  category TEXT,                               -- 'bug' | 'feature' | 'question' | 'complaint' | 'other'
  subject TEXT,
  assigned_to UUID REFERENCES admin_users(id),
  survey_id UUID REFERENCES surveys(id),
  response_id UUID REFERENCES responses(id),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,                   -- 'customer' | 'admin' | 'system' | 'ai'
  sender_id TEXT,
  sender_name TEXT,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_tenant_status ON support_tickets (tenant_id, status);
CREATE INDEX idx_tickets_line_user ON support_tickets (line_user_id);
CREATE INDEX idx_messages_ticket ON support_messages (ticket_id, created_at);

CREATE TABLE IF NOT EXISTS support_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  usage_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**新增檔案**
```
src/app/api/admin/support/route.ts
  - GET  — 列表（?status=&priority=&page=&pageSize=）
  - POST — 手動建立工單

src/app/api/admin/support/[ticketId]/route.ts
  - GET   — 單一工單 + 所有訊息
  - PATCH — 更新 status / priority / category / assigned_to

src/app/api/admin/support/[ticketId]/reply/route.ts
  - POST — 管理員回覆（存訊息 + LINE Push + 更新 first_response_at）

src/app/api/admin/support/[ticketId]/ai-suggest/route.ts
  - POST — AI 建議回覆草稿（呼叫 aiService）

src/app/api/admin/support/templates/route.ts
  - GET  — 列出快速回覆模板
  - POST — 新增模板
  - DELETE — 刪除模板

src/app/(admin)/insight-admin/support/page.tsx
  - 左側工單列表（篩選/搜尋/未讀數）
  - 右側對話詳情（訊息歷史 + 回覆框）
  - 快速回覆模板選擇
  - AI 草稿按鈕
  - 工單狀態/優先級/分類操作
```

**修改檔案**
```
src/app/(admin)/layout.tsx              — KNOWN_ADMIN_PAGES 加 'support'，Sidebar 加客服中心
src/middleware.ts                       — KNOWN_ADMIN_PAGES 加 'support'
src/app/api/line/webhook/official/route.ts
  — handleTextMessage() 加客服關鍵字觸發（「客服」「問題」「幫忙」「help」）
  — 有開放工單時追加訊息到工單
src/lib/supportEngine.ts               — 確認 startSupportTicket / appendSupportMessage / getOpenTicketByLineUser 已實作
```

---

### FEAT-7a 平台公告通知系統（Super Admin）

**DB Migration**
```sql
CREATE TABLE IF NOT EXISTS platform_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',            -- 'text' | 'markdown'
  category TEXT NOT NULL DEFAULT 'announcement', -- 'announcement' | 'maintenance' | 'feature' | 'promotion' | 'urgent'
  target TEXT NOT NULL DEFAULT 'all',          -- 'all' | 'pro' | 'free' | 'specific'
  target_tenant_ids TEXT[],
  channels TEXT[] DEFAULT '{line,dashboard}',  -- 'line' | 'dashboard' | 'email'
  status TEXT DEFAULT 'draft',                 -- 'draft' | 'scheduled' | 'sent' | 'cancelled'
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES platform_notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES admin_users(id),
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (notification_id, user_id)
);

CREATE INDEX idx_platform_notif_status ON platform_notifications (status, scheduled_at);
```

**新增檔案**
```
src/app/api/super-admin/notifications/route.ts
  - GET  — 列表（?status=draft|scheduled|sent）
  - POST — 建立通知（草稿）

src/app/api/super-admin/notifications/[id]/route.ts
  - GET    — 單一通知詳情 + 送達/已讀統計
  - PATCH  — 編輯（draft 狀態才能改）
  - DELETE — 刪除

src/app/api/super-admin/notifications/[id]/send/route.ts
  - POST — 立即發送
    1. 根據 target 查目標租戶管理員
    2. channels 含 'line' → 批量 LINE Push
    3. channels 含 'dashboard' → 寫 notification_reads（未讀）
    4. 更新 sent_count + sent_at + status='sent'

src/app/(super-admin)/snowrealm-insight-ctrl/notifications/page.tsx
  - 列表（草稿/排程/已發送 Tab）
  - 建立/編輯 Modal（標題/內容/類型/目標/管道/排程）
  - 立即發送 / 排程發送按鈕
  - 已發送：顯示送達/已讀統計
```

**修改檔案**
```
src/app/(super-admin)/snowrealm-insight-ctrl/layout.tsx
  — NAV_ITEMS 加 { href: '/notifications', label: '平台通知', icon: '📢' }
```

---

### FEAT-7b 總後台 Rich Menu 管理

**新增檔案**
```
src/app/(super-admin)/snowrealm-insight-ctrl/rich-menu/page.tsx
  - 管理 Official Bot + Insight Bot 的全域預設 Rich Menu
  - 設定「新好友預設」和「填完問卷後」Rich Menu
  - 複用現有 rich-menu 元件邏輯
```

**修改檔案**
```
src/app/api/admin/rich-menu/route.ts
  — 加 ?scope=global 參數，使用 ENV Channel Token 而非租戶 Token
src/app/(super-admin)/snowrealm-insight-ctrl/layout.tsx
  — NAV_ITEMS 加 { href: '/rich-menu', label: 'Rich Menu', icon: '📱' }
```

**DB** — 無（沿用 line_configs）

---

### FEAT-7c 總後台通知樣式管理

**DB Migration**
```sql
CREATE TABLE IF NOT EXISTS platform_notification_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  header_color TEXT DEFAULT '#1DB446',
  header_text TEXT,
  body_template TEXT NOT NULL,                 -- 支援 {{variable}} 佔位符
  footer_text TEXT,
  button_label TEXT,
  button_url TEXT,
  thumbnail_url TEXT,
  text_template TEXT NOT NULL,
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed 11 種事件類型
INSERT INTO platform_notification_styles (event_type, display_name, body_template, text_template) VALUES
  ('new_signup', '新用戶註冊', '{{name}} 剛加入了 {{org}}！', '新用戶 {{name}} 加入'),
  ('survey_complete', '問卷填答完成', '{{name}} 完成了「{{surveyTitle}}」', '填答完成：{{surveyTitle}}'),
  ('ai_report_ready', 'AI 報告生成完成', '你的 AI 洞察報告已生成！', 'AI 報告已生成'),
  ('weekly_report', '每週報告', '本週共 {{count}} 筆回覆，完成率 {{rate}}%', '週報：{{count}} 筆'),
  ('payment_success', '付款成功', '{{amount}} 元付款成功，Z幣 {{zcoin}} 已入帳', '付款成功 {{amount}} 元'),
  ('trial_expiring', '試用即將到期', '你的試用還有 {{days}} 天', '試用剩 {{days}} 天'),
  ('trial_expired', '試用已到期', '你的試用已結束，升級繼續使用所有功能', '試用已結束'),
  ('response_milestone', '回覆數里程碑', '恭喜！你的問卷已累積 {{count}} 筆回覆 🎉', '里程碑：{{count}} 筆'),
  ('support_new_ticket', '新客服工單', '{{name}} 提交了一個新工單：{{subject}}', '新工單：{{subject}}'),
  ('system_alert', '系統異常警報', '系統偵測到異常：{{message}}', '系統警報：{{message}}'),
  ('login_notify', '管理員登入通知', '{{name}} 於 {{time}} 登入了後台', '{{name}} 已登入')
ON CONFLICT (event_type) DO NOTHING;
```

**新增檔案**
```
src/app/api/super-admin/notification-styles/route.ts
  - GET   — 列出所有事件樣式
  - PATCH — 更新特定事件樣式

src/app/(super-admin)/snowrealm-insight-ctrl/notification-styles/page.tsx
  - 每種事件類型的樣式設定卡片
  - 即時預覽 Flex Message 效果
  - 支援 {{variable}} 佔位符說明
```

**修改檔案**
```
src/lib/lineNotify.ts
  — 系統通知改從 platform_notification_styles 讀模板 → 填入變數 → 發送
src/app/(super-admin)/snowrealm-insight-ctrl/layout.tsx
  — NAV_ITEMS 加 { href: '/notification-styles', label: '通知樣式', icon: '🎨' }
```

---

### ADMIN-1 RBAC 五角色系統

**DB Migration**
```sql
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('super_admin', 'admin', 'moderator', 'analyst', 'support'));
```

**修改檔案**
```
src/lib/tenant.ts（或 auth.ts）
  requireRole() — 支援陣列參數：requireRole(['admin', 'moderator'])
  
  修改邏輯：
  export async function requireRole(role: string | string[]) {
    const ctx = await getTenantContext()
    const allowed = Array.isArray(role) ? role : [role]
    if (!allowed.includes(ctx.role) && ctx.role !== 'super_admin') {
      return NextResponse.json({ error: '權限不足' }, { status: 403 })
    }
    return ctx
  }
```

---

### ADMIN-2 超級後台總覽儀表板強化

**新增檔案**
```
src/app/api/super-admin/dashboard/route.ts
  - GET — 全平台統計
    - 總用戶數、DAU（今日活躍）、MAU、今日新增
    - 總問卷數、總回覆數、今日回覆數
    - Z幣：今日發放 / 消耗（從 zcoin_transactions 計算）
    - AI 成本：今日 / 本月（從 ai_usage_logs 估算）
    - 系統：DB 回應時間（SELECT 1 計時）
```

**修改檔案**
```
src/app/(super-admin)/snowrealm-insight-ctrl/page.tsx
  — 新增全平台統計區塊（總用戶/DAU/MAU/問卷/AI成本/Z幣流通）
  — 使用 Recharts 折線圖顯示 7 日趨勢
```

**DB** — 無（查既有表）

---

### ADMIN-3 使用者管理頁面

**DB** — 無（查既有 admin_users + tenant_users）

**新增檔案**
```
src/app/api/super-admin/users/route.ts
  - GET   — 搜尋/篩選用戶列表（?search=&role=&status=&page=）
  - PATCH — 更新用戶資料（role / status）

src/app/api/super-admin/users/[id]/ban/route.ts
  - POST — 封禁用戶（is_active = false + 記 audit_log）
  - DELETE — 解封

src/app/api/super-admin/users/[id]/adjust-zcoin/route.ts
  - POST — 手動調整 Z 幣（body: { amount, reason }）
  - 寫入 zcoin_transactions + audit_log

src/app/(super-admin)/snowrealm-insight-ctrl/users/page.tsx
  - 搜尋框 + 篩選（角色/狀態/入會日）
  - 用戶列表（頭像/名稱/email/租戶/角色/狀態/最後登入）
  - 詳情 Modal：查看歷史 / 封禁 / 重置密碼 / 調整Z幣
```

**修改檔案**
```
src/app/(super-admin)/snowrealm-insight-ctrl/layout.tsx
  — NAV_ITEMS 加 { href: '/users', label: '用戶管理', icon: '👥' }
```

---

### ADMIN-7 AI 成本監控面板

**DB** — 使用既有 `ai_usage_logs`（估算成本）

**新增檔案**
```
src/app/api/super-admin/ai-cost/route.ts
  - GET — 成本統計
    - 本月累計（從 ai_usage_logs 估算 token cost）
    - 日成本趨勢（過去 30 天）
    - 各 provider/model 佔比
    - 各 action 佔比
    - Top 10 最耗 token 的操作

src/app/(super-admin)/snowrealm-insight-ctrl/ai-cost/page.tsx
  - 預算進度條（本月成本 / AI_MONTHLY_BUDGET）
  - Recharts 折線圖（日成本）
  - 圓餅圖（模型佔比 / action 佔比）
  - 告警設定（50%/80%/90%/100% 通知閾值）
```

**修改檔案**
```
src/app/(super-admin)/snowrealm-insight-ctrl/layout.tsx
  — NAV_ITEMS 加 { href: '/ai-cost', label: 'AI 成本', icon: '💰' }
```

---

### FEAT-6 問卷模板系統

**DB Migration**
```sql
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'platform',     -- 'platform' | 'tenant' | 'marketplace'
  tenant_id TEXT,
  created_by UUID REFERENCES admin_users(id),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,                               -- 'pet' | 'restaurant' | 'ecommerce' | 'saas' | 'education' | 'hr' | 'general'
  icon TEXT DEFAULT '📋',
  tags TEXT[] DEFAULT '{}',
  survey_config JSONB NOT NULL,               -- { title, subtitle, coverTitle, theme, ... }
  questions JSONB NOT NULL,                   -- Question[] 完整題目
  branch_config JSONB,
  use_count INT DEFAULT 0,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_survey_templates_industry ON survey_templates (industry) WHERE is_active = true;
CREATE INDEX idx_survey_templates_public ON survey_templates (is_public, use_count DESC) WHERE is_active = true;
```

**新增檔案**
```
src/lib/surveyTemplates.ts
  — 平台預設模板定義（行業分類 + 完整題目）
  — TEMPLATE_INDUSTRIES 常數
  — 寵物/餐飲/電商/SaaS/教育/人資/通用 各 1~2 套

src/scripts/seed-templates.ts
  — 把 surveyTemplates.ts 裡的預設模板寫入 DB

src/app/api/admin/survey-templates/route.ts
  - GET  — 列表（?source=platform|tenant|marketplace&industry=&search=&page=）
  - POST — 建立模板（從現有問卷複製 or 手動）

src/app/api/admin/survey-templates/[id]/route.ts
  - GET    — 單一模板完整內容
  - PATCH  — 更新名稱/說明/is_public
  - DELETE — 刪除（軟刪除 is_active=false）

src/app/api/admin/survey-templates/[id]/use/route.ts
  - POST — 一鍵從模板建立問卷
    1. 讀模板 survey_config + questions + branch_config
    2. createSurvey → 批量 createQuestion → 設 branch_config
    3. use_count++
    4. 回傳新問卷 id + slug

src/app/api/admin/survey-templates/[id]/publish/route.ts
  - POST — 公開到市集（is_public = true）

src/app/(admin)/insight-admin/survey-templates/page.tsx
  - Tab：[🏢 平台模板] [🏠 我的模板] [🌐 模板市集]
  - 行業篩選列 + 搜尋框
  - 模板卡片網格（圖示/名稱/說明/使用次數/[預覽][使用]）
  - 使用 Modal：自訂標題/slug → 一鍵建立
  - 預覽 Modal：完整題目 + 分流邏輯
```

**修改檔案**
```
src/app/(admin)/insight-admin/surveys/page.tsx
  — 加「📋 從模板建立」按鈕 → 跳轉 survey-templates
  — 加「💾 存為模板」按鈕 → Modal 填名稱/說明/行業 → POST survey-templates

src/app/(admin)/layout.tsx
  — KNOWN_ADMIN_PAGES 加 'survey-templates'
  — Sidebar 加 { path: '/survey-templates', label: '📋 問卷模板' }

src/middleware.ts
  — KNOWN_ADMIN_PAGES 加 'survey-templates'
```

---

### FEAT-8 AI 主動推送

**DB** — 無（查既有 ai_usage_logs / responses）

**新增檔案**
```
src/app/api/cron/ai-alerts/route.ts
  - GET — 每日檢查異常指標（Zeabur cron 呼叫）
    - NPS 下降超過 10 分 → LINE Push 預警
    - 某題棄卷率 > 40% → LINE Push 預警
    - 開放題負面關鍵字增加 20% → LINE Push 預警
    - 呼叫 lineNotify.pushToAdmin() 送出警報
```

**修改檔案**
```
src/app/api/cron/weekly-report/route.ts
  — 現有週報新增 AI 摘要段落（用 GPT-4o-mini 總結本週數據）
  — 格式：「📊 本週洞察 • 新增 X 筆 • AI 發現：... • 建議：...」
```

---

### FEAT-5 貼圖個別圖片上傳

**修改檔案**
```
src/app/api/admin/rich-menu/[packId]/stickers/route.ts
  — Content-Type 改為 application/octet-stream 單張上傳模式
  — 支援逐張上傳（原為批量 multipart）
```

**DB** — 無

---

### 租戶品牌解耦（tenantBranding）

**DB Migration**
```sql
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_welcome_message TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_intro_text TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_default_reply TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_completion_message TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_survey_prompt TEXT;
```

**新增檔案**（若 tenantBranding.ts 還未建）
```
src/lib/tenantBranding.ts
  - getTenantBranding(tenantId): 從 site_settings 讀文案，無則回傳預設值
  - 回傳：{ siteName, siteDesc, welcomeMsg, introText, defaultReply, completionMsg, surveyPrompt }
```

**修改檔案**
```
src/app/api/line/webhook/official/route.ts
  — 所有毛行天下硬編碼文案 → getTenantBranding() 動態取得

src/lib/lineBotEngine.ts
  — 完成文案改從 tenantBranding 讀取

src/app/(admin)/insight-admin/site-settings/page.tsx
  — 新增「Bot 文案設定」區塊
    Bot 歡迎語 / Bot 介紹文 / Bot 預設回覆 / 填答完成文案 / 問卷邀請文案
```

---

## Phase 2 — AI 統一架構 🟡

---

### AI-UNIFIED-1 統一入口重構

**新增檔案**
```
src/lib/llm/types.ts
  — AITaskType（17 種） / AIRequest / AIResponse / QuotaConfig 型別定義

src/lib/llm/router.ts
  — 意圖分類器（第一層 regex + 第二層 GPT-4o-mini）
  — routeToModel(taskType): 'gpt-4o-mini' | 'claude-sonnet-4-6'

src/lib/llm/limits.ts
  — 各 taskType 的 maxInputTokens / maxOutputTokens

src/lib/llm/quotaManager.ts
  — checkQuota(userId, taskType): boolean
  — consumeQuota(userId, taskType): void
  — QuotaConfig（free/premium/admin 各 taskType 上限）
```

**修改檔案**
```
src/lib/aiService.ts
  — 新增 callAI(request: AIRequest): Promise<AIResponse>
    1. quotaManager.checkQuota()
    2. router.routeToModel()
    3. 套 YUKIRIN_PERSONA_PREFIX（若 applyYukirinPersona=true）
    4. 呼叫 OpenAI 或 Anthropic
    5. 解析 { text, mood, action } JSON（雪凜模式）
    6. logAiUsage() + ai_cost_log 寫入
  — 保留現有 getActiveAiKey / getPlatformKey 不動
```

**DB Migration**
```sql
-- COST-6 成本記錄表（在此一起建）
CREATE TABLE IF NOT EXISTS ai_cost_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  task_type TEXT,
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  tts_characters INT DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  user_id TEXT,
  tenant_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_cost_log_date ON ai_cost_log (DATE_TRUNC('month', created_at));

CREATE OR REPLACE VIEW monthly_ai_cost AS
  SELECT
    DATE_TRUNC('month', created_at) AS month,
    provider,
    model,
    SUM(cost_usd) AS total_cost,
    SUM(input_tokens) AS total_input_tokens,
    SUM(output_tokens) AS total_output_tokens
  FROM ai_cost_log
  GROUP BY 1, 2, 3;
```

---

### AI-UNIFIED-2 17 任務路由表

**修改檔案**
```
src/lib/llm/router.ts
  — TASK_ROUTE_MAP: Record<AITaskType, { model, applyPersona, quota }>

  雪凜出面（Claude Sonnet + 套語氣）：
    guide_chat / result_explain / story_insight / data_insight / chat_survey_create

  幕後工具（GPT-4o-mini + 不套語氣）：
    survey_generate / meta_generate / sentiment_analysis / blog_seo /
    weekly_report / auto_insight / content_moderation / user_profile_extract /
    intent_classify / bug_report / api_key_validate

  幕後工具（Claude Sonnet + 不套語氣）：
    cognitive_gap
```

---

### AI-UNIFIED-3 雪凜語氣系統

**新增檔案**
```
src/lib/yukirin/persona.ts
  — YUKIRIN_PERSONA_PREFIX: string（完整人設 System Prompt）
  — parseYukirinResponse(raw: string): { text: string; mood: string; action: unknown }
```

---

### AI-UNIFIED-4 額度系統更新

**DB Migration**（若 quota 存 DB）
```sql
-- 輕量方案：直接從 ai_usage_logs 計算（不另建表）
-- 或新增：
CREATE TABLE IF NOT EXISTS user_quota_usage (
  user_id TEXT NOT NULL,
  quota_type TEXT NOT NULL,               -- 'chat' | 'analysis'
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INT DEFAULT 0,
  PRIMARY KEY (user_id, quota_type, usage_date)
);
```

**修改檔案**
```
src/lib/llm/quotaManager.ts（新增）
  — 每日 chat / analysis 次數限制
  — free: chat 5/day, analysis 3/day
  — premium: chat 100/day, analysis 20/day
  — admin: unlimited
```

---

### COST-1~5 LLM 路由 + Prompt Caching + Token 上限 + 使用者日上限 + 月預算

**新增檔案**
```
src/lib/llm/budgetGuard.ts
  — checkMonthlyBudget(): 'normal' | 'degraded' | 'limited'
    - < 90%  → normal（正常運作）
    - 90~100% → degraded（全走 GPT-4o-mini）
    - ≥ 100% → limited（每人每天 5 輪）
```

**修改檔案**
```
src/lib/aiService.ts（callAI 中間加入）
  — Anthropic 呼叫：system prompt 加 cache_control: { type: 'ephemeral' }
  — 呼叫前：budgetGuard.checkMonthlyBudget() → 可能 override model
  — maxTokens 從 limits.ts 讀取（依 taskType）
```

---

### COST-7 後台成本監控面板

（同 ADMIN-7，已列於 Phase 1 的 Super Admin 節）

---

### COST-8 TTS 成本控制

**安裝**
```bash
npm install howler
```

**新增檔案**
```
src/lib/audio/ttsCache.ts
  — 預錄 7 個常用句（/voice/greeting.mp3 等）快取清單
  — shouldUseTTS(text): boolean（短句 < 5 字不觸發）
  — batchMergeShortTexts(texts: string[]): string（合併短句）
```

**修改檔案**
```
src/app/api/tts/route.ts（若存在）
  — 短句攔截：< 5 字 → 回傳預錄音檔 URL
  — 預設關閉（需前端傳 tts_enabled=true）
```

---

### YUKIRIN-1~13 雪凜 AI 嚮導系統

**DB Migration**
```sql
-- 使用者畫像表
CREATE TABLE IF NOT EXISTS guide_user_profiles (
  user_key TEXT PRIMARY KEY,                   -- userId 或 fingerprint
  nickname TEXT,
  chosen_character TEXT DEFAULT 'yukirin',
  preferences JSONB DEFAULT '{}',
  interests JSONB DEFAULT '[]',                -- [{ topic, strength }]
  pets JSONB DEFAULT '[]',                     -- [{ name, species, breed }]
  personality_tags TEXT[] DEFAULT '{}',
  personality_type TEXT,
  last_mood TEXT DEFAULT 'neutral',
  visit_count INT DEFAULT 0,
  disable_partner_peek BOOLEAN DEFAULT false,
  survey_history_summary TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 確認 guide_chat_messages 表存在（Phase 54 已建）
-- 若無：
CREATE TABLE IF NOT EXISTS guide_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_key TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  mood TEXT,
  action JSONB,
  task_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_guide_messages_user ON guide_chat_messages (user_key, created_at DESC);
```

**新增檔案**
```
src/lib/yukirin/contextEngine.ts
  — detectCurrentContext(pathname, userId): PageContext
  — buildSystemPrompt(ctx: PageContext, userProfile, adminInfo): string
  — TRIGGER_RULES: TriggerRule[]（新使用者/停留30秒/填到一半等）

src/lib/yukirin/intentRouter.ts
  — classifyIntent(text: string): Promise<AITaskType>
    第一層：INTENT_REGEX_MAP 規則匹配
    第二層：GPT-4o-mini intent_classify（~50 token）

src/lib/yukirin/memoryManager.ts
  — getRecentMessages(userKey, limit): Promise<ChatMessage[]>
  — saveMessage(userKey, role, content, mood, action): Promise<void>
  — updateUserProfile(userKey, updates): Promise<void>
  — summarizeProfile(messages): Promise<ProfileUpdate>（GPT-4o-mini，非阻塞）

src/lib/yukirin/moodMapper.ts
  — MOOD_TO_VRM: Record<string, { expression: string; animation: string }>
  — getMoodConfig(mood: string): VRMConfig

src/lib/yukirin/tourScripts.ts
  — TOUR_SCRIPTS: Record<string, TourStep[]>（6 個頁面腳本）
  — TourStep: { element: string; message: string; action?: NavigateAction }

src/lib/yukirin/persona.ts
  — YUKIRIN_PERSONA_PREFIX: string
  — RIKU_PERSONA_PREFIX: string
  — parseYukirinResponse(raw): { text, mood, action }

src/lib/yukirin/animationManager.ts
  — MOOD_MAPPING: Record<string, { animation: string; expression: string; intensity: number }>
  — playMoodAnimation(vrm, mood: string): void

src/lib/cognitiveGapEngine.ts
  — analyzeCognitiveGap(selfRatings, peerRatings, aiKey): Promise<CognitiveGapReport>
  — CognitiveGapReport: { gaps, possibleReasons, suggestions }

src/lib/yukirin/partnerInterrupt.ts
  — shouldInterrupt(context): boolean（10% 機率 + 5min 冷卻）
  — getInterruptLines(activeCharacter, scenario): { peekChar, lines }[]

src/lib/yukirin/modules/tourModule.ts
src/lib/yukirin/modules/surveyModule.ts
src/lib/yukirin/modules/resultModule.ts
src/lib/yukirin/modules/zcoinModule.ts
src/lib/yukirin/modules/supportModule.ts
src/lib/yukirin/modules/chitchatModule.ts

src/components/yukirin/YukirinFloat.tsx
  — 右下角浮動圖示（未展開時）
  — 有未讀訊息顯示紅點

src/components/yukirin/YukirinPanel.tsx
  — 展開的對話面板（350×500px）
  — 角色立繪 / 訊息列表 / 輸入框

src/components/yukirin/ChatBubble.tsx
  — 打字機效果氣泡
  — mood 對應的邊框色

src/components/yukirin/PartnerPeek.tsx
  — 從畫面邊緣探出半個身子
  — slide-in/out 動畫，3 秒後退場

src/app/api/guide/chat/route.ts
  — POST { message, userKey, pageContext }
  — 讀歷史 → 分類意圖 → callAI → 存訊息 → 更新畫像（非阻塞）
  — 回傳 { text, mood, action, tokenUsed }

src/app/(admin)/insight-admin/ai-guide/page.tsx
  — 今日對話數、各意圖分布圓餅圖、平均對話輪數
  — 使用者畫像分布（個性分類統計）
```

**修改檔案**
```
src/app/(admin)/layout.tsx
  — KNOWN_ADMIN_PAGES 加 'ai-guide'
  — Sidebar 加 { path: '/ai-guide', label: '🤖 AI 嚮導設定' }

src/middleware.ts
  — KNOWN_ADMIN_PAGES 加 'ai-guide'

src/app/layout.tsx（root layout）
  — 條件性引入 YukirinFloat（非後台路由才顯示）
```

---

## Phase 3 — 視覺升級 🟢

---

### CSS-GLASS-1~3 Liquid Glass CSS

**新增檔案**
```
src/styles/liquid-glass.css
  — 來自 docs/new/liquid-glass.css 直接複製
  — .glass 基礎類
  — 5 個面板變體：--highlight / --warm / --ice / --gold / --light
  — 元件類：.glass-tag / .glass-btn / .glass-btn--primary / .glass-avatar
             .glass-bar / .glass-bar__fill / .glass-input / .glass-divider / .glass-badge
  — .glass--static（停用動畫）
  — @media prefers-reduced-motion 自動停用
```

**修改檔案**
```
src/app/globals.css  — 加 @import './styles/liquid-glass.css'
```

**DB** — 無

---

### CARD-1~9 ShareCard v2

**安裝**
```bash
npm install modern-screenshot
```

**新增檔案**
```
src/components/share-cards/types.ts
  — ShareCardType / ShareCardData / EmotionalCardData / IdentityCardData 等型別

src/components/share-cards/cards/EmotionalCard.tsx
  — 360×640px，深紫星空背景，發光文字，star twinkle CSS 動畫
  — Props: { resultTitle, quotes: string[3], ctaText, theme }

src/components/share-cards/cards/IdentityCard.tsx
  — 暖金 IG 風，頭像 + 語錄 + 標籤 + 數據對比條
  — Props: { avatar, quote, tags, dataComparison }

src/components/share-cards/cards/AuthorityCard.tsx
  — 暗黑科技風，大數字跳動動畫，掃描線，橘色漸層
  — Props: { headlineNumber, headlineLabel, bars, insightQuote }

src/components/share-cards/cards/ProfessionalCard.tsx
  — 純白極簡，頂線伸展動畫，白皮書風格
  — Props: { title, summary, highlights, brandName, url }

src/components/share-cards/ShareCardRenderer.tsx
  — 根據 type 分派到對應卡片元件

src/components/share-cards/ShareCardModal.tsx
  — 卡片預覽 + 複製連結 + 儲存圖片 + 分享到 LINE 按鈕

src/utils/exportPng.ts
  — exportToPng(element: HTMLElement): Promise<Blob>
    - modern-screenshot scale 3x
    - freeze CSS 動畫後截圖
    - 回傳 PNG Blob

src/utils/exportMp4.ts
  — exportToMp4(element: HTMLElement, duration: number): Promise<Blob>
    - canvas.captureStream() + MediaRecorder
    - 錄製 4 秒 WebM

src/app/api/admin/share-card/generate-copy/route.ts
  - POST { cardType, surveyId, data }
  - 情緒卡：生成 resultTitle + quote × 3
  - 權威卡：生成 headlineNumber + bars + insightQuote
```

**修改檔案**
```
src/app/(public)/done/DoneClient.tsx
  — 完成後顯示 EmotionalCard（取代或增強現有 StoryCard）

src/app/story/[responseId]/page.tsx
  — 加 IdentityCard + ShareCardModal

src/app/(admin)/insight-admin/insight/page.tsx
  — 「📤 分享」按鈕改用 AuthorityCard + ShareCardModal

src/app/report/[slug]/ReportViewer.tsx
  — 加 ProfessionalCard + ShareCardModal
```

---

### VRM-1~5 雪凜 3D 角色

**安裝**
```bash
npm install @pixiv/three-vrm
```

**新增檔案**
```
public/models/yukirin.vrm          — VRoid Studio 匯出（非程式碼）
public/models/riku.vrm             — 凜空 VRM（非程式碼）
public/animations/idle.fbx         — 待機動畫
public/animations/wave.fbx         — 揮手動畫
public/animations/thinking.fbx     — 思考動畫
public/animations/excited.fbx      — 興奮動畫
public/animations/pointing.fbx     — 指向動畫
public/animations/clapping.fbx     — 鼓掌動畫

src/hooks/useVRM.ts
  — loadVRM(url): Promise<VRM>（GLTFLoader + VRMLoaderPlugin）
  — VRM 載入進度條
  — rotation.y = Math.PI（面朝正確方向）

src/lib/yukirin/animationManager.ts
  — loadAnimation(name): Promise<AnimationClip>（按需載入 FBX）
  — playAnimation(vrm, name, fadeIn)
  — stopAnimation(vrm, fadeOut)
  — MOOD_MAPPING: happy→wave / excited→clapping / thinking→thinking / wink→wave
  — autoBlinkLoop(vrm)（3~7 秒隨機眨眼）
  — breathingLoop(vrm)（chest sin 波動）
```

**修改檔案**
```
src/components/yukirin/YukirinPanel.tsx
  — 整合 useVRM + animationManager
  — mood 改變時呼叫 playMoodAnimation()
```

---

### UI-1~6 全站 UI 重構

**安裝**
```bash
npm install simplex-noise next-pwa
```

**新增檔案**
```
src/components/three/ThreeBackground.tsx
  — 玻璃球體 6 顆（MeshPhysicalMaterial: transmission + clearcoat）
  — Perlin Noise 驅動（createNoise3D from simplex-noise）
  — 微光粒子 200 個（PointsMaterial + AdditiveBlending）
  — 三點照明設定
  — 滑鼠視差 + 手機陀螺儀

src/components/three/VRMCharacter.tsx
  — 整合 useVRM + animationManager + lipSync

src/components/three/CombinedScene.tsx
  — 背景球體 + VRM 角色合一 Canvas

src/hooks/useVRM.ts（若未建）
src/hooks/useVisibilityRendering.ts
  — 頁面不可見時暫停 Three.js 渲染（節省 GPU）

src/utils/performanceTier.ts
  — detectPerformanceTier(): 'high' | 'mid' | 'low'
    - GPU: WebGL 參數
    - CPU: navigator.hardwareConcurrency
    - 記憶體: navigator.deviceMemory

src/utils/tierConfig.ts
  — HIGH_CONFIG / MID_CONFIG / LOW_CONFIG（球體數/粒子數/FPS 上限/SpringBone）

src/hooks/usePerformanceTier.ts
  — FPS 監控，avgFPS < 20 自動降一級

src/styles/tokens.ts
  — 設計 token（顏色/圓角/陰影/動畫時長）

src/components/ui/GlassPanel.tsx
src/components/ui/GlassButton.tsx
src/components/ui/GlassInput.tsx
src/components/ui/GlassProgress.tsx

src/components/character/characters.ts
  — CHARACTERS: Record<string, CharacterConfig>（yukirin / riku）

src/components/character/useCharacter.ts
  — 動態切換 VRM（讀 guide_user_profiles.chosen_character）
  — switchCharacter(id): 重載 VRM + 更新 DB

src/components/character/CharacterSelect.tsx
  — 首次進入選角色（全螢幕遮罩）
  — 左：雪凜揮手，右：凜空揮手
  — 點選 → 存 DB → 關閉

src/components/character/LowTierCharacter.tsx
  — low tier：PNG 立繪 fallback（public/images/yukirin-neutral.png）

src/hooks/useInstallPrompt.ts
  — PWA 安裝提示

src/app/offline/page.tsx
  — 雪凜難過表情 + 「等你網路回來！」

public/manifest.json
public/icons/icon-192.png
public/icons/icon-512.png
```

**修改檔案**
```
next.config.ts
  — withPWA 包裝 + runtimeCaching 設定
```

---

### AUDIO-1~4 雪凜音訊系統

**安裝**
```bash
npm install howler microsoft-cognitiveservices-speech-sdk
npm install --save-dev @types/howler
```

**新增檔案**
```
public/sounds/tap.mp3
public/sounds/select.mp3
public/sounds/progress.mp3
public/sounds/complete.mp3
public/sounds/result.mp3
public/sounds/zcoin.mp3
public/sounds/share.mp3
public/sounds/error.mp3
public/sounds/notification.mp3
public/sounds/level_up.mp3
public/sounds/coin_drop.mp3
public/sounds/achievement.mp3
public/sounds/goodbye.mp3

public/voice/greeting.mp3
public/voice/thinking.mp3
public/voice/result_ready.mp3
public/voice/zcoin_earned.mp3
public/voice/goodbye.mp3
public/voice/help.mp3
public/voice/encouragement.mp3

src/lib/audio/SoundManager.ts
  — Howler.js 封裝（preload / play / stop / setVolume）
  — SOUND_MAP: Record<SoundKey, string>

src/hooks/useSound.ts
  — const { play } = useSound()

src/app/api/tts/route.ts
  — POST { text, style? }
  — Azure TTS（zh-CN-XiaoxiaoNeural + SSML + 情緒風格）
  — 回傳 audio/mpeg blob

src/app/api/tts-with-viseme/route.ts
  — POST { text }
  — Azure TTS + viseme 時間軸
  — 回傳 { audioUrl, visemes: VisemeEvent[] }

src/hooks/useYukirinVoice.ts
  — 播放 TTS 並同步 LipSyncController

src/lib/audio/LipSyncController.ts
  — Azure viseme ID → VRM 母音 BlendShape
  — update(deltaTime): void（每幀呼叫）
  — lerp 平滑過渡

src/hooks/useVoiceInput.ts
  — Web Speech API（Chrome/Edge）
  — 長按開始錄音，放開送出
```

---

### ROLL-1~3 雪凜 × 凜空互動

**DB Migration**
```sql
-- guide_user_profiles 已建（YUKIRIN-6），確認有：
ALTER TABLE guide_user_profiles ADD COLUMN IF NOT EXISTS disable_partner_peek BOOLEAN DEFAULT false;
```

**新增檔案**（多數已列於 YUKIRIN 節）
```
src/lib/yukirin/partnerInterrupt.ts
  — shouldInterrupt(lastInterruptAt, probability): boolean
  — PARTNER_LINES: Record<ActiveChar, Record<Scenario, InterruptLine[]>>

src/components/yukirin/PartnerPeek.tsx
  — CSS slide-in 從邊緣探出 50% 身體
  — 3 秒後 slide-out
  — pointer-events-none
```

---

## Phase 4 — 商業化 🟢

---

### ZCOIN-1~11 Z 幣經濟系統

**DB Migration**
```sql
-- 確認以下表存在，不存在則建立：

CREATE TABLE IF NOT EXISTS zcoin_accounts (
  user_id TEXT PRIMARY KEY,
  balance INT NOT NULL DEFAULT 0,
  total_earned INT NOT NULL DEFAULT 0,
  total_spent INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zcoin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'signup_bonus','daily_login','streak_bonus','write_story','story_liked',
    'invite_friend','bind_line','complete_profile','feedback','achievement',
    'daily_task','deep_analysis','purchase','gift_sent','gift_received',
    'admin_adjust','refund','expiry'
  )),
  amount INT NOT NULL,                         -- 正數=收入，負數=支出
  ref_id TEXT,                                 -- 關聯的 story_id / task_id 等
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_zcoin_tx_user ON zcoin_transactions (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS zcoin_shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,                      -- 'sticker'|'theme'|'frame'|'title'|'costume'|'zaicai'|'survey'
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  price INT NOT NULL,
  rarity TEXT DEFAULT 'common',               -- 'common'|'rare'|'epic'|'legendary'
  is_limited BOOLEAN DEFAULT false,
  available_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zcoin_user_items (
  user_id TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES zcoin_shop_items(id),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS zcoin_user_equipped (
  user_id TEXT NOT NULL,
  slot TEXT NOT NULL,                          -- 'frame'|'title'|'zaicai'|'theme'
  item_id UUID REFERENCES zcoin_shop_items(id),
  PRIMARY KEY (user_id, slot)
);

CREATE TABLE IF NOT EXISTS daily_check_in (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  streak_days INT NOT NULL DEFAULT 1,
  zcoin_earned INT NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, check_in_date)
);

CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  task_type TEXT NOT NULL,
  zcoin_reward INT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, task_date, task_type)
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id TEXT NOT NULL,
  invitee_id TEXT NOT NULL,
  invitee_completed_survey BOOLEAN DEFAULT false,
  zcoin_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (inviter_id, invitee_id)
);
```

**新增檔案**
```
src/lib/zcoin/zcoinEngine.ts
  — earnZcoin(userId, type, amount, refId): Promise<void>
  — spendZcoin(userId, type, amount, refId): Promise<boolean>
  — getBalance(userId): Promise<number>
  — getTransactionHistory(userId, page): Promise<ZcoinTransaction[]>

src/lib/zcoin/dailyTaskEngine.ts
  — TASK_POOL: TaskConfig[]（10+ 種任務類型）
  — getDailyTasks(userId): Promise<DailyTask[]>（每天隨機抽 3 個）
  — completeTask(userId, taskType): Promise<void>

src/lib/zcoin/antiCheat.ts
  — checkLikeSpam(fromUserId, toUserId): Promise<boolean>（24h 同對限 1 次）
  — checkInviteSpam(ip, deviceFingerprint): Promise<boolean>
  — checkHourlyRate(userId): Promise<boolean>（每小時 30 Z 幣上限）
  — checkDailyRate(userId): Promise<boolean>（每天 109 Z 幣上限）

src/app/api/zcoin/check-in/route.ts
  — POST — 每日簽到（計算 streak + 發放 Z 幣）

src/app/api/zcoin/daily-tasks/route.ts
  — GET  — 取得今日任務
  — POST — 完成任務

src/app/api/zcoin/shop/route.ts
  — GET — 商城列表（?category=&page=）

src/app/api/zcoin/purchase/route.ts
  — POST { itemId } — 購買商品（扣 Z 幣 + 寫 zcoin_user_items）

src/app/api/zcoin/referral/route.ts
  — POST { action: 'generate' } — 生成邀請碼
  — POST { action: 'claim', inviteCode } — 認領邀請獎勵

src/app/api/zcoin/gift/route.ts
  — POST { toUserId, amount } — 送禮（10% 手續費，最低 10 Z）

src/app/api/zcoin/deep-analysis/route.ts
  — POST { responseId } — 扣 30 Z 幣 → 呼叫 Claude Sonnet 深度解讀

src/app/(public)/shop/page.tsx
  — 招財坐商城門口（迎賓動畫）
  — Tab：表情包 / 動態貼圖 / 主題 / 邊框 / 稱號 / 服裝 / 招財配件 / 問卷
  — 商品卡片（預覽/價格/稀缺度/限時倒計時）

src/app/(public)/invite/[code]/page.tsx
  — 邀請連結落地頁（顯示邀請者頭像 + 歡迎文案 + 立即加入按鈕）

src/components/zcoin/ZaicaiIcon.tsx
  — 根據 zcoin_user_equipped slot='zaicai' 渲染招財配件圖示

src/components/zcoin/ZcoinBadge.tsx
  — Z 幣餘額顯示元件（數字 + 招財圖示）
```

---

### PAY-1~4 LINE Pay 串接

**安裝**
```bash
npm install line-pay-merchant
```

**DB Migration**
```sql
-- 確認 payment_orders 表存在且有以下欄位：
-- id, user_id, plan_id, amount, zcoin_amount, payment_method, status,
-- merchant_order_no, transaction_id, created_at, completed_at
-- 若不存在或缺欄位，補齊
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS plan_id TEXT;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS zcoin_amount INT;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS transaction_id TEXT;
```

**新增檔案**
```
src/lib/payment/linePayClient.ts
  — LINE Pay API v3 客戶端封裝
  — createPaymentRequest(order): Promise<{ paymentUrl, transactionId }>
  — confirmPayment(transactionId, amount): Promise<boolean>

src/app/api/line-pay/request/route.ts
  — POST { planId } — 建立 LINE Pay 付款請求
  — 回傳 { paymentUrl } → 前端跳轉

src/app/api/line-pay/confirm/route.ts
  — GET ?transactionId=&orderId= — LINE Pay 確認 callback
  — 驗證 → 更新 payment_orders status → earnZcoin

src/app/api/line-pay/cancel/route.ts
src/app/api/line-pay/refund/route.ts

src/app/api/cron/reconcile-orders/route.ts
  — GET — pending > 1 小時 → 標記 cancelled（Zeabur cron 呼叫）

src/app/(public)/topup/page.tsx
  — 招財坐在 Z 幣堆上動畫
  — 4 種儲值方案卡片（100/300/500/1000 Z 幣）
  — 付款方式切換（LINE Pay / 藍新 / Stripe）

src/app/(public)/topup/success/page.tsx
  — 招財倒幣動畫
  — 顯示到帳 Z 幣數量
```

---

### 免費試用機制

**DB Migration**
```sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial';
  -- plan: 'trial' | 'free' | 'pro' | 'enterprise'
```

**新增檔案**
```
src/lib/trialEngine.ts
  — checkTrialStatus(tenantId): 'active' | 'expired' | 'paid'
  — getTrialDaysRemaining(tenantId): number
  — getAccumulatedAssets(tenantId): { surveys, responses, tags, reports }

src/app/(admin)/insight-admin/upgrade/page.tsx
  — 模糊化 AI 報告預覽（blur + upgrade CTA）
  — 資產清單（你已累積 X 份問卷 / Y 筆回覆 / Z 個標籤）
  — 三種訂閱方案（月繳/年繳/Enterprise）
  — 升級 → 跳轉 topup 頁面
```

**修改檔案**
```
src/middleware.ts
  — 檢查 tenant.plan
  — trial expired + 訪問 AI 功能路由 → redirect /insight-admin/{slug}/upgrade

src/app/(admin)/layout.tsx
  — KNOWN_ADMIN_PAGES 加 'upgrade'
```

---

## Phase 5 — 部落格完善 ⚪

**每項的涉及檔案（主要）**

| 項目 | 新增/修改 |
|------|---------|
| BLOG-1 目錄 TOC | 新增 `components/blog/TableOfContents.tsx`；修改文章頁 layout |
| BLOG-2 閱讀完成 | 修改 `components/blog/ReadingProgress.tsx`（progress ≥ 95% toast） |
| BLOG-3 作者簡介卡 | 新增 `components/blog/AuthorCard.tsx` |
| BLOG-4 相關文章 | 新增 `api/blog/[slug]/related/route.ts`；修改文章頁 |
| BLOG-5 錨點連結 | 修改文章頁 MDX 處理（h2/h3 加 id + hover # 圖示） |
| BLOG-6 email 訂閱 | DB: `blog_subscribers`；新增 `api/blog/subscribe/route.ts` |
| BLOG-7 草稿預覽 | 修改 `api/blog/[slug]/route.ts`（?preview_token= 繞過 published 檢查） |
| BLOG-8 AI 封面圖 | 新增 `api/admin/blog/generate-cover/route.ts`（DALL-E 3 + R2） |
| BLOG-9 文章統計 | 新增 `(admin)/insight-admin/blog-stats/page.tsx` |
| BLOG-10 留言審核 | DB: `is_approved` 欄位；修改留言 API 加黑名單過濾 |
| BLOG-11 版型切換 | 修改 blogs 首頁（card/magazine/list view state） |
| BLOG-12 Paywall | 修改文章頁（前 N 字後模糊）；整合 LINE Pay |
| BLOG-13 TipTap AI | 修改後台編輯器（選取文字 → AI 浮動選單） |
| BLOG-14 RSS Feed | 新增 `app/blogs/[userSlug]/feed.xml/route.ts` |
| BLOG-15 文章分類 | DB: `blog_category` 欄位；修改 CRUD + 篩選 UI |
| BLOG-16 深/淺色 | 新增 `hooks/useBlogTheme.ts`；修改文章頁 CSS |
| BLOG-17 字型調整 | 修改文章頁（小/中/大 class + localStorage） |
| BLOG-18 程式碼高亮 | 安裝 `lowlight`；修改 TipTap 設定 |
| BLOG-19 OG 測試工具 | 修改 `site-settings/page.tsx`（加「測試 OG」按鈕 → fetch URL + 顯示抓到的 meta） |
| BLOG-20 全站搜尋 | 修改 `api/blog/route.ts`（加 full-text search `to_tsquery`） |

---

## 🔴 今日任務（2026-03-31）

```
[1] URG-6 Sidebar 連結缺 tenant slug 導致 404
    → 掃 layout.tsx + 測試 middleware rewrite

[2] 客服系統接線
    → DB migration（support_tickets / support_messages / support_templates）
    → api/admin/support/ 各 route
    → insight-admin/support/page.tsx
    → layout.tsx + middleware.ts

[3] FEAT-7a 平台公告通知系統
    → DB migration（platform_notifications / notification_reads）
    → api/super-admin/notifications/
    → snowrealm-insight-ctrl/notifications/page.tsx
    → layout.tsx NAV_ITEMS 更新

[4] 若有時間：FEAT-6 問卷模板系統
    → DB migration（survey_templates）
    → api/admin/survey-templates/
    → insight-admin/survey-templates/page.tsx
```

---

## Sidebar 入口確認清單

- [x] Dashboard / 問卷管理 / 填答列表 / 漏斗 / 交叉 / 標籤 / 標籤規則
- [x] 來源分析 / A/B 比較 / AI 洞察報告 / 故事牆管理
- [x] LINE 推播 / 通知規則 / 訊息模板 / UTM 管理 / Rich Menu
- [x] LINE 設定 / 通知樣式 / 封測名單 / Webhook / Meta/OG / AI 設定
- [x] 主題設定 / 管理員面板 / 團隊管理 / 帳號設定 / API Key 管理
- [ ] 客服中心（support）← Phase 1 今日
- [ ] 問卷模板（survey-templates）← Phase 1
- [ ] AI 嚮導設定（ai-guide）← Phase 2
- [ ] 升級方案（upgrade）← Phase 4
