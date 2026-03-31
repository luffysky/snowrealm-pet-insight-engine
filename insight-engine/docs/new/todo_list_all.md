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

---

## Phase 6 — LINE 全面重整 🔧

> **優先做這個再繼續前面 Phase**
> 目前問題：三個 webhook route 不確定哪個活著、Rich Menu 未設定、
> Token 散落 ENV+DB 兩處、推播邏輯互相蓋掉、自動回覆文案硬編碼毛行天下

---

### LINE-0 現況盤點（做之前先確認）

**三個 Webhook Route 現況**：

| Route | Bot | 用途 | 狀態 |
|-------|-----|------|------|
| `/api/line/webhook` | Insight Bot `@762wxvfb` | 管理員口令註冊 + 數據查詢 | ❓ 需確認 |
| `/api/line/webhook/official` | Official Bot `@474iwlht` | 用戶自動回覆 + 填答引導 | ❓ 需確認 |
| `/api/line/webhook/insight-engine` | ❓ | 用途不明 | ❓ 可能廢棄 |

**確認清單（需登入 LINE Developers Console）**：
- [ ] Insight Bot Channel → Messaging API → Webhook URL 設的是哪個？
- [ ] Official Bot Channel → Webhook URL 設的是哪個？
- [ ] `insight-engine` route 是否有 Bot 在用？沒有則刪除

---

### LINE-1 Webhook 整理 + 確認可用

**目標**：只保留兩個乾淨的 webhook，每個對應一個 Bot

```
Insight Bot  → /api/line/webhook          （管理員）
Official Bot → /api/line/webhook/official  （用戶）
```

**修改檔案**：

| 檔案 | 動作 |
|------|------|
| `src/app/api/line/webhook/insight-engine/route.ts` | 確認用途 → 沒用就刪除 |
| `src/app/api/line/webhook/route.ts` | 確認 signature 驗證正常 |
| `src/app/api/line/webhook/official/route.ts` | 確認 signature 驗證正常 |

**LINE Developers Console 設定**：
```
Insight Bot：
  Webhook URL: https://insight.snowrealm.pet/api/line/webhook
  Use webhook: ON
  Auto-reply: OFF（改由程式控制）

Official Bot：
  Webhook URL: https://insight.snowrealm.pet/api/line/webhook/official
  Use webhook: ON
  Auto-reply: OFF
  Greeting message: OFF（改由 follow event 控制）
```

---

### LINE-2 Token 統一管理 — 全部進後台 LINE 設定頁

**目標**：所有 LINE Token 從後台 `line-settings` 頁面統一設定，
不再散落在 `.env` 的多個不同變數名。

**目前 ENV 變數混亂**（需對齊）：

| 現在 ENV Key | lineConfig.ts 定義 | 狀態 |
|-------------|-------------------|------|
| `LINE_CHANNEL_ACCESS_TOKEN` | — | ❌ 舊變數，沒被對應 |
| `LINE_INSIGHT_CHANNEL_ACCESS_TOKEN` | `INSIGHT_CHANNEL_ACCESS_TOKEN` | ✅ |
| `LINE_OFFICIAL_CHANNEL_ACCESS_TOKEN` | `OFFICIAL_CHANNEL_ACCESS_TOKEN` | ✅ |
| `LINE_YOUR_USER_ID` | `ADMIN_USER_ID` | ✅ |
| `LINE_LOGIN_CHANNEL_ID/SECRET` | `LINE_LOGIN_CHANNEL_ID/SECRET` | ✅ |

**動作**：
- [ ] 把 `LINE_CHANNEL_ACCESS_TOKEN`（舊）從所有程式碼移除，改用正確的 key
- [ ] 確認 `.env.local` 裡所有 LINE 變數名稱與 `lineConfig.ts` 的 `envKey` 完全一致
- [ ] 在 Zeabur 環境變數也對齊

---

### LINE-3 Official Bot 自動回覆重寫

**目標**：清理 `official/route.ts` 的自動回覆邏輯，移除毛行天下硬編碼，
改從 `tenantBranding.ts` 讀取，支援多租戶。

**現在的問題**：
- `DEFAULT_TENANT = 'maoxingtianxia'` 硬編碼
- 歡迎訊息、介紹文案、預設回覆混雜在 route.ts 裡
- `guideEngine`、`skillEngine`、`proactive/pushEngine` 都在同一個 route 裡調用，邏輯過長

