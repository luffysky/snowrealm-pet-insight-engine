# CLAUDE.md — SnowRealm Insight Engine

> 本文件供 Claude Code 讀取，讓 AI 完全理解專案結構後直接開始寫 code。
> 最後更新：2026-03-23

---

## 專案概述

**SnowRealm Insight Engine** 是一套 AI-Native 智慧問卷系統，隸屬 SnowRealm 生態系。
目前以「毛行天下」組織運營，網域 `insight.snowrealm.pet`。

核心定位：從問卷建立 → 數據收集 → AI 分析 → 商業建議的一站式平台。
支援多租戶（multi-tenant）、LINE 深度整合、AI 出題、9 種主題風格。

---

## 技術棧

| 項目 | 技術 | 版本 |
|------|------|------|
| 框架 | Next.js（App Router + SSR） | 16.1.7 |
| 前端 | React + TypeScript | 19.2.3 / TS 5 |
| 樣式 | Tailwind CSS | 4 |
| 資料庫 | PostgreSQL（via Supabase） | pg 8.20 |
| 3D | Three.js + @react-three/fiber + drei | 0.183 |
| 圖表 | Recharts | 3.8 |
| 圖片 | Sharp | 0.34 |
| LINE | @line/liff | 2.27 |
| 儲存 | AWS S3 / Cloudflare R2 | |
| 簡訊 | AWS SNS | |
| 部署 | Zeabur（zbpack.json） | |
| CDN | Cloudflare（Bot Fight Mode 開啟） | |
| 認證 | 自建 JWT（jose）+ Cookie session | |

---

## 專案結構

