# Z 幣消費循環系統 — 完整經濟引擎規格書

> 五層經濟設計 × 完整運作邏輯 × 代碼 × 資料庫
> 版本：v1.0 | 日期：2026-03-30
> 核心：讓使用者覺得「不花錢也能玩」但「花一點點會更好玩」

---

## 目錄

1. 經濟循環總架構
2. 第一層：免費體驗（讓人進來）
3. 第二層：賺取引擎（讓人留下）
4. 第三層：消耗引擎（讓人花掉）
5. 第四層：儲值轉換（讓人掏錢）
6. 第五層：經濟穩定器（防止崩潰）
7. 核心資料庫設計
8. 後台監控儀表板
9. 驗收清單

---

## 一、經濟循環總架構

```
                ┌─────────────┐
                │  新使用者進入  │
                └──────┬──────┘
                       ↓
              ┌────────────────┐
              │  註冊送 500 Z幣  │ ← 第一層
              └────────┬───────┘
                       ↓
              ┌────────────────┐
         ┌───→│  花掉一部分     │ ← 第三層
         │    └────────┬───────┘
         │             ↓
         │    ┌────────────────┐
         │    │  Z 幣不夠了     │
         │    └───┬────────┬───┘
         │        ↓        ↓
         │  ┌─────────┐ ┌─────────┐
         │  │  努力賺   │ │  直接買  │ ← 第四層
         │  └────┬────┘ └────┬────┘
         │       ↓           ↓
         │  ┌─────────────────────┐
         │  │   Z 幣餘額增加       │ ← 第二層
         │  └──────────┬──────────┘
         │             ↓
         └─────────────┘（循環）

         ┌─────────────────────────┐
         │  第五層：經濟穩定器       │
         │  防通膨 / 防通縮 / 防刷幣 │（背景運作）
         └─────────────────────────┘
```

---

## 二、第一層：免費體驗（讓人進來）

### 2.1 免費 vs 付費對照

| 功能 | 免費 | 花 Z 幣 | 雪凜 Pro |
|------|------|---------|---------|
| 填問卷 | ✅ 無限 | — | — |
| 問卷結果 | ✅ 簡版 3 句 | 30：深度 500 字 | ✅ 無限深度 |
| 故事卡邊框 | ✅ 基本邊框 | 50-200：特殊邊框 | ✅ 全部 |
| 社群互動 | ✅ 無限 | — | — |
| 雪凜聊天 Standard | ✅ 無限 | — | — |
| Premium 聊天 | ✅ 5 則/天 | — | ✅ 20 則/天 |
| 圖片辨識 | ✅ 3 張/天 | 5/張 | ✅ 20 張/天 |
| 表情/貼圖 | ❌ 基本包 | 30-150 | ✅ 部分解鎖 |
| 稱號 | ❌ | 80-500 | ✅ 專屬 |
| 角色服裝 | ❌ | 200-500 | ✅ 1 套/月 |
| 招財配件 | ❌ | 80-150 | ✅ 部分 |
| 深度問卷 | ❌ | 50-100 | ✅ 全部 |
| 週報 | ❌ | — | ✅ |

### 2.2 註冊禮 500 Z幣的消費引導

```typescript
// lib/zcoin/registrationBonus.ts

// 新使用者第一筆 Z 幣怎麼花：
// 表情包(30) + 深度解讀(30) + 邊框(50) = 110
// 剩 390 → 不夠買雪凜服裝(300) + 稱號(120)
// → 只能選一個 → 選完剩不夠 → 動力開始賺或儲值

const FIRST_SPEND_GUIDE = {
  step1: {
    yukirin: '招財準備了 500 Z幣見面禮給你',
    mood: 'excited',
    animation: 'clapping',
  },
  step2: {
    yukirin: '要不要去商城看看\n有可愛的表情包',
    mood: 'wink',
    action: { type: 'navigate', target: '/shop' },
  },
  step3: {
    yukirin: '買了！用表情跟大家打招呼吧',
    mood: 'excited',
    action: { type: 'navigate', target: '/social' },
  },
  skip: {
    yukirin: '沒關係 之後想買再去\nZ 幣不會過期的',
    mood: 'relaxed',
  },
};
```

### 2.3 註冊禮防作弊

```typescript
async function grantRegistrationBonus(userId: string): Promise<boolean> {
  const supabase = await createClient();

  // 1. 已經領過？
  const { data: existing } = await supabase
    .from('zcoin_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'earn_registration')
    .single();
  if (existing) return false;

  // 2. 至少手機或 LINE 驗證一項
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('phone_verified, line_linked')
    .eq('user_id', userId)
    .single();
  if (!profile?.phone_verified && !profile?.line_linked) return false;

  // 3. 同裝置已有 2 個帳號領過？
  const { data: deviceCheck } = await supabase
    .from('device_fingerprints')
    .select('user_id')
    .eq('fingerprint', await getDeviceFingerprint())
    .neq('user_id', userId);
  if (deviceCheck && deviceCheck.length >= 2) return false;

  // 4. 發放 500 Z幣
  await grantZcoin(userId, 500, 'earn_registration', '註冊見面禮');

  // 5. 新帳號 24 小時不能送禮
  await supabase.from('user_restrictions').insert({
    user_id: userId,
    restriction_type: 'no_gift_24h',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    reason: '新帳號 24 小時內不能送禮',
  });

  return true;
}
```

