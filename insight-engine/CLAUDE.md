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
| 資料庫 | PostgreSQL（Supabase Cloud，pg 直連 pooler） | pg 8.20 |
| 3D | Three.js + @react-three/fiber + drei | 0.183 |
| 圖表 | Recharts | 3.8 |
| 圖片 | Sharp | 0.34 |
| LINE | @line/liff | 2.27 |
| 儲存 | AWS S3 / Cloudflare R2 | |
| 簡訊 | AWS SNS | |
| 部署 | Vercel（Root Directory: insight-engine，push main 自動上線） | 2026-11-09 從 Zeabur 遷移 |
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
git push origin main   # 部署到 Vercel
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

## Cursor IDE 完成紀錄（2026-03-24 最新）

### ✅ 全部完成

#### 安全性（全部修復）
- `superAdminAuth.ts` + middleware 攔截 `/api/super-admin/*` + rate limiting ✅
- `auditLog.ts` + toggle API 寫入審計紀錄 ✅
- 49/52 個 admin API route 已加 requireRole ✅（剩 3 個低風險的）
- `planLimits.ts` 額度檢查已整合 `isUserPlatformUnlimited` bypass ✅
- `checkResponseLimit` 已在 `surveys/submit` 強制執行 ✅
- `checkSurveyLimit` 已在 `admin/surveys POST` 強制執行 ✅
- `checkAdminLimit` 已在 `admin/team POST` 強制執行 ✅
- 藍新金流 `payment/notify`：TradeSha 簽章驗證 ✅、MerchantID 比對 ✅、金額比對 ✅、冪等性 ✅

#### 平台禮遇功能（全部修復）
- `layout.tsx` UserInfo 加了 `platformPartner` 欄位 ✅
- 左上角後台名稱旁顯示「🌟 平台禮遇」徽章 ✅
- 手機版 Sidebar 也顯示徽章 ✅
- `planLimits.ts` 所有 check 函式加了 userId + platformUnlimited bypass ✅
- Toggle API 寫入 `logAudit()` ✅

#### Phase 2 功能
- `lineAdminBot.ts` — 管理員 LINE 數據查詢 Bot ✅
- `tenantBranding.ts` — 租戶品牌解耦 ✅
- `sentimentAnalysis.ts` — 開放題情感分析 ✅
- `supportEngine.ts` — 客服系統 ✅
- `automationEngine.ts` — 自動化觸發引擎 ✅
- `trialEngine.ts` — 試用機制 ✅
- LINE Bot Quick Reply + Rich Menu 整合 ✅
- `site-settings` Bot 文案設定 ✅
- `cleanup-sessions` cron ✅

#### Phase 3 功能
- `storyCardEngine.ts` — 個人故事卡片 ✅
- `storyEngine.ts` — AI 故事洞察報告 ✅
- `storyWallEngine.ts` — 群體故事牆 ✅
- `story/[responseId]` 公開卡片頁 ✅
- `story-wall/[surveySlug]` 公開故事牆頁 ✅
- `ruleEngine.ts` + `api/ai/rules` + `api/ai/validate` — Rule Engine API ✅
- `api-keys` — API Key 管理 ✅
- `upgrade/page.tsx` — 升級引導頁 ✅

#### 缺少 requireRole 的 3 個 route（低風險）
- `ai-sentiment/route.ts` — 新增的，需加 requireRole('viewer')
- `responses/[id]/route.ts` — 單筆填答詳情，需加 requireRole('viewer')
- `line/test/route.ts` — LINE 測試連線，需加 requireRole('admin')

---

### 🔴 修復：OG 分享出去沒有使用自訂 OG 欄位

#### 問題

後台 OG/SEO tab 設定了自訂 OG 標題「如果有一個地方，能幫你記住牠的一切，你會用嗎？」
和自訂 OG 圖片（金毛犬圖），但分享到 LINE 時顯示的是 coverTitle「如果有一天牠不在了，你還能留下什麼？」

#### 程式碼邏輯確認（正確）

`generateMetadata` 的 fallback 順序：`survey.og_title || survey.cover_title || survey.title` ✓
`surveyRepo.ts` 的 allowed 欄位包含 `og_title`、`og_description`、`og_image_url` ✓

#### 可能原因（按機率排序）

**原因 1（最可能）：DB 裡 og_title 是 NULL**

後台 OG/SEO tab 可能沒有正確呼叫 save API，或 save API 把空字串存成了 NULL。

```
診斷 SQL：
  SELECT id, slug, og_title, og_description, og_image_url, cover_title
  FROM surveys WHERE slug = 'maoxingtianxia-mvp-survey';

如果 og_title = NULL → 問題在前端存儲流程
如果 og_title 有值 → 問題在 LINE 快取（見原因 2）
```

```
檢查前端存儲流程：
  src/app/(admin)/insight-admin/surveys/page.tsx 第 410-412 行
  og_title: form.og_title || null,   ← 空字串會變 null
  
  這個沒問題（空字串 fallback 到 cover_title 是對的）
  但要確認使用者填入的值有確實觸發 save API
  
  看第 377-413 行的 handleSave 函式，確認 PATCH /api/admin/surveys/{id}
  有帶上 og_title、og_description、og_image_url 欄位
```

**原因 2：LINE 快取舊的 OG**

LINE 對 OG 圖片和標題有快取，改了不會立刻更新。

```
驗證方式：
  1. 用 Facebook 分享除錯工具測試：
     https://developers.facebook.com/tools/debug/
     輸入 https://insight.snowrealm.pet/snowrealm-pet/maoxingtianxia-mvp-survey
     看抓到的 og:title 是什麼

  2. 用 curl 確認 HTML 的 meta tag：
     curl -s https://insight.snowrealm.pet/snowrealm-pet/maoxingtianxia-mvp-survey | grep 'og:'

  3. 如果 meta tag 是對的但 LINE 顯示舊的 → 是 LINE 快取
     解法：在 LINE 重新貼一次連結（清除對話記錄重貼），或等 24 小時

  4. 如果 meta tag 也是舊的 → 是 Server 端的問題
     可能是 Next.js 的 ISR/SSG 快取，需要重新建置或 revalidate
```

**原因 3：Next.js generateMetadata 快取**

Next.js App Router 的 `generateMetadata` 在 production 可能被靜態化。

```
修復：確認 layout.tsx 或 page.tsx 有加上動態渲染：
  export const dynamic = 'force-dynamic'
  
  或者用 revalidate：
  export const revalidate = 60  // 每 60 秒重新生成

檢查：
  src/app/[org]/[slug]/page.tsx — 有沒有 export const dynamic?
  src/app/(public)/survey/[slug]/layout.tsx — 有沒有?
```

---（所有 19 題都顯示）

### 🔴 緊急修復：DB CHECK 約束錯誤 + 分流邏輯未修復

#### 問題 A：`ai_usage_logs_action_check` 約束違反

截圖顯示：`new row for relation "ai_usage_logs" violates check constraint "ai_usage_logs_action_check"`

**根因：** `migration_phase10_ai.sql` 定義的 CHECK constraint 只允許 `'generate'` 和 `'regenerate'`：
```sql
action TEXT NOT NULL CHECK (action IN ('generate', 'regenerate'))
```

但 `ai-chat-generate/route.ts` 第 127 行傳了 `action: 'chat'`。
TypeScript 的 `AiAction` 型別有加 `'chat'`，DB 沒更新。

**修復 — 跑這段 SQL：**
```sql
ALTER TABLE ai_usage_logs DROP CONSTRAINT ai_usage_logs_action_check;
ALTER TABLE ai_usage_logs ADD CONSTRAINT ai_usage_logs_action_check
  CHECK (action IN ('generate', 'regenerate', 'generate_meta', 'regenerate_meta', 'chat', 'insight', 'story', 'sentiment'));
```

這樣所有 AI 功能的 action 值都能寫入（包括未來的 insight 報告、故事報告、情感分析）。

#### 問題 B：分流邏輯 `useSurveyFlow.ts` 完全沒修！

