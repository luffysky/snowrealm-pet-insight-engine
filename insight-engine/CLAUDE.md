# CLAUDE.md — SnowRealm Insight Engine

> 本文件供 Claude Code 讀取，讓 AI 完全理解專案結構後直接開始寫 code。
> 最後更新：2026-03-23

---

## 專案概述

**SnowRealm Insight Engine** 是 SnowRealm 生態系旗下的 AI-Native 智慧問卷引擎。
它是一套**通用型 SaaS 平台**，可服務任何行業的組織。

品牌階層：
- **SnowRealm**（母品牌）— 多宇宙數位存在生態系
  - **Insight Engine**（本產品）— AI 智慧問卷引擎，通用型，跨行業
  - **毛行天下**（垂直產品）— 寵物足跡平台，是 Insight Engine 的第一個租戶
  - 其他生態產品（彩虹國、FlowLightAI、CoinBeast 等）

核心定位：從問卷建立 → 數據收集 → AI 分析 → 商業建議的一站式平台。
支援多租戶（multi-tenant）、LINE 深度整合、AI 出題、9 種主題風格。

**重要原則：Insight Engine 是通用平台，不是寵物產業專用工具。**
毛行天下只是使用 Insight Engine 的一個租戶，跟其他組織（草帽海賊團等）地位相同。
系統層的程式碼不應該有任何行業特定的硬編碼。

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

## Phase 1 完成紀錄（2026-03-23）

### ✅ 已完成項目

#### 1. Dashboard 統計升級
- `stats.ts` 新增 `getAvgCompletionTime()` — 從 responses 表計算 submitted_at - created_at 平均秒數
- `stats.ts` 新增 `getResponseVelocity()` — 回覆速度曲線，分 0-1h / 1-6h / 6-24h / 24h+ 四個 bucket
- `stats.ts` 新增 `getResponseQuality()` — 數據品質分數（開放題空白 40% 權重 + 回覆過短 30% + 同答案模式 30%）
- `getFunnelStats()` 新增 `isHotspot` 布林（dropOffRate > 0.2 標記為熱點）
- `DashboardStats` 型別擴展：新增 `avgCompletionTime`、`responseVelocity`、`responseQuality`
- `types/index.ts` 新增 `ResponseVelocityItem`、`ResponseQuality` 型別

#### 2. AI 對話式問卷生成
- 新增 `src/lib/aiSurveyPrompt.ts` — 完整 System Prompt，含題型定義、9 種主題、分流規則、`<SURVEY_JSON>` 標記輸出格式
- 新增 `src/app/api/admin/ai-chat-generate/route.ts` — 多輪對話 API，支援 OpenAI + Anthropic，複用 aiService.ts
- 新增 `src/components/admin/AiSurveyChat.tsx` — 對話框 UI 元件
- 修改 `surveys/page.tsx` — 新增「AI 對話建立」入口
- `parseSurveyJson()` 從 AI 回覆中提取 `<SURVEY_JSON>` 標記內的 JSON

#### 3. AI 洞察報告（Layer 2）
- 新增 `src/lib/insightEngine.ts`
  - `buildInsightSummary()` — 呼叫 getDashboardStats + getFunnelStats + getTagDistribution + getUtmAnalytics，壓縮成 ~2000 tokens 摘要
  - `generateInsightReport()` — 呼叫 AI 產出結構化報告（summary + highlights + recommendations + funnelInsight + audienceInsight）
  - 支援 OpenAI + Anthropic 雙 provider
  - `parseInsightReport()` 輸出驗證
- 新增 `src/app/api/admin/ai-insight/route.ts` — POST { surveyId } → 壓縮 → AI → 報告
- 新增 `src/app/(admin)/insight-admin/insight/page.tsx` — 洞察報告頁面（HighlightCard + RecommendationCard + InsightSection）

#### 4. LINE Bot 對話式填答
- 新增 `src/lib/lineBotEngine.ts` — 完整狀態機引擎
  - `getActiveSession()` — 查詢進行中的 session
  - `startSurveySession()` — 建立 response + session → 發送第一題
  - `processUserAnswer()` — 解析答案 → 儲存 → 偵測分流 → 推進下一題
  - `abandonSession()` — 中止填答
  - 支援：single/multiple/text 題型、分流偵測、選填跳過、自動貼標籤
- 修改 `src/app/api/line/webhook/official/route.ts`
  - 新增 `handleTextMessage()` 函式取代直接呼叫 `getAutoReply()`
  - 優先偵測「離開」→ abandon session
  - 偵測「LINE填答」→ start session
  - 有活躍 session → processUserAnswer
  - 無 session → 原有關鍵字自動回覆
  - `getAutoReply` 的問卷回覆新增 LINE 填答提示
- 需要 DB migration：`line_survey_sessions` 表（見下方）

#### 5. 其他改動
- `middleware.ts` — 新增 `'insight'` 到 `KNOWN_ADMIN_PAGES` Set
- `types/admin.ts` — 新增 admin 相關型別
- `layout.tsx` — Sidebar 新增洞察報告入口

### ⚠️ 需要手動執行的 DB Migration

```sql
-- LINE Bot 對話式填答 Session 表
CREATE TABLE IF NOT EXISTS line_survey_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  survey_id UUID NOT NULL REFERENCES surveys(id),
  response_id UUID NOT NULL REFERENCES responses(id),
  current_step INT NOT NULL DEFAULT 0,
  route TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_line_sessions_user_status ON line_survey_sessions (line_user_id, status);
CREATE INDEX idx_line_sessions_survey ON line_survey_sessions (survey_id);
```

---

## 當前開發重點（Phase 2）— 智慧分析 + LINE Bot 強化 + 自動化

### 開發優先順序

```
P0（立即）→ P1（本週）→ P2（下週）→ P3（Phase 3 準備）
```

---

### P-URGENT：上線前必修（權限、LINE、連結、帳號）

> 以下問題來自實際後台截圖，優先級高於所有新功能。

#### U.1 權限與帳號隔離 ★ 已定位根因

**問題：** 租戶選單顯示了所有組織（Luffy Lin、毛行天下×2、草帽海賊團、賴咚咚、賴楠楠）。

**根因：** `src/app/api/auth/me/route.ts` 第 42-44 行：

```typescript
if (ctx.role === 'super_admin') {
  tenants = await query(`SELECT slug, name FROM tenants WHERE is_active = true ORDER BY name`)
}
```

你的帳號是 `super_admin`，所以 `/api/auth/me` 回傳了 **所有 active tenant**。這在 super admin 語境下「技術上正確」，但日常操作時不該看到所有組織。

**修復方案（擇一）：**