---

## 三、第二層：賺取引擎（讓人留下）

### 3.1 每日收入預估

```
基本（幾乎人人都做）：
  每日登入        +1
  填 1 份問卷     +3
  分享 1 份結果   +5
  ─────────────────
  基本             9 Z幣/天

積極（願意互動）：
  + 每日任務 ×3   +9
  ─────────────────
  積極             18 Z幣/天

活躍（重度使用者）：
  + 寫 1 篇故事   +10
  + 被按讚 ×20    +20
  + 連續登入加碼   +5
  ─────────────────
  活躍             53 Z幣/天
```

### 3.2 回收週期對照

```
每天 18 Z幣能買什麼：
  30   表情包        → 2 天   ← 入門成就感
  50   邊框          → 3 天
  80   招財配件      → 5 天
  120  稱號          → 7 天   ← 一週目標
  200  雪凜服裝      → 12 天  ← 兩週目標
  300  限定服裝      → 17 天
  500  傳說稱號      → 28 天  ← 一個月目標
```

### 3.3 賺取規則定義

```typescript
// lib/zcoin/earnEngine.ts

interface EarnRule {
  type: string;
  amount: number;
  dailyLimit: number;
  lifetimeLimit?: number;
  cooldownSeconds?: number;
  validator?: (userId: string, context: any) => Promise<boolean>;
}

const EARN_RULES: Record<string, EarnRule> = {
  earn_registration: {
    type: 'earn_registration',
    amount: 500,
    dailyLimit: 1,
    lifetimeLimit: 1,
  },
  earn_daily_login: {
    type: 'earn_daily_login',
    amount: 1,
    dailyLimit: 1,
  },
  earn_streak: {
    type: 'earn_streak',
    amount: 0, // 動態計算
    dailyLimit: 1,
  },
  earn_complete_survey: {
    type: 'earn_complete_survey',
    amount: 3,
    dailyLimit: 10,
    validator: async (userId, ctx) => {
      // 同一份問卷只能領一次
      return !(await checkEarnedForSurvey(userId, ctx.surveyId));
    },
  },
  earn_share: {
    type: 'earn_share',
    amount: 5,
    dailyLimit: 5,
    validator: async (userId, ctx) => {
      return !(await checkEarnedForShare(userId, ctx.surveyId));
    },
  },
  earn_story: {
    type: 'earn_story',
    amount: 10,
    dailyLimit: 3,
    validator: async (userId, ctx) => {
      // AI 審核通過才給
      const moderation = await moderateContent(ctx.content, 'story');
      return moderation.safe;
    },
  },
  earn_liked: {
    type: 'earn_liked',
    amount: 1,
    dailyLimit: 50,
    cooldownSeconds: 86400, // 同一對 24 小時只算 1 次
    validator: async (userId, ctx) => {
      const pairKey = [userId, ctx.likerId].sort().join('-');
      return !(await checkPairCooldown(pairKey));
    },
  },
  earn_invite: {
    type: 'earn_invite',
    amount: 20,
    dailyLimit: 3,
    validator: async (userId, ctx) => {
      if (!ctx.inviteeCompletedSurvey) return false;
      return !(await checkSameDevice(userId, ctx.inviteeId));
    },
  },
  earn_line_bind: {
    type: 'earn_line_bind',
    amount: 10,
    lifetimeLimit: 1,
    dailyLimit: 1,
  },
  earn_profile_complete: {
    type: 'earn_profile_complete',
    amount: 5,
    lifetimeLimit: 1,
    dailyLimit: 1,
  },
  earn_feedback: {
    type: 'earn_feedback',
    amount: 8,
    dailyLimit: 1,
    validator: async (userId) => {
      const lastFeedback = await getLastFeedbackDate(userId);
      if (!lastFeedback) return true;
      return daysSince(lastFeedback) >= 30; // 每月只能 1 次
    },
  },
  earn_daily_task: {
    type: 'earn_daily_task',
    amount: 3, // 每個任務 3，一天 3 個 = 9
    dailyLimit: 3,
  },
  earn_achievement: {
    type: 'earn_achievement',
    amount: 0, // 依成就不同 10-100
    dailyLimit: 99,
    validator: async (userId, ctx) => {
      return !(await checkAchievementClaimed(userId, ctx.achievementId));
    },
  },
};
```

### 3.4 統一發放函式

```typescript
async function grantZcoin(
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string
): Promise<{ success: boolean; newBalance: number }> {
  const supabase = await createClient();

  // 1. 檢查規則
  const rule = EARN_RULES[type];
  if (rule) {
    const todayCount = await getTodayEarnCount(userId, type);
    if (todayCount >= rule.dailyLimit) {
      return { success: false, newBalance: 0 };
    }
    if (rule.lifetimeLimit) {
      const lifetimeCount = await getLifetimeEarnCount(userId, type);
      if (lifetimeCount >= rule.lifetimeLimit) {
        return { success: false, newBalance: 0 };
      }
    }
  }

  // 2. 原子操作加餘額
  const { data: account } = await supabase.rpc('add_zcoin', {
    p_user_id: userId,
    p_amount: amount,
  });
  const newBalance = account.balance;

  // 3. 記錄交易
  await supabase.from('zcoin_transactions').insert({
    user_id: userId,
    type,
    amount,
    balance_after: newBalance,
    reference_id: referenceId,
    description,
  });

  // 4. 觸發雪凜反應
  await emitEvent('zcoin.earn', { userId, amount, newBalance, type });

  return { success: true, newBalance };
}
```

