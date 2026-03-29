# LINE Pay 串接規格書

> Z 幣儲值 + 未來商品購買 · Online API v3 + LIFF 整合
> 版本：v1.0 | 日期：2026-03-30

---

## 目錄

1. 商家帳號申請指南
2. LINE Pay Online API v3 串接
3. LINE LIFF 內付款整合
4. Z 幣儲值完整流程
5. 未來擴展（會員方案等）
6. 資料庫設計
7. 安全 & 注意事項
8. 驗收清單

---

## 一、商家帳號申請指南

### 1.1 你需要什麼

```
必要條件：
  ✅ 公司登記（有統編）或 個人商店（無統編也可以申請）
  ✅ 銀行帳戶（收款用）
  ✅ 網站已上線（審核會看）

準備文件（公司戶）：
  1. 公司設立/變更登記表（最新版，完整不缺頁）
  2. 負責人身份證正反面
  3. 撥款銀行存摺封面影本（戶名須與公司名一致）
  4. 網站首頁截圖

準備文件（個人商店）：
  1. 身份證正反面
  2. 銀行存摺封面影本
  3. 營業證明（網站截圖即可）
```

### 1.2 申請步驟

```
Step 1：前往 LINE Pay 商家申請頁面
  https://pay.line.me/portal/tw/merchant-apply

Step 2：選擇「線上商店」（你是網站，不是實體店）

Step 3：填寫公司/個人資訊 + 上傳文件

Step 4：等待審核
  - 一般 2 週 ~ 1 個月
  - 如果需要補件會收到 email 通知

Step 5：審核通過後，你會收到：
  - Channel ID
  - Channel Secret Key
  - 以及 LINE Pay 商家後台登入方式

⚠️ 重要：Z 幣儲值屬於「遞延性產品」
   個人商店可能無法申請，建議用公司戶申請
   申請時在「商品說明」寫：「平台虛擬代幣儲值服務」
```

### 1.3 Sandbox 測試環境

```
審核通過前，可以先用 Sandbox 開發測試：
  - Sandbox API：https://sandbox-api-pay.line.me
  - Sandbox 不需要商家帳號
  - 到 LINE Pay 開發者頁面申請測試用 Channel ID/Secret
  - https://developers-pay.line.me
```

### 1.4 手續費

```
LINE Pay 線上收款手續費：2.8%（未稅）
  NT$100 儲值 → LINE Pay 抽 NT$2.8 → 你收到 NT$97.2

無申辦費、無月費、無建置費
只有交易才收手續費
```

---

## 二、LINE Pay Online API v3 串接

### 2.1 安裝 SDK

```bash
npm install line-pay-merchant
```

### 2.2 環境變數

```env
# .env.local
LINE_PAY_CHANNEL_ID=your_channel_id
LINE_PAY_CHANNEL_SECRET=your_channel_secret_key
LINE_PAY_ENV=development    # development = sandbox, production = 正式

# 回調 URL
LINE_PAY_CONFIRM_URL=https://insight.snowrealm.pet/api/line-pay/confirm
LINE_PAY_CANCEL_URL=https://insight.snowrealm.pet/api/line-pay/cancel
```

### 2.3 LINE Pay Client 初始化

```typescript
// lib/payment/linePayClient.ts
import { createLinePayClient } from 'line-pay-merchant';

export const linePayClient = createLinePayClient({
  channelId: process.env.LINE_PAY_CHANNEL_ID!,
  channelSecretKey: process.env.LINE_PAY_CHANNEL_SECRET!,
  env: process.env.LINE_PAY_ENV as 'development' | 'production',
});
```

### 2.4 付款流程（三步驟）

```
使用者點「儲值」
    │
    ▼
[Step 1: Request] 建立付款請求
  POST /v3/payments/request
  → LINE Pay 回傳 paymentUrl
    │
    ▼
[使用者跳轉到 LINE Pay 付款頁面]
  → 輸入密碼確認付款
    │
    ▼
[Step 2: 回調] LINE Pay 帶著 transactionId 回到你的 confirmUrl
    │
    ▼
[Step 3: Confirm] 確認付款
  POST /v3/payments/{transactionId}/confirm
  → 付款完成 → 發放 Z 幣
```