方案 A（推薦）：super_admin 在一般後台 `/insight-admin` 只看自己有權限的租戶，在超級後台 `/snowrealm-insight-ctrl` 才看全部。

```
檔案：src/app/api/auth/me/route.ts

修改：
  // 加一個 query param 讓前端區分場景
  const url = new URL(request.url)
  const showAll = url.searchParams.get('scope') === 'super'

  if (ctx.role === 'super_admin' && showAll) {
    tenants = await query(`SELECT slug, name FROM tenants WHERE is_active = true ORDER BY name`)
  } else {
    tenants = await query(
      `SELECT t.slug, t.name FROM tenant_users tu JOIN tenants t ON tu.tenant_id = t.slug WHERE tu.user_id = $1 ORDER BY t.name`,
      [ctx.userId]
    )
  }
```

方案 B（最小改動）：維持現狀不改，super_admin 本來就該看到全部。把「毛行天下重複」的問題修掉就好。

**總後台權限限制：**

```
檔案：src/middleware.ts 第 109-123 行

目前已有 super_admin 角色檢查。如果要額外比對 LINE User ID：
  const SUPER_LINE_ID = process.env.SUPER_ADMIN_LINE_ID
  if (SUPER_LINE_ID) {
    // 查 DB 確認該 user 的 line_user_id === SUPER_LINE_ID
  }
但現有的 role 機制已經足夠安全，建議不加。
```

#### U.2 新帳號初始化問題 ★ 已定位

**問題：** 草帽海賊團 AI 設定顯示「0 / 1 可用」。

**分析：** `aiService.ts` 的邏輯是正確的：
- `FREE_GENERATE_LIMIT = 1`，`checkFreeQuota()` 查 `ai_usage_logs WHERE is_free = true` 的次數
- 如果草帽海賊團已經用過 1 次免費生成，「0 / 1 可用」= 剩餘 0 次 / 上限 1 次，**這是正確的**

**確認項目：**
- `ai-settings/page.tsx` 前端顯示的文案是「X / Y 可用」→ 需確認 X 是「剩餘」還是「已用」
- 如果顯示的是 `freeQuota.generate.limit - freeQuota.generate.used` → 0 = 已用完 ✓
- 如果顯示的是 `freeQuota.generate.used` → 0 = 從未使用過 ✗ 需修

```
檔案：src/app/(admin)/insight-admin/ai-settings/page.tsx

搜尋 freeQuota 相關顯示邏輯，確認計算方式。
如果是 bug，修正為：
  剩餘 = stats.freeQuota.generate.limit - stats.freeQuota.generate.used
  顯示：`${剩餘} / ${stats.freeQuota.generate.limit} 可用`
```

**新帳號 LINE Token 預設值：**
```
檔案：src/app/api/auth/register/route.ts

第 147-154 行建立 admin_users 時沒有帶 line_user_id 欄位 → 預設為 NULL ✓
這個沒問題，除非有其他地方在註冊流程中意外寫入 line_user_id。
```

#### U.3 服務狀態顯示錯誤 ★ 已定位根因

**問題：** 管理員面板的服務狀態顯示 LINE Official / LINE Insight / LIFF / OpenAI 全部「未設定」紅燈，但 LINE 設定頁面顯示「連線成功」。

**根因：** `src/app/api/admin/system/route.ts` 第 62-67 行：

```typescript
// 只查 DB 的 line_configs，不 fallback 到 ENV
const tenantLineOfficial = await queryOne(
  `SELECT id FROM line_configs WHERE tenant_id = $1 AND config_key = 'OFFICIAL_CHANNEL_ACCESS_TOKEN'`, [tenantId]
)
```

LINE Token 是存在 ENV 環境變數（截圖顯示所有 Token 都標 `ENV`），但 panel 的系統狀態只查 DB `line_configs` 表。而 LINE 設定頁面（`line-settings/page.tsx`）呼叫 `getLineConfig()` 會 fallback 到 ENV，所以那邊顯示「連線成功」。

**修復：** `src/app/api/admin/system/route.ts` 第 62-98 行

```typescript
// 改成同時查 DB 和 ENV（與 lineConfig.ts 的 getLineConfig 邏輯一致）
import { getLineConfig } from '@/lib/lineConfig'

// 替換原本的 tenantLineOfficial / tenantLineInsight 查詢：
const [officialToken, insightToken] = await Promise.all([
  getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN'),  // 自動 fallback DB → ENV
  getLineConfig('INSIGHT_CHANNEL_ACCESS_TOKEN'),
])

// env 物件改為：
env: {
  hasLineOfficial: !!officialToken,
  hasLineInsight: !!insightToken,
  hasLiff: !!process.env.NEXT_PUBLIC_LIFF_ID,
  hasOpenAI: !!process.env.OPENAI_API_KEY || !!(await getActiveAiKey(tenantId)),  // 也查 DB
  hasDbUrl: !!process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV,
  baseUrl: `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/insight-admin/${tenantId}`,
}
```

#### U.4 LINE Token 視覺化

**問題：** LINE 設定頁面需要更清楚的 Token 狀態顯示。

```
檔案：src/app/(admin)/insight-admin/line-settings/page.tsx

修改：
  - 未填寫的欄位：顯示灰色佔位文字「尚未設定」+ 灰色圓點
  - 已填寫（來自 ENV）：顯示橘色 ENV 標籤（截圖 3 已經有了 ✓）
  - 已填寫（來自 DB）：顯示綠色 DB 標籤
  - 連線成功：綠色勾勾（截圖 3 已經有了 ✓）
  - 連線失敗：紅色叉叉 + 錯誤訊息

目前截圖 3 的 UI 看起來已經不錯，主要是確保 panel 頁面的狀態跟這裡一致。
```

#### U.5 Zeabur URL 404 — 非程式碼問題

**問題：** 截圖 9 顯示 `insight-engine-sonwrealm-pet.zeabur.app` 出現 404。

**分析：** 這不是程式碼 bug。Zeabur 自動分配的 URL 跟你的自訂域名 `insight.snowrealm.pet` 是兩個不同的入口。程式碼裡 `NEXT_PUBLIC_BASE_URL` 設的是 `https://insight.snowrealm.pet`（截圖 2 確認），所有生成的連結都會指向正確網域。

**建議（非必要）：**
- 在 Zeabur 面板設定：將原始 URL redirect 到 `insight.snowrealm.pet`
- 或者不管它，因為使用者不會接觸到 Zeabur 原始 URL

**真正需要檢查的 404 是 U.6（連結缺組織名稱）。**

#### U.6 連結缺少組織名稱導致 404

**問題：** 部分後台連結缺少租戶 slug 導致 404。

