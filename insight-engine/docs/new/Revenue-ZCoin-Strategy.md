# SnowRealm 完整收費 × Z 幣經濟策略

> 版本：v1.0 | 日期：2026-04-01
> 策略：C 端先跑（現在沒用戶），有流量再推 B 端
> 核心原則：不花錢也能玩，花一點點會更好玩

---

## 目錄

1. 總架構：訂閱 × Z 幣 雙軌
2. C 端定價（雪凜 Pro 訂閱）
3. Z 幣經濟循環（5 層系統）
4. 訂閱與 Z 幣的關係
5. B 端定價（Insight Engine SaaS）
6. 一次性終身方案（LTD）
7. 推薦機制
8. 推出時間表
9. 核心資料庫設計
10. 經濟穩定器與後台監控

---

## 一、總架構：訂閱 × Z 幣 雙軌

```
用戶進來
    ↓
[ Free 方案 ]
  ✅ 無限填問卷
  ✅ 每日賺 Z 幣
  ✅ 聊天 20 次/天
  ❌ Premium 功能鎖

    ↓ 需求升起

┌─────────────────────────────────────────┐
│          兩條變現路線（不互斥）           │
│                                         │
│  訂閱（月費/年費）      Z 幣（虛擬貨幣）  │
│  解鎖「上限」          決定「用多少」     │
│  Pro NT$149/月         儲值 NT$30 起     │
│  Pro+ NT$299/月        首儲 +50% bonus   │
│                                         │
│  訂閱後仍然參與 Z 幣   Z 幣可解鎖訂閱    │
│  經濟（月配額提升）    未涵蓋的消耗品    │
└─────────────────────────────────────────┘

    ↓ 高黏著用戶

[ Pro+ / 終身方案 ]
  ✅ 無限 Premium AI
  ✅ 高品質 TTS
  ✅ + 500 Z幣/月配額
```

---

## 二、C 端定價（雪凜 Pro 訂閱）

### 2.1 方案總覽

| 方案 | 月費 | 年費 | 終身 | 說明 |
|------|------|------|------|------|
| **Free** | NT$0 | — | — | 無限期免費 |
| **Pro** | NT$149/月 | NT$1,188/年 | NT$3,980 | 全功能解鎖 |
| **Pro+** | NT$299/月 | NT$2,388/年 | NT$6,980 | Pro + 高級 AI + 優先回覆 |

> 年費 = 8 個月費（省 4 個月），比月付便宜 33%

### 2.2 Free vs Pro 功能對照

| 功能 | Free | Pro | Pro+ |
|------|------|-----|------|
| 填問卷 | ✅ 無限 | ✅ 無限 | ✅ 無限 |
| 問卷結果分析 | 簡版 3 句 | ✅ 完整深度 500 字 | ✅ + 個人化建議 |
| 雪凜 / 凜空聊天 | 20 次/天（Standard） | 50 次/天（混合） | 無限（Premium） |
| Premium AI 模型 | ❌ | 5 次/天 | ✅ 無限 |
| 故事卡片邊框 | 基本 | ✅ 全部 | ✅ 全部 + 動態 |
| 角色服裝 | ❌ | 1 套/月（含 Z幣） | 2 套/月 + 專屬 |
| 稱號 | ❌ | ✅ 部分 | ✅ 全部 |
| 招財配件 | ❌ | ✅ 部分 | ✅ 全部 |
| 週報 AI 摘要 | ❌ | ✅ | ✅ + 趨勢比較 |
| Z 幣月配額 | 每日賺取 | + 200 Z幣/月 | + 500 Z幣/月 |
| 廣告 | 有 | 無廣告 | 無廣告 |
| 聊天歷史保存 | 7 天 | 永久 | 永久 |
| 深度問卷 | ❌ | ✅ | ✅ |
| 語音輸入（STT） | ❌ | ✅ | ✅ |
| 雪凜語音回覆（TTS） | ❌ | ✅ | ✅ 高品質聲優版 |
| 故事牆置頂 | ❌ | ✅ 1 則/月 | ✅ 3 則/月 |
| 優先客服 | ❌ | ❌ | ✅ |

