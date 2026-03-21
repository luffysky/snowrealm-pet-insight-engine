# insight-engine 專案架構與設計風格分析報告

## 一、技術棧總覽

| 項目 | 技術 |
|------|------|
| 框架 | **Next.js 16.1.7** (App Router) |
| 前端 | **React 19.2.3** + React Compiler |
| CSS | **Tailwind CSS v4** + PostCSS |
| 字型 | Geist / Geist Mono (Google Fonts) |
| 後端 | Next.js API Routes + **PostgreSQL** (`pg`) |
| 認證 | 自訂 JWT + Supabase Auth |
| ORM/查詢 | 原生 SQL ([lib/db.ts](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/lib/db.ts) → `queryOne` / `queryAll`) |
| 檔案存儲 | **AWS S3** / Cloudflare R2 |
| 圖表 | **Recharts 3.8** |
| LINE 整合 | LIFF SDK + LINE Messaging API |
| 部署 | [zbpack.json](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/zbpack.json)（Zeabur）|

---

## 二、目錄結構

```
insight-engine/src/
├── app/
│   ├── (admin)/                    ← 後台管理（23 個子頁面）
│   │   ├── layout.tsx              ← 476 行，含導航/租戶切換/問卷選擇器
│   │   └── insight-admin/          ← 各功能頁面群組
│   │       ├── page.tsx            ← Dashboard
│   │       ├── surveys/            ← 問卷管理
│   │       ├── responses/          ← 填答列表
│   │       ├── funnel/             ← 漏斗分析
│   │       ├── crosstab/           ← 交叉分析
│   │       ├── tags/, tag-rules/   ← 標籤統計/規則
│   │       ├── broadcast/          ← LINE 推播
│   │       ├── panel/              ← 管理員面板
│   │       ├── theme-settings/     ← 主題設定
│   │       └── ...（共 23 個子路由）
│   ├── (public)/                   ← 公開問卷頁面
│   │   ├── page.tsx                ← 問卷封面
│   │   ├── CoverClient.tsx         ← 封面互動
│   │   ├── survey/                 ← 填答流程
│   │   ├── done/                   ← 完成頁
│   │   └── liff/                   ← LINE LIFF 入口
│   ├── (super-admin)/              ← 總後台控制台
│   ├── api/                        ← API Routes（8 個子模組）
│   ├── login/, register/           ← 認證頁面
│   ├── layout.tsx                  ← Root Layout（含 SEO metadata）
│   └── globals.css                 ← 2032 行（主題系統核心）
├── components/
│   ├── admin/                      ← 後台共用元件（9 個）
│   │   ├── StatCard.tsx            ← 統計卡片
│   │   ├── ChartBlock.tsx          ← 圖表區塊（Line/Bar/Pie）
│   │   ├── ResponseTable.tsx       ← 填答表格
│   │   ├── SummaryButton.tsx       ← AI 摘要
│   │   ├── AdminSurveyContext.tsx  ← 問卷/主題全域狀態
│   │   ├── EmojiPicker.tsx         ← Emoji 選擇器
│   │   ├── AiGeneratePanel.tsx     ← AI 產生面板
│   │   └── TagChart.tsx            ← 標籤圖表
│   └── survey/                     ← 問卷填答元件（11 個）
│       ├── ThemeWrapper.tsx        ← 主題包裝器
│       ├── ThemeContext.tsx         ← 主題 Context
│       ├── QuestionSingle.tsx      ← 單選題
│       ├── QuestionMultiple.tsx    ← 複選題
│       ├── QuestionText.tsx        ← 文字題
│       ├── ProgressBar.tsx         ← 進度條
│       ├── theme/                  ← 主題視覺元件
│       │   ├── ParticleCanvas.tsx  ← 粒子背景
│       │   ├── ThemeMilestone.tsx  ← 里程碑動畫
│       │   └── ThemeProgress.tsx   ← 主題進度條
│       └── game/                   ← 遊戲化元件
│           ├── AchievementOverlay  ← 成就彈窗
│           ├── ProgressMap.tsx     ← 進度地圖
│           └── XpBar.tsx           ← 經驗值條
├── hooks/                          ← 3 個自訂 Hook
│   ├── useGameState.ts
│   ├── useSurveyFlow.ts
│   └── useThemeInteraction.ts
├── lib/                            ← 25 個服務/工具模組
│   ├── db.ts, auth.ts, jwt.ts      ← 核心認證/資料庫
│   ├── themes.ts                   ← 主題定義（19976 bytes）
│   ├── surveyConfig.ts             ← 問卷設定
│   ├── surveyRepo.ts               ← 問卷 Repository
│   ├── stats.ts                    ← 統計邏輯（24563 bytes）
│   ├── aiService.ts                ← AI 服務
│   ├── line*.ts                    ← LINE 相關（4 個）
│   ├── notificationEngine.ts       ← 通知引擎
│   └── ...
├── types/                          ← 4 個型別定義檔
├── constants/                      ← 1 個常數檔
└── middleware.ts                   ← 路由中介層（4217 bytes）
```

---

## 三、UI 設計風格分析

### 後台（Admin）

| 風格特徵 | 說明 |
|----------|------|
| **色系** | 深色主題（`slate-900` 為基底），CSS 變數動態切換 9 種主題色 |
| **主題系統** | `THEME_CSS_VALUES` 定義 9 主題 × 9 CSS 變數，透過 `style={cssVars}` 運行時注入 |
| **配色方式** | 使用 `bg-t-card-bg`、`text-t-accent`、`border-t-card-border` 等主題 token |
| **卡片風格** | 圓角 `rounded-2xl`、半透明背景、邊框分隔 |
| **響應式** | Desktop 下拉導航 + Mobile 漢堡選單 |
| **圖表** | Recharts 整合（折線/長條/圓餅圖） |
| **佈局** | `max-w-7xl` 居中、Grid 卡片排列（1/2/4 欄響應式） |