### 2.5 Step 1：建立付款請求

```typescript
// app/api/line-pay/request/route.ts
import { NextResponse } from 'next/server';
import { linePayClient } from '@/lib/payment/linePayClient';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuid } from 'uuid';

// Z 幣儲值方案
const TOPUP_PLANS = {
  plan_100: { zcoin: 100, price: 30, name: '100 Z幣' },
  plan_300: { zcoin: 300, price: 79, name: '300 Z幣（88折）' },
  plan_500: { zcoin: 500, price: 119, name: '500 Z幣（79折）' },
  plan_1000: { zcoin: 1000, price: 199, name: '1000 Z幣（66折）' },
} as const;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId } = await req.json();
  const plan = TOPUP_PLANS[planId as keyof typeof TOPUP_PLANS];
  if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  const orderId = `ZCOIN_${Date.now()}_${uuid().slice(0, 8)}`;

  try {
    // 建立待處理訂單（存 DB）
    await supabase.from('payment_orders').insert({
      order_id: orderId,
      user_id: user.id,
      plan_id: planId,
      amount: plan.price,
      zcoin_amount: plan.zcoin,
      currency: 'TWD',
      provider: 'line_pay',
      status: 'pending',
    });

    // 呼叫 LINE Pay Request API
    const response = await linePayClient.request.send({
      body: {
        amount: plan.price,
        currency: 'TWD',
        orderId,
        packages: [{
          id: planId,
          amount: plan.price,
          name: 'SnowRealm Insight Z幣儲值',
          products: [{
            name: plan.name,
            quantity: 1,
            price: plan.price,
            imageUrl: 'https://insight.snowrealm.pet/images/zcoin-icon.png',
          }],
        }],
        redirectUrls: {
          confirmUrl: process.env.LINE_PAY_CONFIRM_URL!,
          cancelUrl: process.env.LINE_PAY_CANCEL_URL!,
        },
      },
    });

    const paymentUrl = response.body.info.paymentUrl;
    const transactionId = response.body.info.transactionId;

    // 存 transactionId
    await supabase.from('payment_orders').update({
      transaction_id: String(transactionId),
    }).eq('order_id', orderId);

    return NextResponse.json({
      paymentUrl: paymentUrl.web,   // 網頁版付款 URL
      appUrl: paymentUrl.app,       // LINE App 內付款 URL（LIFF 用）
    });

  } catch (error) {
    console.error('LINE Pay request error:', error);
    return NextResponse.json({ error: 'Payment request failed' }, { status: 500 });
  }
}
```

### 2.6 Step 2 & 3：確認付款 + 發放 Z 幣