### 2.3 定價心理學

```
Free → Pro 的轉換動力：
  - 聊天次數用完（高頻用戶 3 天就到上限）
  - 看到好的邊框/服裝被鎖住
  - 深夜聊天沒了，恰好是情感依賴時刻
  - Z 幣不夠買限定商品，Pro 月配額幫一把

Pro → Pro+ 的升級動力：
  - Premium AI 明顯比 Standard 聰明
  - 5 次/天不夠用（重度用戶）
  - TTS 語音的情感體驗差異很大

定價錨點：
  月費 NT$149 ≈ 2 杯手搖飲
  年費 NT$1,188 ≈ 每月 99 → 讓人覺得很划算
```

---

## 三、Z 幣經濟循環（5 層系統）

### 3.0 循環總圖

```
                ┌─────────────┐
                │  新使用者進入  │
                └──────┬──────┘
                       ↓
              ┌────────────────┐
              │  註冊送 500 Z幣  │ ← 第一層：免費體驗
              └────────┬───────┘
                       ↓
              ┌────────────────┐
         ┌───→│  花掉一部分     │ ← 第三層：消耗引擎
         │    └────────┬───────┘
         │             ↓
         │    ┌────────────────┐
         │    │  Z 幣不夠了     │
         │    └───┬────────┬───┘
         │        ↓        ↓
         │  ┌─────────┐ ┌─────────┐
         │  │  努力賺   │ │  直接買  │ ← 第四層：儲值轉換
         │  └────┬────┘ └────┬────┘
         │       ↓           ↓
         │  ┌─────────────────────┐
         │  │   Z 幣餘額增加       │ ← 第二層：賺取引擎
         │  └──────────┬──────────┘
         │             ↓
         └─────────────┘（循環）

         ┌─────────────────────────┐
         │  第五層：經濟穩定器       │
         │  防通膨 / 防通縮 / 防刷幣 │（背景運作）
         └─────────────────────────┘
```

### 3.1 第一層：免費體驗（讓人進來）

#### 免費 vs 付費對照

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

#### 註冊禮 500 Z 幣的消費引導

```
新使用者第一筆 Z 幣怎麼花：
  表情包(30) + 深度解讀(30) + 邊框(50) = 110
  剩 390 → 不夠買雪凜服裝(300) + 稱號(120)
  → 只能選一個 → 選完剩不夠
  → 動力開始賺或儲值 ✓
```

### 3.2 第二層：賺取引擎（讓人留下）

#### 每日收入預估

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

#### 賺取規則與上限

| 賺取管道 | 單次 | 每日上限 | 特殊條件 |
|---------|------|---------|---------|
| 每日登入 | +1 | 1 次 | 連續加碼（Day 7 +5, Day 14 +8, Day 30 +10） |
| 填問卷 | +3 | 10 份 | 同份問卷只計一次 |
| 分享結果 | +5 | 5 次 | 同問卷只計一次 |
| 寫故事 | +10 | 3 篇 | AI 審核通過才給 |
| 被按讚 | +1 | 50 次 | 同一對 24 小時只計 1 次 |
| 邀請好友 | +20 | 3 次 | 受邀者必須完成問卷 + 非同裝置 |
| 綁定 LINE | +10 | 一生 1 次 | — |
| 完善個人資料 | +5 | 一生 1 次 | — |
| 每月回饋 | +8 | 每月 1 次 | 30 天冷卻 |
| 每日任務 | +3 | 3 個 | — |
| 成就解鎖 | 10-100 | 不限 | 每個成就只計一次 |
| 回歸禮 | min(天數×5, 100) | — | 超過 7 天沒回來 |
| 首儲加碼 | +50% | 一生 1 次 | — |

#### 回收週期對照