確認 diff：`phase3-src` vs `phase4-src` 的 `useSurveyFlow.ts` **零差異**。
Cursor 跳過了這個修復。截圖確認還是 1/19，選了「沒有且暫時不考慮」卻要答 19 題。

**必須手動修改 `src/hooks/useSurveyFlow.ts`：**

把第 43-103 行的 `resolveRoutes` 和 `filterQuestions` 整段替換為：

```typescript
/** 根據所有分流規則與已作答，計算出目前活躍的路線 */
function resolveRoutes(
  rules: BranchRule[],
  answers: Map<string, string | string[]>
): Set<string> {
  const active = new Set<string>()
  // 注意：不要預設加 'A'！A 也是條件路線

  for (const rule of rules) {
    const branchAnswer = answers.get(rule.branchKey)
    if (!branchAnswer) continue  // 還沒回答分流題

    const ansArr = Array.isArray(branchAnswer) ? branchAnswer : [branchAnswer]

    for (const ans of ansArr) {
      for (const [route, values] of Object.entries(rule.routes)) {
        if ((values as string[]).includes(ans)) {
          active.add(route)
        }
      }
    }
  }

  return active
}

/** 根據活躍路線過濾有效題目 */
function filterQuestions(
  questions: Question[],
  activeRoutes: Set<string>,
  rules: BranchRule[]
): Question[] {
  if (rules.length === 0) {
    // 無分流設定 → 顯示所有題目
    return questions
  }

  const branchKeys = new Set(rules.map(r => r.branchKey))
  const hasAnyDecision = activeRoutes.size > 0

  return questions.filter((q) => {
    // route = 'all' 或沒設 → 共用題，永遠顯示
    if (!q.route || q.route === 'all') return true
    // 分流觸發題本身 → 永遠顯示
    if (branchKeys.has(q.key)) return true
    // 還沒回答分流題 → 不顯示任何分支題
    if (!hasAnyDecision) return false
    // 有分流生效 → 只顯示活躍路線的題目
    return activeRoutes.has(q.route)
  })
}
```

修復後行為：
- 選「有」或「曾經有」→ A 路線 → q1 + q2,q3,q4,q5 + q6 + q7-q11 = **11 題**
- 選「沒有但未來想養」→ B 路線 → q1 + q2b,q3b,q4b,q5b + q6 + q7-q11 = **11 題**
- 選「沒有且暫時不考慮」→ C 路線 → q1 + q2c,q3c,q4c,q5c + q6 + q7-q11 = **11 題**
- 還沒回答 q1 → 只顯示 route='all' 的題目（第一題就是 q1）

**注意：** 同時檢查 DB 裡 `surveys.branch_config` 是否為 NULL：
```sql
SELECT slug, branch_config FROM surveys WHERE slug = 'maoxingtianxia-mvp-survey';
```
如果是 NULL → 即使前端邏輯修好也不會分流。需要寫入：
```sql
UPDATE surveys SET branch_config = '{"branchKey":"q1","routes":{"A":["有","曾經有"],"B":["沒有但未來想養"],"C":["沒有且暫時不考慮"]}}' WHERE slug = 'maoxingtianxia-mvp-survey';
```
（注意：選項值要跟 DB questions 表裡的 option value 完全一致）

---

---

### 🔴 需要修正：Rich Menu 設定 + LINE 參數統一管理

`switchUserRichMenu()` 用的 Token 是 `OFFICIAL_CHANNEL_ACCESS_TOKEN`（正確），
但 `POST_SURVEY_RICH_MENU_ID` 是從 `process.env` 讀取的，沒有經過 `lineConfig.ts` 的 DB 管理系統。
而且 Rich Menu 可能建在 Insight Bot 上而不是 Official Bot 上。

#### 修復：把所有 LINE 參數統一到 LINE 設定頁面

目前 `lineConfig.ts` 的 `LINE_CONFIG_KEYS` 有 9 個 key，但還有多個 LINE 相關的 ENV 散落在各處，
沒有納入 DB 管理。使用者必須改 ENV 再重新部署，體驗很差。

**需要新增到 `LINE_CONFIG_KEYS` 的參數：**

```
修改：src/lib/lineConfig.ts

在 LINE_CONFIG_KEYS 物件中新增：

export const LINE_CONFIG_KEYS = {
  // === 現有 9 個（不動） ===
  INSIGHT_CHANNEL_ACCESS_TOKEN: { ... },
  INSIGHT_CHANNEL_SECRET: { ... },
  INSIGHT_CHANNEL_ID: { ... },
  INSIGHT_LINE_ID: { ... },
  OFFICIAL_CHANNEL_ACCESS_TOKEN: { ... },
  OFFICIAL_CHANNEL_SECRET: { ... },
  OFFICIAL_CHANNEL_ID: { ... },
  OFFICIAL_LINE_ID: { ... },
  ADMIN_USER_ID: { ... },

  // === 新增：Rich Menu ===
  POST_SURVEY_RICH_MENU_ID: {
    envKey: 'POST_SURVEY_RICH_MENU_ID',
    secret: false,
    label: '填答完成後 Rich Menu ID',
    group: 'official',     // ← 歸類到 Official Bot
    description: '用戶填完問卷後自動切換的 Rich Menu（格式：richmenu-xxx）'
  },
  DEFAULT_RICH_MENU_ID: {
    envKey: 'DEFAULT_RICH_MENU_ID',
    secret: false,
    label: '預設 Rich Menu ID',
    group: 'official',
    description: '新好友加入時的預設 Rich Menu'
  },

  // === 新增：LIFF ===
  LIFF_ID: {
    envKey: 'NEXT_PUBLIC_LIFF_ID',
    secret: false,
    label: 'LIFF ID',
    group: 'official',
    description: 'LIFF 應用程式 ID（用於 LINE 內嵌頁面）'
  },

  // === 新增：LINE Login（OAuth）===
  LINE_LOGIN_CHANNEL_ID: {
    envKey: 'LINE_LOGIN_CHANNEL_ID',
    secret: false,
    label: 'LINE Login Channel ID',
    group: 'admin',
    description: 'LINE Login 的 Channel ID（用於 OAuth 登入）'
  },
  LINE_LOGIN_CHANNEL_SECRET: {
    envKey: 'LINE_LOGIN_CHANNEL_SECRET',
    secret: true,
    label: 'LINE Login Channel Secret',
    group: 'admin',
    description: 'LINE Login 的 Channel Secret'
  },
  LINE_LOGIN_CALLBACK_URL: {
    envKey: 'LINE_LOGIN_CALLBACK_URL',
    secret: false,
    label: 'LINE Login Callback URL',
    group: 'admin',
    description: '例：https://insight.snowrealm.pet/api/auth/line/callback'
  },

  // === 新增：其他 ===
  LINE_FRIEND_URL: {
    envKey: 'NEXT_PUBLIC_LINE_FRIEND_URL',
    secret: false,
    label: 'LINE 加好友連結',
    group: 'official',
    description: '例：https://line.me/R/ti/p/@474iwlht'
  },
  RICH_MENU_SURVEY_URL: {
    envKey: 'NEXT_PUBLIC_RICH_MENU_SURVEY_URL',
    secret: false,
    label: 'Rich Menu 問卷連結',
    group: 'official',
    description: 'Rich Menu 按鈕點擊後開啟的問卷 URL'
  },
} as const
```

注意：`listLineConfigs()` 裡的 group 判斷目前用 `key.startsWith('INSIGHT_')` 等前綴，
新增的 key 不符合這個規則，需要在 LINE_CONFIG_KEYS 定義裡加 `group` 欄位，
然後 `listLineConfigs()` 改成從定義讀 group 而不是從 key 前綴判斷。

**修改 `switchUserRichMenu()` 改從 DB 讀取：**

```
修改：src/lib/lineNotify.ts 第 202-215 行

export async function switchUserRichMenu(lineUserId: string, tenantId?: string): Promise<void> {
  try {
    const token = await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN', tenantId)
    const menuId = await getLineConfig('POST_SURVEY_RICH_MENU_ID', tenantId)  // ← 改用 getLineConfig
    if (!token || !menuId) return

    await fetch(`https://api.line.me/v2/bot/user/${lineUserId}/richmenu/${menuId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (err) {
    console.error('[switchUserRichMenu] Failed:', err)
  }
}
```

**修改所有用 `process.env` 讀 LINE 參數的地方：**

```
1. src/lib/lineNotify.ts:205
   process.env.POST_SURVEY_RICH_MENU_ID
   → await getLineConfig('POST_SURVEY_RICH_MENU_ID', tenantId)

