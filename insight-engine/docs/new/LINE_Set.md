# LINE 設定總表

> 最後更新：2026-03-31
> 不存放真實 Secret/Token，僅記錄設定狀態與架構

---

## 一、現況診斷

### ⚠️ 重大問題：兩條 Route 用同一組 Token

| Route | 使用的 Token | 狀況 |
|-------|------------|------|
| `/api/line/webhook` | `INSIGHT_*` | ✅ 活著（如果 Console 設的是這條） |
| `/api/line/webhook/insight-engine` | `INSIGHT_*`（**完全一樣**） | ❌ 死的 — 同一個 Channel 只能設一條 Webhook URL |
| `/api/line/webhook/official` | `OFFICIAL_*` | ✅ 活著（獨立 Channel） |

**結論**：`/api/line/webhook/insight-engine` 永遠收不到訊息，需要廢棄。

---

### 環境變數現況掃描

| 變數 | 狀態 | 說明 |
|------|------|------|
| `LINE_INSIGHT_CHANNEL_ACCESS_TOKEN` | ✅ 已設定 | `INSIGHT_CHANNEL_ACCESS_TOKEN` 讀這個 |
| `LINE_INSIGHT_CHANNEL_SECRET` | ✅ 已設定 | 簽章驗證用 |
| `LINE_INSIGHT_CHANNEL_ID` | ✅ 已設定 | |
| `LINE_OFFICIAL_CHANNEL_ACCESS_TOKEN` | ✅ 已設定 | `OFFICIAL_CHANNEL_ACCESS_TOKEN` 讀這個 |
| `LINE_OFFICIAL_CHANNEL_SECRET` | ✅ 已設定 | |
| `LINE_OFFICIAL_CHANNEL_ID` | ✅ 已設定 | |
| `LINE_YOUR_USER_ID` | ✅ 已設定 | 管理員 LINE User ID |
| `SUPER_ADMIN_LINE_USER_ID` | ✅ 已設定 | 總後台登入比對（但程式碼目前沒用到！） |
| `LINE_LOGIN_CHANNEL_ID` | ✅ 已設定 | LINE Login OAuth |
| `LINE_LOGIN_CHANNEL_SECRET` | ✅ 已設定 | |
| `LINE_LOGIN_CALLBACK_URL` | ✅ 已設定 | |
| `NEXT_PUBLIC_LIFF_ID` | ✅ 已設定 | |
| `NEXT_PUBLIC_LINE_FRIEND_URL` | ✅ 已設定 | |
| `LINE_CHANNEL_ACCESS_TOKEN` | ⚠️ 舊變數 | **程式碼完全沒用到，可刪除** |
| `LINE_CHANNEL_SECRET` | ⚠️ 舊變數 | **可刪除** |
| `LINE_CHANNEL_ID` | ⚠️ 舊變數 | **可刪除** |
| `POST_SURVEY_RICH_MENU_ID` | ❌ 未設定 | Rich Menu 切換功能失效 |
| `DEFAULT_RICH_MENU_ID` | ❌ 未設定 | 新好友 Rich Menu 失效 |
| `NEXT_PUBLIC_RICH_MENU_SURVEY_URL` | ❌ 未設定 | Rich Menu 問卷按鈕失效 |
| `LINE_MAOXING_*` | ❌ 不存在 | 足跡站專用 Token（待建） |
| `LINE_INSIGHT_EXT_*` | ❌ 不存在 | Insight 對外 Token（待建） |

---

### AI 串接現況

| 功能 | 狀態 | 說明 |
|------|------|------|
| `OPENAI_API_KEY` | ✅ 已設定 | 平台 Key，所有 AI 功能共用 |
| `AI_ENCRYPTION_KEY` | 需確認 | ai_provider_configs 加解密用 |
| AI 出題 | ✅ 應可用 | 用 OPENAI_API_KEY |
| AI 洞察報告 | ✅ 應可用 | 用 OPENAI_API_KEY |
| AI 情感分析 | ✅ 應可用 | |
| AI 客服草稿 | ✅ 應可用 | |
| LINE Bot AI 回覆（guideEngine） | ✅ 應可用 | 用 OPENAI_API_KEY |

---

## 二、目標架構（重整後）

```
四個 LINE 帳號 × 四條 Webhook Route

毛行天下官方帳號（B2C 對外）
  Token: OFFICIAL_*
  Webhook: /api/line/webhook/official  ✅ 已有
  功能: 用戶自動回覆、填問卷、Rich Menu、客服工單

毛行天下-足跡站（私人，只有你）
  Token: MAOXING_*（待建）
  Webhook: /api/line/webhook/maoxing   ❌ 待建
  功能: 問卷新回覆通知、數據回報

Insight 後台回報（私人，只有你）
  Token: INSIGHT_*
  Webhook: /api/line/webhook           ✅ 已有
  功能: 系統警報、AI 報告通知、管理員指令查詢

Insight 對外（B2B，租戶管理員加）
  Token: INSIGHT_EXT_*（待建）
  Webhook: /api/line/webhook/insight   ❌ 待建
  功能: 平台公告、SaaS 功能通知、租戶數據查詢
```

---