**重整後結構**：
```typescript
// official/route.ts 只做三件事：
// 1. 驗 signature
// 2. 解析 event type（message / follow / unfollow / postback）
// 3. 分派給對應 handler

handleFollow(userId)       → 歡迎訊息 + 設預設 Rich Menu
handleTextMessage(text, userId) → 交給 messageRouter
handlePostback(data, userId)    → Rich Menu 按鈕事件
handleUnfollow(userId)     → 記錄封鎖
```

**`messageRouter` 優先順序**：
```
1. 「離開」/ 「結束」  → abandonSession
2. 「填問卷」/ 「開始」→ startSurveySession
3. 活躍填答 session   → processUserAnswer
4. 「客服」/ 「問題」  → startSupportTicket
5. 活躍客服工單       → appendSupportMessage
6. AI Guide 開啟中    → guideEngine
7. 關鍵字自動回覆      → tenantBranding 文案
8. 預設              → 預設回覆（tenantBranding）
```

**修改檔案**：
- `src/app/api/line/webhook/official/route.ts` — 大幅精簡，邏輯分派
- `src/lib/tenantBranding.ts` — 確認 `welcomeMsg`、`defaultReply` 等欄位有值

---

### LINE-4 Rich Menu 完整設定

**目標**：在 LINE Official Account Manager 建好 Rich Menu，
ID 填入後台 `line-settings`，程式自動切換。

**需要建立的 Rich Menu**：

| 名稱 | 觸發時機 | 按鈕配置 |
|------|---------|---------|
| 預設選單（新好友） | follow event | 填問卷 / 官網 / 聯絡客服 |
| 填完問卷選單 | 問卷完成後 | 查看結果 / 再填一次 / 分享 |

**流程**：
```
1. LINE Official Account Manager → Rich Menu → 建立兩個選單 → 拿到 richmenu-xxx ID
2. 後台 line-settings 頁面 → Rich Menu 設定區 → 填入兩個 ID
3. 確認 lineNotify.ts 的 switchUserRichMenu() 從 DB 讀取（已有，確認運作）
4. 確認 follow event handler 有呼叫 setDefaultRichMenu(userId)
```

**新增函式**（`src/lib/lineNotify.ts`）：
```typescript
// 設定用戶的預設 Rich Menu（新好友 follow 時呼叫）
setDefaultRichMenu(lineUserId: string, tenantId?: string): Promise<void>
```

---

### LINE-5 推播系統整理

**目標**：統一所有推播入口，避免 token 用錯、Bot 搞混

**現在問題**：`lineNotify.ts` 裡有多個推播函式各自 `getLineConfig`，
沒有統一的 `pushToUser(userId, message, botType)` 介面。

**重整後介面**：
```typescript
// src/lib/lineNotify.ts

// 統一推播入口
pushMessage(to: string, messages: LineMessage[], bot: 'insight' | 'official'): Promise<void>

// 常用包裝
pushToAdmin(message: string)           → insight bot → ADMIN_USER_ID
pushToUser(lineUserId: string, msg)    → official bot → 單一用戶
broadcastToAll(messages: LineMessage[])→ official bot → 全部好友
multicastToUsers(ids: string[], msg)   → official bot → 指定用戶（分批 500）

// Rich Menu
setDefaultRichMenu(lineUserId: string) → official bot
switchUserRichMenu(lineUserId: string) → official bot（填完問卷後）
```

---

### LINE-6 LINE Login OAuth 確認

**目標**：確認 LINE Login 登入流程正常（用於後台登入 + LIFF 綁定）

**確認清單**：
- [ ] LINE Developers → LINE Login Channel → Callback URL 設定正確
  - `https://insight.snowrealm.pet/api/auth/line/callback`
- [ ] `src/app/api/auth/line/route.ts` 用的是 `LINE_LOGIN_CHANNEL_ID`（不是 Messaging API 的 Channel）
- [ ] LIFF → LIFF ID 填入後台 line-settings
- [ ] `src/app/(public)/liff/page.tsx` 讀到正確的 LIFF ID

---

### LINE-7 Insight Bot（管理員 Bot）整理

**目標**：確認管理員 Bot 功能正常（口令註冊 + 數據查詢）

**現有功能（確認是否運作）**：
- [ ] 管理員傳口令 → 收到邀請連結
- [ ] 管理員傳「今日報告」→ 收到數據摘要 Flex Message
- [ ] 管理員傳「漏斗」→ 收到漏斗分析
- [ ] 管理員傳「匯出」→ 收到下載連結

**修改檔案**：
- `src/app/api/line/webhook/route.ts` — 確認 `handleAdminCommand` 有正確回應
- `src/lib/lineAdminBot.ts` — 確認各指令 handler 正常

