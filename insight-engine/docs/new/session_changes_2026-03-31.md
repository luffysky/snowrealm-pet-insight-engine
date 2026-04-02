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

- [x] `git diff` 確認所有改動符合預期
- [x] 確認 `supabase/run_all_pending.sql` 已在 Supabase 執行
- [x] 確認 api-keys/page.tsx 在後台側欄可正常點擊
- [x] 確認 orders/export CSV 格式正確
- [x] 確認 insight/page.tsx 情感分析 tab 無回覆時顯示空狀態
- [x] 確認 survey-templates/[id]/publish 在模板頁面已接上前端按鈕

---

## 2026-04-02 Session Changes

### Bug 修復

| 檔案 | 說明 |
|------|------|
| `src/app/api/blogs/[userSlug]/[articleSlug]/comments/route.ts` | 修復留言消失 — `parent_id::text` 把 NULL 轉成字串 "null"，頂層留言被誤歸為回覆 |
| `src/app/api/admin/responses/[id]/route.ts` | 補上 DELETE handler 缺少的 `requireRole('admin')` 安全檢查 |
| `src/app/globals.css` | 修復部落格 h1~h6 大小全部一樣（Tailwind Typography 未安裝，prose 類別無效）|

### 部落格 BLOG-1~20 補完（6 項）

#### BLOG-8 AI 封面圖生成

| 類型 | 檔案 | 說明 |
|------|------|------|
| 新增 | `src/app/api/admin/social/blog/ai-cover/route.ts` | DALL-E 3 封面圖生成 API（4 種風格 + R2 上傳） |
| 修改 | `src/components/social/BlogEditor.tsx` | 編輯器加「AI 生成封面」按鈕 + 風格選擇下拉 |

#### BLOG-9 文章統計頁

| 類型 | 檔案 | 說明 |
|------|------|------|
| 新增 | `src/app/api/admin/social/blog/stats/route.ts` | 文章統計 API（瀏覽/留言/反應/訂閱/分類/趨勢） |
| 新增 | `src/app/(admin)/insight-admin/blog-stats/page.tsx` | 獨立統計頁面（Recharts 圖表 + Top 文章排行） |
| 修改 | `src/app/(admin)/layout.tsx` | KNOWN_ADMIN_PAGES 加 'blog-stats'，Sidebar 加文章統計入口 |
| 修改 | `src/middleware.ts` | KNOWN_ADMIN_PAGES 加 'blog-stats' |

#### BLOG-13 TipTap AI 浮動選單

| 類型 | 檔案 | 說明 |
|------|------|------|
| 新增 | `src/app/api/admin/social/blog/ai-text/route.ts` | AI 文字處理 API（改寫/精簡/展開/修正/翻譯） |
| 新增 | `src/components/social/AiBubbleMenu.tsx` | 選取文字後顯示的 AI 操作浮動選單 |
| 修改 | `src/components/social/BlogTipTapEditor.tsx` | 整合 AiBubbleMenu + CodeBlockLowlight 語法高亮 |

#### BLOG-15 文章分類系統

| 類型 | 檔案 | 說明 |
|------|------|------|
| 新增 | `supabase/migrations/20260402_blog_categories.sql` | user_blog_articles 加 category 欄位 + 索引 |
| 修改 | `src/app/api/admin/social/blog/route.ts` | GET/POST 加 category 欄位 |
| 修改 | `src/app/api/admin/social/blog/[id]/route.ts` | PATCH 加 category 欄位 |
| 修改 | `src/app/api/blogs/[userSlug]/route.ts` | 加 ?category= 篩選 + 回傳分類列表 |
| 修改 | `src/components/social/BlogEditor.tsx` | 編輯器加分類下拉選單 |
| 修改 | `src/app/(admin)/insight-admin/blog/page.tsx` | 文章列表顯示分類標籤 |
| 修改 | `src/app/blogs/[userSlug]/page.tsx` | 傳 categories 到 ArticleList |
| 修改 | `src/app/blogs/[userSlug]/ArticleList.tsx` | 分類篩選 chip 按鈕 |

#### BLOG-18 程式碼語法高亮

| 類型 | 檔案 | 說明 |
|------|------|------|
| 安裝 | `lowlight`, `@tiptap/extension-code-block-lowlight`, `highlight.js` | 語法高亮套件 |
| 修改 | `src/components/social/BlogTipTapEditor.tsx` | CodeBlock → CodeBlockLowlight |
| 修改 | `src/app/globals.css` | 匯入 highlight.js github-dark 主題 + 淺色模式 override |
| 修改 | `src/app/blogs/[userSlug]/[articleSlug]/ArticleClient.tsx` | 新增 CodeHighlighter 元件（舊文章補高亮） |
| 修改 | `src/app/blogs/[userSlug]/[articleSlug]/page.tsx` | 引入 CodeHighlighter |

#### BLOG-20 全文搜尋升級

| 類型 | 檔案 | 說明 |
|------|------|------|
| 新增 | `supabase/migrations/20260402_blog_fulltext_search.sql` | tsvector 欄位 + GIN 索引 + 自動更新 trigger |
| 修改 | `src/app/api/blogs/search/route.ts` | ILIKE → ts_rank full-text search |
| 修改 | `src/app/api/blogs/route.ts` | 同上 |

### 資料庫影響

| Migration | 說明 |
|-----------|------|
| `20260402_blog_categories.sql` | `user_blog_articles` 加 `category TEXT` + 索引 |
| `20260402_blog_fulltext_search.sql` | `user_blog_articles` 加 `search_vector tsvector` + GIN 索引 + trigger |

### 其他操作

- LINE 管理員清理：停用林葳翔（U857a...），僅保留 Monkey€D€Luffy 為唯一 active 管理員

### 部落格公開頁可收合側邊欄

| 類型 | 檔案 | 說明 |
|------|------|------|
| 新增 | `src/app/blogs/[userSlug]/BlogSidebar.tsx` | 可收合側邊欄（桌面 inline + 手機 overlay drawer） |
| 新增 | `src/app/blogs/[userSlug]/BlogLayout.tsx` | Client wrapper 連接 sidebar + article list |
| 新增 | `src/app/blogs/[userSlug]/series/[seriesId]/page.tsx` | 系列文章公開頁 |
| 新增 | `src/app/api/blogs/[userSlug]/series/[seriesId]/route.ts` | 系列文章公開 API |
| 修改 | `src/app/blogs/[userSlug]/page.tsx` | ArticleList → BlogLayout，容器 max-w-3xl → max-w-5xl |
| 修改 | `src/app/blogs/[userSlug]/ArticleList.tsx` | 新增 externalCategoryControl / onExternalCategoryChange props |
| 修改 | `src/app/api/blogs/[userSlug]/route.ts` | API 新增 series / otherArticles / similarArticles |
| 修改 | `src/app/globals.css` | slideInLeft 動畫 + sidebar-nav-link 樣式 |

側邊欄 5 個區塊：
1. 文章分類（與 ArticleList 同步篩選）
2. 系列文章（連結到 /blogs/{slug}/series/{id}）
3. 類似文章（同 tag 其他作者文章）
4. 其他作者近期文章
5. 探索更多導航（所有部落格 / 首頁）