```
insight-engine/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (admin)/                  # 管理後台（需登入）
│   │   │   ├── insight-admin/        # 主後台路徑
│   │   │   │   ├── page.tsx          # Dashboard 首頁
│   │   │   │   ├── surveys/          # 問卷管理（CRUD + 題目編輯 + 分流設定）
│   │   │   │   ├── responses/        # 填答列表 + 單筆詳情
│   │   │   │   ├── ai-settings/      # AI Key 設定（引導式 UI，支援 OpenAI/Anthropic/Google）
│   │   │   │   ├── funnel/           # 漏斗分析
│   │   │   │   ├── crosstab/         # 交叉分析
│   │   │   │   ├── tags/             # 標籤統計
│   │   │   │   ├── tag-rules/        # 標籤規則
│   │   │   │   ├── ab/              # A/B 比較
│   │   │   │   ├── line-settings/    # LINE 設定
│   │   │   │   ├── broadcast/        # LINE 推播
│   │   │   │   ├── notification-rules/ # 通知規則
│   │   │   │   ├── notification-styles/ # 通知樣式
│   │   │   │   ├── rich-menu/        # Rich Menu
│   │   │   │   ├── templates/        # 訊息模板
│   │   │   │   ├── utm/             # UTM 管理
│   │   │   │   ├── utm-links/        # UTM 連結
│   │   │   │   ├── webhooks/         # Webhook 設定
│   │   │   │   ├── theme-settings/   # 主題設定
│   │   │   │   ├── site-settings/    # Meta/OG 設定
│   │   │   │   ├── panel/           # 管理員面板
│   │   │   │   ├── team/            # 團隊管理
│   │   │   │   ├── tenants/          # 租戶管理
│   │   │   │   ├── waitlist/         # 封測名單
│   │   │   │   └── account/          # 帳號設定
│   │   │   └── layout.tsx            # Admin layout（Sidebar + 3D 背景）
│   │   ├── (public)/                 # Landing Page + 問卷填答
│   │   ├── (super-admin)/            # Super Admin 控制台
│   │   ├── api/
│   │   │   ├── admin/               # 管理 API（30+ 端點）
│   │   │   │   ├── ai-generate/     # AI 出題 POST
│   │   │   │   ├── ai-generate-meta/ # AI 生成 Meta/OG
│   │   │   │   ├── ai-settings/     # AI Key CRUD
│   │   │   │   ├── ai-usage/        # AI 使用統計
│   │   │   │   ├── surveys/         # 問卷 CRUD
│   │   │   │   ├── questions/       # 題目 CRUD
│   │   │   │   ├── responses/       # 填答管理
│   │   │   │   ├── stats/           # Dashboard 統計
│   │   │   │   ├── summary/         # 摘要
│   │   │   │   ├── funnel/          # 漏斗分析
│   │   │   │   ├── crosstab/        # 交叉分析
│   │   │   │   ├── tags/            # 標籤統計
│   │   │   │   ├── tag-rules/       # 標籤規則
│   │   │   │   ├── ab/             # A/B 比較
│   │   │   │   ├── broadcast/       # LINE 推播
│   │   │   │   ├── line/           # LINE 管理
│   │   │   │   ├── line-settings/   # LINE 設定
│   │   │   │   ├── notification-rules/
│   │   │   │   ├── notification-styles/
│   │   │   │   ├── notification-logs/
│   │   │   │   ├── rich-menu/
│   │   │   │   ├── templates/
│   │   │   │   ├── theme-settings/
│   │   │   │   ├── site-settings/
│   │   │   │   ├── utm/
│   │   │   │   ├── utm-links/
│   │   │   │   ├── waitlist/
│   │   │   │   ├── webhooks/
│   │   │   │   ├── team/
│   │   │   │   ├── tenants/
│   │   │   │   ├── export/
│   │   │   │   ├── upload/
│   │   │   │   ├── my-responses/
│   │   │   │   ├── system/
│   │   │   │   └── delete-account/
│   │   │   ├── auth/                # 認證
│   │   │   │   ├── login/          # 帳密登入
│   │   │   │   ├── register/       # 註冊（含邀請碼）
│   │   │   │   ├── me/             # 取得當前用戶
│   │   │   │   ├── logout/
│   │   │   │   ├── google/         # Google OAuth
│   │   │   │   ├── line/           # LINE OAuth
│   │   │   │   ├── send-code/      # 驗證碼
│   │   │   │   ├── reset-password/
│   │   │   │   └── switch-tenant/  # 切換租戶
│   │   │   ├── cron/               # 排程任務
│   │   │   │   ├── broadcast/      # 定時推播
│   │   │   │   ├── remind/         # 填答提醒
│   │   │   │   └── weekly-report/  # 週報
│   │   │   ├── line/               # LINE Webhook
│   │   │   │   ├── webhook/        # Insight Bot（管理員口令註冊）
│   │   │   │   │   ├── route.ts    # 管理員 Bot
│   │   │   │   │   ├── official/   # Official Bot（顧客自動回覆）
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── insight-engine/
│   │   │   │   │       └── route.ts
│   │   │   │   └── liff-bind/      # LIFF 綁定
│   │   │   ├── surveys/            # 公開問卷 API
│   │   │   │   ├── [slug]/         # GET 問卷
│   │   │   │   ├── submit/         # POST 提交
│   │   │   │   ├── progress/       # POST 中途儲存
│   │   │   │   ├── click/          # POST 點擊追蹤
│   │   │   │   └── theme/          # GET 主題
│   │   │   ├── primary-survey/     # 主問卷查詢
│   │   │   ├── super-admin/        # Super Admin API
│   │   │   └── waitlist/           # 封測報名
│   │   ├── [org]/                  # 組織動態路由
│   │   ├── login/                  # 登入頁
│   │   ├── register/               # 註冊頁
│   │   ├── super-login/            # Super Admin 登入
│   │   ├── forgot-password/
│   │   ├── privacy/                # 隱私權政策
│   │   ├── terms/                  # 使用條款
│   │   ├── cookies/                # Cookie 政策
│   │   ├── globals.css             # Tailwind + 全域樣式
│   │   ├── layout.tsx              # Root layout
│   │   └── opengraph-image.tsx     # OG 圖片生成
│   ├── components/
│   │   ├── admin/                  # 後台元件
│   │   │   ├── Sidebar.tsx         # 側邊欄（含問卷選擇器）
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── AdminBackground3D.tsx # Three.js 3D 背景
│   │   │   └── ...
│   │   ├── public/                 # 公開元件
│   │   └── survey/                 # 問卷填答元件
│   │       ├── SurveyEngine.tsx    # 問卷引擎主元件
│   │       ├── QuestionCard.tsx    # 題目卡片
│   │       └── ...
│   ├── hooks/
│   │   ├── useSurveyFlow.ts       # 問卷流程控制（含分流邏輯）
│   │   ├── useThemeInteraction.ts  # 主題互動效果
│   │   └── useGameState.ts        # 遊戲化狀態
│   ├── lib/
│   │   ├── aiService.ts           # ★ AI Key 管理 + 額度 + 日誌
│   │   ├── aiCrypto.ts            # API Key AES 加解密
│   │   ├── analyzeResponse.ts     # 回覆分析
│   │   ├── stats.ts               # ★ 統計引擎（dashboard/漏斗/交叉/標籤/UTM/CSV）
│   │   ├── surveyRepo.ts          # ★ 問卷 DB 操作（CRUD + 分流 + A/B）
│   │   ├── surveyConfig.ts        # 問卷靜態設定（MVP_SURVEY）
│   │   ├── themes.ts              # 9 種主題定義
│   │   ├── line.ts                # LINE Messaging API 封裝
│   │   ├── lineConfig.ts          # LINE 設定管理（從 DB 讀取）
│   │   ├── lineNotify.ts          # LINE 通知發送
│   │   ├── lineStyles.ts          # LINE Flex Message 樣式
│   │   ├── lineToken.ts           # LINE 身份 Token（HMAC 簽名）
│   │   ├── notificationEngine.ts  # 通知觸發引擎
│   │   ├── webhook.ts             # Webhook 發送
│   │   ├── db.ts                  # PostgreSQL 連線池（pg Pool）
│   │   ├── auth.ts                # 認證工具（密碼雜湊、邀請碼）
│   │   ├── jwt.ts                 # JWT 簽發/驗證（jose）
│   │   ├── tenant.ts              # 租戶 context（從 request header 讀取）
│   │   ├── email.ts               # Email 發送
│   │   ├── sms.ts                 # 簡訊發送（AWS SNS）
│   │   ├── r2.ts                  # Cloudflare R2 / S3 儲存
│   │   ├── fingerprint.ts         # 填答指紋
│   │   ├── optionEmoji.ts         # 選項 Emoji 對應
│   │   ├── personalityAnalyzer.ts # 人格分析
│   │   ├── supabase.ts            # Supabase client
│   │   └── supabaseAdmin.ts       # Supabase admin client
│   ├── types/
│   │   ├── survey.ts              # 問卷型別（見下方詳解）
│   │   ├── admin.ts               # 管理型別
│   │   ├── tags.ts                # 標籤型別
│   │   └── index.ts               # 統計型別（DashboardStats 等）
│   ├── constants/
│   │   └── index.ts               # TREND_DAYS、MVP_SURVEY_SLUG
│   └── middleware.ts              # ★ 路由中間件（JWT 認證 + 租戶路由 + rewrite）
├── supabase/                      # DB Migration SQL（20+ 檔案）
├── scripts/                       # 工具腳本
├── public/                        # 靜態資源
├── package.json
├── next.config.ts
├── tsconfig.json
└── zbpack.json                    # Zeabur 部署設定
```