### 3.5 連續登入加碼

```typescript
function getStreakBonus(streakDays: number): number {
  if (streakDays <= 2) return 0;
  if (streakDays <= 4) return 2;   // Day 3-4
  if (streakDays <= 6) return 3;   // Day 5-6
  if (streakDays === 7) return 5;  // Day 7 週獎勵
  if (streakDays <= 13) return 3;  // Day 8-13
  if (streakDays === 14) return 8; // Day 14
  if (streakDays <= 29) return 3;  // Day 15-29
  if (streakDays === 30) return 10;// Day 30 月獎勵
  return 3;                         // Day 31+
}

async function processDailyCheckIn(userId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // 已簽到？
  const { data: existing } = await supabase
    .from('daily_check_in')
    .select('id')
    .eq('user_id', userId)
    .eq('check_in_date', today)
    .single();
  if (existing) return;

  // 計算連續天數
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const { data: yesterdayRecord } = await supabase
    .from('daily_check_in')
    .select('streak_days')
    .eq('user_id', userId)
    .eq('check_in_date', yesterday)
    .single();

  const streakDays = yesterdayRecord ? yesterdayRecord.streak_days + 1 : 1;
  const baseReward = 1;
  const streakBonus = getStreakBonus(streakDays);
  const totalReward = baseReward + streakBonus;

  // 記錄
  await supabase.from('daily_check_in').insert({
    user_id: userId,
    check_in_date: today,
    streak_days: streakDays,
    zcoin_earned: totalReward,
  });

  // 發放
  await grantZcoin(userId, totalReward, 'earn_daily_login',
    streakBonus > 0
      ? `登入 +${baseReward} + 連續 ${streakDays} 天 +${streakBonus}`
      : `登入 +${baseReward}`
  );

  // 里程碑
  if ([7, 14, 30].includes(streakDays)) {
    await emitEvent('streak.milestone', { userId, streakDays });
  }
}
```

---

## 四、第三層：消耗引擎（讓人花掉）

### 4.1 十大消費場景

| # | 品類 | 價格 | 心理驅動 | 回收天數 |
|---|------|------|---------|---------|
| 1 | AI 深度解讀 | 30 | 好奇心 | 2 天 |
| 2 | 圖片辨識 | 5/張 | 即時需求 | 0.3 天 |
| 3 | 表情/貼圖 | 30-150 | 社交貨幣 | 2-9 天 |
| 4 | 故事卡邊框 | 50-200 | 虛榮 + 分享 | 3-12 天 |
| 5 | 專屬稱號 | 80-500 | 身份標識 | 5-28 天 |
| 6 | 角色服裝 | 200-500 | 情感連結 | 12-28 天 |
| 7 | 招財配件 | 80-150 | 收集慾 | 5-9 天 |
| 8 | 問卷解鎖 | 50-100 | 好奇心 | 3-6 天 |
| 9 | 送禮(含10%手續費) | 10+ | 社交認同 | 1 天 |
| 10 | 限定商品 | 100-500 | FOMO | 6-28 天 |

### 4.2 消費執行代碼

```typescript
// lib/zcoin/spendEngine.ts

async function spendZcoin(
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string
): Promise<{ success: boolean; newBalance: number }> {
  const supabase = await createClient();

  // 1. 檢查餘額 + 凍結狀態
  const { data: account } = await supabase
    .from('zcoin_accounts')
    .select('balance, is_frozen')
    .eq('user_id', userId)
    .single();

  if (!account || account.is_frozen) {
    return { success: false, newBalance: 0 };
  }

  if (account.balance < amount) {
    await emitEvent('zcoin.insufficient', {
      userId, needed: amount, balance: account.balance,
    });
    return { success: false, newBalance: account.balance };
  }

  // 2. 原子操作扣除
  const { data: result } = await supabase.rpc('deduct_zcoin', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (!result.success) {
    return { success: false, newBalance: account.balance };
  }

  // 3. 記錄
  await supabase.from('zcoin_transactions').insert({
    user_id: userId,
    type,
    amount: -amount,
    balance_after: result.new_balance,
    reference_id: referenceId,
    description,
  });

  // 4. 觸發事件
  await emitEvent('zcoin.spend', {
    userId, amount, newBalance: result.new_balance, type,
  });

  return { success: true, newBalance: result.new_balance };
}
```

### 4.3 商品購買流程

