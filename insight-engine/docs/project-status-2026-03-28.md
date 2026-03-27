# SnowRealm Insight Engine — 專案現況總覽
> 更新時間：2026-03-28

---

## 整體進度快照

| 層面 | 完成度 | 備註 |
|------|--------|------|
| 資料庫 Migration | ✅ 100% | 64 張表全部跑完 |
| 後台頁面 (Admin) | ✅ 100% | 38 頁全部存在 |
| 超級後台 (Super Admin) | ✅ 100% | 15 頁全部存在 |
| 後台 API | ✅ 99% | 80+ 個 route |
| 前端公開頁面 | ⚠️ 85% | 缺 3 個公開展示頁 |
| 元件庫 | ✅ 99% | 70+ 個元件 |
| lib 函式庫 | ✅ 100% | 56 個模組 |
| Bug 修復 | ⚠️ 75% | 剩 4 個已知 bug |

---

## ✅ 已全部完成的功能

### 核心問卷系統
- 問卷 CRUD + 題目編輯 + 分流設定 (branch_config)
- 9 種主題風格 (default/game/cyber/ancient/sakura/ocean/forest/candy/noir)
- A/B 比較測試
- 問卷排程 (scheduled_start/end)
- 封測名單管理 (waitlist)
- 問卷覆蓋圖 (survey cover)
- 密碼鎖問卷

### 填答系統
- 多題型：單選/多選/文字/評分/星級/日期/上傳
- 答題指紋 (fingerprint) 防重複
- 中途儲存 (progress)
- 點擊追蹤 (click events)
- UTM 追蹤

### 統計分析
- Dashboard 統計 (totalResponses, completionRate, dailyTrend 等)
- 平均填答時間 (avgCompletionTime)
- 回覆速度曲線 (responseVelocity)
- 數據品質分數 (responseQuality)
- 漏斗分析 + hotspot 標記
- 交叉分析 (crosstab)
- 標籤統計 (user_tags)
- 標籤規則引擎
- UTM 來源分析
- CSV 匯出

### AI 功能
- AI 出題 (OpenAI + Anthropic 雙引擎)
- AI 對話式問卷生成 (AiSurveyChat + ai-chat-generate)
- AI 洞察報告 - 數據模式 (insightEngine + ai-insight)
- AI 洞察報告 - 故事模式 (storyEngine + ai-story)
- AI 情感分析 (sentimentAnalysis + ai-sentiment)
- AI Key 管理 (加密存儲 + 額度控制)
- AI 使用日誌

### 報告分享系統
- 報告公開連結 (share_slug + is_public)
- 分享小卡 (ShareCard.tsx + ShareCardModal.tsx)
- html2canvas 存圖
- API: GET /api/report/[slug]
- ⚠️ 前端公開頁 `/report/[slug]/page.tsx` 缺失

### 故事系統 (Story × Data)
- storyCardEngine.ts — 個人故事卡片資料生成
- storyEngine.ts — AI 故事報告
- storyWallEngine.ts — 群體故事牆
- StoryCard.tsx (public 元件) ✅
- ShareButtons.tsx (public 元件) ✅
- API: /api/story-card/[responseId]
- API: /api/story-wall/[surveySlug]
- 管理後台: /insight-admin/story-wall ✅
- ⚠️ 前端公開頁 `/story/[responseId]/page.tsx` 缺失
- ⚠️ 前端公開頁 `/story-wall/[surveySlug]/page.tsx` 缺失
- ⚠️ 問卷完成頁 DoneClient.tsx 尚未整合故事卡片顯示

### LINE 深度整合
- LINE Bot 對話式填答 (lineBotEngine.ts)
- LINE 管理員數據查詢 Bot (lineAdminBot.ts)
- LINE Quick Reply 按鈕
- Rich Menu 自動切換
- LINE 推播 + 廣播
- LINE 設定後台管理
- Official Bot 自動回覆
- LINE OAuth 登入

### 多租戶系統
- JWT 認證 + Cookie session
- 租戶路由 rewrite (middleware)
- 租戶品牌解耦 (tenantBranding.ts)
- super_admin 總後台

### 社群系統 (Social)
- 貼文 + 留言 + 按讚 + 收藏
- 追蹤/被追蹤系統
- 私訊 DM (完整功能)
- 私訊 10 種主題 + 背景濾鏡
- 文章/貼圖/影片上傳
- 封鎖/檢舉系統
- 分享卡片 (PostShareCard 含圖片代理)

### 客服系統
- supportEngine.ts ✅
- 後台: /insight-admin/support ✅
- API: /api/admin/support ✅
- LINE Bot 整合接收客服訊息

### 問卷模板系統
- survey_templates DB 表 ✅
- surveyTemplates.ts ✅
- API: /api/admin/survey-templates ✅
- 後台: /insight-admin/survey-templates ✅
- 平台預設模板 seed ✅

### 平台功能 (Super Admin)
- 平台通知 (platform_notifications) ✅
- 通知樣式 (platform_notification_styles) ✅
- Rich Menu 管理 ✅
- 審計日誌 (audit_logs) ✅
- 訂閱 + 計畫管理

### 遊戲化 / 成長系統
- Z幣系統 (zcoinEngine)
- 每日任務 (dailyTaskEngine)
- 遊戲稱號 (game_titles)
- 獎勵系統 (reward_system)
- 病毒式模板 (viralTemplates)
- 推薦系統 (referralEngine)
- 認知差距分析 (cognitiveGapEngine)

### 支付系統
- 藍新金流 (newebpay.ts)
- Z幣儲值
- 訂閱方案

