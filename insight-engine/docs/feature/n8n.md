# n8n 整合

## 目標

以 n8n 作為自動化中介層，讓 Insight Engine 的事件（問卷提交、新訂閱、標籤觸發等）能串接任意第三方服務，無需改動核心程式碼。

## 架構

```
Insight Engine
      │
      │ Webhook（/api/admin/webhooks 已有）
      ▼
    n8n
      │
  ┌───┼──────────┬───────────┬──────────┐
  ▼   ▼          ▼           ▼          ▼
Stripe  Shopify  HubSpot   Slack    任意 API
國際收款 電商整合  CRM       通知    自訂流程
```

## 部署方式

### 方案 A：自架於 Zeabur（推薦）

在 Zeabur 新增一個 n8n 服務：
- Image: `n8nio/n8n`
- Port: 5678
- ENV: `N8N_BASIC_AUTH_ACTIVE=true`、`N8N_BASIC_AUTH_USER`、`N8N_BASIC_AUTH_PASSWORD`
- Volume: 掛載 `/home/node/.n8n` 持久化設定

### 方案 B：n8n Cloud

https://n8n.io — 有免費額度，省心但執行次數有限。

## Insight Engine 端需要做的

### 現有 Webhook 事件（已支援）

`/api/admin/webhooks` 已有 Webhook 發送機制，租戶可自訂 URL。
目前支援的事件：survey_submitted、response_completed 等。

### 建議新增的事件類型

```typescript
// src/lib/webhook.ts — 擴充 event types

type WebhookEvent =
  | 'survey_submitted'
  | 'response_completed'
  | 'new_subscription'       // 新增：訂閱升級
  | 'subscription_cancelled' // 新增：取消訂閱
  | 'zcoin_earned'           // 新增：Z幣入帳
  | 'tag_applied'            // 新增：標籤觸發
  | 'ai_report_generated'    // 新增：AI 報告完成
  | 'support_ticket_created' // 新增：新客服工單
```

### n8n Webhook URL 設定

租戶在後台 Webhook 設定頁面填入 n8n 的 Webhook URL：
```
https://n8n.your-domain.com/webhook/insight-engine
```

## n8n 端常用 Workflow 範例

### 1. 問卷完成 → HubSpot 建立聯絡人

```
[Webhook] → [Function: 解析 answers] → [HubSpot: Create Contact]
```

### 2. 新訂閱 → Slack 通知業務

```
[Webhook: new_subscription] → [Slack: 發訊息到 #sales]
```

### 3. 台灣以外用戶 → Stripe 收款

```
[Webhook: payment_intent] → [IF: country != TW] → [Stripe: Create Payment Intent]
```

### 4. 標籤觸發 → 自動化行銷

```
[Webhook: tag_applied] → [IF: tag == 'high_value'] → [LINE: 發送優惠訊息]
```

## 擴張路徑

| 階段 | 目標 | 透過 n8n 串接 |
|------|------|--------------|
| 現在 | 台灣市場 | 藍新金流（已有） |
| 近期 | 日本/東南亞 | Stripe |
| 中期 | 電商整合 | Shopify / WooCommerce |
| 長期 | 企業 CRM | Salesforce / HubSpot |

## 注意事項

- n8n Webhook 端點需設定驗證（Basic Auth 或 Header Token）
- Insight Engine 發送 Webhook 時帶上 `X-Webhook-Secret` header（`webhook.ts` 已有簽章機制）
- n8n 處理失敗時會自動 retry，確保冪等性
