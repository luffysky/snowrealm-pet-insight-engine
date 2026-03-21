# todos.md 全部待辦項目實作計畫

## 目標
依序完成 [todos.md](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/docs/todos.md) 中所有未完成項目，並補上使用者要求的首頁 footer 連結。一律遵循 [clean_code.md](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/docs/clean_code.md) 規範。

---

## 執行順序與預估

| 順序 | 項目 | 預估時間 |
|------|------|----------|
| 1 | 首頁 footer 加入 Cookie/Privacy/Terms 連結 | 5 分鐘 |
| 2 | 管理員邀請 UI（#5）| 20 分鐘 |
| 3 | 問卷 Meta/OG 欄位（#4）| 40 分鐘 |
| 4 | Three.js 3D 動態背景（#2）| 30 分鐘 |
| 5 | 問卷跳題分流邏輯（#3）| 探索性，先規劃 |
| 6 | Super Admin 升級（#6）| 探索性，先規劃 |
| 7 | 尚未啟動功能（#9）| 依使用者決定 |

---

## 項目 1：首頁 Footer 連結

### 問題
[(public)/page.tsx](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/app/register/page.tsx#6-7) 的 footer 只有「登入/註冊」，缺少 Cookie/Privacy/Terms 連結。

### 變更

#### [MODIFY] [page.tsx](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/app/(public)/page.tsx)
- footer 區塊（第 119-128 行）加入三個連結：隱私權政策、使用者條款、Cookie 政策
- 年份更新為 2026

---

## 項目 2：管理員邀請 UI（#5）

### 問題
[panel/page.tsx](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/app/%28admin%29/insight-admin/panel/page.tsx) 已有完整邀請邏輯（state、handleInvite 函式）但缺少 JSX 渲染。

### 變更

#### [MODIFY] [page.tsx](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/app/(admin)/insight-admin/panel/page.tsx)
在管理人員區塊下方加入邀請表單 UI：
- 「邀請成員」按鈕，點擊展開表單
- Email 輸入框 + 角色選擇器（admin/viewer）
- 邀請結果顯示（成功 → 複製連結 / 失敗 → 錯誤訊息）
- 使用既有的 `showInvite`、`inviteEmail`、`inviteRole`、[handleInvite](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/app/%28admin%29/insight-admin/panel/page.tsx#86-105)、`inviteResult`、`inviteError`、`copied`、[copyToClipboard](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/app/%28admin%29/insight-admin/panel/page.tsx#106-111) 等已定義的 state 和函式

---

## 項目 3：問卷 Meta/OG 欄位（#4）

### 問題
問卷需要獨立的 `meta_title`、`meta_description`、`og_image_url` 欄位。

### 變更

#### [MODIFY] [surveyRepo.ts](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/lib/surveyRepo.ts)
- 查詢問卷時包含 `meta_title`、`meta_description`、`og_image_url` 欄位

#### [MODIFY] [survey.ts](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/types/survey.ts)
- 型別定義新增三個可選欄位

#### [MODIFY] [site-settings/page.tsx](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/app/(admin)/insight-admin/site-settings/page.tsx)
- 加入問卷級別 Meta/OG 編輯表單

> [!IMPORTANT]
> DB migration 需要使用者手動執行 SQL 或透過 `scripts/db-push.js` 加入新欄位。我會提供 SQL 語句。

---

## 項目 4：Three.js 3D 動態背景（#2）

### 變更

#### [NEW] [AdminBackground3D.tsx](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/components/admin/AdminBackground3D.tsx)
- 3D 粒子/幾何背景元件
- 顏色跟隨 CSS 變數（`--t-accent`）

#### [MODIFY] [layout.tsx](file:///d:/SnowRealmRebirth/snowrealm-insight-engine/insight-engine/src/app/(admin)/layout.tsx)
- 整合 `AdminBackground3D` 作為背景層

> [!WARNING]
> 需要安裝 Three.js 相關套件：`three`、`@react-three/fiber`、`@react-three/drei`

---

## 項目 5-7：大型功能（後續分批規劃）

問卷跳題分流（#3）、Super Admin 升級（#6）、尚未啟動功能（#9）屬於大型功能，將在前面項目完成後逐一規劃並請求確認。

---

## 驗證計畫

### 自動化驗證
```bash
cd d:\SnowRealmRebirth\snowrealm-insight-engine\insight-engine
npx next build
```
確認 build 成功，無新增錯誤。

### 視覺驗證（使用瀏覽器工具）
1. **首頁 Footer**：開啟 `http://localhost:3000/`，確認 footer 顯示五個連結（登入、註冊、隱私權政策、使用者條款、Cookie 政策），點擊每個連結確認能正確導航
2. **管理員邀請 UI**：登入後進入 panel 頁面，確認「邀請成員」按鈕出現，展開表單後確認 UI 正確顯示
3. **Three.js 背景**：登入後台確認 3D 背景效果存在且跟隨主題色變化