```typescript
// app/api/line-pay/confirm/route.ts
import { NextResponse } from 'next/server';
import { linePayClient } from '@/lib/payment/linePayClient';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const transactionId = url.searchParams.get('transactionId');
  const orderId = url.searchParams.get('orderId');

  if (!transactionId || !orderId) {
    return NextResponse.redirect(new URL('/topup?error=missing_params', req.url));
  }

  const supabase = await createClient();

  // 查訂單
  const { data: order } = await supabase
    .from('payment_orders')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (!order || order.status !== 'pending') {
    return NextResponse.redirect(new URL('/topup?error=invalid_order', req.url));
  }

  try {
    // 呼叫 LINE Pay Confirm API
    const response = await linePayClient.confirm.send({
      transactionId,
      body: {
        amount: order.amount,
        currency: 'TWD',
      },
    });

    if (response.body.returnCode === '0000') {
      // 付款成功！

      // 1. 更新訂單狀態
      await supabase.from('payment_orders').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        line_pay_response: response.body,
      }).eq('order_id', orderId);

      // 2. 發放 Z 幣
      const { data: account } = await supabase
        .from('zcoin_accounts')
        .select('balance, total_earned')
        .eq('user_id', order.user_id)
        .single();

      const newBalance = (account?.balance || 0) + order.zcoin_amount;

      await supabase.from('zcoin_accounts').upsert({
        user_id: order.user_id,
        balance: newBalance,
        total_earned: (account?.total_earned || 0) + order.zcoin_amount,
        updated_at: new Date().toISOString(),
      });

      // 3. 記錄交易
      await supabase.from('zcoin_transactions').insert({
        user_id: order.user_id,
        type: 'earn_topup',
        amount: order.zcoin_amount,
        balance_after: newBalance,
        reference_id: orderId,
        description: `LINE Pay 儲值 ${order.zcoin_amount} Z幣`,
      });

      // 4. 檢查是否首儲（加碼 50%）
      const { count } = await supabase
        .from('payment_orders')
        .select('id', { count: 'exact' })
        .eq('user_id', order.user_id)
        .eq('status', 'completed');

      if (count === 1) {
        // 首儲加碼！
        const bonus = Math.floor(order.zcoin_amount * 0.5);
        const bonusBalance = newBalance + bonus;

        await supabase.from('zcoin_accounts').update({
          balance: bonusBalance,
          total_earned: (account?.total_earned || 0) + order.zcoin_amount + bonus,
        }).eq('user_id', order.user_id);

        await supabase.from('zcoin_transactions').insert({
          user_id: order.user_id,
          type: 'earn_topup',
          amount: bonus,
          balance_after: bonusBalance,
          reference_id: orderId,
          description: `首儲加碼 +${bonus} Z幣`,
        });
      }

      // 5. 導向成功頁面
      return NextResponse.redirect(
        new URL(`/topup/success?zcoin=${order.zcoin_amount}&orderId=${orderId}`, req.url)
      );

    } else {
      // 付款失敗
      await supabase.from('payment_orders').update({
        status: 'failed',
        line_pay_response: response.body,
      }).eq('order_id', orderId);

      return NextResponse.redirect(new URL('/topup?error=payment_failed', req.url));
    }
  } catch (error) {
    console.error('LINE Pay confirm error:', error);
    return NextResponse.redirect(new URL('/topup?error=confirm_failed', req.url));
  }
}
```

### 2.7 取消付款

```typescript
// app/api/line-pay/cancel/route.ts
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get('orderId');

  if (orderId) {
    const supabase = await createClient();
    await supabase.from('payment_orders').update({
      status: 'cancelled',
    }).eq('order_id', orderId);
  }

  return NextResponse.redirect(new URL('/topup?cancelled=true', req.url));
}
```

### 2.8 退款 API

```typescript
// app/api/line-pay/refund/route.ts
// 管理員手動觸發退款

export async function POST(req: Request) {
  const { orderId } = await req.json();

  const supabase = await createClient();
  const { data: order } = await supabase
    .from('payment_orders')
    .select('*')
    .eq('order_id', orderId)
    .eq('status', 'completed')
    .single();

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const response = await linePayClient.refund.send({
    transactionId: order.transaction_id,
    body: { refundAmount: order.amount },
  });

  if (response.body.returnCode === '0000') {
    // 退款成功 → 扣回 Z 幣
    await supabase.from('payment_orders').update({ status: 'refunded' }).eq('order_id', orderId);

    // 扣回 Z 幣
    const { data: account } = await supabase
      .from('zcoin_accounts')
      .select('balance, total_spent')
      .eq('user_id', order.user_id)
      .single();

    await supabase.from('zcoin_accounts').update({
      balance: Math.max(0, (account?.balance || 0) - order.zcoin_amount),
      total_spent: (account?.total_spent || 0) + order.zcoin_amount,
    }).eq('user_id', order.user_id);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Refund failed' }, { status: 500 });
}
```

---

## 三、LINE LIFF 內付款整合

### 3.1 為什麼要 LIFF 整合

```
使用者在 LINE 裡面打開 Insight（透過 LIFF）：
  - 一般 Online API：跳出 LINE → 瀏覽器付款 → 再跳回來（體驗差）
  - LIFF 整合：直接在 LINE 裡面呼叫 LINE Pay → 無縫付款 → 留在 LINE

你已經有 LINE LIFF 了，加這個很自然。
```

### 3.2 LIFF 內付款流程