```
每天 18 Z幣能買什麼（積極用戶）：
  30   表情包        → 2 天   ← 入門成就感
  50   邊框          → 3 天
  80   招財配件      → 5 天
  120  稱號          → 7 天   ← 一週目標
  200  雪凜服裝      → 12 天  ← 兩週目標
  300  限定服裝      → 17 天
  500  傳說稱號      → 28 天  ← 一個月目標
```

### 3.3 第三層：消耗引擎（讓人花掉）

#### 十大消費場景

| # | 品類 | 價格（Z幣） | 心理驅動 | 回收天數 |
|---|------|-----------|---------|---------|
| 1 | AI 深度解讀 | 30 | 好奇心 | 2 天 |
| 2 | 圖片辨識 | 5/張 | 即時需求 | 0.3 天 |
| 3 | 表情/貼圖 | 30-150 | 社交貨幣 | 2-9 天 |
| 4 | 故事卡邊框 | 50-200 | 虛榮 + 分享 | 3-12 天 |
| 5 | 專屬稱號 | 80-500 | 身份標識 | 5-28 天 |
| 6 | 角色服裝 | 200-500 | 情感連結 | 12-28 天 |
| 7 | 招財配件 | 80-150 | 收集慾 | 5-9 天 |
| 8 | 問卷解鎖 | 50-100 | 好奇心 | 3-6 天 |
| 9 | 送禮（+10% 手續費） | 10+ | 社交認同 | 1 天 |
| 10 | 限定商品 | 100-500 | FOMO | 6-28 天 |

#### 送禮規則

```
最少送 10 Z幣
手續費 10%（系統收走，當通縮機制）
新帳號 24 小時內不能送禮（防刷幣）
儲值後 24 小時內不能送禮（防洗幣）
```

### 3.4 第四層：儲值轉換（讓人掏錢）

#### 儲值方案

| 方案 | NT$ | Z幣 | 折扣 | 標籤 |
|------|-----|-----|------|------|
| 小包 | 30 | 100 | 原價 | — |
| 中包 | 79 | 300 | 88 折 | ⭐ 熱門 |
| 大包 | 119 | 500 | 79 折 | — |
| 超值包 | 199 | 1000 | 66 折 | 最划算 |

**首次儲值加碼 50%：**
```
NT$30  → 100 + 50 bonus  = 150 Z幣
NT$79  → 300 + 150 bonus = 450 Z幣
NT$199 → 1000 + 500 bonus = 1500 Z幣
```

首儲同時解鎖：
- 🏷️ 「初心者贊助者」稱號
- 🌟 限定招財配件（黃金皇冠）

#### 儲值觸發時機（不強推，只在剛好需要時出現）

```
1. 商城看商品但餘額不夠 →
   雪凜：「差一點點欸，要不要儲個小包？」

2. 限定商品快下架 →
   凜空：「...限定的快沒了」

3. 剛拿到好的問卷結果但 Z 幣不夠看深度解讀 →
   雪凜：「你的結果超特別的，深度解讀要 30 Z幣...你現在只有 {balance}」
```

### 3.5 第五層：經濟穩定器（防止崩潰）

#### 健康指標

```
理想數值：
  消費比例（spendRatio）: 0.6-0.8
  平均每人餘額: < 500 Z幣
  淨增長率: < 5%/週
```

#### 防通膨工具（Z 幣太多時）

| 工具 | 觸發條件 | 說明 |
|------|---------|------|
| 限定商品 | avgBalance > 500 或 spendRatio < 0.4 | 高價限定品吸收大量 Z 幣 |
| 增加消費場景 | spendRatio < 0.3 持續 7 天 | 新增 AI 功能、付費問卷 |
| 微調賺取速率 | 增長率 > 10%/週 持續 3 週 | 最後手段，慎用 |

#### 防刷幣機制