---

## 核心型別定義

### 問卷（src/types/survey.ts）

```typescript
type QuestionType = 'single' | 'multiple' | 'text'

interface Question {
  key: string             // q1, q2, q3...
  type: QuestionType
  content: string         // 題目文字
  options: QuestionOption[] // label + value + emoji
  isRequired: boolean
  maxSelections?: number   // 多選題限制
  route?: string           // 分流：'all' | 'A' | 'B' | 'C'
  chapter?: string         // 章節名稱
  emoji?: string           // 場景 emoji
  narrative?: string       // 場景敘事
}

interface BranchRule {
  id: string
  branchKey: string        // 分流依據的題目 key
  routes: Record<string, string[]> // { "A": ["選項1","選項2"], "B": ["選項3"] }
}

type BranchConfig = BranchRule[] | { branchKey: string; routes: Record<string, string[]> }

interface SurveyConfig {
  slug: string
  title: string
  subtitle: string
  coverTitle: string
  coverSubtitle: string
  startButtonText: string
  doneTitle: string
  doneSubtitle: string
  questions: Question[]
  branchConfig?: BranchConfig
}

type SurveyTheme = 'default' | 'game' | 'cyber' | 'ancient' | 'sakura' | 'ocean' | 'forest' | 'candy' | 'noir'
```

### 統計（src/types/index.ts）

```typescript
interface DashboardStats {
  totalResponses: number
  completedResponses: number
  completionRate: number
  todayResponses: number
  dailyTrend: DailyTrendItem[]
  topFeatures: FeatureCount[]
  emotionDistribution: TagDistribution[]
}
```

---

## 資料庫結構