---

## ⚠️ 尚未完成（待補）

### P0 — Bug（阻礙正常使用）

| # | 問題 | 位置 | 修法 |
|---|------|------|------|
| BUG-1 | 分流邏輯壞了，不管選什麼都顯示 19 題 | `src/hooks/useSurveyFlow.ts` | 替換 `resolveRoutes` + `filterQuestions`，刪除 `active.add('A')` 和 `if (q.route === 'A') return true` |
| BUG-2 | AI 對話建立問卷報 `ai_usage_logs_action_check` constraint error | DB | 跑 ALTER TABLE 更新 CHECK constraint |
| BUG-3 | OG 分享顯示 coverTitle 而非自訂 OG 標題 | `surveys/[slug]/page.tsx` | 確認 DB og_title 非 NULL + export const dynamic = 'force-dynamic' |
| BUG-4 | 3 個 admin API 缺 requireRole | `ai-sentiment`, `responses/[id]`, `line/test` | 各加一行 requireRole() |

### P1 — 缺少的前端頁面（後端已備，前端沒接）

| # | 頁面路徑 | 現況 | 需要做什麼 |
|---|---------|------|-----------|
| PAGE-1 | `/report/[slug]` | API ✅ 頁面 ❌ | 建 `src/app/report/[slug]/page.tsx` — SSR 公開報告頁，含 OG Meta + CTA |
| PAGE-2 | `/story/[responseId]` | API ✅ 頁面 ❌ | 建 `src/app/story/[responseId]/page.tsx` — 個人故事卡片公開頁 |
| PAGE-3 | `/story-wall/[surveySlug]` | API ✅ 頁面 ❌ | 建 `src/app/story-wall/[surveySlug]/page.tsx` — 故事牆公開頁 + 底部 CTA |

### P2 — 功能接線（元件存在但沒整合）

| # | 功能 | 現況 | 需要做什麼 |
|---|------|------|-----------|
| WIRE-1 | 問卷完成頁顯示故事卡片 | DoneClient.tsx 未呼叫 | 加 story-card API 呼叫 + StoryCard 元件渲染 + 分享按鈕 + 同意勾選 |
| WIRE-2 | 故事報告存入 DB | ai-story/route.ts 未 INSERT | 加 INSERT INTO ai_insight_reports (report_type='story') |
| WIRE-3 | 報告歷史區分數據/故事 | insight/page.tsx 未區分 | history 列表加 report_type 圖示 + 點擊對應切換 tab |
| WIRE-4 | Dashboard 顯示新指標 | stats 有算但頁面沒顯示 | page.tsx 加 avgCompletionTime / responseQuality / responseVelocity 卡片 |

### P3 — LINE 設定頁面擴充

| # | 功能 | 說明 |
|---|------|------|
| LINE-1 | Rich Menu ID 移入後台 | lineConfig.ts 加 8 個 key，line-settings 頁加 Rich Menu 設定區塊 |
| LINE-2 | system/route.ts 服務狀態修正 | 改用 getLineConfig 取代純 DB 查詢，解決 panel 紅燈問題 |

### P4 — 已知操作問題（非緊急）

| # | 問題 |
|---|------|
| URG-1 | 毛行天下租戶重複顯示兩次 → SQL 確認後刪除或合併 |
| URG-3 | super_admin 登入後台看到所有組織 → me/route.ts 加 scope 參數 |
| URG-4 | Official Bot 文案仍有毛行天下硬編碼 → 改用 tenantBranding.ts |

---

## 資料表完整清單（已跑 Migration）

> 共 64+ 張表，全部成功執行

核心表：surveys, questions, responses, answers, user_tags, tag_rules, click_events
租戶：tenants, tenant_users, admin_users, admin_invites
AI：ai_provider_configs, ai_usage_logs, ai_insight_reports
LINE：line_configs, line_users, line_admins, line_survey_sessions
社群：posts, comments, likes, follows, bookmarks, direct_messages, dm_rooms
故事：story_cards, story_wall_items
客服：support_tickets, support_messages, support_templates
模板：survey_templates, template_ratings
平台：platform_notifications, platform_notification_styles
成長：zcoin_transactions, daily_tasks, reward_items, api_keys
設定：survey_theme_settings, site_settings, notification_rules, notification_logs
推播：broadcast_tasks, templates, line_notification_styles
其他：subscriptions, audit_logs, automation_rules, utm_links, webhooks, waitlist

---

## 環境 / 部署

- **部署平台**：Zeabur (zbpack.json)
- **正式域名**：https://insight.snowrealm.pet
- **DB**：PostgreSQL @ 43.167.237.37:30465
- **GitHub**：https://github.com/luffysky/snowrealm-pet-insight-engine
- **CDN**：Cloudflare (Bot Fight Mode 開)
- **圖片儲存**：Cloudflare R2

---

## 明日開發計劃

### 優先順序：BUG-1 → PAGE-1,2,3 → WIRE-1,2,3,4 → LINE-2

**預估工時（按此順序）：**
1. BUG-1 分流修正 (30 分鐘)
2. BUG-2 DB ALTER TABLE (5 分鐘)
3. PAGE-1,2,3 三個公開頁面 (2-3 小時)
4. WIRE-1 完成頁故事卡片整合 (1 小時)
5. WIRE-2,3 故事報告存DB + 歷史區分 (30 分鐘)
6. WIRE-4 Dashboard 新指標 (30 分鐘)
7. LINE-2 服務狀態修正 (30 分鐘)