---

### LINE-9 Super Admin 身份強化 + 未來團隊管理設計

**目標**：總後台登入只認你的 LINE 帳號（精確比對 User ID），
同時設計好未來擴充團隊的權限架構。

#### 現況問題

目前 callback 流程：LINE OAuth → 查 DB `WHERE role='super_admin' LIMIT 1` → 任何人登入都能進去（只要 DB 裡有 super_admin 帳號），User ID 比對是缺失的。

**修改**：`src/app/api/auth/line/super-admin/callback/route.ts`
```typescript
// 現在（不安全）：
const allowedUserId = process.env.SUPER_ADMIN_LINE_USER_ID || process.env.LINE_YOUR_USER_ID
// allowedUserId 根本沒被用來比對！

// 修復：
if (allowedUserId && lineProfile.userId !== allowedUserId) {
  return NextResponse.redirect(`${baseUrl}/super-login?error=not_authorized`)
}
```

#### 團隊角色設計

```
super_admin     你本人，唯一，LINE User ID 綁死
platform_admin  核心團隊（未來），可看大部分後台，不能看特權功能
tenant_admin    各租戶管理員（現有 admin 角色）
editor          編輯人員
viewer          唯讀
```

#### 特權功能 Flag（社群監控等只有你能看）

**DB Migration**：
```sql
CREATE TABLE IF NOT EXISTS feature_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  -- feature 清單：
  --   'social_monitor'     社群監控（爬蟲結果）
  --   'crawler_dashboard'  爬蟲控制台
  --   'finance'            財務/訂單/收益
  --   'platform_config'    系統設定
  --   'ai_cost'            AI 成本明細
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES admin_users(id),
  PRIMARY KEY (user_id, feature)  -- 改為複合主鍵
);

-- 建立時給 super_admin 所有權限
INSERT INTO feature_access (user_id, feature)
SELECT id, unnest(ARRAY[
  'social_monitor','crawler_dashboard','finance',
  'platform_config','ai_cost'
])
FROM admin_users WHERE role = 'super_admin'
ON CONFLICT DO NOTHING;
```

**後端工具函式**（`src/lib/tenant.ts` 新增）：
```typescript
// 檢查特權功能權限
requireFeature(feature: string): 
  → 查 feature_access 表
  → 無權限回傳 403
  → 只有有紀錄的 user_id 才過得去
```

**套用到社群監控**（`/api/admin/social-monitor/*`）：
```typescript
const check = await requireFeature('social_monitor')
if (check instanceof NextResponse) return check
```

**前端**：Sidebar 的社群監控入口只在有 `social_monitor` 權限時顯示，
不是靠 role 判斷，靠 `feature_access` 表。

#### 修改檔案清單

| 檔案 | 修改內容 |
|------|---------|
| `src/app/api/auth/line/super-admin/callback/route.ts` | 加入 `allowedUserId` 精確比對 |
| `src/lib/tenant.ts` | 新增 `requireFeature(feature)` |
| `src/app/(admin)/layout.tsx` | Sidebar 特權項目依 `feature_access` 顯示/隱藏 |
| `src/app/api/auth/me/route.ts` | 回傳 `features: string[]`（讓前端知道有哪些權限） |

**DB Migration**：`supabase/migration_phase_feature_access.sql`

---

### LINE-8 完整測試清單（做完再繼續其他 Phase）

```
□ 新好友加入 Official Bot → 收到歡迎訊息 + 看到預設 Rich Menu
□ 傳「填問卷」→ 開始 LINE 填答流程
□ 選擇選項 → 正確推進下一題（分流正確）
□ 填完問卷 → 收到完成訊息 + Rich Menu 切換成填完版
□ 傳「客服」→ 建立工單 + 管理員 Insight Bot 收到通知
□ 管理員在後台客服頁面回覆 → Official Bot 推送給用戶
□ 管理員傳「今日報告」給 Insight Bot → 收到數據
□ 後台 line-settings → 所有 Token 顯示正確來源（DB/ENV）
□ 後台 line-settings → Rich Menu ID 欄位可填寫 + 儲存
□ 後台 broadcast 頁面 → 發送推播 → 好友收到
□ LINE Login 按鈕 → OAuth 流程正常 → 登入成功
```

---

## Phase 7 — Python 爬蟲 + LLM + LINE 整合服務 🐍