```typescript
// lib/zcoin/shopEngine.ts

async function purchaseItem(
  userId: string,
  itemId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();

  // 1. 查商品
  const { data: item } = await supabase
    .from('zcoin_shop_items')
    .select('*')
    .eq('id', itemId)
    .eq('is_active', true)
    .single();
  if (!item) return { success: false, message: '商品不存在' };

  // 2. 限定商品過期？
  if (item.is_limited && item.available_until) {
    if (new Date(item.available_until) < new Date()) {
      return { success: false, message: '限定商品已下架' };
    }
  }

  // 3. 庫存檢查
  if (item.stock_limit && item.stock_remaining <= 0) {
    return { success: false, message: '已售完' };
  }

  // 4. 已購買？
  const { data: owned } = await supabase
    .from('zcoin_user_items')
    .select('id')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .single();
  if (owned) return { success: false, message: '你已經有了' };

  // 5. 扣 Z 幣
  const spendResult = await spendZcoin(
    userId, item.price, `spend_${item.category}`,
    `購買 ${item.name}`, itemId
  );
  if (!spendResult.success) {
    return { success: false, message: 'Z 幣不足' };
  }

  // 6. 記錄購買
  await supabase.from('zcoin_user_items').insert({
    user_id: userId,
    item_id: itemId,
  });

  // 7. 扣庫存
  if (item.stock_limit) {
    await supabase.from('zcoin_shop_items').update({
      stock_remaining: item.stock_remaining - 1,
    }).eq('id', itemId);
  }

  // 8. 自動裝備
  if (['title', 'frame', 'theme', 'zaicai_item', 'costume'].includes(item.category)) {
    await supabase.from('zcoin_user_equipped').upsert({
      user_id: userId,
      slot: item.category,
      item_id: itemId,
    });
  }

  return { success: true, message: `成功購買 ${item.name}` };
}
```

### 4.4 送禮（含手續費）

```typescript
async function sendGift(
  senderId: string,
  receiverId: string,
  amount: number,
  message?: string
): Promise<{ success: boolean; message: string }> {
  if (amount < 10) return { success: false, message: '最少送 10 Z幣' };
  if (senderId === receiverId) return { success: false, message: '不能送給自己' };

  // 新帳號 24 小時不能送禮
  const restriction = await checkRestriction(senderId, 'no_gift_24h');
  if (restriction) return { success: false, message: '新帳號 24 小時後才能送禮' };

  // 儲值後 24 小時不能送禮
  const topupRestriction = await checkRestriction(senderId, 'no_gift_after_topup');
  if (topupRestriction) return { success: false, message: '儲值後 24 小時才能送禮' };

  const fee = Math.ceil(amount * 0.1); // 10% 手續費（無條件進位）
  const totalCost = amount + fee;

  // 扣發送者
  const sendResult = await spendZcoin(
    senderId, totalCost, 'spend_gift',
    `送 ${amount} Z幣（手續費 ${fee}）`, receiverId
  );
  if (!sendResult.success) {
    return { success: false, message: 'Z 幣不足' };
  }

  // 加接收者
  await grantZcoin(receiverId, amount, 'gift_received',
    `收到 ${amount} Z幣的禮物`, senderId);

  return { success: true, message: `成功送出 ${amount} Z幣` };
}
```

---

## 五、第四層：儲值轉換（讓人掏錢）

### 5.1 儲值方案

```typescript
const TOPUP_PLANS = {
  plan_100: { zcoin: 100, price: 30, discount: null, tag: null },
  plan_300: { zcoin: 300, price: 79, discount: '88折', tag: '熱門' },
  plan_500: { zcoin: 500, price: 119, discount: '79折', tag: null },
  plan_1000: { zcoin: 1000, price: 199, discount: '66折', tag: '最划算' },
};

// 首儲加碼 50%
// NT$30 → 100 Z幣 + 50 bonus = 150
// NT$199 → 1000 Z幣 + 500 bonus = 1500
```

### 4.3 首儲加碼完整代碼

```typescript
async function processFirstTopupBonus(userId: string, zcoinAmount: number) {
  const supabase = await createClient();

  // 檢查是否首儲
  const { count } = await supabase
    .from('payment_orders')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'completed');

  if (count !== 1) return; // 不是首儲

  // 加碼 50%
  const bonus = Math.floor(zcoinAmount * 0.5);
  await grantZcoin(userId, bonus, 'earn_topup_bonus',
    `首儲加碼 +${bonus} Z幣`);

  // 解鎖首儲稱號
  await grantAchievement(userId, 'first_topup_vip');

  // 解鎖首儲限定招財配件
  await grantItem(userId, 'zaicai_golden_crown');

  // 雪凜反應
  await emitEvent('payment.first', { userId, amount: zcoinAmount, bonus });
}
```

### 4.4 儲值時機觸發（雪凜怎麼引導）

```typescript
// 不是主動推銷，是在「剛好需要」的時候出現

const TOPUP_TRIGGERS = [
  {
    id: 'balance_insufficient_for_item',
    // 使用者在商城看一個商品，但餘額不夠
    condition: (s) => s.currentPage === '/shop' && s.lastClickTarget === 'buy_button',
    yukirin: '差一點點欸\n要不要儲個小包？',
    riku: '...差一點\n儲值？',
    // 不強迫，只是溫柔提一下
  },
  {
    id: 'limited_item_ending',
    // 限定商品快下架，使用者看過但沒買
    condition: (s) => s.viewedLimitedItem && s.hoursUntilExpiry < 24,
    yukirin: '那個限定的明天就下架了欸\n不買真的沒了喔',
    riku: '...限定的快沒了',
    // FOMO 但不過分
  },
  {
    id: 'after_great_result',
    // 使用者剛拿到很好的問卷結果，想看深度解讀但 Z 幣不夠
    condition: (s) => s.currentPage.startsWith('/done') && s.zcoinBalance < 30,
    yukirin: '你的結果超特別的\n深度解讀要 30 Z幣\n...你現在只有 {balance}',
    riku: '結果不錯\n...深度版需要 30',
    // 在使用者最興奮的時候出現需求
  },
];
```