## 三、待填入資料（你對照 LINE Developers Console 填）

### 毛行天下-足跡站（現有帳號，待新增 Token 到環境變數）

```
LINE_MAOXING_CHANNEL_ACCESS_TOKEN=
LINE_MAOXING_CHANNEL_SECRET=
LINE_MAOXING_CHANNEL_ID=
LINE_MAOXING_LINE_ID=
```

Webhook URL 設定：`https://insight.snowrealm.pet/api/line/webhook/maoxing`

### Insight 對外（新帳號建好後填）

```
LINE_INSIGHT_EXT_CHANNEL_ACCESS_TOKEN=
LINE_INSIGHT_EXT_CHANNEL_SECRET=
LINE_INSIGHT_EXT_CHANNEL_ID=
LINE_INSIGHT_EXT_LINE_ID=
```

Webhook URL 設定：`https://insight.snowrealm.pet/api/line/webhook/insight`

---

## 四、各帳號 Webhook URL 設定確認

去 LINE Developers Console → 各 Channel → Messaging API → Webhook URL：

| 帳號 | 應設定的 URL | Use webhook | Auto-reply | Greeting |
|------|------------|-------------|-----------|---------|
| 毛行天下官方 | `.../api/line/webhook/official` | ON | OFF | OFF |
| 毛行天下-足跡站 | `.../api/line/webhook/maoxing` | ON | OFF | OFF |
| Insight 後台回報 | `.../api/line/webhook` | ON | OFF | OFF |
| Insight 對外 | `.../api/line/webhook/insight` | ON | OFF | OFF |

> Base URL: `https://insight.snowrealm.pet`

---

## 五、Rich Menu 規劃

### 需要在 LINE Official Account Manager 建立的選單

#### 毛行天下官方帳號 — 選單 A（預設，新好友）

```
┌──────────────────┬──────────────────┬──────────────────┐
│   📋 填問卷      │   🌐 官網        │   💬 聯絡客服    │
│  開始填問卷       │ https://         │  傳「客服」       │
│                  │ snowrealm.pet    │                  │
└──────────────────┴──────────────────┴──────────────────┘
```
- 填問卷 → postback `action=start_survey`
- 官網 → URI `https://snowrealm.pet`
- 聯絡客服 → 傳送文字 `客服`

取得 ID 後填入：`DEFAULT_RICH_MENU_ID=richmenu-xxxxxxxx`

#### 毛行天下官方帳號 — 選單 B（填完問卷後自動切換）

```
┌──────────────────┬──────────────────┬──────────────────┐
│   📊 查看結果    │   🔄 再填一次    │   🐾 最新消息    │
│  LIFF 結果頁     │ postback 重填    │  官網最新動態    │
└──────────────────┴──────────────────┴──────────────────┘
```

取得 ID 後填入：`POST_SURVEY_RICH_MENU_ID=richmenu-xxxxxxxx`

#### 問卷按鈕 URL

填入：`NEXT_PUBLIC_RICH_MENU_SURVEY_URL=https://insight.snowrealm.pet/maoxingtianxia/maoxingtianxia-mvp-survey`

---

## 六、需要修改的程式碼清單

| 檔案 | 問題 | 修改內容 |
|------|------|---------|
| `src/app/api/auth/line/super-admin/callback/route.ts` | `SUPER_ADMIN_LINE_USER_ID` 設了但沒比對 | 加入精確 User ID 比對 |
| `src/app/api/line/webhook/insight-engine/route.ts` | 死路，與 `/webhook` 用同一 Token | 廢棄刪除 |
| `src/lib/lineConfig.ts` | 缺少 MAOXING 和 INSIGHT_EXT Channel 設定 | 新增兩組 config keys |
| 新建：`src/app/api/line/webhook/maoxing/route.ts` | 足跡站 webhook 不存在 | 建立，只接受你的 LINE ID |
| 新建：`src/app/api/line/webhook/insight/route.ts` | Insight 對外 webhook 不存在 | 建立，B2B 租戶管理員 |
| `src/lib/lineNotify.ts` | 推播介面不統一 | 整理成統一介面 |

---

## 七、串接驗證清單

### ✅ 可以馬上測試（Token 已設定）

- [ ] 毛行天下官方：傳「填問卷」→ 收到問卷引導
- [ ] 毛行天下官方：傳「客服」→ 建立工單
- [ ] 毛行天下官方：後台廣播 → 好友收到
- [ ] Insight 後台：傳「今日報告」→ 收到數據 Flex Message
- [ ] 後台 AI 設定 → 顯示已連線 + 剩餘額度
- [ ] AI 出題 → 成功生成題目
- [ ] LINE Login → 後台登入成功

### ❌ 需要先完成設定才能測試

- [ ] 毛行天下官方：新好友加入 → 看到 Rich Menu（需先建 Rich Menu 填 ID）
- [ ] 毛行天下官方：填完問卷 → Rich Menu 自動切換（同上）
- [ ] 足跡站：問卷新回覆 → 你的 LINE 收到通知（需建 webhook route + Token）
- [ ] Insight 對外：租戶管理員加入（需新建帳號 + webhook route）
- [ ] 總後台登入：只有你的 LINE ID 能進（需修 callback route）