> **依賴 Phase 6 完成**（LINE 整理好再做爬蟲整合）
> 獨立 Python 專案：`D:/SnowRealmRebirth/snowrealm-crawler/`
> 語言：Python 3.11 + FastAPI + APScheduler
> 部署：Zeabur 獨立服務（與 Next.js 平行）

---

### CRAWL-1 FastAPI 骨架 + Cloudflare Token 鎖

**目標**：建立爬蟲服務主體，所有請求必須帶 `X-Crawler-Token` header，
Cloudflare Firewall Rule 同一個 token → 白名單放行自家爬蟲、擋掉其他 bot。

**新增檔案**：
```
snowrealm-crawler/
├── app/
│   ├── main.py                  # FastAPI 入口 + token 驗證 middleware
│   ├── routers/
│   │   ├── crawl.py             # POST /crawl/run, GET /crawl/status/{id}
│   │   ├── analyze.py           # POST /analyze/survey, POST /analyze/segment
│   │   └── line_push.py         # POST /line/push（private/broadcast/targeted）
│   ├── crawlers/
│   │   ├── work_crawler.py      # 競品/產業/新聞 → 私人 LINE 回報
│   │   ├── site_crawler.py      # 爬自己網站 → 建 RAG 向量庫
│   │   ├── user_profiler.py     # 用戶畫像分析 → 分眾推播
│   │   └── content_crawler.py   # 內容監控 → 官方廣播
│   ├── llm/
│   │   ├── summarizer.py        # 爬蟲結果 → LLM 摘要
│   │   ├── embedder.py          # 文本向量化（sentence-transformers）
│   │   └── rag.py               # RAG 查詢（pgvector）
│   ├── line_router/
│   │   ├── private_push.py      # Insight Bot → 你的 LINE ID（工作回報）
│   │   ├── broadcast.py         # Official Bot → 全部好友
│   │   └── targeted_push.py     # Official Bot → 指定 LINE ID 列表（分眾）
│   └── analysis/
│       ├── stats_engine.py      # pandas 統計分析
│       ├── cluster.py           # scikit-learn 用戶分群
│       └── sentiment_local.py   # jieba + TF-IDF 本地 NLP
├── scheduler.py                 # APScheduler 排程定義
├── requirements.txt
├── .env.example
├── Dockerfile
└── zbpack.json                  # Zeabur 部署設定
```

**Cloudflare 設定（手動在 Dashboard 操作）**：
```
Firewall Rules → Create Rule：
  名稱：Allow SnowRealm Crawler
  條件：(http.request.headers["X-Crawler-Token"][0] eq "{{CRAWLER_TOKEN}}")
  動作：Skip → Bot Fight Mode
  優先級：1（最高）

第二條 Rule：
  名稱：Block Other Bots
  條件：cf.client.bot AND NOT 上面條件
  動作：Block
  優先級：2
```

**環境變數（.env）**：
```
CRAWLER_TOKEN=                    # 自訂強密鑰（同步設定到 Cloudflare Rule）
NEXTJS_ORIGIN=https://insight.snowrealm.pet
DATABASE_URL=                     # 共用同一個 Supabase
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
INSIGHT_CHANNEL_ACCESS_TOKEN=     # Insight Bot（推私人）
OFFICIAL_CHANNEL_ACCESS_TOKEN=    # Official Bot（推好友）
MY_LINE_USER_ID=                  # 你的個人 LINE ID（工作回報目標）
```

---

### CRAWL-2 LINE Router — 三種推播模式

**目標**：統一的推播介面，依 `mode` 路由到不同 Bot 和對象

| mode | Bot | 對象 |
|------|-----|------|
| `private` | Insight Bot | `MY_LINE_USER_ID`（你） |
| `broadcast` | Official Bot | 全部好友 |
| `targeted` | Official Bot | 指定 LINE ID 列表（分眾） |

**分眾規則（user_profiler 產出）**：
```python
SEGMENT_RULES = {
    "pet_owner":    "SELECT line_user_id FROM user_tags WHERE tag_key='pet_owner'",
    "high_value":   "SELECT line_user_id FROM responses WHERE score > 80",
    "inactive_30d": "SELECT line_user_id FROM line_users WHERE last_active < NOW() - INTERVAL '30 days'",
    "new_user_7d":  "SELECT line_user_id FROM line_users WHERE created_at > NOW() - INTERVAL '7 days'",
}
```

LINE multicast 自動分批（每批 ≤ 500 人）。

---

### CRAWL-3 Work Crawler — 競品/產業/新聞 → 私人 LINE 回報

**目標**：定時爬競品動態、產業新聞、PTT，LLM 摘要後推給你的 LINE