```
檔案：src/middleware.ts + src/components/admin/Sidebar.tsx

問題：
  middleware 支援 /insight-admin/{tenant-slug}/surveys 格式
  但如果前端生成連結時沒有帶 tenant-slug → 可能找不到頁面

修復：
  - Sidebar.tsx 的所有導航連結確保帶上當前 tenant slug
  - 或在 middleware 中，如果沒有帶 slug，自動 redirect 到使用者的第一個 tenant
    （目前 middleware 似乎已經有這個邏輯，確認是否正確運作）
  - 檢查問卷填寫後生成的分享連結是否正確
```

#### U.7 重複租戶名稱 ★ 已定位根因

**問題：** 截圖 4 顯示「毛行天下」出現兩次。

**根因：** `api/auth/me/route.ts` 第 43 行查 `tenants` 表回傳了兩筆同名但不同 slug 的記錄。

**診斷（請在 DB 跑以下 SQL）：**
```sql
SELECT id, slug, name, is_active, created_at FROM tenants WHERE name LIKE '%毛行天下%' ORDER BY created_at;
```

**修復：**
1. 如果其中一筆是測試用的 → 直接在 DB 刪除或設 `is_active = false`
2. 如果兩筆都在用 → 需要決定合併到哪一筆，把相關的 `tenant_users`、`surveys`、`responses` 等資料遷移過去
3. 預防再次發生：`api/auth/register/route.ts` 第 129 行已經有 slug 唯一性檢查，但 **名稱** 沒有做唯一檢查。建議加上：
```typescript
// 在 register route 的 slug 檢查後面加：
const nameExists = await queryOne(`SELECT id FROM tenants WHERE name = $1`, [orgName])
if (nameExists) return NextResponse.json({ error: `組織名稱「${orgName}」已存在` }, { status: 409 })
```

#### U.8 客服系統 — 完整設計

##### 架構概覽

```
填答者/顧客                    管理員
    │                            │
    │ LINE 傳訊息                │ 後台查看 + 回覆
    ▼                            ▼
┌──────────┐    DB     ┌─────────────────────┐
│ LINE Bot │ ──────→   │ support_tickets 表   │
│ (Official│ ←──────   │ support_messages 表  │
│  Webhook)│           └─────────────────────┘
└──────────┘                     ▲
                                 │
                    ┌────────────┘
                    │
              ┌─────────────┐
              │ 後台客服頁面 │
              │ /support     │
              └─────────────┘
```

##### DB Migration

```sql
-- 客服工單
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  -- 來源
  channel TEXT NOT NULL DEFAULT 'line',  -- 'line' | 'web' | 'email'
  line_user_id TEXT,
  line_display_name TEXT,
  email TEXT,
  -- 狀態
  status TEXT NOT NULL DEFAULT 'open',   -- 'open' | 'in_progress' | 'resolved' | 'closed'
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low' | 'normal' | 'high' | 'urgent'
  -- 分類
  category TEXT,                          -- 'bug' | 'feature' | 'question' | 'complaint' | 'other'
  subject TEXT,                           -- 工單標題（從第一條訊息自動截取或 AI 生成）
  -- 指派
  assigned_to UUID REFERENCES admin_users(id),
  -- 關聯
  survey_id UUID REFERENCES surveys(id),  -- 如果是從問卷來的
  response_id UUID REFERENCES responses(id),
  -- 時間
  first_response_at TIMESTAMPTZ,          -- 首次回覆時間（計算回覆速度）
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 客服訊息（雙向）
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  -- 誰發的
  sender_type TEXT NOT NULL,              -- 'customer' | 'admin' | 'system' | 'ai'
  sender_id TEXT,                         -- line_user_id 或 admin_user_id
  sender_name TEXT,
  -- 內容
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text', -- 'text' | 'image' | 'sticker' | 'ai_suggestion'
  -- 元資料
  metadata JSONB,                         -- LINE message ID、圖片 URL 等
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_tickets_tenant_status ON support_tickets (tenant_id, status);
CREATE INDEX idx_tickets_line_user ON support_tickets (line_user_id);
CREATE INDEX idx_messages_ticket ON support_messages (ticket_id, created_at);

-- 快速回覆模板
CREATE TABLE IF NOT EXISTS support_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  title TEXT NOT NULL,                    -- 模板名稱（如「感謝回饋」）
  content TEXT NOT NULL,                  -- 模板內容
  category TEXT,                          -- 對應的工單分類
  usage_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

##### 後端 API

```
新增：src/app/api/admin/support/route.ts

GET /api/admin/support
  - 列出該租戶的所有工單
  - Query params: status, priority, category, page, pageSize
  - 回傳：工單列表 + 未讀數 + 統計（開放/進行中/已解決）

GET /api/admin/support/[ticketId]/route.ts
  - 取得單一工單 + 所有訊息

POST /api/admin/support/[ticketId]/reply/route.ts
  - 管理員回覆
  - body: { content, contentType }
  - 同時透過 LINE Push Message API 發送給顧客
  - 更新 ticket.first_response_at（如果是首次回覆）

PATCH /api/admin/support/[ticketId]/route.ts
  - 更新工單狀態、優先級、分類、指派

GET /api/admin/support/stats/route.ts
  - 客服統計：平均回覆時間、解決率、工單量趨勢

新增：src/app/api/admin/support/templates/route.ts
  - GET: 列出快速回覆模板
  - POST: 新增模板
  - DELETE: 刪除模板
```

##### 後台頁面

```
新增：src/app/(admin)/insight-admin/support/page.tsx

UI 設計：
┌─────────────────────────────────────────────────────┐
│ 📬 客服中心                          [+ 新增工單]    │
├───────────┬─────────────────────────────────────────┤
│ 工單列表   │  對話詳情                               │
│           │                                         │
│ 🔴 #127  │  👤 LINE 用戶: Mao Lover               │
│ 問題反映  │  📋 來自問卷: MVP 問卷                  │
│ 3 分鐘前  │  🏷️ 分類: question → [修改]            │
│           │                                         │
│ 🟡 #126  │  ─── 對話紀錄 ───                       │
│ 功能建議  │                                         │
│ 1 小時前  │  [顧客] 請問什麼時候會上線？            │
│           │  [系統] 工單已建立 #127                  │
│ 🟢 #125  │  [AI 建議] 建議回覆：感謝您的關注...    │
│ 已解決    │                                         │
│ 昨天      │  ─── 回覆區 ───                        │
│           │  [快速回覆 ▼] [AI 草稿] [發送]         │
│           │  ┌─────────────────────────┐            │
│           │  │ 輸入回覆...              │            │
│           │  └─────────────────────────┘            │
├───────────┴─────────────────────────────────────────┤
│ 統計：開放 5 | 進行中 3 | 今日解決 12 | 平均回覆 8分 │
└─────────────────────────────────────────────────────┘