| 表 | 用途 | 關鍵欄位 |
|---|---|---|
| `surveys` | 問卷主表 | id, slug, title, status, branch_config(JSON), variant_group, tenant_id, is_primary, display_order, scheduled_start/end |
| `questions` | 題目 | id, survey_id, key, type, content, options(JSON), order_index, is_required, max_selections, route, chapter, emoji, narrative |
| `responses` | 填答紀錄 | id, survey_id, status, last_step, route, source, utm_source/medium/campaign, fingerprint, submitted_at, tenant_id |
| `answers` | 答案 | response_id, question_key, value(JSON) |
| `user_tags` | 自動標籤 | response_id, tag_key, tag_value, tenant_id |
| `tag_rules` | 標籤規則 | survey_id, question_key, option_value, tag_key, tag_value |
| `click_events` | 點擊追蹤 | response_id, event_type, clicked_at |
| `ai_provider_configs` | AI Key（加密） | tenant_id, provider, default_model, encrypted_api_key, encryption_iv/tag, is_primary, is_active |
| `ai_usage_logs` | AI 使用日誌 | tenant_id, action, key_source, provider, model, survey_id, prompt_tokens, completion_tokens, is_free |
| `survey_theme_settings` | 主題設定 | survey_slug, default_theme, available_themes, allow_user_choice, theme_intensity |
| `notification_rules` | 通知規則 | |
| `notification_logs` | 通知日誌 | |
| `broadcast_tasks` | 推播任務 | |
| `line_configs` | LINE 設定 | config_key, config_value（INSIGHT_CHANNEL_SECRET 等） |
| `line_users` | LINE 好友 | line_user_id, display_name |
| `line_admins` | LINE 管理員 | line_user_id, active |
| `admin_users` | 管理員 | id, username, password_hash, line_user_id, role |
| `admin_invites` | 邀請碼 | token, line_user_id, display_name, expires_at, used |
| `tenant_users` | 租戶用戶關聯 | user_id, tenant_id, role |
| `templates` | 訊息模板 | |
| `utm_links` | UTM 連結 | |
| `site_settings` | 站台設定 | key, value, tenant_id |
| `waitlist` | 封測名單 | |

---

## AI 基礎設施（可複用）

### aiService.ts

```typescript
// 取得可用 AI Key（優先用戶自己的 > 平台 Key）
getActiveAiKey(tenantId): Promise<AiKeyResult | null>

// 取得平台 Key（env OPENAI_API_KEY）
getPlatformKey(): AiKeyResult | null

// 檢查免費額度
checkFreeQuota(tenantId, action: 'generate'|'regenerate'|'generate_meta'|'regenerate_meta'): Promise<boolean>

// 記錄使用
logAiUsage({ tenantId, action, keySource, provider, model, surveyId, promptTokens, completionTokens, isFree })

// 使用統計
getAiUsageStats(tenantId): Promise<{ usage, freeQuota }>
```

### ai-generate/route.ts

```typescript
// 支援 OpenAI-compatible + Anthropic 兩種 API
callOpenAI(apiKey, model, userPrompt)
callAnthropic(apiKey, model, userPrompt)

// 輸出驗證：移除 markdown code block → 提取 JSON array → 驗證結構
parseGeneratedQuestions(raw: string): GeneratedQuestion[]
```

**新功能複用模式：**
1. 取 key：`getActiveAiKey(tenantId)` → fallback `getPlatformKey()`
2. 呼叫 AI：`callOpenAI()` 或 `callAnthropic()`
3. 記日誌：`logAiUsage()`

---

## LINE Bot 架構

### 兩個 Bot

| Bot | 路由 | Channel | 用途 |
|-----|------|---------|------|
| Insight Bot | `/api/line/webhook` | @762wxvfb | 管理員：口令「我要當足跡管理員」→ 註冊連結 |
| Official Bot | `/api/line/webhook/official` | @474iwlht | 顧客：關鍵字自動回覆（問卷/封測/毛行天下/官網/最新消息/聯絡） |

### Official Bot 自動回覆邏輯

`getAutoReply(text, userId)` 函式用 regex 匹配關鍵字，回傳固定文字。
問卷連結透過 `buildSurveyLink(userId)` 生成，帶 LINE Token + UTM。

### LINE 設定管理