### 問卷前台（Public Survey）

| 風格特徵 | 說明 |
|----------|------|
| **主題數量** | 9 套完整主題 |
| **🎮 Game** | RPG 風——星空粒子、羊皮紙金邊卡片、HP/XP 進度條、成就彈窗、打字機效果 |
| **🔮 Cyber** | 霓虹科技——液態玻璃 backdrop-blur、流動光暈邊框（conic-gradient 旋轉）、Glitch 效果、掃描線 |
| **🏯 Ancient** | 古風水墨——暖褐配色、雙層邊框、微光進度條 |
| **🌸 Sakura** | 櫻花夢境——粉色系、花瓣飄落粒子動畫 |
| **🌊 Ocean** | 深海探索——藍綠系、水波紋動畫、螢光粒子 |
| **動畫深度** | 每套主題都有 hover、selected、pulse、shine、glitch 等完整互動動畫 |
| **遊戲化** | `XpBar`、`AchievementOverlay`、`ProgressMap`、`ThemeMilestone` 等元件 |
| **粒子系統** | [ParticleCanvas.tsx](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/components/survey/theme/ParticleCanvas.tsx) 8934 bytes 的 Canvas 粒子引擎 |

---

## 四、todos.md 執行策略分析

### 已完成項目 ✅
- **#1 動態主題渲染**：所有 18 個後台頁面已完成主題轉換
- **#7 ESLint / Tailwind v4 風格**：已全數修復
- **#8 程式碼品質**：未使用變數/import 已清理

### 尚未完成項目與執行優先級建議

| 優先級 | 項目 | 工作量 | 說明 |
|--------|------|--------|------|
| 🔴 高 | **#2 Three.js 3D 背景** | 中 | 需安裝 3 個套件，建立粒子/幾何背景元件，整合到 admin layout |
| 🔴 高 | **#4 Meta / OG 欄位** | 中 | DB 加欄位 + UI 編輯區塊 + 公開頁 `<head>` 渲染 |
| 🟡 中 | **#5 管理員邀請 UI** | 小 | `panel/page.tsx` 已有後端邏輯，只缺 JSX 渲染 |
| 🟡 中 | **#3 問卷跳題分流** | 大 | 需設計新 UX（規則式條件/視覺化流程/批次設定） |
| 🟡 中 | **#6 Super Admin 升級** | 大 | 需建子頁面（租戶詳情、全域設定、系統健康度） |
| 🟢 低 | **#9 尚未啟動功能** | 大 | 問卷模板庫、AI 問卷生成、LINE Login、最終 build |

---

## 五、clean_code.md 重點規範摘要（後續開發必須遵守）

### 核心原則
> **可讀性 > 可維護性 > 效能優化 > 炫技寫法**

### 關鍵規則

1. **命名**：變數表達資料意義、函式動詞開頭、boolean 以 `is/has/can/should` 開頭
2. **函式**：10-20 行為佳、上限 30 行、巢狀不超過 2 層、參數不超過 3 個
3. **分層**：`components`（UI）→ `hooks`（邏輯）→ `services`（API）→ `utils`（純工具）
4. **元件**：單一元件不超過 150 行、UI 與商業邏輯分離
5. **型別**：禁止濫用 `any`、所有 API response 必須有型別
6. **錯誤處理**：所有 API/IO 操作需有錯誤處理、不可 silent fail
7. **常數**：禁止魔法數字、重複字串集中管理

### AI 協作規則
- 嚴格依 [clean_code.md](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/docs/clean_code.md) 輸出程式碼
- 不得破壞既有功能
- 不得混寫 UI / 商業邏輯 / API
- 輸出前先說明結構與改動範圍

---

## 六、現有專案與 clean_code.md 的符合度觀察

| 項目 | 狀態 | 說明 |
|------|------|------|
| 分層結構 | ⚠️ 部分符合 | `lib/` 混合了 service/repository/utility，無明確 `services/` 資料夾 |
| 元件大小 | ⚠️ 部分超標 | [AdminSurveyContext.tsx](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/components/admin/AdminSurveyContext.tsx)（10248 bytes）、[EmojiPicker.tsx](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/components/admin/EmojiPicker.tsx)（8943 bytes）偏大 |
| admin layout | ⚠️ 偏大 | 476 行含多重邏輯（導航/租戶/問卷選擇），建議拆分 |
| [globals.css](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/app/globals.css) | ⚠️ 偏大 | 2032 行，建議依主題拆分為獨立檔案 |
| 型別系統 | ✅ 良好 | `types/` 有獨立型別定義，元件有 interface |
| 命名 | ✅ 良好 | 函式/變數命名語義清晰 |
| 測試 | ❌ 缺失 | 目前無任何自訂測試檔案 |
| [lib/themes.ts](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/lib/themes.ts) | ⚠️ 偏大 | 19976 bytes 的單一檔案 |

---

## 七、後續開發建議

> [!IMPORTANT]
> 所有後續修改都必須嚴格遵守 [clean_code.md](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/docs/clean_code.md) 規範，特別注意：
> - 新元件不超過 150 行
> - 新函式不超過 30 行
> - UI / 邏輯 / API 分層
> - 所有 API response 定義型別

當使用者準備好執行 [todos.md](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/docs/todos.md) 中的待辦項目時，我會依上述優先級逐一產出實作計畫（`implementation_plan.md`），確認後再進入開發模式。