**爬取來源（可設定）**：
- 競品：指定 URL 列表（每日 08:00）
- 新聞：Google News RSS（每日 08:00）
- PTT：問卷/SaaS 板（每週一）
- Product Hunt：新工具追蹤（每週一）

**流程**：
```
Playwright 爬取 → BeautifulSoup 解析
  → LLM 摘要（200 字內，繁中）
  → Flex Message 格式化
  → line_router private_push → 你的 LINE
```

**排程**：APScheduler `cron(hour=8, minute=0)`

---

### CRAWL-4 Site Crawler — 爬自己網站建 RAG

**目標**：爬 `insight.snowrealm.pet` 所有頁面 + 文件 → 向量化 → 存 pgvector
→ LINE Bot 收到問題時用 RAG 查詢 + LLM 回答（取代純關鍵字自動回覆）

**流程**：
```
Playwright 爬所有頁面
  → 切段（chunk_size=500 tokens）
  → sentence-transformers 向量化
  → INSERT INTO rag_documents (content, embedding, url, updated_at)
  → 每週重爬（內容更新時也可手動觸發）
```

**DB Migration**：
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  url TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  embedding vector(384),          -- sentence-transformers/all-MiniLM-L6-v2
  source TEXT DEFAULT 'site',     -- 'site' | 'docs' | 'faq'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_embedding ON rag_documents
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**Next.js 整合**：
- `src/app/api/line/webhook/official/route.ts` 無關鍵字匹配時 → 呼叫 `/analyze/rag-query`
- FastAPI 回傳 LLM 回答 → LINE 推回給用戶

---

### CRAWL-5 User Profiler — 用戶畫像分析 → 分眾推播

**目標**：分析填答者行為 → 自動分群 → 觸發個性化 LINE 推播

**分析流程**：
```
從 DB 撈 responses + answers + user_tags
  → pandas 特徵工程
  → scikit-learn KMeans 分群（k=4~6）
  → 每群命名（LLM 根據特徵命名）
  → 存回 user_tags（tag_key='segment', tag_value='高價值飼主'）
  → 觸發 line_router targeted_push（每群不同訊息）
```

**觸發時機**：
- 每週日 22:00 全量重算
- 新回覆達 100 筆時增量更新
- 手動 POST `/crawl/run` `type=user_profile`

---

### CRAWL-6 Content Crawler — 內容監控 → 官方廣播

**目標**：監控特定關鍵字/網站，發現值得分享的內容 → 整理成 LINE 官方廣播

**監控來源**：
- 你指定的競品/媒體 URL
- 關鍵字：可設定（如「問卷」「SaaS」「寵物」）

**LLM 過濾**：每篇內容先由 LLM 評分（0-10），≥7 才推送，避免廣播垃圾訊息

**推送格式**：Flex Message（標題 + 摘要 + 連結按鈕）

---

### CRAWL-7 排程設定（APScheduler）

```python
# scheduler.py
每日 08:00 → work_crawler（競品/新聞）→ private
每週一 09:00 → work_crawler（Product Hunt/PTT）→ private
每週三 10:00 → site_crawler（重建 RAG）→ 不推播
每週日 22:00 → user_profiler（重算分群）→ targeted
事件觸發 → content_crawler → broadcast（LLM 評分 ≥7）
```

---

### CRAWL-8 Zeabur 部署

**新增**：`snowrealm-crawler/zbpack.json`
```json
{
  "build_command": "pip install -r requirements.txt",
  "start_command": "uvicorn app.main:app --host 0.0.0.0 --port 8000"
}
```

**Zeabur 設定**：
- 新增 Service → 選 `snowrealm-crawler/` 資料夾
- 設定環境變數（同 .env.example）
- 拿到固定 IP → 加進 Cloudflare Firewall Rule IP 白名單

---

### CRAWL-9 Next.js 整合點

**修改檔案**：

| 檔案 | 修改內容 |
|------|---------|
| `src/app/api/line/webhook/official/route.ts` | 無關鍵字 → 呼叫 Python `/analyze/rag-query` |
| `src/app/api/admin/ai-insight/route.ts` | 可選：呼叫 Python `/analyze/survey` 取得深度分析 |
| `src/app/api/cron/weekly-report/route.ts` | 呼叫 Python `/crawl/run` `type=user_profile` |

**Python → Next.js 呼叫**（帶 token）：
```python
headers = {"X-Crawler-Token": os.getenv("CRAWLER_TOKEN")}
await httpx.post("https://insight.snowrealm.pet/api/internal/...", headers=headers)
```
