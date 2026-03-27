# 今日工作紀錄 — 2026-03-28

---

## 完成項目（按時序）

### 1. 私訊 Forward Modal 欄位名稱修正
**問題：** 轉傳對話框無法顯示聯絡人列表（顯示空白）
**根因：** JSX 裡用了舊欄位名 `conv.name`、`conv.avatar`、`conv.lastMsg`，但實際資料結構是 `conv.displayName`、`conv.avatarUrl`、`conv.lastMessagePreview`
**修正：** `src/app/messages/page.tsx` 轉傳列表渲染部分
**Commit：** 前一 session

---

### 2. 私訊全套主題系統 (10 種主題 + 背景濾鏡)
**功能：**
- 10 種完整主題：default / midnight / aurora / rose / forest / amber / neon / purple / coral / slate
- 每個主題包含：背景漸層 + 自己的訊息泡泡色 + 對方的訊息泡泡色
- 3 頁籤面板：主題 / 背景效果 / 濾鏡
- 背景效果：模糊 (blur) / 亮度 (brightness) / 遮罩 (dim) / 飽和度 (saturate) / 色相旋轉 (hue)
- 設定持久化：localStorage `dm_chat_theme`
- 分層渲染架構：背景層 z-0 → 遮罩層 z-1 → 訊息層 z-2，濾鏡只作用在背景不影響文字

**核心介面定義：**
```typescript
interface ChatTheme {
  key: string; label: string; emoji: string
  bg: React.CSSProperties
  myBg: string; myText: string; myShadow?: string
  theirBg: string; theirText: string; theirBorder?: string
}
interface BgEffects { blur: number; brightness: number; dim: number; saturate: number; hue: number }
```

---

### 3. 修正轉傳訊息無法收回
**問題：** 轉傳後的訊息無法收回（recall），轉傳本身也靜默失敗
**根因 1：** 呼叫了錯誤 API endpoint `POST /api/admin/social/messages/${userId}`（該路徑無 POST handler）
**根因 2：** 樂觀更新用假 ID `fwd-${Date.now()}`，recall 時傳送不存在的 ID 到 DB
**修正：**
- 改用正確 endpoint `POST /api/admin/social/messages` with `{toUserId, content}` in body
- 等待 API 回傳真實 DB message ID 後再塞入 state

```typescript
const res = await fetch('/api/admin/social/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ toUserId: targetUserId, content: fwdContent }),
})
const data = await res.json() as { message: { id: string; createdAt: string } }
// 用真實 ID 塞入訊息列表
```

---

### 4. 修正無法刪除收到的訊息
**問題：** 只有自己發的訊息才有刪除按鈕，收到的訊息無法刪除
**根因：** delete button 被包在 `{msgMenu.msg.isMine && (` 條件內
**修正：** 移除 isMine 條件，改為：
- 自己的訊息 → 「刪除」
- 對方的訊息 → 「從我這邊刪除」

---

### 5. 修正部署失敗 (Turbopack Build Error)
**問題：** Zeabur 部署失敗，`messages/page.tsx:1284` Turbopack parse error
```
Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
```
**根因：** 第 4 項修正刪除按鈕時，移除了 `{msgMenu.msg.isMine && (` 的開頭，但遺留了對應的 `)}` 在 line 1284
**修正：** 移除多餘的 `)}` + 修正縮排

---

### 6. 修正分享卡片圖片預覽破圖 (Bug #44)
**問題：** PostShareCard 的圖片完全無法顯示，html2canvas 匯出空白圖片
**根因：** `crossOrigin="anonymous"` 強制發出 CORS request，但 R2/S3 bucket 沒有回傳 `Access-Control-Allow-Origin` header → 瀏覽器阻擋圖片顯示
**解法：** 建立 server-side 圖片代理 API

**新增：** `src/app/api/img-proxy/route.ts`
- GET `/api/img-proxy?url=<encoded-url>`
- 白名單驗證（僅允許 R2、S3、LINE CDN）
- Server 端 fetch（無 CORS 限制）
- 回傳時加上 `Access-Control-Allow-Origin: *`
- Cache-Control 24 小時

**修改：** `src/components/social/PostShareCard.tsx`
- 新增 `proxyImg()` helper：非 data URL 的圖片全部走代理
- `post.images[0].url` → `proxyImg(url)`
- `post.authorAvatar` → `proxyImg(url)`

---

### 7. DB Migrations 全部執行完畢
**工具：** 建立 `scripts/run-migrations.mjs`
- 自動讀取 `.env.local` 的 DATABASE_URL
- 預設跑 `supabase/run_all_pending.sql`
- 若 consolidated 檔失敗，自動 fallback 逐一跑所有 phase SQL

**執行結果：** 64 成功 / 2 失敗（均為 index already exists，安全忽略）
- `migration_follow_dm.sql` — `idx_follows_follower` 已存在
- `migration_phase43_cognitive_gap.sql` — `uq_self_trait` 已存在

---

## Commits 推送紀錄

| Commit | 內容 |
|--------|------|
| `1aa9664` | fix(auth): 修正 tenants 空陣列導致 middleware 踢回登入頁 |
| `f71b049` | fix(auth): jwt 改為相容 ADMIN_SECRET 或 JWT_SECRET |
| `50ed86a` | fix(auth): jwt 改為相容 ADMIN_SECRET 或 JWT_SECRET |
| `9add2cb` | chore: 將 docs/user.json 和 docs/log.md 加入 .gitignore |
| `d3b34ea` | (前一 session 最後 commit — forward modal 修正 + theme 系統) |
| `24c9f2a` | fix(messages): build 修正 + 分享卡片圖片 CORS 修正 (Bug 44) |
| `54423b9` | chore: 新增 DB migration 執行腳本 |

---

## 今日未完成（移入明日計劃）

- BUG-1：分流邏輯 (useSurveyFlow.ts) 仍未修
- PAGE-1,2,3：三個公開頁面缺失 (report/story/story-wall)
- WIRE-1：問卷完成頁故事卡片整合
- WIRE-2,3：故事報告存 DB + 歷史列表區分
- WIRE-4：Dashboard 整合新指標顯示