### 4.5 儲值方案 UI

```
商城裡的儲值區：

┌─────────────────────────────────────────┐
│  招財的金庫 🐹                            │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ 100 Z幣  │ │ 300 Z幣  │ │ 500 Z幣  │  │
│  │ NT$30    │ │ NT$79    │ │ NT$119   │  │
│  │          │ │ ⭐ 熱門   │ │ 79 折    │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│                                         │
│  ┌─────────────────────┐               │
│  │    1000 Z幣          │               │
│  │    NT$199  最划算     │               │
│  │    66 折              │               │
│  └─────────────────────┘               │
│                                         │
│  首次儲值加碼 50%！                       │
│  ⚡ 限首次                               │
└─────────────────────────────────────────┘
```

---

## 第五層：經濟穩定器（防止崩潰）

### 5.1 防通膨機制（Z 幣太多）

```typescript
// lib/zcoin/economicStabilizer.ts

// 每天凌晨跑一次的經濟健康檢查
async function dailyEconomicCheck() {
  const supabase = await createClient();

  // 1. 計算全平台 Z 幣總量
  const { data: total } = await supabase
    .rpc('get_total_zcoin');

  // 2. 計算今日淨增長
  const todayEarned = await getTodayTotalEarned();
  const todaySpent = await getTodayTotalSpent();
  const netGrowth = todayEarned - todaySpent;

  // 3. 計算平均每人餘額
  const avgBalance = await getAverageBalance();
  const activeUsers = await getActiveUserCount('24h');

  // 4. 健康指標判斷
  const health = {
    totalSupply: total,
    dailyEarned: todayEarned,
    dailySpent: todaySpent,
    netGrowth,
    avgBalance,
    inflationRate: netGrowth / total,
    spendRatio: todaySpent / todayEarned, // 理想值 0.6-0.8
  };

  // 5. 告警
  if (health.spendRatio < 0.3) {
    // 花的太少 → 通膨風險
    await sendAlert({
      level: 'warning',
      title: 'Z 幣通膨風險',
      details: `消費比例只有 ${(health.spendRatio * 100).toFixed(0)}%，使用者賺的遠多於花的`,
      action: '考慮推出新的消費場景或限定商品',
    });
  }

  if (health.avgBalance > 1000) {
    // 平均餘額太高 → 大家都在囤
    await sendAlert({
      level: 'warning',
      title: 'Z 幣囤積過多',
      details: `平均每人餘額 ${health.avgBalance}，需要更多消費出口`,
      action: '推出高價值限定商品吸收 Z 幣',
    });
  }

  // 6. 存入歷史記錄（給後台畫圖用）
  await supabase.from('zcoin_daily_stats').insert({
    date: new Date().toISOString().split('T')[0],
    total_supply: health.totalSupply,
    daily_earned: health.dailyEarned,
    daily_spent: health.dailySpent,
    net_growth: health.netGrowth,
    avg_balance: health.avgBalance,
    active_users: activeUsers,
    spend_ratio: health.spendRatio,
  });

  return health;
}
```

### 5.2 防通膨的自動調節手段

```typescript
const ANTI_INFLATION_TOOLS = {
  // 工具 1：限定商品吸收（最常用）
  limitedEdition: {
    description: '推出高價限定商品吸收大量 Z 幣',
    trigger: 'avgBalance > 500 或 spendRatio < 0.4',
    example: '限定招財黃金裝（1000 Z幣），限量 100 個',
  },

  // 工具 2：提高消費場景的頻率
  moreConsumption: {
    description: '增加需要花 Z 幣的場景',
    trigger: 'spendRatio < 0.3 持續 7 天',
    examples: [
      '新增 AI 功能需要 Z 幣',
      '新增付費問卷',
      '社群打賞活動',
    ],
  },

  // 工具 3：降低賺取速率（最後手段）
  reduceEarning: {
    description: '微調某些賺取管道的金額',
    trigger: 'totalSupply 增長率 > 10%/週 持續 3 週',
    example: '按讚獎勵從 1 降到 0.5（慎用，影響使用者感受）',
    warning: '只在極端情況下使用',
  },
};
```

### 5.3 防通縮機制（Z 幣太少）

```typescript
const ANTI_DEFLATION_TOOLS = {
  // 工具 1：保底收入
  guaranteedIncome: {
    description: '每日任務保底 18 Z幣，不管怎樣都能賺到',
    implementation: '已在賺取引擎中內建',
  },

  // 工具 2：新人大禮包
  newUserBonus: {
    description: '註冊送 500 讓新人立刻有東西花',
    implementation: '已實作',
  },

  // 工具 3：回歸禮包
  returnBonus: {
    description: '超過 7 天沒來的使用者回來送 50 Z幣',
    trigger: 'daysSinceLastVisit >= 7',
    implementation: async (userId: string) => {
      const lastVisit = await getLastVisitDate(userId);
      const days = daysSince(lastVisit);
      if (days >= 7) {
        const bonus = Math.min(days * 5, 100); // 最多 100
        await grantZcoin(userId, bonus, 'earn_comeback',
          `歡迎回來！回歸禮 +${bonus} Z幣`);
      }
    },
  },

  // 工具 4：免費比例保持 70%
  freeContentRatio: {
    description: '永遠有 70% 的內容是免費的',
    rule: '付費問卷不超過總問卷的 30%',
  },
};
```

