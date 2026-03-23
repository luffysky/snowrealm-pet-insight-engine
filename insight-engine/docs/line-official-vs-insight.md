# LINE：官方帳號 vs Insight／問卷通知、Token、Webhook、Rich Menu

本文件說明 SnowRealm Insight Engine 內 **兩條 LINE Messaging API 通道** 的分工、設定方式，以及常見誤解。

---

## 1. 為什麼會有「兩組」Channel？

| 類型（後台分組名稱） | 環境變數 / DB Key 前綴 | 典型用途 |
|----------------------|-------------------------|----------|
| **Official 官方帳號** | `OFFICIAL_*` | 給**一般用戶**加好友：歡迎訊息、關鍵字自動回覆、填問卷導流、廣播推播、`line_users` 好友名單 |
| **Insight 問卷／通知機器人** | `INSIGHT_*` | 給**管理員或內部流程**：口令註冊、系統通知、與「足跡／問卷後台」相關的 Bot 互動 |

- **最小配置**：只建 **1 個** Messaging API Channel，只填 **Official** 那一組 Token／Secret，Webhook 只設 **`/api/line/webhook/official`**，多數對外功能即可運作。
- **進階配置**：希望「顧客加的 OA」和「管理員收通知的 Bot」**分開**，就建 **2 個** Channel，兩組金鑰都填，並在 LINE Developers **各自**設定對應的 Webhook URL。

---

## 2. Token／Secret 貼到「我們後台」後，LINE Developers 那邊就算完成了嗎？

**還差一步：Webhook。**

流程應為：

1. 在 **LINE Developers Console** → 該 Channel → **Messaging API** 取得 **Channel Secret**、簽發 **Channel access token**。
2. 把 **同一個 Channel** 的 Token／Secret／Channel ID 貼到本系統 **LINE 設定 → 環境設定**（對應 Official 或 Insight 區塊）。系統會用 **Channel Secret** 驗證 Webhook 簽章，用 **Access Token** 主動發訊息。
3. 仍在 **同一個 Channel** 的 Messaging API 頁面，設定 **Webhook URL** 並 **Verify 成功**，且 **Use webhook** 開啟。
4. 在 **LINE Official Account Manager** 將回應改為 **Bot**、關閉與 Webhook 衝突的**自動回應訊息**（見後台「設定指南」步驟 5）。

只有 1+2 沒有 3：LINE **不會**把使用者訊息事件送到你的伺服器，自動回覆與 follow 邏輯都不會跑。  
**測試連線**按鈕只驗證 Token 能否呼叫 LINE API，**不代替** Webhook Verify。

---

## 3. Webhook：我這邊設了，LINE 那邊還能用嗎？會不會只有我能收通知？

### 重點：**一個 Messaging API Channel 只能填一個 Webhook URL**

- 該 Channel 上發生的 **message / follow / unfollow** 等事件，LINE **只會 POST 到你填的那一支 URL**。
- **不會**同時轉發到第二個 URL；也**不會**因為你在本系統後台存了 Token，就自動幫你改 LINE 控制台的 Webhook（必須自己在 Developers 貼 URL）。

因此：

- 若這個 Official Channel **過去**已接別家 SaaS 的 Webhook，改成我們的 URL 後，**舊服務就收不到同一個 Channel 的事件**（除非對方提供轉發／你改用別條 Channel）。
- **不會**發生「客戶那邊也收到、只有你收到」的雙重隱私問題；實際上是 **誰的伺服器在 Webhook URL 上，誰就收到該 Channel 的事件**。

本專案預設兩條路徑（**不同 Channel 請各設各的**）：

| Channel 用途 | Webhook URL（範例，網域請換成你的 `NEXT_PUBLIC_BASE_URL`） |
|--------------|------------------------------------------------------------|
| Official 官方帳號 | `https://你的網域/api/line/webhook/official` |
| Insight 問卷／通知 Bot | `https://你的網域/api/line/webhook` |

（另有 ` /api/line/webhook/insight-engine ` 等路徑若存在，為專案內其他入口；**同一 Channel 請只選一個 URL 使用**，並與該 Channel 的 Secret 對應。）

---

## 4. Rich Menu：只能預設一個嗎？官方跟後台都要怎麼辦？

- **對「同一個」Messaging API Bot**：LINE 規則是同一時間 **只有一個「全體使用者的預設 Rich Menu」**（`user/all/richmenu`）。
- **對「兩個」Bot（Official + Insight）**：可以 **各有一套**預設選單，互不干擾。

後台 **Rich Menu** 頁：

- 用 **「Official 官方帳號 / Insight 問卷／通知」** 分頁切換，列表與「設為預設／刪除／取消預設」會對應到 **該 Channel 的 Access Token**。
- 建立選單時選 **要建立到哪個 Bot**（模板「官方帳號」→ Official；「後台管理」→ 建議搭配 Insight）。

**無法**在同一個 Bot 上同時讓不同好友看到兩種不同的「預設」選單；若要分眾，需使用 LINE 的 **per-user Rich Menu API**（本後台目前以「全體預設」為主）。

---

## 5. 租戶與設定儲存

- 管理後台依 **租戶（tenant）** 讀寫 `line_configs`；多租戶時每個組織可填自己的 Official／Insight 金鑰。
- **Webhook 路由**目前使用 `getLineConfig(..., tenantId)` 時，若未帶租戶則可能回退到 **default／ENV**；若你使用 **多租戶 + 不同 LINE Channel**，請在部署與程式路徑上確認與 `CLAUDE.md`／程式註解一致，必要時為每租戶使用獨立子網域或明確傳入 tenant。

---

## 6. 建議自檢清單

- [ ] Official：`OFFICIAL_CHANNEL_*` 已填，Webhook = `.../api/line/webhook/official`，Verify 成功  
- [ ] （選用）Insight：`INSIGHT_CHANNEL_*` 已填，Webhook = `.../api/line/webhook`，Verify 成功  
- [ ] OA Manager：回應模式 Bot、自動回應關閉、Webhook 啟用  
- [ ] Rich Menu：在正確的分頁（Official / Insight）建立並設預設  
- [ ] 後台 **測試連線** 兩邊皆 ✅（僅代表 Token 有效）

更細的圖文教學請見：**後台 → LINE 設定 → 設定指南**。
