# insight-engine 未完成任務清單
> 最後更新：2025-07-25

---

## 1. 動態主題渲染（Theme Migration）

### 已完成
- [x] CSS 變數基礎建設（globals.css `:root` + `@theme inline`）
- [x] `THEME_CSS_VALUES` 匯出（9 主題 × 9 CSS hex 值）— AdminSurveyContext.tsx
- [x] layout.tsx 注入 `style={cssVars}` + `data-admin-theme={theme}`
- [x] 共用元件：StatCard、SummaryButton、ChartBlock、ResponseTable
- [x] 頁面：panel、dashboard、team、webhooks、ai-settings、ab、notification-rules

### 未完成 — 約 18 個後台頁面需要主題轉換
替換規則：
- `bg-slate-900/60` → `bg-t-card-bg`
- `border-slate-800` → `border-t-card-border`
- `text-cyan-400` → `text-t-accent`
- `bg-cyan-600` → `bg-t-btn`
- `hover:bg-cyan-500` → `hover:bg-t-btn-hover`
- `bg-cyan-500/20` → `bg-t-accent-bg`

待處理頁面清單：
- [x] notification-styles/page.tsx
- [x] waitlist/page.tsx
- [x] utm-links/page.tsx
- [x] utm/page.tsx
- [x] line-settings/page.tsx
- [x] funnel/page.tsx
- [x] crosstab/page.tsx
- [x] broadcast/page.tsx
- [x] templates/page.tsx
- [x] tags/page.tsx
- [x] tag-rules/page.tsx
- [x] surveys/page.tsx
- [x] site-settings/page.tsx
- [x] rich-menu/page.tsx
- [x] responses/page.tsx
- [x] responses/[id]/page.tsx
- [x] tenants/page.tsx
- [x] theme-settings/page.tsx

---

## 2. Three.js 3D 動態背景
- [ ] 安裝：`npm install three @react-three/fiber @react-three/drei`
- [ ] 建立 3D 粒子/幾何背景元件（顏色跟隨主題 CSS 變數）
- [ ] 整合到 admin layout 作為背景層

---

## 3. 問卷跳題分流邏輯（Smart Branching）
- [ ] 目前 `branch_config` schema 只支援手動逐題設定，20+ 題 × 5 選項太累
- [ ] 需要更聰明的 UX：規則式條件 / 視覺化流程編輯器 / 批次設定
- [ ] 探索資料庫現有 `branch_config` 欄位結構，設計更好方案

---

## 4. 問卷基本設定 — Meta / OG 欄位 + 問卷連結
- [ ] surveys 表加欄位：`meta_title`、`meta_description`、`og_image_url`
- [ ] 問卷基本設定 UI 加入 Meta/OG 編輯區塊
- [ ] 問卷基本設定頁面直接顯示可複製的公開問卷 URL
- [ ] 公開問卷頁面讀取該問卷的 meta/og 欄位渲染 `<head>`

---

## 5. 管理員面板邀請 UI
- [ ] panel/page.tsx 已有邀請狀態和函式（~lines 73-100），但缺少 JSX 渲染
- [ ] 需要加入邀請表單 UI（輸入 email → 產生邀請連結 → 顯示待處理/已過期邀請）

---

## 6. 總後台（Super Admin）升級
- [ ] /snowrealm-insight-ctrl 目前只有概覽表格
- [ ] 需要子頁面：租戶詳情、全域設定、系統健康度等
- [ ] 資料量：25 張 DB 表已探索完畢

---

## 7. ESLint / Tailwind v4 風格建議 ✅ 已完成
不影響 build，但可一次修掉：
- [x] `bg-gradient-to-r` → `bg-linear-to-r`（約 20 處）
- [x] `bg-gradient-to-br` → `bg-linear-to-br`（約 15 處）
- [x] `!text-base` → `text-base!`（2 處）
- [x] `accent-[var(--t-accent)]` → `accent-t-accent`（2 處）
- [x] `min-w-[Xpx]` → `min-w-N`（5 處）— 保留為合法 arbitrary value
- [x] `max-h-[200px]` → `max-h-50`（1 處）
- [x] `z-[100]` → `z-100`（2 處）
- [x] `from-white/[0.04]` → `from-white/4`、`to-white/[0.02]` → `to-white/2`（3 處）

涉及檔案：page.tsx (public)、ResponseTable、XpBar、AchievementOverlay、DownloadAnswers、ThemeWrapper、CoverClient、DoneClient、ThemeMilestone、ThemeProgress、EmojiPicker、AiGeneratePanel、OrgSurveyClient、snowrealm-insight-ctrl、team、line-settings、surveys、webhooks、tenants

---

## 8. 其他程式碼品質 ✅ 已完成
- [x] register/page.tsx：useCallback 補上 `slug` 依賴
- [x] personalityAnalyzer.ts：移除 4 個未使用變數（recordMethod, memoryFade, interest, hope）
- [x] ThemeWrapper.tsx：移除 3 個未使用 import（shellClass, ctaBtnClass, questionTitleClass）
- [x] aiCrypto.ts：移除未使用常數 `TAG_LENGTH`
- [x] theme-settings/route.ts：移除未使用 import `query`
- [x] system/route.ts：移除未使用 interface `TableCount`
- [x] team/page.tsx：移除未使用變數 `basePath`、`expiredInvites`、`pathname`、`slugMatch`
- [x] survey/[slug]/page.tsx：移除未使用 import `useCallback`
- [x] OrgSurveyClient.tsx：移除未使用參數 `org`、消除 3 處 `as any` 型別

---

## 9. 尚未啟動的功能
- [ ] 問卷模板庫（Survey Templates）
- [ ] AI 問卷生成
- [ ] LINE Login 整合
- [ ] 最終 build + git push

---

## 10. VS Code 工作區注意事項
- SnowRealmRebirth 大資料夾開啟時，TS Server 會掃描所有子專案 tsconfig 導致假錯誤
- **建議**：直接開 `d:\SnowRealmRebirth\snowrealm-insight-engine\insight-engine` 作為 workspace root
- 如需同時改 MaoTravelBlog，另開視窗：`code d:\SnowRealmRebirth\snowrealm-pet\MaoTravelBlog`

---

## 已完成項目（供參考）
- [x] Email 驗證、自訂 slug 路由、Google OAuth
- [x] 網域遷移至 insight.snowrealm.pet
- [x] LINE 設定 webhook URL 修正 + 導航重排
- [x] 問卷封面頁（公開）
- [x] 問卷拖曳排序
- [x] 公開問卷標題 / OG metadata
- [x] 安全性稽核（3 個漏洞修復：邀請 token 洩漏、legacy auth bypass、tenants config 暴露）
- [x] Cookie / Privacy / Terms 頁面 + footer 連結
- [x] 管理主題色彩系統（ADMIN_THEME_COLORS 9 主題 × 13 屬性）
- [x] CSS 變數主題系統（THEME_CSS_VALUES + @theme inline）
- [x] Build 驗證通過（npx next build 成功）