功能：
- 左側工單列表：篩選（狀態/優先級/分類）、搜尋、排序
- 右側對話：完整訊息歷史、顧客 LINE 資料、關聯問卷
- 快速回覆：從模板選擇，一鍵發送
- AI 草稿：根據顧客訊息 + 上下文，AI 自動生成建議回覆
- 狀態管理：拖拽或點擊改狀態
- 指派：多管理員時可指派給特定人
```

##### LINE Webhook 整合（接收顧客訊息 → 建立工單）

```
修改：src/app/api/line/webhook/official/route.ts

在 handleTextMessage() 函式中，加入客服訊息處理：

async function handleTextMessage(text, userId) {
  // 1. 離開填答
  if (ABANDON_KEYWORD.test(text)) { ... }

  // 2. 開始填答
  if (START_SURVEY_KEYWORD.test(text)) { ... }

  // 3. 正在填答
  const session = await getActiveSession(userId)
  if (session) return processUserAnswer(session, text)

  // 4.【新增】客服關鍵字
  if (/客服|幫助|問題|投訴|反映|help|support/i.test(text)) {
    return startSupportTicket(userId, text)
  }

  // 5.【新增】如果有開放中的客服工單 → 追加訊息
  const openTicket = await getOpenTicketByLineUser(userId)
  if (openTicket) {
    return appendSupportMessage(openTicket.id, userId, text)
  }

  // 6. 一般自動回覆
  return getAutoReply(text, userId)
}
```

```
新增：src/lib/supportEngine.ts

// 建立客服工單
export async function startSupportTicket(lineUserId: string, firstMessage: string): Promise<LineTextMessage[]> {
  const displayName = await getLineProfile(lineUserId)
  
  // 建立工單
  const ticket = await queryOne<{ id: string }>(
    `INSERT INTO support_tickets (tenant_id, channel, line_user_id, line_display_name, subject)
     VALUES ('default', 'line', $1, $2, $3) RETURNING id`,
    [lineUserId, displayName, firstMessage.slice(0, 50)]
  )
  
  // 存第一條訊息
  await execute(
    `INSERT INTO support_messages (ticket_id, sender_type, sender_id, sender_name, content)
     VALUES ($1, 'customer', $2, $3, $4)`,
    [ticket.id, lineUserId, displayName, firstMessage]
  )

  // 通知管理員（LINE Push）
  await notifyAdminNewTicket(ticket.id, displayName, firstMessage)

  return [{
    type: 'text',
    text: '📬 已收到你的訊息！\n\n我們的團隊會盡快回覆你。\n在等待期間，你可以繼續傳訊息補充說明 💬\n\n輸入「問卷」可回到問卷功能'
  }]
}

// 追加訊息到現有工單
export async function appendSupportMessage(ticketId: string, lineUserId: string, text: string): Promise<LineTextMessage[]> {
  await execute(
    `INSERT INTO support_messages (ticket_id, sender_type, sender_id, content)
     VALUES ($1, 'customer', $2, $3)`,
    [ticketId, lineUserId, text]
  )
  // 不回覆，避免打擾（除非超過 24 小時沒人理）
  return []
}

// 管理員回覆 → 透過 LINE Push 發給顧客
export async function sendAdminReply(ticketId: string, adminUserId: string, content: string): Promise<void> {
  const ticket = await queryOne<{ line_user_id: string; first_response_at: string | null }>(
    `SELECT line_user_id, first_response_at FROM support_tickets WHERE id = $1`, [ticketId]
  )
  if (!ticket?.line_user_id) throw new Error('工單無 LINE 用戶')

  // 存訊息
  await execute(
    `INSERT INTO support_messages (ticket_id, sender_type, sender_id, content)
     VALUES ($1, 'admin', $2, $3)`,
    [ticketId, adminUserId, content]
  )

  // 更新首次回覆時間
  if (!ticket.first_response_at) {
    await execute(
      `UPDATE support_tickets SET first_response_at = NOW(), status = 'in_progress' WHERE id = $1`,
      [ticketId]
    )
  }

  // LINE Push Message
  const token = await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN')
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      to: ticket.line_user_id,
      messages: [{ type: 'text', text: `💬 客服回覆：\n\n${content}` }]
    })
  })
}

// 查詢用戶是否有開放中的工單
export async function getOpenTicketByLineUser(lineUserId: string) {
  return queryOne<{ id: string }>(
    `SELECT id FROM support_tickets
     WHERE line_user_id = $1 AND status IN ('open', 'in_progress')
     ORDER BY created_at DESC LIMIT 1`,
    [lineUserId]
  )
}

// AI 建議回覆
export async function generateAiSuggestion(ticketId: string, aiKey: AiKeyResult): Promise<string> {
  const messages = await query<{ sender_type: string; content: string }>(
    `SELECT sender_type, content FROM support_messages WHERE ticket_id = $1 ORDER BY created_at ASC`,
    [ticketId]
  )
  
  const context = messages.map(m =>
    `${m.sender_type === 'customer' ? '顧客' : '客服'}：${m.content}`
  ).join('\n')

  const res = await callOpenAI(aiKey.apiKey, aiKey.model,
    `你是客服助手。根據以下對話，生成一段友善、專業的回覆建議（繁體中文，50 字以內）：\n\n${context}`
  )
  return res.content.trim()
}
```

##### 前端問卷完成頁整合

```
修改：src/app/(public)/done/ 相關元件

在完成頁新增：
  <div className="mt-6 text-center">
    <p className="text-sm text-white/50 mb-2">有任何問題？</p>
    <a href="https://line.me/R/ti/p/@474iwlht" className="text-emerald-400 underline">
      💬 LINE 聯繫客服
    </a>
  </div>
```

##### Sidebar 導航

```
修改：src/app/(admin)/layout.tsx

在 BASE_NAV_GROUPS 的系統區塊加入：
  { path: '/support', label: '📬 客服中心' },

修改：src/middleware.ts
  KNOWN_ADMIN_PAGES.add('support')
```

##### AI 輔助功能

```
客服頁面的 AI 功能：

1. AI 自動分類：新工單進來時，用 gpt-4o-mini 自動判斷分類（bug/feature/question/complaint）
   - 在 startSupportTicket() 裡非阻塞呼叫
   
2. AI 建議回覆：管理員查看工單時，自動生成回覆建議
   - 前端：「AI 草稿」按鈕 → 呼叫 /api/admin/support/[ticketId]/ai-suggest
   
3. AI 摘要：長對話自動生成摘要
   - 超過 5 條訊息時，自動產出一行摘要顯示在工單列表