2. src/app/(public)/done/ClickTrackLinks.tsx:7
   process.env.NEXT_PUBLIC_LINE_FRIEND_URL
   → 這是前端元件，不能用 server-side 的 getLineConfig
   → 解法：從 API route 帶入，或保持 ENV（NEXT_PUBLIC_ 開頭的是前端可讀的）
   → 建議：保持 ENV 但也存一份到 DB，後台可修改

3. src/app/api/admin/rich-menu/route.ts:77
   process.env.NEXT_PUBLIC_RICH_MENU_SURVEY_URL
   → await getLineConfig('RICH_MENU_SURVEY_URL', tenantId)

4. src/app/api/admin/system/route.ts:97
   process.env.NEXT_PUBLIC_LIFF_ID
   → await getLineConfig('LIFF_ID', tenantId)

5. src/app/api/auth/line/route.ts:12-15
   process.env.LINE_LOGIN_CHANNEL_ID / SECRET / CALLBACK_URL
   → await getLineConfig('LINE_LOGIN_CHANNEL_ID', tenantId) 等
   → 注意：LINE Login 的 channel 跟 Messaging API 的 channel 是不同的
   → 多租戶場景下，每個租戶可能有自己的 LINE Login channel

6. src/app/(public)/liff/page.tsx:15
   process.env.NEXT_PUBLIC_LIFF_ID
   → 前端元件，保持 ENV
```

**修改 LINE 設定頁面 — 新增 Rich Menu 和進階設定區塊：**

```
修改：src/app/(admin)/insight-admin/line-settings/page.tsx

在現有的 Insight / Official / Admin 三個區塊之外，
GROUP_META 新增：

const GROUP_META = {
  insight: { emoji: '🤖', title: 'Insight 問卷機器人', desc: '用於管理員通知推播' },
  official: { emoji: '📢', title: 'Official 官方帳號', desc: '用於用戶推播 / 廣播' },
  admin: { emoji: '👤', title: '管理員設定', desc: '' },
  richmenu: { emoji: '📱', title: 'Rich Menu 設定', desc: '填答後自動切換的選單' },  // ← 新增
  login: { emoji: '🔑', title: 'LINE Login', desc: 'OAuth 登入設定' },                // ← 新增
}

或者更簡單：把新的 key 歸到現有的 group 裡（official / admin），
在 UI 上用子標題分隔就好。

UI 效果：
  📢 Official 官方帳號
    ├── Channel Access Token  [ENV] ••••••...  [修改]
    ├── Channel Secret        [ENV] ••••••...  [修改]
    ├── Channel ID            [ENV] 2009544... [修改]
    ├── LINE ID               [ENV] @474iwl... [修改]
    ├── ── Rich Menu ──
    ├── 填答完成後 Rich Menu   [未設定]         [設定]  ← 新
    ├── 預設 Rich Menu         [未設定]         [設定]  ← 新
    ├── ── 連結 ──
    ├── LINE 加好友連結        [未設定]         [設定]  ← 新
    └── Rich Menu 問卷連結     [未設定]         [設定]  ← 新

  🔑 LINE Login
    ├── Channel ID            [未設定]         [設定]  ← 新
    ├── Channel Secret        [未設定]         [設定]  ← 新
    └── Callback URL          [未設定]         [設定]  ← 新
```

**修改 `listLineConfigs()` 支援新的 group 分類：**

```
修改：src/lib/lineConfig.ts

LINE_CONFIG_KEYS 每個定義加上 group 欄位（見上方）

listLineConfigs() 中：
  // 舊邏輯（刪除）：
  const group = key.startsWith('INSIGHT_') ? 'insight' : key.startsWith('OFFICIAL_') ? 'official' : 'admin'

  // 新邏輯：
  const group = def.group ?? (key.startsWith('INSIGHT_') ? 'insight' : key.startsWith('OFFICIAL_') ? 'official' : 'admin')
```

### 🔴 緊急修復：故事報告沒有保存 + 缺少保存按鈕

#### 問題 1：故事報告 API 沒有存入 DB

`ai-insight/route.ts`（數據報告）第 60-64 行有 INSERT 到 `ai_insight_reports` ✅
`ai-story/route.ts`（故事報告）**完全沒有存 DB** ✗ → 生成完刷新就消失

```
修改：src/app/api/admin/ai-story/route.ts

在 return 之前加入：

    // 存入 DB（與數據報告共用 ai_insight_reports 表，用 report_type 區分）
    const reportMeta = {
      provider: aiKey.provider,
      model: aiKey.model,
      keySource: aiKey.keySource,
      generatedAt: new Date().toISOString(),
    }

    const saved = await queryOne<{ id: string }>(
      `INSERT INTO ai_insight_reports (tenant_id, survey_id, report, meta, generated_by, report_type)
       VALUES ($1, $2, $3, $4, $5, 'story') RETURNING id`,
      [tenantId, surveyId, JSON.stringify(report), JSON.stringify(reportMeta), roleCheck.userId]
    )

    return NextResponse.json({
      report,
      reportId: saved?.id,    // ← 回傳 ID 讓前端可以分享
      meta: reportMeta,
      tokenUsage: { prompt: promptTokens, completion: completionTokens },
    })

需要先確認 ai_insight_reports 表有 report_type 欄位：
  ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'data';
```

#### 問題 2：歷史報告列表沒有顯示故事報告

`ai-insight/route.ts` 的 GET handler 只查 `ai_insight_reports`，
但沒有區分 report_type，也沒有在前端分開顯示。

```
修改：src/app/api/admin/ai-insight/route.ts GET handler

回傳時加上 report_type：
  const reports = await query<ReportRow>(
    `SELECT id, survey_id, report, meta, generated_by, created_at, 
            COALESCE(report_type, 'data') as report_type
     FROM ai_insight_reports
     WHERE tenant_id = $1 AND survey_id = $2
     ORDER BY created_at DESC
     LIMIT 20`,
    [tenantId, surveyId]
  )

前端 history 型別加上 report_type：
  { id, report, meta, created_at, report_type: 'data' | 'story' }
```

#### 問題 3：前端缺少「保存」指示 + 歷史切換

雖然數據報告是自動存的，但使用者不知道。故事報告現在修好後也會自動存。
需要在 UI 上讓使用者清楚知道報告已保存，並能從歷史中載入。

```
修改：src/app/(admin)/insight-admin/insight/page.tsx

1. 報告生成成功後顯示提示：
   「✅ 報告已自動保存」（綠色 toast，2 秒後消失）

2. 歷史報告列表區分數據/故事：
   📊 2026/03/24 14:30 — 數據報告    [查看] [分享] [刪除]
   📖 2026/03/24 15:00 — 故事報告    [查看] [分享] [刪除]

3. 點「查看」歷史報告時：
   - 如果是 report_type = 'data' → setReport(item.report) + setActiveTab('data')
   - 如果是 report_type = 'story' → setStoryReport(item.report) + setActiveTab('story')

4. 按鈕排列（數據模式）：
   [✨ 產生報告]  [📤 分享]  [📋 複製摘要]

5. 按鈕排列（故事模式）：
   [📖 產生故事]  [📤 分享]  [📋 複製全文]
