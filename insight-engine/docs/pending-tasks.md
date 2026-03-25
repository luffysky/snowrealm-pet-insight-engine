# 待辦任務清單

> 最後更新：2026-03-26
> 已完成：HOTFIX-1~9（程式碼 + DB），見 commit `d135fb8`
> 已完成：BUG-OG / WIRE-1 / WIRE-2，見 commit `6293c1d`（WIRE-1/2 原已由 Cursor 完成）

---

## ✅ 已完成

- **BUG-OG** — `survey/[slug]/layout.tsx` 加 `export const dynamic = 'force-dynamic'`（commit `6293c1d`）
- **WIRE-1** — `ai-story/route.ts` 已有 INSERT + reportId 回傳（Cursor 已完成）
- **WIRE-2** — GET API 已回傳 `report_type`，insight 頁面已顯示 📊/📖 + toast（Cursor 已完成）
- **WIRE-3** — `story-wall` 已在 layout.tsx KNOWN_ADMIN_PAGES + nav，管理頁面已完整實作（Cursor 已完成）
- **WIRE-4** — DoneClient.tsx 已整合 StoryCard + ShareButtons + allow_story_wall checkbox（Cursor 已完成）
- **WIRE-5** — lineConfig.ts 補齊所有 LINE 參數（含 Rich Menu / LIFF / LINE Login），lineNotify.ts 已用 getLineConfig（2026-03-26 完成）
- **WIRE-6** — 洞察報告公開分享：PATCH handler / 公開頁面 / ShareModal 均已完成（Cursor 已完成）
- **FEAT-1** — Dashboard 已顯示 avgCompletionTime / responseQuality / responseVelocity（Cursor 已完成）
- **FEAT-3** — export-report API route 已存在（Cursor 已完成）
- **FEAT-6** — survey-templates API + 頁面均已存在（Cursor 已完成）

---

## 🟠 待辦：DB Migration（需手動在 Supabase 跑）

```sql
-- WIRE-5：LINE Login config 新 key 不需要 DB migration，只要在後台設定即可
-- WIRE-6：已需要的欄位
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_slug TEXT UNIQUE;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_title TEXT;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS share_views INT DEFAULT 0;
ALTER TABLE ai_insight_reports ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'data';

CREATE INDEX IF NOT EXISTS idx_insight_reports_share ON ai_insight_reports (share_slug) WHERE is_public = true;

-- FEAT-6：問卷模板表
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

---

## 🟡 待確認：功能是否正常接線

### 確認 WIRE-5 在後台 LINE 設定頁面是否顯示新 key

後台 `/line-settings` 頁面的 `ConfigItem` 型別有 `group: 'insight' | 'official' | 'admin'`。
新加的 `RICH_MENU_SURVEY_URL`（official）和 `LINE_LOGIN_*`（admin）應該會自動出現在對應區塊。
→ 進後台確認有沒有看到這些新欄位

### 確認 survey-templates 有在 Sidebar 導覽

檢查：
- `src/app/(admin)/layout.tsx` — 有沒有 `{ path: '/survey-templates', label: '📋 問卷模板' }`
- `src/middleware.ts` — 有沒有 `'survey-templates'` 在 KNOWN_ADMIN_PAGES

### 確認 FEAT-3 export 路由返回正確格式

`src/app/api/admin/export-report/route.ts` 存在，但需要確認是否回傳 blob（PDF 或 Markdown）。

---

## 完成記錄

| 日期 | 項目 | commit |
|------|------|--------|
| 2026-03-26 | HOTFIX-2~9 程式碼修復 | `d135fb8` |
| 2026-03-26 | DB：platform_unlimited / ai constraint / done_config / 幽靈題目清理 | 手動執行 |
| 2026-03-26 | BUG-OG + Dockerfile + standalone build | 最新 commit |
| 2026-03-26 | WIRE-5 lineConfig.ts 補齊 RICH_MENU_SURVEY_URL + LINE Login keys | 本次 |