成本：每筆工單的 AI 輔助約 $0.002，幾乎可忽略
```

#### U.9 解耦毛行天下硬編碼 — 讓 Insight Engine 成為通用平台

**問題：** 系統層有多處毛行天下/寵物產業的硬編碼，導致其他租戶使用時會看到不屬於他們的內容。

**需要改的檔案與具體位置：**

```
1. src/constants/index.ts
   - MVP_SURVEY_SLUG 指向毛行天下的問卷
   → 改成從 DB 動態取得當前租戶的主問卷，不要硬編碼

2. src/lib/surveyConfig.ts
   - MVP_SURVEY 是毛行天下的靜態問卷定義
   → 這個作為 fallback 可以保留，但不該是唯一來源
   → 確保所有呼叫 MVP_SURVEY 的地方都先查 DB

3. src/app/api/line/webhook/official/route.ts
   - 第 72 行歡迎訊息：「歡迎來到毛行天下！打造寵物足跡平台」
   - 第 150 行問卷回覆：「毛行天下 MVP 問卷」
   - 第 170 行介紹文案：「毛行天下 SnowRealm...讓那些重要的存在不被沖淡」
   - 第 195 行預設回覆：「我是毛行天下小助手」
   → 這些文案應該從 DB 的 site_settings 表讀取
   → 每個租戶設定自己的 Bot 歡迎訊息、介紹文案、問卷名稱

4. src/lib/lineBotEngine.ts
   - 第 233 行完成訊息：「期待讓毛孩的足跡被好好記住 🐾」
   → 改從 site_settings 讀取完成文案

5. src/app/(public)/page.tsx（Landing Page）
   - 如果有毛行天下的硬編碼文案 → 改為 SnowRealm Insight Engine
   - 但如果 Landing Page 就是毛行天下的前台 → 那這個不用改，由路由決定

6. src/app/api/line/webhook/route.ts
   - 第 7 行口令 '我要當足跡管理員' → 這是 Insight Bot 的管理口令
   → 可以保留，但建議也改成從 DB 讀取，讓每個租戶可自訂口令
```

**解耦策略：**

```
Step 1：site_settings 表新增欄位（如果還沒有）
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_welcome_message TEXT;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_intro_text TEXT;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_default_reply TEXT;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_completion_message TEXT;
  ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bot_survey_prompt TEXT;

Step 2：新增工具函式
  src/lib/tenantBranding.ts

  export async function getTenantBranding(tenantId: string) {
    const settings = await queryOne(
      `SELECT site_title, site_description, bot_welcome_message, bot_intro_text,
              bot_default_reply, bot_completion_message, bot_survey_prompt
       FROM site_settings WHERE tenant_id = $1`, [tenantId]
    )
    return {
      siteName: settings?.site_title ?? 'SnowRealm Insight Engine',
      siteDesc: settings?.site_description ?? 'AI 智慧問卷引擎',
      welcomeMsg: settings?.bot_welcome_message ?? `👋 歡迎！這是 ${settings?.site_title ?? '問卷系統'} 的官方帳號。`,
      introText: settings?.bot_intro_text ?? '我們提供 AI 智慧問卷服務。',
      defaultReply: settings?.bot_default_reply ?? '輸入「問卷」開始填寫，或輸入「客服」聯繫我們。',
      completionMsg: settings?.bot_completion_message ?? '🎉 感謝你的填寫！你的回覆已成功送出 💛',
      surveyPrompt: settings?.bot_survey_prompt ?? '填寫問卷，幫助我們更了解你的需求！',
    }
  }

Step 3：逐步替換硬編碼
  - Official Bot 的所有文案改為呼叫 getTenantBranding('default')
  - 之後每個租戶可以在後台的 site-settings 頁面自訂這些文案
  - 後台 site-settings 頁面新增 Bot 文案設定區塊
```

**優先級：** 中（不影響功能運作，但影響多租戶的品牌體驗。建議在 P1 時一起做。）

---

#### 0.1 Dashboard 頁面整合新指標

Phase 1 的 stats 函式已經回傳 `avgCompletionTime`、`responseVelocity`、`responseQuality`，
但 Dashboard 頁面（`insight-admin/page.tsx`）可能還沒顯示這些新數據。

```
檔案：src/app/(admin)/insight-admin/page.tsx

新增顯示：
- 「平均填答時間」卡片（格式化為 X 分 Y 秒）
- 「數據品質」卡片（分數 + 三個子指標）
- 「回覆速度」長條圖（Recharts BarChart，4 個 bucket）
- 漏斗分析的 hotspot 題目標紅（在 funnel 頁面也要改）
```

#### 0.2 AI 對話生成的問卷寫入 DB

`ai-chat-generate` 目前回傳 JSON 給前端，但前端需要把 `<SURVEY_JSON>` 解析出的問卷寫入 DB。

```
檔案：src/components/admin/AiSurveyChat.tsx

確認以下流程完整：
1. AI 回覆包含 <SURVEY_JSON> → parseSurveyJson() 提取
2. 前端顯示預覽（題目列表 + 設定摘要）
3. 使用者確認 → 呼叫 POST /api/admin/surveys 建立問卷
4. 呼叫 POST /api/admin/questions 批量建立題目
5. 如果有 branching → 呼叫 PUT /api/admin/surveys/{id} 更新 branch_config
6. 建立成功 → 導向問卷管理頁面

如果這個流程已經完成，跳過此項。
如果只做到顯示 JSON 預覽但沒有寫入 DB，需要補完。
```

#### 0.3 洞察報告頁面的問卷選擇器

```
檔案：src/app/(admin)/insight-admin/insight/page.tsx

確認：
- 頁面有問卷選擇器（從 useAdminSurvey context 取得當前問卷）
- 如果沒有選擇問卷，顯示提示
- 「產生報告」按鈕呼叫 POST /api/admin/ai-insight
- Loading 狀態處理
- 錯誤處理（API Key 未設定 → 引導到 ai-settings）
```

---

### P1：開放題情感分析 + PDF 報告

#### 1.1 開放題情感分析

```
新增：src/lib/sentimentAnalysis.ts

功能：
- getOpenTextResponses(surveyId, tenantId) — 從 answers 表取出 text 題型的所有回覆
- analyzeOpenTextSentiment(texts, aiKey) — 批量呼叫 AI 做情感分析
  - 每 50 筆打包成一個 prompt（減少 API 呼叫次數）
  - 回傳：{ positive: number, negative: number, neutral: number, topKeywords: string[] }
- 用 gpt-4o-mini，成本極低

新增：src/app/api/admin/ai-sentiment/route.ts
  - POST { surveyId } → 取開放題 → 分析 → 回傳

