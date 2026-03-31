# LINE 通知系統設計文件

> 最後更新：2026-03-31
> 說明哪些事件會觸發 LINE 通知、發給誰、用哪個 Bot

---

## 通知架構

```
事件發生
  │
  ├─ 管理員通知 → Insight Bot（@039cyzqq）→ 管理員 LINE
  │    └─ 使用 INSIGHT_CHANNEL_ACCESS_TOKEN
  │
  └─ 用戶通知  → Official Bot（@474iwlht）→ 填答者 LINE
       └─ 使用 OFFICIAL_CHANNEL_ACCESS_TOKEN
```

---

## 通知事件清單

### 🔔 管理員通知（Insight Bot 發送）

| 事件 | 觸發時機 | 入口 | Bot |
|------|---------|------|-----|
| 問卷填答完成 | `POST /api/surveys/submit` | `notifySurveySubmitted()` | Insight |
| 新用戶 Email 註冊 | `POST /api/auth/register` | `notifyNewRegistration()` | Insight |
| 新用戶 Google 登入/註冊 | `GET /api/auth/google/callback` | `notifyNewRegistration()` / `notifyUserLogin()` | Insight |
| 新用戶 LINE 登入/註冊 | `GET /api/auth/line/callback` | `notifyNewRegistration()` / `notifyUserLogin()` | Insight |
| 密碼登入 | `POST /api/auth/login` | `notifyUserLogin()` | Insight |
| 封測名單加入 | `POST /api/waitlist` | `notifyWaitlistJoined()` | Insight |
| AI 洞察報告生成 | `POST /api/admin/ai-insight` | `notifyReport()` | Insight |
| 社群回報 | `POST /api/admin/social/reports` | `notifyReport()` | Insight |
| 系統活動 | 各處 | `notifyActivity()` | Insight |

### 👤 用戶通知（Official Bot 發送）

| 事件 | 觸發時機 | 入口 | Bot |
|------|---------|------|-----|
| 條件觸發（標籤/完成規則） | 問卷提交後 | `evaluateNotificationRules()` | Official |
| 填答提醒 | Cron 定時 | `cron/remind` | Official |
| 廣播 | 後台手動 | `broadcastMessage()` | Official |

---

## Flex Message 設計

### 問卷填答完成（survey_submitted）

```
┌─────────────────────────────┐
│ 📊  新填答通知               │  ← 綠色 #059669
├─────────────────────────────┤
│ 問卷   survey-slug           │
│ 回答   8 題                  │
│ 填答 ID  abc12345...         │
│ ─────────────────────────── │
│ 時間   2026/03/31 14:30      │
└─── [查看回覆 →] ────────────┘
```

### 新用戶加入（registration）

```
┌─────────────────────────────┐
│ 👋  新用戶加入               │  ← 顏色依登入來源
│     email=藍綠 / Google=藍   │
│     LINE=LINE綠              │
├─────────────────────────────┤
│ 來源   LINE 登入              │
│ 帳號   Luffy Lin              │
│ 時間   ...                   │
└─── [前往後台 →] ────────────┘
```

### 登入通知（login）

```
┌─────────────────────────────┐
│ 🔑  用戶登入                 │  ← 顏色依登入方式
├─────────────────────────────┤
│ 來源   密碼登入               │
│ 帳號   admin@...             │
│ 時間   ...                   │
└─── [前往後台 →] ────────────┘
```

### 封測加入（waitlist_joined）

```
┌─────────────────────────────┐
│ 🎉  新封測申請               │  ← 橘色 #f97316
├─────────────────────────────┤
│ Email   user@example.com    │
│ 暱稱    名字（如有）          │
│ 時間    ...                  │
└─── [查看名單 →] ────────────┘
```

---

## 防重複規則

1. **每次問卷提交只推一次管理員通知**：
   - `notifySurveySubmitted()` 負責管理員 Insight Bot 通知
   - `evaluateNotificationRules()` 只處理「標籤觸發」類型，不處理 `completion + line_push_admin`（避免重複）

2. **管理員 ID 去重**：
   - `getAllAdminIds()` 合併 ENV `LINE_YOUR_USER_ID` + DB `line_admins`，
     合併時 `.trim()` + `new Set()` 確保不重複

3. **Bot 分工清晰**：
   - 管理員通知 → 一律 Insight Bot
   - 用戶通知 → 一律 Official Bot

---

## 呼叫鏈

```
submit/route.ts
  ├─ notifySurveySubmitted()      → line.ts → pushLineMessage() → Insight Bot → 管理員
  └─ evaluateNotificationRules()  → notificationEngine.ts
       └─ line_push_user only     → Official Bot → 填答者

register/route.ts → notifyNewRegistration() → lineNotify.ts → Insight Bot → 管理員
login/route.ts    → notifyUserLogin()        → lineNotify.ts → Insight Bot → 管理員
waitlist/route.ts → notifyWaitlistJoined()   → line.ts       → Insight Bot → 管理員
```

---

## Rich Menu 設計

### 選單 A — 預設（新好友加入時設定）

ID: `richmenu-e879cc72cf43693d9b66043ed3d3b7b0`

```
┌──────────────────┬──────────────────┬──────────────────┐
│   📋 填問卷      │   🌐 官網        │   💬 聯絡客服    │
│  開始填問卷       │  snowrealm.pet   │  輸入「客服」     │
└──────────────────┴──────────────────┴──────────────────┘
```

| 按鈕 | 動作 |
|------|------|
| 📋 填問卷 | URI → 問卷連結 |
| 🌐 官網 | URI → https://snowrealm.pet |
| 💬 聯絡客服 | 傳送文字 `客服` |

### 選單 B — 填完問卷後（自動切換）

ID: `richmenu-c5e2bc40ccde95086165165679bec029`

```
┌──────────────────┬──────────────────┬──────────────────┐
│   📊 查看結果    │   🔄 再填一次    │   🐾 最新消息    │
│  LIFF 結果頁     │  重新填寫         │  官網動態        │
└──────────────────┴──────────────────┴──────────────────┘
```

| 按鈕 | 動作 |
|------|------|
| 📊 查看結果 | URI → 結果頁 |
| 🔄 再填一次 | URI → 問卷連結 |
| 🐾 最新消息 | URI → https://snowrealm.pet |