### 5.4 防刷幣系統

```typescript
// lib/zcoin/antiFraud.ts

interface FraudSignal {
  type: string;
  severity: 'low' | 'medium' | 'high';
  action: 'log' | 'flag' | 'freeze' | 'ban';
}

async function detectZcoinFraud(userId: string): Promise<FraudSignal[]> {
  const signals: FraudSignal[] = [];

  // 1. 短時間大量賺取
  const hourlyEarned = await getHourlyEarned(userId);
  if (hourlyEarned > 30) {
    signals.push({
      type: 'rapid_earning',
      severity: 'medium',
      action: 'flag',
    });
  }

  // 2. 互刷偵測
  const mutualLikes = await getMutualLikes(userId, '24h');
  if (mutualLikes.length > 3) {
    signals.push({
      type: 'mutual_farming',
      severity: 'high',
      action: 'freeze',
    });
  }

  // 3. 多帳號同裝置
  const sameDeviceAccounts = await getSameDeviceAccounts(userId);
  if (sameDeviceAccounts.length > 1) {
    signals.push({
      type: 'multi_account',
      severity: 'high',
      action: 'freeze',
    });
  }

  // 4. 按讚模式異常（對同一批人反覆按讚）
  const likePatterns = await analyzeLikePatterns(userId, '7d');
  if (likePatterns.suspiciousRatio > 0.5) {
    signals.push({
      type: 'suspicious_like_pattern',
      severity: 'medium',
      action: 'flag',
    });
  }

  // 5. 儲值後立即送禮（洗錢嫌疑）
  const recentTopup = await getRecentTopup(userId, '24h');
  const recentGifts = await getRecentGifts(userId, '24h');
  if (recentTopup && recentGifts.totalAmount > recentTopup.amount * 0.5) {
    signals.push({
      type: 'topup_then_gift',
      severity: 'high',
      action: 'freeze',
    });
  }

  // 執行動作
  for (const signal of signals) {
    if (signal.action === 'freeze') {
      await freezeZcoinAccount(userId, signal.type);
    } else if (signal.action === 'flag') {
      await addToWatchlist(userId, signal.type);
    }
    // 所有 signal 都記錄
    await logFraudSignal(userId, signal);
  }

  return signals;
}

// 凍結帳戶的 Z 幣
async function freezeZcoinAccount(userId: string, reason: string) {
  const supabase = await createClient();
  
  await supabase.from('zcoin_accounts').update({
    is_frozen: true,
    frozen_reason: reason,
    frozen_at: new Date().toISOString(),
  }).eq('user_id', userId);

  // 通知管理員
  await sendAlert({
    level: 'warning',
    title: '⚠️ Z 幣帳戶凍結',
    details: `使用者 ${userId} 的 Z 幣帳戶已凍結\n原因：${reason}`,
    action: '請到後台確認是否誤判',
  });
}
```

### 5.5 每日賺取上限

```typescript
const DAILY_EARN_CAPS: Record<string, number> = {
  earn_daily_login: 1,
  earn_streak: 1,
  earn_complete_survey: 10,
  earn_share: 5,
  earn_story: 3,
  earn_liked: 50,
  earn_invite: 3,
  earn_daily_task: 3,
  earn_feedback: 1,
};

// 理論最大值計算
// login(1) + streak(10) + survey(30) + share(25) + story(30) + liked(50) + invite(60) + task(15) + feedback(8)
// = 229 Z幣/天
// 但實際上不可能每項都達上限，正常活躍使用者約 18-53 Z幣/天
```

---

## 六、核心資料庫設計