修改：src/app/(admin)/insight-admin/insight/page.tsx
  - 報告頁面新增「開放題分析」區塊
  - 顯示情感比例圓餅圖 + 關鍵字標籤雲

Prompt 設計：
"""
分析以下問卷開放題回覆的情感傾向和關鍵字。
回傳 JSON：
{
  "sentiment": { "positive": 65, "negative": 15, "neutral": 20 },
  "topKeywords": ["紀錄", "回憶", "照片", "不捨", "成長"],
  "samplePositive": "希望能有個地方好好保存牠的照片",
  "sampleNegative": "覺得功能太少"
}

回覆列表：
{texts}
"""
```

#### 1.2 品牌化 PDF 報告匯出

```
新增：src/app/api/admin/export-report/route.ts

功能：
- 接收報告 JSON + 問卷設定
- 用 puppeteer 或 @react-pdf/renderer 產生 PDF
- 包含：封面（組織 Logo + 問卷標題）、洞察摘要、重點發現、建議行動、漏斗圖、標籤分布
- 套用組織品牌色系（從 site_settings 讀取）

前端：
  - 報告頁面新增「匯出 PDF」按鈕
  - 點擊 → 呼叫 API → 下載 PDF

注意：puppeteer 在 Zeabur 可能需要特殊設定，備選方案是用 @react-pdf/renderer（純 Node.js，不需瀏覽器）
```

---

### P2：LINE Bot 強化 + 管理員 Bot

#### 2.1 LINE 管理員數據查詢 Bot

```
新增：src/lib/lineAdminBot.ts

功能：
- 管理員透過 Insight Bot（/api/line/webhook/route.ts）查詢數據
- 辨識管理員身份：line_user_id 存在於 admin_users 表
- 支援的指令：
  - 「今日報告」→ 呼叫 getDashboardStats() → 回傳 Flex Message
  - 「分析 q3」→ 呼叫 getQuestionStats() → 回傳該題分布
  - 「漏斗」→ 呼叫 getFunnelStats() → 回傳文字摘要
  - 「匯出」→ 呼叫 getResponsesCsv() → 回傳下載連結（存到 R2）

修改：src/app/api/line/webhook/route.ts
  - 在口令檢查之前，先檢查是否是已註冊管理員
  - 如果是 → 交給 lineAdminBot 處理
  - 如果不是 → 原有口令流程

Flex Message 範例（今日報告）：
{
  type: 'flex',
  altText: '📊 今日問卷報告',
  contents: {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: '📊 今日問卷報告', weight: 'bold', size: 'lg' },
        { type: 'separator', margin: 'md' },
        { type: 'text', text: '回覆數：47 筆（+12）', size: 'sm' },
        { type: 'text', text: '完成率：82%', size: 'sm' },
        { type: 'text', text: '⚠️ q5 棄卷率 34%', size: 'sm', color: '#FF6B6B' },
      ]
    }
  }
}
```

#### 2.2 LINE Bot 填答體驗優化

```
修改：src/lib/lineBotEngine.ts

改善項目：
1. 單選題改用 Quick Reply 按鈕（不用打數字，直接點）
   - buildQuestionMessage() 回傳時加入 quickReply 欄位
   - LINE Quick Reply 格式：{ items: [{ type: 'action', action: { type: 'message', label: '選項A', text: '1' } }] }

2. 填答進度視覺化
   - 每題回覆後加上進度條：「███░░░░ 3/10」

3. Session 過期處理
   - 新增 cron job：每小時檢查超過 24 小時的 in_progress session → 自動 abandon
   
新增：src/app/api/cron/cleanup-sessions/route.ts
  - 清理過期 session
```

#### 2.3 Rich Menu 智慧切換

```
修改：src/lib/lineNotify.ts
  新增：switchRichMenuForUser(lineUserId, menuId)

邏輯：
  - 新用戶加好友 → Rich Menu A（歡迎 + 填問卷 + 了解更多）
  - 填完問卷後 → 切換到 Rich Menu B（查結果 + 封測 + 客服）
  - 在 lineBotEngine.ts 的 finalizeSession() 最後觸發切換

需要在 LINE Official Account Manager 先建好兩組 Rich Menu，
然後在 line_configs 表存入 menu ID。
```

---

### P3：Phase 3（自動化 + Rule Engine + Story × Data + 護城河建設）

> Phase 3 的目標不只是加功能，而是建立競爭對手無法複製的護城河。

#### 護城河策略（貫穿 Phase 3 所有功能）

```
三層護城河：

L1 數據飛輪（本 Phase 強化）
   使用者建問卷 → 累積回覆 → AI 趨勢追蹤 → 洞察越精準 → 做更多問卷
   → 歷史數據搬不走，換平台就失去跨時間比較能力

L2 Rule Engine 生態系（本 Phase 建立）
   第三方開發者接 API → 建立行業垂直工具 → 整合的轉換成本 > 功能差異

L3 LINE CRM 閉環（Phase 2 已建立，本 Phase 深化）
   LINE 收集 → 自動標籤 → AI 分析 → 行動建議 → LINE 推播 → 循環
   → 標籤體系 + 自動化規則越多越黏

L4 Story × Data（本 Phase 獨創）★ 新護城河
   故事驅動的數據平台 → 市面上沒有人在做
   填答者自發分享故事卡片 → 病毒傳播 → 更多填答 → 更多故事
   → 故事牆的內容資產是獨一無二的，無法複製
```

#### 3.1 自動化觸發引擎

```
新增：src/lib/automationEngine.ts

DB migration：
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  survey_id UUID REFERENCES surveys(id),
  trigger_type TEXT NOT NULL,     -- 'response_count' | 'nps_threshold' | 'keyword' | 'schedule'
  trigger_config JSONB NOT NULL,  -- { "threshold": 100 } 或 { "keyword": "不滿" } 等
  action_type TEXT NOT NULL,      -- 'ai_insight' | 'line_notify' | 'webhook' | 'email'
  action_config JSONB NOT NULL,   -- { "lineUserId": "xxx" } 等
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

觸發檢查時機：
  - 在 surveys/submit/route.ts 的提交成功後，呼叫 checkAutomationTriggers(surveyId, tenantId)
  - cron job 每小時檢查 schedule 類型的規則

規則範例：
  { trigger_type: 'response_count', trigger_config: { threshold: 100 }, action_type: 'ai_insight' }
  → 回覆達 100 筆時自動觸發 AI 洞察 → 結果推播給管理員 LINE

自動化週期問卷（留存關鍵功能）：
  { trigger_type: 'schedule', trigger_config: { cron: '0 9 1 * *' }, action_type: 'clone_and_send' }
  → 每月 1 號自動複製上個月的問卷 → LINE 推播 → 收集 → AI 比較上月
  → 使用者什麼都不做，每月都能收到趨勢報告
