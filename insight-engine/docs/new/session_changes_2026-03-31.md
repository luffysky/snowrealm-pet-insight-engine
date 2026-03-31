# Session Changes — 2026-03-31

> 本次 session 所有新增/修改檔案與資料庫影響，供最終審核 + git push 使用。

---

## 新增檔案

| 檔案 | 說明 |
|------|------|
| `src/app/(admin)/insight-admin/api-keys/page.tsx` | API Key 管理頁面（修復 sidebar 404） |
| `src/app/api/super-admin/orders/export/route.ts` | 訂單 CSV 匯出 API（修復 orders 頁「匯出 CSV」404） |
| `src/app/api/admin/survey-templates/[id]/publish/route.ts` | 問卷模板公開到市集 / 取消公開 |
| `src/app/api/admin/support/[ticketId]/ai-suggest/route.ts` | 客服工單 AI 回覆草稿建議 |
| `src/lib/surveyTemplates.ts` | 平台預設模板定義（8 套，含通用/餐飲/電商/SaaS/教育/人資/寵物） |
| `docs/new/todo_list_all.md` | 全任務清單重排 Phase 版（含每項詳細檔案清單 + DB migration） |

---

## 修改檔案

| 檔案 | 說明 |
|------|------|
| `src/app/(admin)/insight-admin/insight/page.tsx` | 新增第三 tab「🔤 開放題分析」（FEAT-9）+ `SentimentDisplay` 元件 |
| `docs/new/todo_all.md` | FEAT-9 標為已完成，更新日期 |
| `docs/new/session_changes_2026-03-31.md` | 搬移至 new/ 資料夾 + 本次記錄 |

---

## 資料庫影響

本次 session **無新增資料表或欄位**（所有新增 API 使用既有表）。

下列表在 `supabase/run_all_pending.sql` 已定義，確認執行即可：
- `support_tickets` / `support_messages` / `support_templates` — 客服系統
- `survey_templates` — 問卷模板
- `platform_notifications` / `notification_reads` — 平台通知

---

## 已掃描確認完成（本次無需重做）

| 項目 | 狀態 |
|------|------|
| URG-6 Sidebar 連結 slug | ✅ middleware + layout 已正確處理（無 slug 走 defaultAccess） |
| 客服系統後端 | ✅ support route × 4 + supportEngine.ts + LINE webhook 整合均已存在 |
| FEAT-7a 平台通知系統 | ✅ API × 3 + 頁面均已存在；DB migration 在 run_all_pending.sql |
| FEAT-7b/c/d 總後台 Rich Menu/通知樣式/導覽 | ✅ 全部已存在（pages + NAV_ITEMS） |
| ADMIN-2/3/7 超級後台儀表板/用戶/AI成本 | ✅ pages 均存在 |
| FEAT-6 問卷模板系統 | ✅ API × 3 + 頁面均已存在；新增 publish route + surveyTemplates.ts |
| WIRE-1~6 | ✅ 前次 session 確認 |
| FEAT-1~4、FEAT-9、URG-2、URG-5 | ✅ 前次 session 確認 |

---

## 404 修復清單

| 路由 | 問題 | 修復方式 |
|------|------|---------|
| `/insight-admin/api-keys` | page.tsx 不存在 | 新增 page.tsx |
| `GET /api/super-admin/orders/export` | route.ts 不存在 | 新增 route.ts |

---

## TypeScript 檢查

```
npx tsc --noEmit → 0 errors ✅
```

---

## 推送前最終審核清單

- [ ] `git diff` 確認所有改動符合預期
- [ ] 確認 `supabase/run_all_pending.sql` 已在 Supabase 執行（support_tickets / survey_templates / platform_notifications）
- [ ] 確認 api-keys/page.tsx 在後台側欄可正常點擊
- [ ] 確認 orders/export CSV 格式正確（UTF-8，逗號分隔）
- [ ] 確認 insight/page.tsx 情感分析 tab 無回覆時顯示空狀態
- [ ] 確認 survey-templates/[id]/publish 在模板頁面已接上前端按鈕（若尚未接，後續再補）