```sql
-- ===== Z 幣帳戶 =====
CREATE TABLE zcoin_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  total_topup INTEGER NOT NULL DEFAULT 0,
  is_frozen BOOLEAN DEFAULT FALSE,
  frozen_reason TEXT,
  frozen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Z 幣交易記錄 =====
CREATE TABLE zcoin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  type TEXT NOT NULL,
  -- 賺取：earn_registration, earn_daily_login, earn_streak,
  --       earn_complete_survey, earn_share, earn_story,
  --       earn_liked, earn_invite, earn_line_bind,
  --       earn_profile_complete, earn_feedback, earn_achievement,
  --       earn_daily_task, earn_topup, earn_topup_bonus,
  --       earn_comeback, gift_received
  -- 消費：spend_ai_analysis, spend_image_recognition,
  --       spend_emoji, spend_frame, spend_title,
  --       spend_costume, spend_zaicai_item, spend_survey_unlock,
  --       spend_gift, spend_theme, spend_limited
  -- 系統：gift_fee, system_adjust
  amount INTEGER NOT NULL,
  -- 正數 = 收入，負數 = 支出
  balance_after INTEGER NOT NULL,
  reference_id TEXT,
  -- 關聯的問卷ID、商品ID、使用者ID等
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_zcoin_tx_user ON zcoin_transactions(user_id, created_at DESC);
CREATE INDEX idx_zcoin_tx_type ON zcoin_transactions(type, created_at DESC);
CREATE INDEX idx_zcoin_tx_date ON zcoin_transactions(created_at DESC);

-- ===== 商城商品 =====
CREATE TABLE zcoin_shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'emoji', 'sticker', 'frame', 'title', 'costume',
    'zaicai_item', 'theme', 'survey_unlock', 'limited'
  )),
  price INTEGER NOT NULL CHECK (price > 0),
  image_url TEXT,
  preview_url TEXT,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN DEFAULT TRUE,
  is_limited BOOLEAN DEFAULT FALSE,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  stock_limit INTEGER,  -- NULL = 無限
  stock_remaining INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_shop_category ON zcoin_shop_items(category, is_active);

-- ===== 使用者擁有的商品 =====
CREATE TABLE zcoin_user_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  item_id UUID NOT NULL REFERENCES zcoin_shop_items,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);
CREATE INDEX idx_user_items ON zcoin_user_items(user_id);

-- ===== 使用者裝備中的商品 =====
CREATE TABLE zcoin_user_equipped (
  user_id UUID NOT NULL REFERENCES auth.users,
  slot TEXT NOT NULL CHECK (slot IN ('title', 'frame', 'theme', 'zaicai_item', 'costume')),
  item_id UUID REFERENCES zcoin_shop_items,
  PRIMARY KEY (user_id, slot)
);

-- ===== 每日簽到 =====
CREATE TABLE daily_check_in (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  check_in_date DATE NOT NULL,
  streak_days INTEGER NOT NULL DEFAULT 1,
  zcoin_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, check_in_date)
);
CREATE INDEX idx_checkin_user ON daily_check_in(user_id, check_in_date DESC);

-- ===== Z 幣目標 =====
CREATE TABLE zcoin_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  item_id UUID REFERENCES zcoin_shop_items,
  item_name TEXT NOT NULL,
  target_amount INTEGER NOT NULL,
  achieved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 儲值訂單 =====
CREATE TABLE payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  order_number TEXT UNIQUE NOT NULL,
  plan_id TEXT NOT NULL,
  zcoin_amount INTEGER NOT NULL,
  price_ntd INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('line_pay', 'newebpay', 'stripe')),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'failed', 'cancelled', 'refunded'
  )),
  payment_response JSONB,
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_user ON payment_orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status ON payment_orders(status, created_at DESC);

-- ===== 經濟日報（每日統計） =====
CREATE TABLE zcoin_daily_stats (
  date DATE PRIMARY KEY,
  total_supply INTEGER NOT NULL,
  daily_earned INTEGER NOT NULL,
  daily_spent INTEGER NOT NULL,
  net_growth INTEGER NOT NULL,
  avg_balance FLOAT NOT NULL,
  active_users INTEGER NOT NULL,
  spend_ratio FLOAT NOT NULL,
  topup_revenue_ntd INTEGER DEFAULT 0,
  topup_count INTEGER DEFAULT 0,
  gift_count INTEGER DEFAULT 0,
  gift_fee_collected INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 帳戶使用限制 =====
CREATE TABLE user_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  restriction_type TEXT NOT NULL,
  -- no_gift_24h, no_topup_24h, earn_suspended
  expires_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_restrictions ON user_restrictions(user_id, restriction_type, expires_at);

-- ===== 原子操作：加 Z 幣 =====
CREATE OR REPLACE FUNCTION add_zcoin(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(balance INTEGER) AS $$
BEGIN
  UPDATE zcoin_accounts
  SET balance = balance + p_amount,
      total_earned = total_earned + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO zcoin_accounts(user_id, balance, total_earned)
    VALUES (p_user_id, p_amount, p_amount);
  END IF;

  RETURN QUERY SELECT zcoin_accounts.balance FROM zcoin_accounts
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ===== 原子操作：扣 Z 幣 =====
CREATE OR REPLACE FUNCTION deduct_zcoin(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER) AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT balance INTO v_balance FROM zcoin_accounts
  WHERE user_id = p_user_id FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount THEN
    RETURN QUERY SELECT FALSE, COALESCE(v_balance, 0);
    RETURN;
  END IF;

  UPDATE zcoin_accounts
  SET balance = balance - p_amount,
      total_spent = total_spent + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT TRUE, (v_balance - p_amount);
END;
$$ LANGUAGE plpgsql;
```

---

## 七、後台監控儀表板

### 7.1 /admin/zcoin 頁面設計

