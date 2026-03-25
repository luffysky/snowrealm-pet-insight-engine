# 待辦任務清單

> 最後更新：2026-03-26
> DB 腳本全部在 `supabase/` 資料夾，已 commit 到 GitHub。

---

## 🔴 需要在 Supabase 手動執行的 Migration

> 腳本已在 repo，直接複製到 Supabase SQL Editor 貼上執行即可。

### migration_phase33_report_sharing.sql（commit `0474f28`）

```
supabase/migration_phase33_report_sharing.sql
```

包含：
- `ai_insight_reports` 新增 `report_type / share_slug / is_public / share_title / share_views`
- `ai_usage_logs` 放寬 action CHECK 約束（加入 chat/insight/story/sentiment）
- `support_tickets` + `support_messages` + `support_templates`（客服系統）
- `survey_templates` + `template_ratings`（問卷模板系統）
- `automation_rules` 補 `last_triggered_at` 欄位

### migration_phase34_bot_passcode.sql（commit `40a6991`）

```
supabase/migration_phase34_bot_passcode.sql
```

包含：
- `site_settings` 新增 `bot_admin_passcode` 欄位

### migration_phase35_platform_notifications.sql（commit `40a6991`）

```
supabase/migration_phase35_platform_notifications.sql
```

包含：
- `platform_notifications` 表
- `notification_reads` 表
- `platform_notification_styles` 表 + 預設 10 筆 seed 資料

---

## ✅ 已完成（程式碼 + 已 commit）

| 項目 | commit |
|------|--------|
| HOTFIX-1~9 程式碼修復 | `d135fb8` |
| BUG-OG（force-dynamic OG meta）| `6293c1d` |
| WIRE-1 故事報告存 DB | `0474f28` |
| WIRE-2 洞察歷史區分數據/故事 | `0474f28` |
| WIRE-3 故事牆管理 Sidebar + 頁面 | `b7c878d` |
| WIRE-4 完成頁 Story Card 接線 | `b7c878d` |
| WIRE-5 lineConfig 補齊所有 LINE 參數 | `c783119` |
| WIRE-6 洞察報告公開分享 + ShareModal | `0474f28` |
| FEAT-1 Dashboard 新指標 | `b7c878d` |
| FEAT-3 PDF/Markdown 匯出 API | `40a6991` |
| FEAT-6 問卷模板系統 | `b7c878d` |
| FEAT-7 總後台通知 / Rich Menu / 樣式管理 | `40a6991` |
| Dockerfile + standalone build（Zeabur 部署修復）| 最新 |
| DB 腳本 phase33~35 commit 到 GitHub | 已完成 |

---

## 🟡 待確認（上線後驗證）

1. **Supabase 執行 phase33~35** — 見上方 Migration 清單
2. **LINE 設定頁面新欄位** — 進後台 `/line-settings` 確認顯示 RICH_MENU_SURVEY_URL / LINE Login 設定
3. **分享報告頁面** — 確認 `/report/{slug}` 公開頁可正常訪問（不需登入）
4. **問卷模板** — 確認 `/survey-templates` 頁面有在 Sidebar 且可正常使用