`lineConfig.ts` 的 `getLineConfig(key)` 從 DB `line_configs` 表讀取設定值。
Key 包含：`INSIGHT_CHANNEL_SECRET`、`INSIGHT_CHANNEL_ACCESS_TOKEN`、`OFFICIAL_CHANNEL_SECRET`、`OFFICIAL_CHANNEL_ACCESS_TOKEN`。

---

## 中間件（middleware.ts）

### 路由規則

- `/login`、`/register`、`/api/auth/*` → 放行
- `/insight-admin/*` → JWT 認證 → 租戶路由 rewrite
  - 支援 `/insight-admin/{tenant-slug}/surveys` 格式
  - tenant slug 透過 `KNOWN_ADMIN_PAGES` Set 排除已知頁面名
  - 認證資訊注入 headers：`x-tenant-id`、`x-user-id`、`x-user-role`、`x-user-name`
- `/api/admin/*` → JWT 認證 → 注入 tenant headers
- `/snowrealm-insight-ctrl/*` → super_admin 角色檢查

### 讀取租戶 context

`lib/tenant.ts` 的 `getTenantContext()` 從 request headers 讀取 `x-tenant-id`、`x-user-id`、`x-user-role`。

---

## 編碼慣例

### 檔案命名
- 頁面：`page.tsx`（Next.js App Router 慣例）
- 元件：PascalCase（`SurveyEngine.tsx`）
- 工具：camelCase（`aiService.ts`）
- API route：`route.ts`

### DB 操作
- 使用 `lib/db.ts` 的 `query()`、`queryOne()`、`execute()`
- 參數化查詢（`$1`、`$2`...），防止 SQL injection
- 複雜查詢在 `lib/stats.ts` 和 `lib/surveyRepo.ts` 中封裝

### API 慣例
- 統一用 `NextRequest` / `NextResponse`
- 認證：從 `getTenantContext()` 取得 tenantId
- 錯誤回傳：`{ error: '訊息' }` + HTTP status
- 成功回傳：直接回傳資料 JSON

### 前端慣例
- 所有 admin 頁面是 `'use client'`
- 資料載入用 `useEffect` + `fetch`
- 表單用 `useState`
- 深色主題，CSS 變數控制主題色

### 語言
- UI 文字：繁體中文
- 程式碼：英文
- 註解：中文為主

---

## 開發指令

```bash
npm run dev          # 開發伺服器
npm run build        # 生產建置
npm run lint         # ESLint
npm run db:push      # 推送 DB schema
npm run deploy       # 部署到 Zeabur
```

---

## 環境變數

```
DATABASE_URL          # PostgreSQL 連線字串
NEXT_PUBLIC_BASE_URL  # https://insight.snowrealm.pet
OPENAI_API_KEY        # 平台 AI Key（gpt-4o-mini）
AI_ENCRYPTION_KEY     # AI Key 加密金鑰
JWT_SECRET            # JWT 簽名金鑰
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
R2_ACCOUNT_ID / R2_ACCESS_KEY / R2_SECRET_KEY / R2_BUCKET
AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION
```

---

## 當前開發重點（Phase 1）

### 1. Dashboard 統計升級

在 `src/lib/stats.ts` 新增：
- `getAvgCompletionTime()` — 平均填答時間
- `getResponseVelocity()` — 回覆速度曲線（0-1h / 1-6h / 6-24h / 24h+）
- `getResponseQuality()` — 數據品質分數（填答過短 / 同答案模式 / 開放題空白）
- 修改 `getFunnelStats()` — 新增 `isHotspot` 布林（dropOffRate > 0.2）

### 2. AI 對話式問卷生成

新增：
- `src/lib/aiSurveyPrompt.ts` — System Prompt（含完整問卷結構規格 + 分流規則 + 主題推薦）
- `src/app/api/admin/ai-chat-generate/route.ts` — 對話式生成 API
- `src/components/admin/AiSurveyChat.tsx` — 對話框 UI
- 修改 `surveys/page.tsx` — 新增「AI 對話建立」入口

生成的 JSON 結構：
```json
{
  "survey": { "slug", "title", "subtitle", "coverTitle", "coverSubtitle", "startButtonText", "doneTitle", "doneSubtitle", "theme" },
  "questions": [{ "id", "type", "text", "required", "group", "options" }],
  "branching": { "enabled", "rules": [{ "triggerQuestionId", "conditions": [{ "answer", "targetGroup" }] }] },
  "tags": [{ "questionId", "rules": [{ "answer", "tag" }] }],
  "og": { "ogTitle", "ogDescription", "ogImageUrl" }
}
```