```
偵測信號：
  短時間大量賺取（1 小時 > 30）→ 標記
  互刷按讚（24h > 3 組）→ 凍結
  多帳號同裝置 → 凍結
  儲值後立即送禮（洗幣嫌疑）→ 凍結

防作弊（註冊禮）：
  1. 已領過？拒絕
  2. 手機/LINE 至少驗證一項
  3. 同裝置已有 2 個帳號領過？拒絕
  4. 新帳號 24 小時不能送禮
```

---

## 四、訂閱與 Z 幣的關係

```
訂閱解鎖「上限」，Z 幣決定「用多少」：

Free：
  - 每日賺 Z 幣（9-53 Z幣/天）
  - 聊天 20 次/天
  - 商城可買基本消耗品

Pro（NT$149/月）：
  - + 200 Z幣/月配額（不用賺就有）
  - 聊天提升到 50 次/天
  - 解鎖更多商城品類
  - Pro 首儲加碼 70%（一般 +50%）
  - 商城 Pro 限定商品可購買

Pro+（NT$299/月）：
  - + 500 Z幣/月配額
  - 聊天無限（Premium AI）
  - 全商城解鎖
  - 優先客服

重要：Pro 訂閱者仍然參與 Z 幣經濟
  → Z 幣來源更多（月配額）
  → 商城有更多選項
  → Z 幣儲值 bonus 更高
  → 不是「買了 Pro 就不用 Z 幣」
```

### 訂閱 vs Z 幣的變現路線比較

```
訂閱（穩定收入）：
  NT$149/月 × 1,000 人 = NT$149,000/月
  適合：重度用戶、長期使用

Z 幣儲值（衝動購買）：
  平均 NT$99/次 × 300 次/月 = NT$29,700/月
  適合：輕度用戶、一次性需求

兩者不互斥，重度用戶兩個都買。
目標比例：訂閱 70% / 儲值 30%
```

---

## 五、B 端定價（Insight Engine SaaS）

> B 端等 C 端有流量/口碑後再主推，初期先有 Waitlist

### 5.1 方案總覽

| 方案 | 月費 | 年費 | 說明 |
|------|------|------|------|
| **Starter** | NT$490/月 | NT$3,920/年 | 小型組織，基本功能 |
| **Pro** | NT$1,490/月 | NT$11,920/年 | 中型組織，AI 全開 |
| **Scale** | NT$3,990/月 | NT$31,920/年 | 多租戶，優先支援 |
| **Enterprise** | 洽談 | — | 白標 + 客製化 |

> 年費 = 8 個月費（省 4 個月）

### 5.2 功能對照

| 功能 | Starter | Pro | Scale | Enterprise |
|------|---------|-----|-------|------------|
| 問卷數量 | 5 份 | 20 份 | 無限 | 無限 |
| 月回覆上限 | 500 筆 | 5,000 筆 | 無限 | 無限 |
| 管理員帳號 | 2 個 | 10 個 | 無限 | 無限 |
| AI 出題 | 10 次/月 | 50 次/月 | 200 次/月 | 無限 |
| AI 洞察報告 | 3 份/月 | 20 份/月 | 無限 | 無限 |
| LINE 整合 | ✅ 基本 | ✅ 完整 | ✅ 完整 | ✅ + 白標 |
| 故事牆 | ❌ | ✅ | ✅ | ✅ |
| 客服系統 | ❌ | ✅ | ✅ | ✅ |
| 自訂網域 | ❌ | ❌ | ✅ | ✅ |
| API 存取 | ❌ | ✅ 限速 | ✅ 完整 | ✅ + SLA |
| 問卷模板 | 平台模板 | + 自訂 | + 市集販售 | 全部 |
| 支援 | 社群 | Email | 優先 Email | 專屬 AM |

### 5.3 B 端推出時機

```
C 端用戶 < 1,000：先別推 B 端，專注產品力
C 端用戶 1,000-5,000：開放 Waitlist，邀請制
C 端用戶 5,000+：正式推出 B 端，用 C 端案例背書
```

---