```

#### 分享小卡設計（可存成圖片）

報告生成後，點「📤 分享」自動生成一張視覺小卡，右上角有儲存按鈕可下載 PNG。
小卡上有插畫、故事大綱/數據摘要、品牌標記，適合分享到 LINE、IG 限動、FB。

##### 小卡視覺結構

**故事模式小卡：**
```
┌─────────────────────────────────────────┐
│                                    [💾] │  ← 右上角儲存按鈕
│         🐾 ✨ 🌿                        │  ← 主題插畫（Emoji 組合，根據行業/主題動態選）
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │  愛與陪伴：在數位時代的           │    │  ← storyTitle
│  │  寵物情感連結                    │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  「如果愛有期限的話，                    │  ← pullQuotes[0]（引言）
│    我希望是一萬年。」                    │
│                                         │
│  ── ── ── ── ── ── ──                 │
│                                         │
│  📊 500 位填答者                        │  ← keyDataPoints 精選
│  💛 72% 希望留下毛孩的足跡              │
│  🐕 312 隻狗 · 🐈 156 隻貓            │
│                                         │
│  ── ── ── ── ── ── ──                 │
│                                         │
│  ✨ 愛的陪伴，永恆不變。               │  ← shareableOneLiner
│                                         │
│  ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈              │
│  SnowRealm Insight Engine              │  ← 品牌
│  insight.snowrealm.pet/report/xxx      │  ← 公開連結
│  2026.03.24                             │  ← 日期
└─────────────────────────────────────────┘
```

**數據模式小卡：**
```
┌─────────────────────────────────────────┐
│                                    [💾] │
│         📊 🔍 💡                        │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  毛行天下 MVP 問卷               │    │  ← 問卷標題
│  │  AI 洞察報告                     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  🟢 完成率 100%，數據品質 87 分         │  ← summary 摘要
│                                         │
│  ── 關鍵發現 ──                        │
│                                         │
│  ✅ 72% 的飼主想要足跡紀錄功能          │  ← highlights[0]
│  ⚠️ q5 棄卷率偏高（34%）              │  ← highlights[1]（negative）
│  📌 年輕族群偏好 AI 互動功能            │  ← highlights[2]
│                                         │
│  ── 建議行動 ──                        │
│                                         │
│  🎯 優先開發足跡時間線功能              │  ← recommendations[0]
│                                         │
│  ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈              │
│  SnowRealm Insight Engine              │
│  insight.snowrealm.pet/report/xxx      │
│  2026.03.24                             │
└─────────────────────────────────────────┘
```

##### 插畫系統（Emoji 組合，不需要外部圖片）

根據問卷主題或行業自動選擇插畫 Emoji 組合：
```typescript
// src/lib/shareCardIllustrations.ts

const ILLUSTRATIONS: Record<string, string[]> = {
  // 預設
  default: ['📊', '✨', '💡'],
  
  // 行業
  pet:        ['🐾', '✨', '🌿'],
  restaurant: ['🍽️', '☕', '🌮'],
  ecommerce:  ['🛍️', '📦', '💳'],
  education:  ['📚', '🎓', '✏️'],
  saas:       ['💻', '⚡', '🚀'],
  health:     ['💚', '🏥', '🌱'],
  
  // 問卷主題（跟 9 種 theme 對應）
  default_theme: ['📊', '✨', '💡'],
  game:          ['🎮', '🏆', '⭐'],
  cyber:         ['🤖', '⚡', '🌐'],
  ancient:       ['🏯', '🌸', '📜'],
  sakura:        ['🌸', '🎀', '💮'],
  ocean:         ['🌊', '🐠', '🐚'],
  forest:        ['🌲', '🍃', '🦊'],
  candy:         ['🍬', '🎨', '🌈'],
  noir:          ['🖤', '🌙', '✨'],
}

export function getIllustration(theme?: string, industry?: string): string[] {
  if (industry && ILLUSTRATIONS[industry]) return ILLUSTRATIONS[industry]
  if (theme && ILLUSTRATIONS[theme]) return ILLUSTRATIONS[theme]
  return ILLUSTRATIONS.default
}
```

##### 前端元件

```
新增：src/components/admin/ShareCard.tsx

Props:
  reportType: 'data' | 'story'
  report: InsightReport | StoryInsightReport
  surveyTitle: string
  shareUrl: string
  theme?: string
  industry?: string
  createdAt: string