複用 `aiService.ts` 的 key 管理 + quota + logging。

### 3. AI 洞察報告（Layer 2）

新增：
- `src/lib/insightEngine.ts`
  - `buildInsightSummary(surveyId, tenantId)` — 呼叫現有 stats 函式，壓縮成 ~2000 tokens 摘要
  - `generateInsightReport(summary)` — 呼叫 AI 產出報告 JSON
- `src/app/api/admin/ai-insight/route.ts` — POST { surveyId }
- `src/app/(admin)/insight-admin/insight/page.tsx` — 報告頁面

### 4. LINE Bot 升級

修改 `src/app/api/line/webhook/official/route.ts`：
- 在 `getAutoReply()` 前加入 Bot 狀態機檢查
- 新增對話式填答 Session 管理

新增：
- `src/lib/lineBotEngine.ts` — Bot 核心（狀態機 + 問卷推進 + 分流）
- DB migration：`line_survey_sessions` 表

---

## 注意事項

- DB 操作一律用 `lib/db.ts` 的函式，不要直接 import pg
- AI 呼叫一律透過 `aiService.ts` 取 key，不要硬編碼 API Key
- 新增 admin 頁面要加到 middleware.ts 的 `KNOWN_ADMIN_PAGES` Set
- 新增 API route 如果需要認證，確保路徑在 `/api/admin/` 下
- LINE webhook 需要驗證 signature（HMAC-SHA256）
- 前端一律用繁體中文
- 部署用 `npm run deploy`，Zeabur 會自動讀取 zbpack.json

---

## Clean Code 規範（摘自 /docs/clean_code.md）

> 完整規範見 `../docs/clean_code.md`，以下為 AI 協作時的執行摘要。

### 核心原則

優先順序：**可讀性 > 可維護性 > 效能優化 > 炫技寫法**

### 命名

- 變數、function、型別名稱必須清楚表達用途，禁止 `data`、`temp`、`obj`、`item`、`doThing`
- function 名稱以動詞開頭（`createSurvey`、`updateQuestion`）
- boolean 以 `is` / `has` / `can` / `should` 開頭
- 陣列用複數（`surveys`、`questions`、`tagRules`）

### 函式

- 單一職責，一個 function 只做一件事
- 每個 function 盡量 10～20 行，**上限 30 行**
- 巢狀邏輯不超過 **2 層**
- 參數超過 3 個改用物件參數

### 分層（本專案對應）

| 責任 | 位置 |
|------|------|
| UI 顯示 | `components/` |
| 頁面資料組裝 | `app/(admin)/*/page.tsx` |
| API 呼叫邏輯 | `app/api/*/route.ts` |
| 商業邏輯 / DB | `lib/` |
| 型別定義 | `types/` |
| 共用常數 | `constants/` |

- **component 內不得寫複雜業務邏輯，不得直接做 DB 查詢**
- **`lib/` 函式不得操作 UI 狀態或回傳 NextResponse**
- 單一 component 盡量不超過 **150 行**

### 型別安全

- 禁止濫用 `any`；若因第三方限制暫用須加註解
- 所有 API response 必須定義型別（用 `as` 明確轉型，不裸用 `response.json()`）
- 公開 function 必須有明確 return type

### 錯誤處理

- 所有 API / I/O 操作都必須有 `try/catch`，不可 silent fail
- API route 錯誤一律回傳 `{ error: '...' }` + 適當 HTTP status
- 前端錯誤文案對用戶說話，`console.error` log 對工程師說話

### 禁止事項

- God function / God component（超長、超多責任）
- UI / API / business logic 混寫在同一層
- 魔法值（`0.2`、`3600`、`'completed'` 等）散落在程式碼中，應提取為具名常數
- 相同商業規則重複出現 2 次以上，應抽共用函式
- 深層巢狀超過 3 層

### 合併前自查清單

1. 這段 code 能不能一眼看懂？
2. 三天後我還敢不敢改它？
3. 改這裡會不會爆別的地方？
4. 命名是否清楚到幾乎不需要註解？
5. UI、邏輯、資料存取是否已分層？
6. 若交給另一個人或另一個 AI，他能否快速接手？

**只要其中 2 題答不出「是」，就不算乾淨。**