## 六、一次性終身方案（LTD）

### 6.1 C 端終身策略

```
限量策略（不是永久開放）：
  - 第一批：500 名創辦人特別席
  - 售完就結束，不再補充
  - 目的：早期現金流 + 核心用戶培育
```

| LTD 方案 | 價格 | 相當於 | 備註 |
|---------|------|------|------|
| Pro 終身 | NT$3,980 | ~26 個月月費 | 限前 500 名 |
| Pro+ 終身 | NT$6,980 | ~23 個月月費 | 限前 200 名 |

**損益平衡：**
```
Pro 月費 NT$149：
  LTD NT$3,980 ÷ NT$149 = 26.7 個月 ≈ 2.2 年回本

Pro+ 月費 NT$299：
  LTD NT$6,980 ÷ NT$299 = 23.3 個月 ≈ 1.9 年回本
```

### 6.2 B 端終身（不建議）

B 端客戶服務成本高，不適合 LTD。
替代方案：**預付年費 9 折**（吸引長期客戶）。

---

## 七、推薦機制

```
推薦計畫：
  - 你推薦朋友加入 → 雙方各得 100 Z 幣
  - 朋友升級 Pro → 你再得 200 Z 幣
  - 推薦 5 人升級 → 你獲得一個月 Pro 免費
  - 推薦 20 人升級 → 終身 Pro

Pro 用戶推薦碼顯示在帳號頁面，方便分享。
```

---

## 八、推出時間表

```
現在（無用戶期）：
  ✅ 後台定價頁面建好（/pricing）
  ✅ Free 方案完整可用
  ⏳ Pro/Pro+ 方案顯示「即將推出」+ Waitlist

有 100 用戶後：
  - 開放 LTD 創辦人席（限 500/200 名）
  - 推廣碼系統上線
  - Stripe / 藍新金流整合
  - Z 幣儲值功能上線

有 1,000 用戶後：
  - 正式月費/年費開放
  - B 端 Waitlist 開放
  - 企業方案洽談頁面

有 5,000 用戶後：
  - B 端正式推出
  - LTD 結束（限量已售完或時間到期）
```

---

## 九、核心資料庫設計

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
  --       earn_comeback, gift_received, pro_monthly_quota
  -- 消費：spend_ai_analysis, spend_image_recognition,
  --       spend_emoji, spend_frame, spend_title,
  --       spend_costume, spend_zaicai_item, spend_survey_unlock,
  --       spend_gift, spend_theme, spend_limited
  -- 系統：gift_fee, system_adjust
  amount INTEGER NOT NULL,  -- 正數 = 收入，負數 = 支出
  balance_after INTEGER NOT NULL,
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zcoin_tx_user ON zcoin_transactions(user_id, created_at DESC);
CREATE INDEX idx_zcoin_tx_type ON zcoin_transactions(type, created_at DESC);

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
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN DEFAULT TRUE,
  is_limited BOOLEAN DEFAULT FALSE,
  available_until TIMESTAMPTZ,
  stock_limit INTEGER,  -- NULL = 無限
  stock_remaining INTEGER,
  pro_only BOOLEAN DEFAULT FALSE,  -- Pro 訂閱才能購買
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 使用者擁有的商品 =====
CREATE TABLE zcoin_user_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  item_id UUID NOT NULL REFERENCES zcoin_shop_items,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
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