功能：
  - 根據 reportType 渲染不同的卡片佈局
  - 右上角 💾 按鈕：用 html2canvas 把卡片 DOM 轉成 PNG 下載
  - 背景漸層跟問卷主題色連動（從 themes.ts 讀取）
  - 卡片寬度固定 400px（適合手機螢幕和 IG 限動）
  - 高度自適應內容

  import html2canvas from 'html2canvas'  // 需要安裝：npm install html2canvas

  const handleSaveImage = async () => {
    const card = cardRef.current
    if (!card) return
    const canvas = await html2canvas(card, {
      scale: 2,              // 2x 解析度
      backgroundColor: null, // 透明背景
      useCORS: true,
    })
    const link = document.createElement('a')
    link.download = `insight-report-${shareSlug}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
```

```
新增：src/components/admin/ShareCardModal.tsx

Props:
  open: boolean
  onClose: () => void
  reportType: 'data' | 'story'
  report: InsightReport | StoryInsightReport
  surveyTitle: string
  shareUrl: string
  theme?: string
  createdAt: string

Modal 內容：
  ┌──────────────────────────────────────┐
  │ 📤 分享報告                    [✕]  │
  │                                      │
  │  ┌────────────────────────┐          │
  │  │   ShareCard 預覽       │          │
  │  │   （實際大小預覽）      │          │
  │  └────────────────────────┘          │
  │                                      │
  │  公開連結：                           │
  │  https://insight.snowrealm.pet/...   │
  │  [📋 複製連結]                       │
  │                                      │
  │  [💾 儲存圖片] [💬 分享到LINE]      │
  │                                      │
  │  自訂分享標題：                       │
  │  ┌──────────────────────────┐       │
  │  │ 毛行天下問卷分析報告     │       │
  │  └──────────────────────────┘       │
  │                                      │
  │  [關閉公開分享]                      │
  └──────────────────────────────────────┘
```

##### 整合到 insight 頁面

```
修改：src/app/(admin)/insight-admin/insight/page.tsx

1. import ShareCardModal

2. 新增 state：
   const [shareModalOpen, setShareModalOpen] = useState(false)
   const [shareReportId, setShareReportId] = useState<string | null>(null)
   const [shareUrl, setShareUrl] = useState('')

3. 分享按鈕（在產生報告/重新產生旁邊）：
   <button onClick={handleShare}>📤 分享</button>

4. handleShare 函式：
   async function handleShare() {
     // 呼叫 PATCH /api/admin/ai-insight 開啟公開分享
     const res = await fetch('/api/admin/ai-insight', {
       method: 'PATCH',
       body: JSON.stringify({ reportId: currentReportId, action: 'share' })
     })
     const data = await res.json()
     setShareUrl(data.shareUrl)
     setShareModalOpen(true)
   }

5. ShareCardModal 元件：
   <ShareCardModal
     open={shareModalOpen}
     onClose={() => setShareModalOpen(false)}
     reportType={activeTab}
     report={activeTab === 'data' ? report : storyReport}
     surveyTitle={selectedSurvey?.title}
     shareUrl={shareUrl}
     theme={selectedSurvey?.theme}
     createdAt={new Date().toISOString()}
   />
```

##### 安裝依賴

```bash
npm install html2canvas
```

或如果不想加依賴，可以用 server-side 生成 PNG（用 satori + resvg-js）：
```
新增：src/app/api/report/[slug]/og/route.tsx
  — 用 satori 把 React 元件渲染成 SVG → resvg 轉 PNG
  — 同時用於 OG 圖片和下載功能
  — 不需要瀏覽器環境（Node.js 原生）
```

---

### 🟡 新功能：AI 報告公開分享頁面

管理員在 AI 洞察報告頁面點「分享」→ 生成一個公開連結 → 任何人都能看到這份報告。
連結格式：`https://insight.snowrealm.pet/report/{shareSlug}`

分享出去的報告是**快照**（生成當下的內容），不會隨後續數據變動而改變。

#### DB Migration

```sql
-- 在 ai_insight_reports 表新增分享欄位
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_slug TEXT UNIQUE;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_title TEXT;       -- 自訂分享標題（OG 用）
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_views INT DEFAULT 0;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'data'; -- 'data' | 'story'

-- 故事報告也存到同一張表（report_type = 'story'）
-- report JSONB 欄位已經夠彈性，InsightReport 和 StoryInsightReport 都能存

CREATE INDEX idx_insight_reports_share ON ai_insight_reports (share_slug) WHERE is_public = true;
```

#### 後端 API

```
修改：src/app/api/admin/ai-insight/route.ts

新增 PATCH handler — 開啟/關閉公開分享：
  PATCH { reportId, action: 'share' }
    → 生成 share_slug（nanoid 8 碼，如 'rpt-a3x9k2m1'）
    → 設 is_public = true
    → 回傳 { shareUrl: 'https://insight.snowrealm.pet/report/rpt-a3x9k2m1' }

  PATCH { reportId, action: 'unshare' }
    → 設 is_public = false
    → 回傳 { ok: true }

  PATCH { reportId, action: 'update_title', shareTitle: '...' }
    → 更新 share_title

新增：src/app/api/report/[slug]/route.ts — 公開 API（不需登入）
  GET /api/report/{shareSlug}
    → 查 ai_insight_reports WHERE share_slug = $1 AND is_public = true
    → 回傳 { report, meta, surveyTitle, shareTitle, reportType, createdAt }
    → 同時 UPDATE share_views = share_views + 1
    → 不回傳 tenant_id、generated_by 等敏感欄位
```

#### 公開報告頁面

```
新增：src/app/report/[slug]/page.tsx — SSR 公開頁（不需登入）

頁面結構：
┌─────────────────────────────────────────────────┐
│  SnowRealm Insight Engine                       │
│                                                  │
│  📊 毛行天下 MVP 問卷 — AI 洞察報告              │
│  產生時間：2026/03/24                            │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │ 報告內容（跟後台看到的一樣）            │    │
│  │ 如果是故事模式 → 顯示故事敘事           │    │
│  │ 如果是數據模式 → 顯示 highlights +      │    │
│  │   recommendations + insights             │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ── ── ── ── ── ── ── ── ── ──                 │
│                                                  │
│  由 SnowRealm Insight Engine 生成               │
│  想為你的問卷也生成 AI 洞察？                    │
│  [免費試用 30 天]                                │
│                                                  │
│  👁 已被查看 {share_views} 次                    │
└─────────────────────────────────────────────────┘

OG Meta（分享到社群時自動帶圖帶文案）：
  og:title = share_title || '毛行天下 MVP 問卷 — AI 洞察報告'
  og:description = report.summary 的前 100 字（數據模式）或 storyBody 前 100 字（故事模式）
  og:image = 自動生成的報告封面圖（可用 opengraph-image.tsx 動態生成）
  og:url = https://insight.snowrealm.pet/report/{shareSlug}

重要：
  - 頁面不需要登入就能看
  - 但不顯示原始數據（回覆列表、填答者資料等）
  - 只顯示 AI 分析後的結論、建議、故事
  - 底部永遠有 CTA 導向免費試用
```

#### 前端 — insight 頁面加分享按鈕

```
修改：src/app/(admin)/insight-admin/insight/page.tsx

在報告生成成功後，新增一排按鈕：
  [🔄 重新產生]  [📤 分享報告]  [📋 複製連結]

點「📤 分享報告」：
  → PATCH /api/admin/ai-insight { reportId, action: 'share' }
  → 回傳 shareUrl
  → 顯示 modal：
    ┌──────────────────────────────────┐
    │ 📤 報告已公開！                   │
    │                                   │
    │ https://insight.snowrealm.pet/   │
    │ report/rpt-a3x9k2m1              │
    │                                   │
    │ [📋 複製連結] [💬 分享到 LINE]   │
    │                                   │
    │ 自訂標題（OG 分享時顯示）：       │
    │ ┌────────────────────────────┐   │
    │ │ 毛行天下 MVP 問卷分析報告  │   │
    │ └────────────────────────────┘   │
    │                                   │
    │ 👁 已被查看 0 次                  │
    │ [關閉公開分享]                    │
    └──────────────────────────────────┘

歷史報告列表裡，已分享的報告旁邊顯示 🔗 圖示 + 查看次數

故事模式的報告也用同樣的分享機制：
  - 故事報告存入 ai_insight_reports 時 report_type = 'story'
  - 公開頁面根據 report_type 決定用數據模式還是故事模式渲染
```

#### middleware 路由

```
公開報告頁 /report/[slug] 不需要認證 → 不用改 middleware（它不在 matcher 裡）

但 /api/report/[slug] 也不需要認證 → 確認 middleware matcher 沒有攔截 /api/report/*
目前 matcher 是：['/insight-admin/:path*', '/api/admin/:path*', '/api/super-admin/:path*', ...]
/api/report/* 不在裡面 → 自動放行 ✓
```

---

### 🔴 需要補完：Story × Data 前端入口

後端引擎和 API 全部完成（storyCardEngine / storyEngine / storyWallEngine + 所有 route），
insight 頁面的故事模式 tab 也做好了。但以下前端入口缺失：

#### 5a. Sidebar 缺少故事牆管理入口

```
修改：src/app/(admin)/layout.tsx

KNOWN_ADMIN_PAGES Set 新增：
  'story-wall'

BASE_NAV_GROUPS 的「數據分析」區塊新增：
  { path: '/story-wall', label: '📖 故事牆管理' },

或者放到獨立區塊：
  {
    label: '📖 故事系統',
    items: [
      { path: '/insight', label: '🔍 AI 洞察報告' },  // 已有，含故事模式 tab
      { path: '/story-wall', label: '📖 故事牆管理' }, // 新增
    ],
  },

修改：src/middleware.ts
  KNOWN_ADMIN_PAGES.add('story-wall')
```

#### 5b. 故事牆管理頁面

```
新增：src/app/(admin)/insight-admin/story-wall/page.tsx

功能：
- 列出所有 allow_story_wall = true 的回覆故事卡片
- 每張卡片顯示：摘要內容、建立時間、狀態
- 操作：審核通過 / 隱藏 / 置頂 / 刪除
- 篩選：全部 / 已審核 / 待審核 / 已隱藏
- 頂部統計：總故事數、本月新增、分享次數
- 預覽按鈕：開新視窗看公開的故事牆頁面 /story-wall/{surveySlug}
- 「複製故事牆連結」按鈕

呼叫的 API：
  GET /api/admin/story-wall — 列表（已有）
  PATCH /api/admin/story-wall — 審核/隱藏/置頂（已有）
```

#### 5c. 問卷完成頁缺少 Story Card 顯示 + 分享按鈕

```
修改：src/app/(public)/done/DoneClient.tsx

在完成頁的感謝文字下方新增：
1. 呼叫 GET /api/story-card/{responseId} 取得 StoryCardData
2. 渲染 StoryCard 元件
3. 顯示分享按鈕（LINE / 複製連結 / 下載圖片）

流程：
  感謝填寫！
     ↓ 1.5 秒後
  「🎉 你的故事卡片生成中...」
     ↓ 卡片生成完成
  顯示 StoryCard 元件
  [分享到 LINE] [複製連結] [下載圖片]
     ↓ 卡片下方
  「□ 我願意匿名分享我的故事到故事牆」（勾選後 POST 更新 allow_story_wall）

注意：submit/route.ts 第 174 行已經有：
  UPDATE responses SET allow_story_wall = true WHERE id = $1
  但這是預設全部同意。改成預設 false，由完成頁讓使用者自行勾選。
```

#### 5d. StoryCard + ShareButtons 元件

```
新增：src/components/public/StoryCard.tsx

Props：StoryCardData（從 storyCardEngine.ts）
渲染：
  - 個人化事實區塊（emoji + 文字）
  - 群體比較區塊（「43% 的人跟你一樣...」）
  - 引言區塊（如果有開放題回答）
  - 底部品牌 logo + 問卷名稱
  - 跟隨問卷主題配色（9 種主題）

新增：src/components/public/ShareButtons.tsx

Props：{ url: string, title: string, imageUrl?: string }
按鈕：
  - 💬 分享到 LINE（LINE Share API: https://social-plugins.line.me/lineit/share?url=xxx）
  - 📋 複製連結
  - 📷 下載圖片（用 html2canvas 把 StoryCard 元件轉成 PNG）
  - 📱 分享到 IG（複製圖片到剪貼簿 + 提示開啟 IG）

公開故事卡片頁 OG Meta（src/app/story/[responseId]/page.tsx）：
  確認有設定：
  - og:title = 動態（根據問卷標題）
  - og:image = 故事卡片圖片 URL（需要 server-side PNG 生成，或用 opengraph-image.tsx）
  - og:description = shareableOneLiner
```

#### 5e. 公開故事牆頁面底部 CTA

```
確認：src/app/story-wall/[surveySlug]/page.tsx

頁面底部需要有 CTA：
  「💛 看完他們的故事，也來分享你的？」
  [開始填問卷] ← 連結到 /{org-slug}/{survey-slug} 或問卷首頁

頁面頂部統計：
  「📖 共 {total} 個故事」
  關鍵字標籤雲（從回覆中提取高頻詞）
```

---

## 當前開發重點（Phase 2+3）— 安全修復 + 分析 + LINE Bot + Story × Data

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

#### 3.6 問卷模板系統（預設模板 + 模板市集）

> 現有的 `templates` 頁面是 LINE 訊息模板，不是問卷模板。這是全新功能。

##### 概念

三層模板系統：
1. **平台預設模板** — SnowRealm 官方行業模板，所有租戶可用
2. **租戶自訂模板** — 組織把自己的問卷存成模板，組織內共用
3. **模板市集** — 使用者公開分享問卷模板，其他人一鍵複製

##### DB Migration

```sql
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'platform',  -- 'platform' | 'tenant' | 'marketplace'
  tenant_id TEXT,
  created_by UUID REFERENCES admin_users(id),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,                            -- pet | restaurant | ecommerce | saas | education | hr | general
  icon TEXT DEFAULT '📋',
  tags TEXT[] DEFAULT '{}',
  survey_config JSONB NOT NULL,             -- { title, subtitle, coverTitle, theme, ... }
  questions JSONB NOT NULL,                 -- Question[] 完整題目
  branch_config JSONB,                      -- BranchConfig 分流設定
  use_count INT DEFAULT 0,
  rating_sum INT DEFAULT 0,
  rating_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_industry ON survey_templates (industry) WHERE is_active = true;
CREATE INDEX idx_templates_marketplace ON survey_templates (is_public, use_count DESC) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES survey_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (template_id, user_id)
);
```

##### 平台預設模板清單

```
新增：src/lib/surveyTemplates.ts

行業模板（每個含完整 questions + branch_config）：
  🐾 寵物飼主調查 / 寵物離世紀念回饋
  🍽️ 顧客滿意度調查 / 新品試吃回饋
  🛍️ 購物體驗調查 / 購買決策分析
  🚀 PMF 產品市場適配度 / 功能需求優先級
  📚 課程滿意度 / 活動講座回饋
  👥 員工滿意度 / 面試體驗回饋
  ⭐ NPS 淨推薦分數 / 活動報名表 / 意見回饋表

行業分類：
  TEMPLATE_INDUSTRIES = [
    { key: 'all', label: '全部', icon: '📋' },
    { key: 'pet', label: '寵物', icon: '🐾' },
    { key: 'restaurant', label: '餐飲', icon: '🍽️' },
    { key: 'ecommerce', label: '電商', icon: '🛍️' },
    { key: 'saas', label: 'SaaS', icon: '🚀' },
    { key: 'education', label: '教育', icon: '📚' },
    { key: 'hr', label: '人資', icon: '👥' },
    { key: 'general', label: '通用', icon: '⭐' },
  ]

新增：scripts/seed-templates.ts — 把預設模板寫入 DB
```

##### API

```
新增：src/app/api/admin/survey-templates/route.ts
  GET  — 列表（?source=platform|tenant|marketplace&industry=pet&search=關鍵字）
  POST — 建立模板（從現有問卷複製 或 手動填寫）

新增：src/app/api/admin/survey-templates/[id]/route.ts
  GET    — 單一模板完整內容
  PATCH  — 更新
  DELETE — 刪除

新增：src/app/api/admin/survey-templates/[id]/use/route.ts
  POST — 一鍵從模板建立完整問卷
    1. 讀取模板 survey_config + questions + branch_config
    2. createSurvey → 批量 createQuestion → 設定 branch_config
    3. use_count++
    4. 回傳新問卷 ID + slug

新增：src/app/api/admin/survey-templates/[id]/rate/route.ts
  POST { rating: 1-5, comment? }

新增：src/app/api/admin/survey-templates/[id]/publish/route.ts
  POST { is_public: true } — 公開到市集
```

##### 後台頁面

```
新增：src/app/(admin)/insight-admin/survey-templates/page.tsx
修改：layout.tsx — KNOWN_ADMIN_PAGES 加 'survey-templates'，Sidebar 加 { path: '/survey-templates', label: '📋 問卷模板' }
修改：middleware.ts — KNOWN_ADMIN_PAGES 加 'survey-templates'

頁面 UI：
  Tab 切換：[🏢 平台模板] [🏠 我的模板] [🌐 模板市集]
  行業篩選列：[全部] [🐾寵物] [🍽️餐飲] [🛍️電商] ...
  搜尋框
  模板卡片網格：圖示 + 名稱 + 說明 + 使用次數 + 評分 + [預覽] [使用]
  「使用」→ modal 自訂標題/slug → 一鍵建立
  「預覽」→ modal 顯示完整題目 + 分流邏輯

修改：surveys/page.tsx
  新增按鈕：[📋 從模板建立] → 跳轉到 survey-templates 頁面
  問卷設定區塊加：[💾 存為模板] → modal 填寫名稱/說明/行業 → POST survey-templates

模板市集排序：use_count DESC | rating DESC | created_at DESC
精選模板（is_featured）置頂
```

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
| 問卷模板 | `lib/surveyTemplates.ts`、`api/admin/survey-templates/`、`insight-admin/survey-templates/`、`scripts/seed-templates.ts`、DB migration | `surveys/page.tsx`、`layout.tsx`、`middleware.ts` |

---

### 建議開發順序（2026-03-25 更新）

> Cursor 已建立大量 .ts 檔案，但很多沒有真正接上去。
> 以下是按「緊急度 × 影響力」排列的執行清單，每項標註狀態。

```
═══ 第 1 批：緊急 Bug 修復（阻礙正常使用）═══

□ BUG-1  分流邏輯壞了（19 題全顯示）
         修改：src/hooks/useSurveyFlow.ts
         動作：把 resolveRoutes + filterQuestions 兩個函式整段替換
               （完整代碼在本文件「緊急修復：DB CHECK 約束錯誤 + 分流邏輯未修復」區塊）
         重點：刪除 active.add('A') 和 if (q.route === 'A') return true
         驗證：選「沒有且暫時不考慮」→ 應只看到 11 題（不是 19 題）
         同時：檢查 DB surveys.branch_config 是否為 NULL

□ BUG-2  AI 對話建立問卷報錯 ai_usage_logs_action_check
         動作：在 Supabase 跑 SQL：
           ALTER TABLE ai_usage_logs DROP CONSTRAINT ai_usage_logs_action_check;
           ALTER TABLE ai_usage_logs ADD CONSTRAINT ai_usage_logs_action_check
             CHECK (action IN ('generate','regenerate','generate_meta','regenerate_meta','chat','insight','story','sentiment'));

□ BUG-3  OG 分享出去顯示 coverTitle 而非自訂 OG
         診斷：SELECT og_title, cover_title FROM surveys WHERE slug = 'maoxingtianxia-mvp-survey';
         如果 og_title = NULL → 前端 save 流程有 bug
         如果 og_title 有值 → LINE 快取問題，重新貼連結即可
         同時：確認 [org]/[slug]/page.tsx 和 survey/[slug]/layout.tsx 有 export const dynamic = 'force-dynamic'

□ BUG-4  3 個 admin API 缺少 requireRole
         ai-sentiment/route.ts → 加 requireRole('viewer')
         responses/[id]/route.ts → 加 requireRole('viewer')
         line/test/route.ts → 加 requireRole('admin')

═══ 第 2 批：功能接線（後端做好了但前端沒接上）═══

□ WIRE-1  故事報告沒有保存到 DB
          修改：src/app/api/admin/ai-story/route.ts
          動作：在 return 前加 INSERT INTO ai_insight_reports（report_type = 'story'）
          DB：  ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'data';

□ WIRE-2  洞察報告歷史列表不區分數據/故事
          修改：ai-insight GET handler — 回傳加上 report_type
          修改：insight/page.tsx — 歷史列表顯示 📊/📖 圖示，點擊切換對應 tab
          新增：報告生成成功後顯示「✅ 已自動保存」toast

□ WIRE-3  故事牆管理頁面沒有 Sidebar 入口
          修改：layout.tsx KNOWN_ADMIN_PAGES 加 'story-wall'
          修改：layout.tsx BASE_NAV_GROUPS 加 { path: '/story-wall', label: '📖 故事牆管理' }
          修改：middleware.ts KNOWN_ADMIN_PAGES 加 'story-wall'
          新增：insight-admin/story-wall/page.tsx（管理頁面：審核/隱藏/置頂/篩選）

□ WIRE-4  問卷完成頁缺少 Story Card + 分享按鈕
          新增：components/public/StoryCard.tsx
          新增：components/public/ShareButtons.tsx
          修改：app/(public)/done/DoneClient.tsx — 呼叫 story-card API → 渲染卡片 → 分享按鈕
          修改：submit route — allow_story_wall 預設 false，由完成頁勾選

□ WIRE-5  Rich Menu 設定搬進後台 LINE 設定頁面
          修改：lib/lineConfig.ts — LINE_CONFIG_KEYS 新增 POST_SURVEY_RICH_MENU_ID 等 8 個 key
          修改：lib/lineNotify.ts switchUserRichMenu() — 改用 getLineConfig 取代 process.env
          修改：line-settings/page.tsx — 新增 Rich Menu / LIFF / LINE Login 設定區塊
          修改：listLineConfigs() — group 從定義讀取而非 key 前綴判斷

□ WIRE-6  洞察報告分享功能（公開連結 + 分享小卡）
          DB：  ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_slug TEXT UNIQUE;
                ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
                ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_title TEXT;
                ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_views INT DEFAULT 0;
          修改：ai-insight route 新增 PATCH handler（share/unshare/update_title）
          新增：app/api/report/[slug]/route.ts — 公開 API（不需登入）
          新增：app/report/[slug]/page.tsx — 公開報告頁面（SSR + OG Meta + CTA）
          新增：components/admin/ShareCard.tsx — 分享小卡（插畫 + 摘要 + 儲存 PNG）
          新增：components/admin/ShareCardModal.tsx — 分享 modal
          修改：insight/page.tsx — 加「📤 分享」按鈕 → 開 ShareCardModal
          安裝：npm install html2canvas

═══ 第 3 批：確認 Sidebar 所有功能都有入口 ═══

□ NAV-1  逐一確認以下頁面在 Sidebar 有連結且可正常訪問：
         □ Dashboard（/insight-admin/{slug}）
         □ 問卷管理（/surveys）
         □ 填答列表（/responses）
         □ 漏斗分析（/funnel）
         □ 交叉分析（/crosstab）
         □ 標籤統計（/tags）
         □ 標籤規則（/tag-rules）
         □ 來源分析（/utm）
         □ A/B 比較（/ab）
         □ AI 洞察報告（/insight）—— 含數據報告 + 故事模式 tab
         □ 故事牆管理（/story-wall）—— 新增
         □ 客服中心（/support）
         □ LINE 推播（/broadcast）
         □ 通知規則（/notification-rules）
         □ 訊息模板（/templates）
         □ UTM 管理（/utm-links）
         □ Rich Menu（/rich-menu）
         □ LINE 設定（/line-settings）—— 含 Rich Menu ID / LIFF / LINE Login 設定
         □ 通知樣式（/notification-styles）
         □ 封測名單（/waitlist）
         □ Webhook（/webhooks）
         □ Meta/OG（/site-settings）
         □ AI 設定（/ai-settings）
         □ 主題設定（/theme-settings）
         □ 管理員面板（/panel）
         □ 團隊管理（/team）
         □ 租戶管理（/tenants）—— 僅 super_admin
         □ 帳號設定（/account）
         □ 訂閱方案（/subscription）
         □ 升級頁面（/upgrade）—— 試用到期時導向

═══ 第 4 批：前面規劃但尚未實作的功能 ═══

□ FEAT-1  Dashboard 頁面整合新指標
          確認 page.tsx 有顯示：平均填答時間、數據品質分數、回覆速度長條圖、棄卷熱點標紅

□ FEAT-2  AI 對話生成的問卷確認能寫入 DB
          確認 AiSurveyChat.tsx 的流程：parseSurveyJson → 預覽 → 呼叫 surveys API 建立 → 建立題目

□ FEAT-3  品牌化 PDF 報告匯出
          新增：api/admin/export-report/route.ts
          修改：insight/page.tsx 加「匯出 PDF」按鈕

□ FEAT-4  公開故事牆頁底部 CTA + 頂部統計 + 關鍵字標籤雲
          確認：story-wall/[surveySlug]/page.tsx

□ FEAT-7  總後台：平台級通知系統 + Rich Menu + 通知樣式管理
          （只有 super_admin 可進入的 /snowrealm-insight-ctrl）

          ═══ 7a. 平台公告通知系統 ═══

          DB：
          CREATE TABLE IF NOT EXISTS platform_notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            -- 通知內容
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            content_type TEXT DEFAULT 'text',        -- 'text' | 'flex' | 'markdown'
            flex_json JSONB,                         -- Flex Message JSON（LINE 用）
            -- 通知類型
            category TEXT NOT NULL DEFAULT 'announcement',  -- 'announcement' | 'maintenance' | 'feature' | 'promotion' | 'urgent'
            -- 推送目標
            target TEXT NOT NULL DEFAULT 'all',       -- 'all' | 'pro' | 'free' | 'specific'
            target_tenant_ids TEXT[],                 -- target='specific' 時指定
            -- 推送管道
            channels TEXT[] DEFAULT '{line,dashboard}', -- 'line' | 'dashboard' | 'email'
            -- 排程
            status TEXT DEFAULT 'draft',              -- 'draft' | 'scheduled' | 'sent' | 'cancelled'
            scheduled_at TIMESTAMPTZ,
            sent_at TIMESTAMPTZ,
            -- 統計
            sent_count INT DEFAULT 0,
            read_count INT DEFAULT 0,
            -- 元資料
            created_by UUID REFERENCES admin_users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- 已讀紀錄（Dashboard 內建通知用）
          CREATE TABLE IF NOT EXISTS notification_reads (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            notification_id UUID REFERENCES platform_notifications(id) ON DELETE CASCADE,
            user_id UUID REFERENCES admin_users(id),
            read_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE (notification_id, user_id)
          );

          通知類型：
            📢 announcement — 系統公告（新功能上線、版本更新）
            🔧 maintenance  — 維護通知（預定停機、緊急維修）
            ✨ feature      — 新功能介紹（功能說明 + CTA）
            🎉 promotion    — 促銷活動（限時優惠、折扣）
            🚨 urgent       — 緊急通知（安全事件、重大 bug）

          API：
            新增：src/app/api/super-admin/notifications/route.ts
              GET  — 列出所有平台通知（含統計）
              POST — 建立新通知（草稿 or 立即發送 or 排程）

            新增：src/app/api/super-admin/notifications/[id]/route.ts
              GET    — 單一通知詳情 + 送達/已讀統計
              PATCH  — 編輯（draft 狀態才能改）
              DELETE — 刪除

            新增：src/app/api/super-admin/notifications/[id]/send/route.ts
              POST — 立即發送
                1. 根據 target 查出目標租戶的管理員
                2. channels 包含 'line' → 批量 LINE Push Message
                3. channels 包含 'dashboard' → 寫入 notification_reads（未讀狀態）
                4. channels 包含 'email' → 批量發送 email
                5. 更新 sent_count + sent_at + status='sent'

          總後台頁面：
            新增：src/app/(super-admin)/snowrealm-insight-ctrl/notifications/page.tsx

            UI：
            ┌─────────────────────────────────────────────────┐
            │ 📢 平台通知管理                    [+ 建立通知] │
            │                                                  │
            │ [全部] [📢公告] [🔧維護] [✨功能] [🎉促銷]      │
            │                                                  │
            │ ┌────────────────────────────────────────────┐  │
            │ │ 📢 Insight Engine v2.0 正式上線            │  │
            │ │ 狀態：已發送 · 送達 156 人 · 已讀 89 人    │  │
            │ │ 管道：LINE + Dashboard                      │  │
            │ │ 2026/03/25 14:00                            │  │
            │ │ [查看詳情] [重新發送]                       │  │
            │ ├────────────────────────────────────────────┤  │
            │ │ 🔧 系統維護公告：3/28 02:00-04:00          │  │
            │ │ 狀態：排程中 · 預定 3/27 18:00 發送         │  │
            │ │ [編輯] [取消排程]                           │  │
            │ ├────────────────────────────────────────────┤  │
            │ │ 🎉 Pro 方案首月半價                        │  │
            │ │ 狀態：草稿                                  │  │
            │ │ [編輯] [預覽] [立即發送] [排程發送]        │  │
            │ └────────────────────────────────────────────┘  │
            └─────────────────────────────────────────────────┘

            建立/編輯 Modal：
              標題：[________________________]
              內容：[________________________]（支援 markdown）
              類型：[▼ 選擇類型]
              推送目標：● 全部租戶 ○ 僅 Pro ○ 僅 Free ○ 指定租戶
              推送管道：☑ LINE ☑ Dashboard ☐ Email
              LINE 樣式：● 純文字 ○ Flex Message（可自訂 JSON）
              [預覽] [存為草稿] [立即發送] [排程發送]

          ═══ 7b. 總後台 Rich Menu 管理 ═══

          目前 Rich Menu 只在租戶後台（insight-admin/rich-menu）可管理。
          總後台需要能管理**平台級的 Rich Menu**（Official Bot 的預設選單）。

          新增：src/app/(super-admin)/snowrealm-insight-ctrl/rich-menu/page.tsx

          功能：
            - 管理 Official Bot 和 Insight Bot 的 Rich Menu（跟租戶版一樣的 UI）
            - 但這裡是**全域預設**，影響所有沒有自訂 Rich Menu 的用戶
            - 可以設定「新好友預設 Rich Menu」和「填完問卷後 Rich Menu」
            - 顯示目前各 Bot 的預設 Rich Menu 狀態

          API：
            複用現有的 /api/admin/rich-menu，但加一個 scope 參數
            或新增：src/app/api/super-admin/rich-menu/route.ts
            → 直接用 ENV 的 Channel Token 操作（不走租戶的 lineConfig）

          ═══ 7c. 總後台通知樣式管理 ═══

          目前 line_notification_styles 是租戶級的。
          總後台需要管理**平台級的通知樣式**（系統通知的 Flex Message 模板）。

          新增：src/app/(super-admin)/snowrealm-insight-ctrl/notification-styles/page.tsx

          功能：
            - 管理平台級的 LINE Flex Message 樣式
            - 系統通知（新帳號、登入、問卷完成、AI 報告等）的樣式在這裡統一管理
            - 每種通知事件可自訂：標題、顏色、按鈕文字、圖片
            - 預覽功能：即時看到 Flex Message 的效果

          DB：
          CREATE TABLE IF NOT EXISTS platform_notification_styles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_type TEXT NOT NULL UNIQUE,   -- 'new_signup' | 'login' | 'survey_complete' | 'ai_report' | 'weekly_report' | 'payment_success' ...
            display_name TEXT NOT NULL,         -- 顯示名稱（如「新用戶註冊通知」）
            is_active BOOLEAN DEFAULT true,
            -- Flex Message 樣式
            header_color TEXT DEFAULT '#1DB446',
            header_text TEXT,
            body_template TEXT NOT NULL,        -- 支援 {{variable}} 佔位符
            footer_text TEXT,
            button_label TEXT,
            button_url TEXT,                    -- 支援 {{variable}}
            thumbnail_url TEXT,
            -- 純文字備援（LINE 不支援 Flex 時）
            text_template TEXT NOT NULL,        -- 支援 {{variable}}
            -- 元資料
            updated_by UUID REFERENCES admin_users(id),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          預設事件類型 seed：
            new_signup        → 新用戶註冊（通知到管理員 LINE）
            user_login        → 用戶登入
            survey_complete   → 問卷填答完成
            ai_report_ready   → AI 報告生成完成
            weekly_report     → 每週報告
            payment_success   → 付款成功
            trial_expiring    → 試用即將到期（3天前）
            trial_expired     → 試用已到期
            response_milestone → 回覆數里程碑（100/500/1000）
            support_new_ticket → 新客服工單
            system_alert      → 系統異常警報

          API：
            新增：src/app/api/super-admin/notification-styles/route.ts
              GET  — 列出所有事件樣式
              PATCH — 更新特定事件的樣式

          修改：src/lib/lineNotify.ts
            目前 pushToAdmin 等函式的 Flex Message 是硬編碼的
            改成從 platform_notification_styles 讀取模板 → 填入變數 → 發送

          ═══ 7d. 總後台導覽更新 ═══

          修改：src/app/(super-admin)/snowrealm-insight-ctrl/layout.tsx

          NAV_ITEMS 新增：
            { href: '/snowrealm-insight-ctrl/notifications', label: '平台通知', icon: '📢' },
            { href: '/snowrealm-insight-ctrl/rich-menu', label: 'Rich Menu', icon: '📱' },
            { href: '/snowrealm-insight-ctrl/notification-styles', label: '通知樣式', icon: '🎨' },

□ FEAT-6  問卷模板系統
          DB：  建立 survey_templates + template_ratings 表
          新增：lib/surveyTemplates.ts（預設模板定義 + 行業分類）
          新增：api/admin/survey-templates/（CRUD + use + rate + publish）
          新增：insight-admin/survey-templates/page.tsx（模板瀏覽 + 市集）
          新增：scripts/seed-templates.ts（seed 平台預設模板）
          修改：surveys/page.tsx 加 [📋 從模板建立] + [💾 存為模板]
          修改：layout.tsx + middleware.ts 加 'survey-templates'

□ FEAT-8  AI 主動推送（LINE 週報 AI 摘要 + 異常預警）
          修改：api/cron/weekly-report 加 AI 摘要
          新增：api/cron/ai-alerts（NPS 下降 / 棄卷率飆升 / 負面關鍵字）

═══ 第 5 批：P-URGENT 剩餘項目（部分可能已被 Cursor 處理）═══

□ URG-1  確認毛行天下重複問題已解決
         SQL: SELECT slug, name FROM tenants WHERE name LIKE '%毛行天下%';
         如果重複 → 刪除/合併 + register route 加名稱唯一檢查

□ URG-2  確認服務狀態紅燈已修好
         panel 頁面的 PostgreSQL / LINE / OpenAI 狀態是否全綠

□ URG-3  確認 super_admin 租戶列表不再顯示全部（或維持全部但去重）

□ URG-4  毛行天下硬編碼解耦
         確認 Official Bot 文案從 tenantBranding.ts 讀取而非硬編碼
         確認 site-settings 頁面有 Bot 文案設定區塊
```

---

## 注意事項

- DB 操作一律用 `lib/db.ts` 的函式，不要直接 import pg
- AI 呼叫一律透過 `aiService.ts` 取 key，不要硬編碼 API Key
- 新增 admin 頁面要加到 middleware.ts 的 `KNOWN_ADMIN_PAGES` Set
- 新增 API route 如果需要認證，確保路徑在 `/api/admin/` 下
- LINE webhook 需要驗證 signature（HMAC-SHA256）
- 前端一律用繁體中文
- 部署：push `main` 由 Vercel 自動上線。大檔上傳走 `postUpload()` 直傳 R2（Vercel 請求上限 4.5 MB），背景工作用 `after()`，`/api/cron/*` 需帶 `Authorization: Bearer $CRON_SECRET`

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