```

#### 3.2 行業分析模板

```
新增：src/lib/industryTemplates.ts

const INDUSTRY_PROMPTS = {
  restaurant: '餐飲業：關注滿意度驅動因素、回購轉折點、季節性偏好',
  ecommerce: '電商：關注購買決策排序、價格敏感度、NPS、渠道 ROI',
  saas: 'SaaS：關注功能優先級、用戶分群、PMF 分數、流失預警',
  education: '教育：關注學習成效、課程偏好、教學方式',
  pet: '寵物：關注飼主行為分群、消費意願、情感連結、服務缺口',
}

修改：insightEngine.ts — INSIGHT_SYSTEM_PROMPT 後附加行業模板
修改：insight/page.tsx — 新增行業選擇器
```

#### 3.3 Rule Engine API

```
新增：src/app/api/ai/rules/route.ts        — GET 取得規則
新增：src/app/api/ai/validate/route.ts      — POST 驗證問卷 JSON
新增：src/lib/ruleEngine.ts                 — 規則組裝 + 驗證邏輯

新增 DB migration：
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

修改：src/middleware.ts
  - /api/ai/* 走獨立的 API Key 認證（不走 JWT）
```

#### 3.4 Story × Data 故事數據融合系統 ★ 核心差異化

> 詳細設計文件：story-data-fusion.md
> 人會忘記數字，但不會忘記一個好故事。

##### 3.4.1 Story Card — 個人故事卡片

填答完成後，系統根據回答 + 群體數據，自動生成個人化視覺卡片。

```
卡片內容：
  - 個人化事實（從回答提取）
  - 群體比較（「43% 的人跟你一樣...」）
  - 情感連結文案
  - 可分享到 LINE / IG / FB

新增：
  src/lib/storyCardEngine.ts          — 卡片資料生成（程式碼比對，無需 AI）
  src/components/public/StoryCard.tsx  — 卡片渲染元件
  src/components/public/ShareButtons.tsx — 分享按鈕
  src/app/story/[responseId]/page.tsx  — 公開故事卡片頁
  src/app/api/story-card/[responseId]/route.ts — JSON / PNG

修改：
  src/app/(public)/done/ — 完成頁加入故事卡片 + 分享按鈕
  src/app/api/surveys/submit/route.ts — 新增 allow_story_wall 欄位

DB migration：
  ALTER TABLE responses ADD COLUMN IF NOT EXISTS allow_story_wall BOOLEAN DEFAULT false;
  ALTER TABLE responses ADD COLUMN IF NOT EXISTS story_card_generated BOOLEAN DEFAULT false;

OG Meta（分享時自動帶圖帶文案）：
  og:title = "我和毛孩的足跡"（動態，根據問卷主題）
  og:image = 故事卡片 PNG
  og:description = "500 位飼主中，43% 跟我一樣..."

成本：$0（純程式碼比對）或 ~$0.001/張（AI 生成 closing message）
```

為什麼人會分享：
- **自我表達**：「這是我的故事」
- **社交貨幣**：「500 人中只有 12% 跟我一樣」→ 獨特感
- **情感共鳴**：「原來不只我這樣」
- **群體歸屬**：「我是 500 位飼主的其中一位」

##### 3.4.2 Story Insight — AI 故事洞察報告

用 AI 從數據中提取「人的故事」，不是取代數據報告，而是加一層故事層。

```
傳統報告：
  「61.7% 是現有飼主，72% 對足跡功能有興趣」

故事版：
  「她叫小雨，養了一隻 12 歲的柴犬。
   她在開放題寫了：每次翻到阿福小時候的照片，我都會哭。
   像小雨這樣的人，佔了 61.7%...」

新增：
  src/lib/storyEngine.ts — AI 故事洞察生成
  src/app/api/admin/ai-story/route.ts — POST { surveyId }

修改：
  insight/page.tsx — 新增「故事模式」tab（傳統報告 / 故事報告切換）

AI Prompt 核心：
  - 從開放題挑 2-3 個最有故事性的匿名引言
  - 先講故事再放數字（數據是骨架，故事是血肉）
  - 結尾是可行動的洞察，不只是數據結論

輸出：
  {
    storyTitle, storyBody（500-800 字 markdown）,
    pullQuotes, keyDataPoints,
    unexpectedInsight, shareableOneLiner
  }

成本：~$0.005/份
```

##### 3.4.3 Story Wall — 群體故事牆

所有願意公開的故事卡片匯集成一面牆，本身就是最強的問卷推廣素材。

```
看到別人的故事 → 共鳴 → 想填自己的 → 更多故事 → 病毒循環

新增：
  src/lib/storyWallEngine.ts — 故事牆資料組裝
  src/components/public/StoryWall.tsx — 瀑布流元件
  src/app/story-wall/[surveySlug]/page.tsx — 公開頁（不需登入）
  src/app/api/story-wall/[surveySlug]/route.ts — 故事牆 API
  src/app/api/admin/story-wall/route.ts — 管理（審核/隱藏/置頂）

頁面底部永遠有 CTA：
  「💛 看完他們的故事，也來分享你的？[開始填問卷]」

管理員控制：開/關故事牆、審核回覆、置頂故事
填答時勾選：「□ 我願意匿名分享我的故事到故事牆」
```

##### 3.4.4 Story Card 跨行業適用

| 行業 | 故事角度 | 卡片範例 |
|------|---------|---------|
| 餐飲 | 口味故事 | 「你喜歡微糖，38% 的人跟你一樣。但你選了抹茶，只有 7% 的人跟你一樣！」 |
| 教育 | 學習旅程 | 「你最喜歡實作，52% 的同學也是。你的目標是創業，這是前 15%。」 |
| SaaS | 使用風格 | 「你最常用數據分析，你是 Power User（前 8%）。」 |
| HR | 職場觀 | 「你最重視工作彈性，跟 61% 的同事一樣。」 |
| 寵物 | 毛孩足跡 | 「你養了 8 年，43% 的人跟你一樣最後悔記錄不夠多。」 |

#### 3.5 留存與免費試用機制

##### 30 天全功能免費試用

```
四週引導節奏：
  Week 1（Wow）：AI 生成問卷 → 發放 → 第一份洞察報告 → LINE 推播
  Week 2（依賴）：CRM 標籤累積 → 第一次分眾推播 → 跨問卷比較
  Week 3（深度）：AI 商業顧問 → 自動化規則 → 趨勢曲線
  Week 4（FOMO）：「你已累積 X 份問卷、Y 筆回覆、Z 個標籤、N 份報告」

到期後降級（不是砍掉）：
  - 數據永遠保留
  - AI 功能鎖住（洞察報告模糊化預覽 + 升級 CTA）
  - 基本統計 + 3 份問卷仍可用
  - 「你有 847 筆回覆等待 AI 分析」→ 驅動升級

轉換手段：
  - 試用到期 48 小時內升級 → 首月半價
  - 年繳 = 10 個月費用
  - 推薦機制：推薦朋友 → 雙方延長 7 天

技術實作：
  新增：src/lib/trialEngine.ts
    - checkTrialStatus(tenantId) → 'active' | 'expired' | 'paid'
    - getTrialDaysRemaining(tenantId) → number
    - getAccumulatedAssets(tenantId) → { surveys, responses, tags, reports }

  DB migration：
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial';

  修改：src/middleware.ts
    - 檢查 tenant 的 plan 狀態
    - trial expired + 訪問 AI 功能 → redirect 到升級頁

  新增：src/app/(admin)/insight-admin/upgrade/page.tsx
    - 升級頁面（模糊化報告預覽 + 資產清單 + 定價方案）
```

##### AI 主動推送（持續觸達使用者）

```
擴展：src/app/api/cron/weekly-report/route.ts

現有的週報加入 AI 摘要：
  「📊 本週洞察
   • 新增 47 筆回覆，完成率 82%（↑5%）
   • AI 發現：『價格太高』提及率增加 23%
   • 建議：做一份價格敏感度調查
   [一鍵生成追蹤問卷]」

新增：src/app/api/cron/ai-alerts/route.ts
  - 每日檢查異常指標 → NPS 下降 / 棄卷率飆升 / 負面關鍵字
  - 觸發 LINE 推送預警給管理員
```

---

### 各功能的檔案改動總覽

| 功能 | 新增檔案 | 修改檔案 |
|------|---------|---------|
| **Phase 2** | | |
| Dashboard 整合 | — | `insight-admin/page.tsx`、`funnel/page.tsx` |
| 情感分析 | `lib/sentimentAnalysis.ts`、`api/admin/ai-sentiment/` | `insight/page.tsx` |
| PDF 匯出 | `api/admin/export-report/` | `insight/page.tsx` |
| 管理員 Bot | `lib/lineAdminBot.ts` | `api/line/webhook/route.ts` |
| Bot 體驗優化 | `api/cron/cleanup-sessions/` | `lib/lineBotEngine.ts` |
| Rich Menu 切換 | — | `lib/lineNotify.ts`、`lib/lineBotEngine.ts` |
| 客服系統 | `lib/supportEngine.ts`、`api/admin/support/`、`insight-admin/support/`、DB migration | `api/line/webhook/official/route.ts`、`middleware.ts` |
| 租戶品牌解耦 | `lib/tenantBranding.ts`、DB migration | `api/line/webhook/*/route.ts`、`lib/lineBotEngine.ts` |
| **Phase 3** | | |
| 自動化引擎 | `lib/automationEngine.ts`、`api/cron/ai-alerts/`、DB migration | `api/surveys/submit/route.ts` |
| 行業模板 | `lib/industryTemplates.ts` | `lib/insightEngine.ts`、`insight/page.tsx` |
| Rule Engine | `api/ai/rules/`、`api/ai/validate/`、`lib/ruleEngine.ts`、DB migration | `middleware.ts` |
| Story Card | `lib/storyCardEngine.ts`、`components/public/StoryCard.tsx`、`components/public/ShareButtons.tsx`、`app/story/[responseId]/`、`api/story-card/[responseId]/`、DB migration | `app/(public)/done/`、`api/surveys/submit/route.ts` |
| Story Insight | `lib/storyEngine.ts`、`api/admin/ai-story/` | `insight/page.tsx` |
| Story Wall | `lib/storyWallEngine.ts`、`components/public/StoryWall.tsx`、`app/story-wall/[surveySlug]/`、`api/story-wall/`、`api/admin/story-wall/` | — |
| 免費試用 | `lib/trialEngine.ts`、`insight-admin/upgrade/`、DB migration | `middleware.ts` |
| AI 主動推送 | `api/cron/ai-alerts/` | `api/cron/weekly-report/` |

---

### 建議開發順序

```
═══ Phase 2：修復 + 分析 + LINE Bot ═══