-- ===== 儲值訂單 =====
CREATE TABLE payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  order_number TEXT UNIQUE NOT NULL,
  plan_id TEXT NOT NULL,         -- 'zcoin_100' | 'zcoin_300' | 'sub_pro' | 'sub_pro_plus'
  plan_type TEXT NOT NULL,       -- 'zcoin' | 'subscription' | 'ltd'
  zcoin_amount INTEGER,          -- Z 幣儲值才有
  price_ntd INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('line_pay', 'newebpay', 'stripe')),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'failed', 'cancelled', 'refunded'
  )),
  payment_response JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 訂閱狀態 =====
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'pro_plus', 'ltd_pro', 'ltd_pro_plus')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'cancelled', 'expired', 'paused'
  )),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  monthly_zcoin_quota INTEGER NOT NULL DEFAULT 0,  -- 0 / 200 / 500
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 經濟日報 =====
CREATE TABLE zcoin_daily_stats (
  date DATE PRIMARY KEY,
  total_supply INTEGER NOT NULL,
  daily_earned INTEGER NOT NULL,
  daily_spent INTEGER NOT NULL,
  net_growth INTEGER NOT NULL,
  avg_balance FLOAT NOT NULL,
  active_users INTEGER NOT NULL,
  spend_ratio FLOAT NOT NULL,   -- 理想 0.6-0.8
  topup_revenue_ntd INTEGER DEFAULT 0,
  subscription_revenue_ntd INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 帳戶使用限制（防刷幣） =====
CREATE TABLE user_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  restriction_type TEXT NOT NULL,
  -- no_gift_24h, no_topup_24h, earn_suspended
  expires_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 原子操作：加 Z 幣 =====
CREATE OR REPLACE FUNCTION add_zcoin(p_user_id UUID, p_amount INTEGER)
RETURNS TABLE(balance INTEGER) AS $$
BEGIN
  INSERT INTO zcoin_accounts(user_id, balance, total_earned)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = zcoin_accounts.balance + p_amount,
      total_earned = zcoin_accounts.total_earned + p_amount,
      updated_at = NOW();

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

## 十、經濟穩定器與後台監控

### 後台監控儀表板 `/admin/zcoin`

```
┌─ 經濟健康總覽 ──────────────────────────────────┐
│                                                  │
│  全平台 Z 幣總量        今日產出 / 消耗            │
│  2,450,000             +12,300 / -8,700          │
│                                                  │
│  淨增長率               消費比例                   │
│  +3,600 (⚠️)           70.7% (✅)                │
│                                                  │
│  平均每人餘額            訂閱收入（本月）            │
│  245 Z幣               NT$89,200                 │
│                                                  │
│  Z 幣儲值收入           儲值轉換率                  │
│  NT$29,700             3.2%                      │
│                                                  │
└──────────────────────────────────────────────────┘

┌─ 趨勢圖（30 天）────────────────────────────────┐
│  [每日總量] [產出/消耗] [平均餘額] [儲值/訂閱營收]  │
│  📈 折線圖                                        │
└──────────────────────────────────────────────────┘

┌─ 各管道佔比 ────────────────────────────────────┐
│  賺取管道佔比（餅圖）    消費管道佔比（餅圖）       │
│  ● 按讚 34%             ● AI 解讀 28%             │
│  ● 問卷 22%             ● 表情 18%                │
│  ● 分享 18%             ● 送禮 15%                │
│  ● 故事 12%             ● 邊框 12%                │
│  ● 登入 8%              ● 其他 27%                │
│  ● 其他 6%                                       │
└──────────────────────────────────────────────────┘

┌─ 異常偵測 ──────────────────────────────────────┐
│  🔴 user_xyz 1 小時賺取 45 Z幣（疑似刷幣）       │
│  🔴 3 組帳號互刷按讚嫌疑                          │
│  🟡 消費比例連續 3 天低於 40%                      │
└──────────────────────────────────────────────────┘
```

### 健康指標告警規則

| 指標 | 正常 | 警告 | 危險 |
|------|------|------|------|
| 消費比例 | 0.6-0.8 | < 0.4 | < 0.3 |
| 平均餘額 | < 300 | > 500 | > 1,000 |
| 週增長率 | < 3% | > 7% | > 10% |
| 訂閱取消率 | < 5% | > 8% | > 12% |

---

> 此文件由 `Pricing-Plan.md` 和 `ZCoin-Circulation-Spec.md` 合併整理。
> 詳細代碼實作請見 `ZCoin-Circulation-Spec.md`。