```
┌─ 經濟健康總覽 ──────────────────────────────────┐
│                                                  │
│  全平台 Z 幣總量        今日產出 / 消耗            │
│  2,450,000             +12,300 / -8,700          │
│                                                  │
│  淨增長率               消費比例                   │
│  +3,600 (⚠️)           70.7% (✅)                │
│                                                  │
│  平均每人餘額            儲值轉換率                 │
│  245 Z幣               3.2%                      │
│                                                  │
└──────────────────────────────────────────────────┘

┌─ 趨勢圖（30 天）────────────────────────────────┐
│                                                  │
│  [每日總量] [產出/消耗] [平均餘額] [儲值營收]       │
│                                                  │
│  📈 折線圖                                        │
│                                                  │
└──────────────────────────────────────────────────┘

┌─ 各管道佔比 ────────────────────────────────────┐
│                                                  │
│  賺取管道佔比（餅圖）    消費管道佔比（餅圖）       │
│  ● 按讚 34%             ● AI 解讀 28%             │
│  ● 問卷 22%             ● 表情 18%                │
│  ● 分享 18%             ● 送禮 15%                │
│  ● 故事 12%             ● 邊框 12%                │
│  ● 登入 8%              ● 其他 27%                │
│  ● 其他 6%                                       │
│                                                  │
└──────────────────────────────────────────────────┘

┌─ 異常偵測 ──────────────────────────────────────┐
│                                                  │
│  🔴 user_xyz 1 小時賺取 45 Z幣（疑似刷幣）       │
│  🔴 3 組帳號互刷按讚嫌疑                          │
│  🟡 user_abc Z 幣餘額 15,000（異常高）            │
│  🟡 消費比例連續 3 天低於 40%                      │
│                                                  │
│  [查看詳情] [凍結帳戶] [手動調整]                  │
│                                                  │
└──────────────────────────────────────────────────┘

┌─ 最近交易流水 ──────────────────────────────────┐
│                                                  │
│  | 時間 | 使用者 | 類型 | 金額 | 餘額 |           │
│  | 09:32 | 小美 | 購買表情 | -30 | 250 |          │
│  | 09:31 | JK大叔 | 儲值 | +300 | 580 |           │
│  | 09:28 | 花花 | 送禮 | -110 | 90 |              │
│  | 09:25 | 阿明 | 填問卷 | +3 | 187 |             │
│                                                  │
│  [匯出 CSV]                                      │
│                                                  │
└──────────────────────────────────────────────────┘

┌─ 手動調整 ──────────────────────────────────────┐
│                                                  │
│  使用者 ID：[___________]                         │
│  調整金額：[___] Z幣                              │
│  原因：[________________]                         │
│  [確認調整]                                       │
│                                                  │
│  ⚠️ 所有手動調整會記錄到 audit log                │
│  ⚠️ 會即時 LINE 通知 super_admin                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 7.2 健康指標閾值

```typescript
const ECONOMIC_HEALTH_THRESHOLDS = {
  spendRatio: {
    healthy: { min: 0.6, max: 0.8 },
    warning: { min: 0.3, max: 0.6 },
    danger: { min: 0, max: 0.3 },
  },
  avgBalance: {
    healthy: { min: 100, max: 500 },
    warning: { min: 500, max: 1000 },
    danger: { min: 1000, max: Infinity },
  },
  dailyNetGrowth: {
    healthy: { min: -1000, max: 5000 },
    warning: { min: 5000, max: 20000 },
    danger: { min: 20000, max: Infinity },
  },
};
```

---

## 八、驗收清單

### 第一層：免費體驗
- [ ] 註冊送 500 Z幣正確發放
- [ ] 防重複領取（同裝置/同 IP）
- [ ] 新帳號 24 小時送禮限制
- [ ] 免費功能佔 70% 以上
- [ ] 雪凜引導新使用者消費

### 第二層：賺取引擎
- [ ] 每日登入 +1 正常
- [ ] 連續登入加碼正確（Day 7=+5, Day 14=+8, Day 30=+10）
- [ ] 填問卷 +3（同問卷只能領一次）
- [ ] 分享 +5（每日上限 5 次）
- [ ] 發故事 +10（AI 審核通過才給）
- [ ] 按讚 +1（24 小時同對冷卻、每日上限 50）
- [ ] 每日任務正常
- [ ] 所有每日上限正常生效

### 第三層：消耗引擎
- [ ] AI 深度解讀 30 Z幣正常扣費
- [ ] 圖片辨識 5 Z幣正常扣費
- [ ] 商城購買流程正常
- [ ] 限定商品倒數計時
- [ ] 送禮 10% 手續費
- [ ] 餘額不足時正確攔截 + 雪凜反應

### 第四層：儲值轉換
- [ ] 4 種方案價格正確
- [ ] LINE Pay 付款流程
- [ ] Newebpay 付款流程
- [ ] 首儲加碼 50%（只限第一次）
- [ ] 首儲限定商品解鎖
- [ ] 儲值成功 Z 幣即時到帳

### 第五層：經濟穩定器
- [ ] 每日經濟健康檢查 Cron Job
- [ ] 通膨告警（消費比例 < 30%）
- [ ] 囤積告警（平均餘額 > 1000）
- [ ] 互刷偵測正常
- [ ] 多帳號偵測正常
- [ ] 帳戶凍結功能正常
- [ ] 回歸禮包正常
- [ ] 後台 /admin/zcoin 儀表板正常
- [ ] 手動調整 + audit log

### 整體
- [ ] 原子操作（扣幣不會超賣）
- [ ] 交易記錄完整（每筆進出都有）
- [ ] 全部交易可匯出 CSV
- [ ] 雪凜在各消費場景的反應正確