```typescript
// 前端：在 LIFF 環境中判斷並使用 app URL

async function handleTopup(planId: string) {
  const res = await fetch('/api/line-pay/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId }),
  });
  const data = await res.json();

  // 判斷是否在 LIFF 環境
  if (liff.isInClient()) {
    // 在 LINE 裡面 → 用 app URL，直接呼叫 LINE Pay
    liff.openWindow({
      url: data.appUrl,  // line://pay/payment/xxx
      external: false,
    });
  } else {
    // 在瀏覽器 → 用 web URL，跳轉到 LINE Pay 網頁
    window.location.href = data.paymentUrl;
  }
}
```

### 3.3 LIFF 回調處理

```typescript
// LIFF 付款完成後會回到 confirmUrl
// 但在 LIFF 裡面需要特殊處理

// app/topup/success/page.tsx
'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function TopupSuccess() {
  const params = useSearchParams();
  const zcoin = params.get('zcoin');

  useEffect(() => {
    // 如果在 LIFF 裡面，可以用 liff.sendMessages 通知聊天室
    if (typeof liff !== 'undefined' && liff.isInClient()) {
      liff.sendMessages([{
        type: 'text',
        text: `我剛在 SnowRealm Insight 儲值了 ${zcoin} Z幣！✦`,
      }]).catch(() => {});
    }
  }, [zcoin]);

  // 顯示招財慶祝動畫 + 儲值成功頁面
  return (
    <div>
      {/* 招財從袋子倒出 Z 幣的動畫 */}
      {/* 雪凜說：「招財幫你把 Z 幣存好了！」 */}
    </div>
  );
}
```

---

## 四、Z 幣儲值完整流程（前端 UI）

### 4.1 儲值頁面

```
路由：/topup

結構：
┌─────────────────────────────┐
│  招財坐在 Z 幣堆上 (動畫)     │
│  「要帶更多 Z 幣回家嗎！」      │
├─────────────────────────────┤
│                             │
│  ┌─────────┐ ┌─────────┐   │
│  │ 100 Z幣 │ │ 300 Z幣 │   │
│  │ NT$30   │ │ NT$79   │   │
│  │         │ │ 88折 ★  │   │
│  └─────────┘ └─────────┘   │
│  ┌─────────┐ ┌─────────┐   │
│  │ 500 Z幣 │ │1000 Z幣 │   │
│  │ NT$119  │ │ NT$199  │   │
│  │ 79折    │ │ 66折 ★★ │   │
│  └─────────┘ └─────────┘   │
│                             │
│  [首儲加碼 50% 標語]          │
│                             │
│  ┌──── 選擇付款方式 ────┐    │
│  │ 🟢 LINE Pay        │    │
│  │ 💳 信用卡(Newebpay) │    │
│  │ 💳 Stripe          │    │
│  └─────────────────────┘    │
│                             │
│  [ 確認儲值 ]                │
└─────────────────────────────┘
```

### 4.2 付款方式切換

```typescript
// 前端根據使用者選擇的付款方式呼叫不同 API

async function handlePayment(planId: string, method: 'line_pay' | 'newebpay' | 'stripe') {
  switch (method) {
    case 'line_pay':
      // 呼叫 LINE Pay API
      const lpRes = await fetch('/api/line-pay/request', { ... });
      // 跳轉到 LINE Pay
      break;

    case 'newebpay':
      // 呼叫藍新金流 API（你現有的）
      const npRes = await fetch('/api/newebpay/request', { ... });
      // 跳轉到藍新
      break;

    case 'stripe':
      // 呼叫 Stripe API
      const stRes = await fetch('/api/stripe/checkout', { ... });
      // 跳轉到 Stripe Checkout
      break;
  }
}
```

---

## 五、未來擴展

### 5.1 會員方案（訂閱制）

```typescript
// LINE Pay 支援 PREAPPROVED 定期扣款
// 適合做月訂閱制會員

const MEMBERSHIP_PLANS = {
  basic: {
    name: 'Insight 基本會員',
    price: 99,   // NT$/月
    benefits: ['每月 200 Z幣', '去廣告', 'AI 深度解讀 5次/月'],
  },
  premium: {
    name: 'Insight 進階會員',
    price: 199,  // NT$/月
    benefits: ['每月 500 Z幣', '去廣告', 'AI 深度解讀無限', '專屬雪凜服裝', '專屬稱號'],
  },
};

// 使用 LINE Pay 的 PREAPPROVED payType
// 首次授權後，之後每月自動扣款
```