第 1 天：P-URGENT U.3（服務狀態紅燈 — system/route.ts 改用 getLineConfig）
         P-URGENT U.7（毛行天下重複 — 查 DB 去重）
         P-URGENT U.6（連結 404 — 確認 Sidebar 連結帶 slug）

第 2 天：P-URGENT U.1（權限隔離 — auth/me 的 super_admin 租戶列表）
         P-URGENT U.2（AI 額度顯示 — 確認前端計算邏輯）
         P0 全部（Dashboard 整合新指標 / AI 對話寫入 DB / 洞察報告選擇器）

第 3-4 天：P-URGENT U.9（解耦毛行天下硬編碼 — tenantBranding.ts + site_settings）
           P-URGENT U.8（客服系統 — supportEngine.ts + LINE 整合 + 後台頁面）

第 5-6 天：P1.1 開放題情感分析（sentimentAnalysis.ts + Batch 打包）
第 7 天：   P2.1 管理員 LINE 數據查詢 Bot（lineAdminBot.ts）
第 8-9 天：P2.2 LINE Bot 體驗優化（Quick Reply + 進度條 + session 清理 cron）
第 10 天：  P1.2 PDF 報告匯出
第 11 天：  P2.3 Rich Menu 智慧切換

═══ Phase 3：護城河 + Story × Data ═══

第 12-13 天：3.1 自動化觸發引擎（automationEngine.ts + automation_rules 表）
第 14 天：   3.2 行業分析模板（industryTemplates.ts）
第 15-16 天：3.3 Rule Engine API（/api/ai/rules + /api/ai/validate + api_keys 表）
第 17-19 天：3.4.1 Story Card（storyCardEngine.ts + StoryCard.tsx + 完成頁整合 + 分享按鈕）★
第 20 天：   3.4.1 公開故事卡片頁 + OG Meta + PNG 生成
第 21-22 天：3.4.3 Story Wall（storyWallEngine.ts + 公開頁 + 管理端審核）
第 23-24 天：3.4.2 Story Insight AI 故事洞察報告（storyEngine.ts + 故事模式 tab）
第 25-26 天：3.5 免費試用機制（trialEngine.ts + upgrade 頁面 + middleware 降級檢查）
第 27 天：   3.5 AI 主動推送（weekly-report 加 AI 摘要 + ai-alerts cron）

★ = 最高 ROI，Story Card 是整個傳播飛輪的起點
```

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
