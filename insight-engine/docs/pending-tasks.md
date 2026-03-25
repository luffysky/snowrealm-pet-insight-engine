# 待辦任務清單

> 最後更新：2026-03-26
> 已完成：HOTFIX-1~9（程式碼 + DB），見 commit `d135fb8`

---

## 🔴 Bug 修復

### BUG-OG：OG 分享不生效

**問題：** 分享連結到 LINE 時顯示 coverTitle 而非自訂 OG 標題/圖片。

**待做：**
1. 確認 `src/app/[org]/[slug]/page.tsx` 有 `export const dynamic = 'force-dynamic'`
2. 確認 `src/app/(public)/survey/[slug]/layout.tsx` 有 `export const dynamic = 'force-dynamic'`
3. 若 meta tag 正確但 LINE 還是舊的 → 是 LINE 快取，重新貼連結等 24 小時

**診斷 SQL：**
```sql
SELECT slug, og_title, og_description, og_image_url FROM surveys
WHERE slug = 'maoxingtianxia-mvp-survey';
```

---

## 🟠 功能接線（後端已有，前端未接）

### WIRE-1：故事報告未存入 DB

**修改：** `src/app/api/admin/ai-story/route.ts`

在 return 前加入：
```typescript
const saved = await queryOne<{ id: string }>(
  `INSERT INTO ai_insight_reports (tenant_id, survey_id, report, meta, generated_by, report_type)
   VALUES ($1, $2, $3, $4, $5, 'story') RETURNING id`,
  [tenantId, surveyId, JSON.stringify(report), JSON.stringify(reportMeta), roleCheck.userId]
)
```

**DB 先跑：**
```sql
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'data';
```

---

### WIRE-2：洞察報告歷史不區分數據/故事

**修改：**
- `src/app/api/admin/ai-insight/route.ts` GET handler — 回傳加上 `report_type`
- `src/app/(admin)/insight-admin/insight/page.tsx` — 歷史列表顯示 📊/📖 圖示，點擊切換對應 tab；報告生成後顯示「✅ 已自動保存」toast

---

### WIRE-3：故事牆管理沒有 Sidebar 入口

**修改：**
- `src/app/(admin)/layout.tsx` — `KNOWN_ADMIN_PAGES` 加 `'story-wall'`，`BASE_NAV_GROUPS` 加 `{ path: '/story-wall', label: '📖 故事牆管理' }`
- `src/middleware.ts` — `KNOWN_ADMIN_PAGES` 加 `'story-wall'`

**新增：** `src/app/(admin)/insight-admin/story-wall/page.tsx`
- 列出 `allow_story_wall = true` 的故事卡片
- 操作：審核通過 / 隱藏 / 置頂 / 刪除
- 篩選：全部 / 已審核 / 待審核 / 已隱藏
- 頂部統計 + 「複製故事牆連結」按鈕

---

### WIRE-4：問卷完成頁 Story Card 接線

目前 `DoneClient.tsx` 已有載入 story card 的邏輯，但需確認：
- `src/components/public/StoryCard.tsx` 元件存在且正常渲染
- `src/components/public/ShareButtons.tsx` 元件存在
- `allow_story_wall` 預設 false（已透過 `doneConfig` 控制）

---

### WIRE-5：Rich Menu 設定搬進後台 LINE 設定頁面

**修改：**
- `src/lib/lineConfig.ts` — `LINE_CONFIG_KEYS` 補齊 `LINE_FRIEND_URL`、`RICH_MENU_SURVEY_URL`、`LIFF_ID`、`LINE_LOGIN_CHANNEL_ID/SECRET/CALLBACK_URL`（目前已有 `POST_SURVEY_RICH_MENU_ID`、`DEFAULT_RICH_MENU_ID`）
- `src/lib/lineNotify.ts` `switchUserRichMenu()` — 改用 `getLineConfig('POST_SURVEY_RICH_MENU_ID')` 取代 `process.env`
- `src/app/(admin)/insight-admin/line-settings/page.tsx` — 新增 Rich Menu / LIFF / LINE Login 設定區塊

---

### WIRE-6：洞察報告公開分享連結 + 分享小卡

**DB 先跑：**
```sql
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_slug TEXT UNIQUE;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_title TEXT;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_views INT DEFAULT 0;
```

**新增/修改：**
- `src/app/api/admin/ai-insight/route.ts` — 新增 `PATCH` handler（share/unshare/update_title）
- `src/app/api/report/[slug]/route.ts` — 公開 API（不需登入，+1 view）
- `src/app/report/[slug]/page.tsx` — 公開報告頁面（SSR + OG Meta + CTA）
- `src/components/admin/ShareCard.tsx` — 分享小卡（插畫 + 摘要 + html2canvas 存 PNG）
- `src/components/admin/ShareCardModal.tsx` — 分享 modal
- `src/app/(admin)/insight-admin/insight/page.tsx` — 加「📤 分享」按鈕

**安裝：**
```bash
npm install html2canvas
```

---

## 🟡 新功能（尚未實作）

### FEAT-1：Dashboard 整合新指標

**修改：** `src/app/(admin)/insight-admin/page.tsx`

新增顯示：
- 平均填答時間卡片（`avgCompletionTime`）
- 數據品質分數卡片（`responseQuality`）
- 回覆速度長條圖（`responseVelocity`，Recharts BarChart）
- 漏斗棄卷熱點標紅（`isHotspot` 題目）

後端 `stats.ts` 已有這些函式，只差前端顯示。

---

### FEAT-3：品牌化 PDF 報告匯出

**新增：** `src/app/api/admin/export-report/route.ts`

使用 `@react-pdf/renderer`（不依賴 puppeteer，Node.js 原生）：
```bash
npm install @react-pdf/renderer
```

內容：封面 + 問卷標題 + 洞察摘要 + 重點發現 + 建議行動 + 漏斗圖

---

### FEAT-6：問卷模板系統

**DB 先跑：**
```sql
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'platform',
  tenant_id TEXT,
  created_by UUID REFERENCES admin_users(id),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  icon TEXT DEFAULT '📋',
  tags TEXT[] DEFAULT '{}',
  survey_config JSONB NOT NULL,
  questions JSONB NOT NULL,
  branch_config JSONB,
  use_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**新增：**
- `src/lib/surveyTemplates.ts` — 平台預設模板定義（行業分類）
- `src/app/api/admin/survey-templates/route.ts` — CRUD + use + rate + publish
- `src/app/(admin)/insight-admin/survey-templates/page.tsx` — 模板瀏覽 + 市集
- `src/scripts/seed-templates.ts` — seed 預設模板

**修改：**
- `src/app/(admin)/insight-admin/surveys/page.tsx` — 加「📋 從模板建立」+「💾 存為模板」
- `src/app/(admin)/layout.tsx` + `src/middleware.ts` — 加 `'survey-templates'`

---

## 完成記錄

| 日期 | 項目 | commit |
|------|------|--------|
| 2026-03-26 | HOTFIX-2~9 程式碼修復 | `d135fb8` |
| 2026-03-26 | DB：platform_unlimited / ai constraint / done_config / 幽靈題目清理 | 手動執行 |