### 5.2 問卷付費解鎖

```
除了用 Z 幣解鎖，也可以直接用 LINE Pay 付款：
  - 深度問卷：NT$15 或 50 Z幣
  - 讓使用者選擇付現金或用 Z 幣
```

---

## 六、資料庫設計

```sql
-- 付款訂單
CREATE TABLE payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,          -- 自訂訂單編號
  user_id UUID NOT NULL REFERENCES auth.users,
  plan_id TEXT NOT NULL,                  -- 'plan_100' | 'plan_300' etc
  amount INTEGER NOT NULL,                -- 付款金額 (TWD)
  zcoin_amount INTEGER NOT NULL,          -- Z 幣數量
  currency TEXT DEFAULT 'TWD',
  provider TEXT NOT NULL CHECK (provider IN ('line_pay', 'newebpay', 'stripe')),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'failed', 'cancelled', 'refunded'
  )),
  transaction_id TEXT,                    -- LINE Pay transaction ID
  line_pay_response JSONB,               -- LINE Pay 完整回應（debug 用）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 建索引
CREATE INDEX idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_status ON payment_orders(status);
CREATE INDEX idx_payment_orders_transaction ON payment_orders(transaction_id);
```

---

## 七、安全 & 注意事項

### 7.1 防重複確認

```typescript
// Confirm API 可能被重複呼叫（使用者重新整理頁面）
// 必須檢查訂單狀態

if (order.status !== 'pending') {
  // 已經處理過了，直接導向結果頁
  if (order.status === 'completed') {
    return redirect('/topup/success');
  }
  return redirect('/topup?error=already_processed');
}
```

### 7.2 金額驗證

```typescript
// Confirm 時要用 DB 裡的金額，不要用前端傳來的
const response = await linePayClient.confirm.send({
  transactionId,
  body: {
    amount: order.amount,     // 從 DB 讀，不信任前端
    currency: order.currency,
  },
});
```

### 7.3 Webhook / 定時核對

```typescript
// 每天定時核對：DB 裡 pending 超過 1 小時的訂單
// 呼叫 LINE Pay 查詢 API 確認實際狀態

async function reconcilePendingOrders() {
  const supabase = await createClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: pendingOrders } = await supabase
    .from('payment_orders')
    .select('*')
    .eq('status', 'pending')
    .lt('created_at', oneHourAgo);

  for (const order of pendingOrders || []) {
    // 超過 1 小時未完成 → 標記為過期
    await supabase.from('payment_orders').update({
      status: 'cancelled',
    }).eq('order_id', order.order_id);
  }
}
```

### 7.4 環境變數安全

```
Channel Secret 絕對不能出現在前端代碼裡！
所有 LINE Pay API 呼叫都必須在 server-side (API Route) 執行
前端只負責跳轉和顯示結果
```

---

## 八、驗收清單

### 商家帳號
- [ ] LINE Pay 商家帳號申請通過
- [ ] 拿到 Channel ID + Channel Secret
- [ ] Sandbox 測試環境可用

### Online API
- [ ] Request API 成功建立付款
- [ ] 跳轉到 LINE Pay 付款頁正常
- [ ] Confirm API 確認付款成功
- [ ] Z 幣正確發放到帳戶
- [ ] 首儲加碼 50% 正確
- [ ] 取消付款流程正常
- [ ] 退款 API 正常

### LIFF
- [ ] LIFF 環境偵測正確
- [ ] LIFF 內用 app URL 直接喚起 LINE Pay
- [ ] 瀏覽器用 web URL 跳轉
- [ ] 付款完成後正確回到 LIFF

### 安全
- [ ] 防重複確認
- [ ] 金額從 DB 讀取不信前端
- [ ] Channel Secret 只在 server-side
- [ ] 過期訂單自動取消
- [ ] 交易記錄完整

### UI
- [ ] 儲值頁面方案卡片正常
- [ ] 首儲加碼標語顯示
- [ ] 招財儲值成功動畫
- [ ] LINE Pay / Newebpay / Stripe 切換
- [ ] 錯誤頁面友善提示
