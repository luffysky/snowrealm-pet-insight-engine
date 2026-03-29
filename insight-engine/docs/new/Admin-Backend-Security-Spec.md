# SnowRealm Insight — 總後台架構 & 安全防護規格書

> 最高權限管理系統 · 全數據監控 · 反詐騙防線
> 版本：v1.0 | 日期：2026-03-30
> 原則：看到一切、管到一切、但有紀錄有權限有底線

---

## 目錄

1. 權限系統（RBAC）
2. 後台總覽儀表板
3. 使用者管理
4. 全數據監控中心
5. 內容審核系統
6. 問卷管理
7. Z 幣經濟監控
8. AI 成本監控
9. 金流訂單管理
10. 系統健康監控
11. 反詐騙 & 安全防線
12. 資料庫設計
13. 後台 UI 架構
14. 驗收清單

---

## 一、權限系統（RBAC）

### 1.1 角色定義

```typescript
type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'analyst' | 'support';

const ROLES = {
  super_admin: {
    name: '超級管理員',
    description: '你（Luffysky），擁有一切權限',
    permissions: ['*'],  // 所有權限
    maxCount: 1,         // 只能有一個
  },
  admin: {
    name: '管理員',
    description: '合夥人或核心團隊，幾乎所有權限',
    permissions: [
      'users.*', 'content.*', 'surveys.*', 'zcoin.*',
      'orders.*', 'analytics.*', 'ai_cost.view',
      // 不能：刪除管理員、修改系統設定、查看原始密鑰
    ],
    maxCount: 3,
  },
  moderator: {
    name: '內容審核員',
    description: '負責審核故事、留言、檢舉',
    permissions: [
      'content.view', 'content.moderate', 'content.delete',
      'users.view', 'users.warn', 'users.mute',
      'reports.view', 'reports.resolve',
    ],
    maxCount: 5,
  },
  analyst: {
    name: '數據分析師',
    description: '只能看數據，不能改任何東西',
    permissions: [
      'analytics.*', 'ai_cost.view', 'zcoin.view',
      'users.view_stats', 'surveys.view_stats',
    ],
    maxCount: 3,
  },
  support: {
    name: '客服人員',
    description: '處理使用者問題，有限的查看權限',
    permissions: [
      'users.view', 'users.view_details', 'users.reset_password',
      'orders.view', 'orders.refund',
      'zcoin.view', 'zcoin.adjust',
      'reports.view', 'reports.resolve',
    ],
    maxCount: 5,
  },
};
```

### 1.2 權限檢查中間件

```typescript
// middleware/adminAuth.ts
import { createClient } from '@/lib/supabase/server';

type Permission = string;

export async function checkAdminPermission(
  requiredPermission: Permission
): Promise<{ allowed: boolean; admin: AdminUser | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { allowed: false, admin: null };

  const { data: admin } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!admin) return { allowed: false, admin: null };

  // super_admin 有所有權限
  if (admin.role === 'super_admin') return { allowed: true, admin };

  // 檢查具體權限
  const rolePerms = ROLES[admin.role].permissions;
  const hasPermission = rolePerms.some(p =>
    p === '*' ||
    p === requiredPermission ||
    (p.endsWith('.*') && requiredPermission.startsWith(p.replace('.*', '')))
  );

  return { allowed: hasPermission, admin };
}

// API Route 用法：
export async function GET(req: Request) {
  const { allowed, admin } = await checkAdminPermission('users.view');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // 記錄操作日誌
  await logAdminAction(admin!.id, 'users.view', { ip: getIP(req) });

  // ... 執行操作
}
```

### 1.3 操作日誌（所有後台操作必留紀錄）

```typescript
async function logAdminAction(
  adminId: string,
  action: string,
  details: Record<string, any>
) {
  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    details,
    ip_address: details.ip,
    user_agent: details.userAgent,
    created_at: new Date().toISOString(),
  });
}

// 敏感操作額外通知
const SENSITIVE_ACTIONS = [
  'users.ban', 'users.delete', 'zcoin.adjust',
  'orders.refund', 'system.config_change', 'admin.role_change',
];

// 敏感操作會即時通知到你的 LINE
if (SENSITIVE_ACTIONS.includes(action)) {
  await sendLINENotify(`⚠️ 後台敏感操作\n${admin.name} 執行了 ${action}\n${JSON.stringify(details)}`);
}
```

---

## 二、後台總覽儀表板

### 2.1 首頁 Dashboard

```
/admin

┌─ 即時數據（自動更新）──────────────────────┐
│  [今日 DAU]  [在線人數]  [新註冊]  [營收]   │
│   1,247       89         43       NT$2,180 │
└────────────────────────────────────────────┘

┌─ 警報中心 ─────────────────────────────────┐
│  🔴 3 則待處理檢舉                           │
│  🟡 AI 成本已達月預算 72%                     │
│  🟡 2 筆退款申請待處理                        │
│  🟢 系統正常運行中                            │
└────────────────────────────────────────────┘

┌─ 趨勢圖 ───────────────────────────────────┐
│  [DAU 7日] [營收 7日] [問卷完成 7日]          │
│  📈 折線圖                                   │
└────────────────────────────────────────────┘

┌─ 最近活動流 ───────────────────────────────┐
│  09:32 小美 完成了「寵物默契測驗」             │
│  09:31 JK大叔 儲值了 300 Z幣                 │
│  09:28 系統 封鎖了帳號 user_xxx（自動偵測）    │
│  09:25 新用戶 花花 完成註冊                   │
│  ...                                       │
└────────────────────────────────────────────┘
```

---

## 三、使用者管理

### 3.1 使用者列表

```
/admin/users

功能：
- 搜尋（暱稱、Email、LINE ID、手機、IP）
- 篩選（角色、狀態、註冊時間、活躍度）
- 排序（註冊時間、最後活躍、Z幣餘額、問卷數）
- 批量操作（封鎖、解封、發送通知）

列表欄位：
| 頭像 | 暱稱 | Email | 狀態 | 註冊日 | 最後活躍 | 問卷數 | Z幣 | 操作 |
```

### 3.2 使用者詳情頁

```
/admin/users/[userId]

┌─ 基本資料 ──────────────────────┐
│  頭像 · 暱稱 · Email · 手機     │
│  LINE ID · 註冊日 · IP 記錄      │
│  裝置指紋 · 瀏覽器 · 作業系統    │
│  狀態：✅ 正常 / 🚫 封鎖 / ⚠️ 觀察│
└─────────────────────────────────┘

┌─ 帳號操作 ──────────────────────┐
│  [封鎖帳號] [解封] [重置密碼]    │
│  [發送警告] [禁言N天] [刪除帳號] │
│  [調整Z幣] [強制登出]            │
└─────────────────────────────────┘

┌─ 活動時間線（所有動作）──────────┐
│  所有操作按時間排列：             │
│  登入/登出、填問卷、發故事、      │
│  留言、按讚、花Z幣、儲值、       │
│  分享、上傳檔案、修改資料...      │
└─────────────────────────────────┘

┌─ 數據分頁 ──────────────────────┐
│  [問卷記錄] [故事/留言] [Z幣明細] │
│  [金流記錄] [登入歷史] [檢舉記錄] │
│  [AI對話] [上傳檔案] [裝置列表]  │
└─────────────────────────────────┘
```

### 3.3 使用者封鎖流程

```typescript
async function banUser(adminId: string, userId: string, reason: string, duration?: number) {
  const supabase = await createClient();

  // 1. 更新使用者狀態
  await supabase.from('user_profiles').update({
    status: 'banned',
    banned_at: new Date().toISOString(),
    banned_reason: reason,
    banned_until: duration
      ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
      : null, // null = 永久封鎖
    banned_by: adminId,
  }).eq('user_id', userId);

  // 2. 強制登出（撤銷所有 session）
  await supabase.auth.admin.signOut(userId, 'global');

  // 3. 如果是儲值詐騙，凍結 Z 幣
  if (reason.includes('fraud') || reason.includes('詐騙')) {
    await supabase.from('zcoin_accounts').update({
      is_frozen: true,
    }).eq('user_id', userId);
  }

  // 4. 記錄日誌
  await logAdminAction(adminId, 'users.ban', {
    targetUserId: userId, reason, duration,
  });

  // 5. 通知使用者（如果有 LINE）
  await sendUserNotification(userId, `您的帳號已被暫停使用。原因：${reason}`);
}
```

---

## 四、全數據監控中心

### 4.1 即時活動流（Live Feed）

```
/admin/live-feed

所有使用者的所有動作即時串流：

[09:32:15] 小美 (user_abc) 發了一則故事「我家橘貓...」
[09:32:08] JK大叔 (user_def) 上傳了 1 張照片 (photo_123.jpg) [預覽]
[09:31:55] 花花 (user_ghi) 完成了問卷「寵物默契測驗」
[09:31:42] 阿明 (user_jkl) 在故事#456 留言「好可愛！」
[09:31:30] user_xyz 連續建立 5 個帳號 ⚠️ [自動標記]
[09:31:20] 小美 (user_abc) 儲值 300 Z幣 via LINE Pay

篩選：
  [全部] [故事] [留言] [問卷] [Z幣] [金流] [登入] [上傳] [⚠️警報]

技術實現：
  - 所有使用者動作寫入 activity_log 表
  - 後台用 Supabase Realtime 訂閱即時推送
  - 或用 Server-Sent Events 串流
```

### 4.2 活動記錄表設計

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  action TEXT NOT NULL,
  -- 動作類型：
  -- auth.login, auth.logout, auth.register
  -- survey.start, survey.complete, survey.share
  -- story.create, story.edit, story.delete
  -- comment.create, comment.delete
  -- reaction.add, reaction.remove
  -- zcoin.earn, zcoin.spend, zcoin.topup
  -- file.upload, file.delete
  -- profile.update, profile.avatar_change
  -- chat.message_send (雪凜對話)
  -- report.submit (檢舉)
  -- admin.action (後台操作)
  category TEXT NOT NULL,
  -- auth, survey, story, comment, reaction, zcoin, file, profile, chat, report
  details JSONB DEFAULT '{}',
  -- 彈性欄位，存各種附加資料
  -- 例：{ "storyId": "xxx", "content": "前50字...", "photoUrl": "..." }
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_activity_user ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_action ON activity_log(action, created_at DESC);
CREATE INDEX idx_activity_category ON activity_log(category, created_at DESC);
CREATE INDEX idx_activity_time ON activity_log(created_at DESC);
CREATE INDEX idx_activity_ip ON activity_log(ip_address);

-- Supabase Realtime 訂閱（後台即時推送用）
ALTER TABLE activity_log REPLICA IDENTITY FULL;
```

### 4.3 使用者檔案管理

```
/admin/files

所有使用者上傳的檔案集中管理：

| 預覽 | 檔名 | 類型 | 大小 | 上傳者 | 時間 | 狀態 | 操作 |
| 🖼️  | cat.jpg | image | 2.1MB | 小美 | 09:32 | ✅ | [刪除][封鎖] |

篩選：
  [全部] [圖片] [影片] [文件]
  [待審核] [已審核] [已標記]

AI 自動審核：
  - 上傳時自動掃描（見第十一章反詐騙）
  - 不當內容自動標記 ⚠️ 並進入人工審核佇列
```

### 4.4 對話紀錄監控

```
/admin/conversations

所有雪凜 AI 對話紀錄：

| 使用者 | 意圖 | 輪數 | LLM | 時間 | 操作 |
| 小美 | chitchat | 8 | GPT-mini | 09:30 | [查看] |

點「查看」可以看到完整對話內容：
  使用者：嗨嗨
  雪凜：嗨嗨！今天想做什麼呀？
  使用者：Z幣怎麼賺
  雪凜：分享問卷就能賺5Z幣喔...

用途：
  - 監控使用者是否試圖讓雪凜說不該說的話
  - 收集 bad case 改善 AI 品質
  - 客訴時查看對話記錄
```

### 4.5 私訊 / 社群訊息監控

```
/admin/messages

如果未來有使用者間私訊功能：

| 發送者 | 接收者 | 內容預覽 | 時間 | 標記 |
| 阿明 | 小美 | 「你好我是...」 | 09:35 | ⚠️ 疑似詐騙 |

AI 自動掃描關鍵字：
  - 詐騙：「加LINE」「私下交易」「投資」「報酬」
  - 騷擾：髒話、性暗示、威脅
  - 自動標記 → 進入人工審核佇列
```

---

## 五、內容審核系統

### 5.1 審核佇列

```
/admin/moderation

三個佇列：
  [待審核] — AI 自動標記的內容
  [檢舉]   — 使用者主動檢舉的內容
  [已處理] — 已審核完的歷史記錄

每則審核項目：
┌──────────────────────────────────┐
│  ⚠️ AI 標記：疑似垃圾內容         │
│  類型：故事                        │
│  作者：user_xyz                    │
│  內容：「加我LINE可以免費...」      │
│  時間：2026-03-30 09:35           │
│  AI 信心度：87%                    │
│                                   │
│  [✅ 通過] [❌ 刪除] [⚠️ 警告使用者] │
│  [🚫 封鎖帳號] [👀 加入觀察名單]    │
└──────────────────────────────────┘
```

### 5.2 AI 自動審核

```typescript
// lib/moderation/contentFilter.ts

interface ModerationResult {
  safe: boolean;
  categories: {
    spam: number;       // 垃圾廣告 (0-1)
    fraud: number;      // 詐騙 (0-1)
    sexual: number;     // 色情 (0-1)
    violence: number;   // 暴力 (0-1)
    harassment: number; // 騷擾 (0-1)
    selfHarm: number;   // 自殘 (0-1)
  };
  flaggedKeywords: string[];
  action: 'pass' | 'flag' | 'block';
}

async function moderateContent(content: string, type: 'story' | 'comment' | 'message'): Promise<ModerationResult> {
  // 第一層：關鍵字快速篩選（不花 token）
  const keywordResult = keywordFilter(content);
  if (keywordResult.action === 'block') return keywordResult;

  // 第二層：LLM 語意分析（花少量 token）
  const llmResult = await callGPT({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: `你是內容審核系統。分析以下文字是否包含：
        1. spam（垃圾廣告、行銷訊息）
        2. fraud（詐騙、誘導私下交易）
        3. sexual（色情、性暗示）
        4. violence（暴力、威脅）
        5. harassment（霸凌、騷擾）
        6. selfHarm（自殘暗示）
        回覆 JSON：{ categories: { spam:0-1, fraud:0-1, ... }, action: "pass"|"flag"|"block" }`
    }, {
      role: 'user',
      content: `[${type}] ${content}`
    }],
    max_tokens: 100,
  });

  return JSON.parse(llmResult);
}

// 關鍵字黑名單
const KEYWORD_BLACKLIST = {
  fraud: ['加我LINE', '私下交易', '投資報酬', '保證獲利', '被動收入', '賺錢機會', '轉帳', '匯款'],
  spam: ['免費領取', '限時優惠', '點擊連結', '立即註冊', '推廣碼'],
  sexual: [/* 敏感詞列表 */],
  contact: ['我的LINE是', '加我IG', '私訊我', '微信', 'Telegram'],
};
```

### 5.3 圖片/影片審核

```typescript
// 圖片上傳時自動掃描

async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  // 方案 A：用 OpenAI Vision API
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: '這張圖片是否包含：色情、暴力、血腥、令人不適的內容？回覆 JSON：{ safe: true/false, reason: "" }' },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    }],
    max_tokens: 50,
  });

  return JSON.parse(response.choices[0].message.content!);

  // 方案 B：用 Azure Content Safety API（更便宜、更快）
  // 方案 C：用 AWS Rekognition
}
```

### 5.4 檢舉系統

```sql
CREATE TABLE user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'story', 'comment', 'message')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'spam', 'fraud', 'harassment', 'sexual', 'violence',
    'self_harm', 'misinformation', 'other'
  )),
  description TEXT,
  evidence_urls TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES admin_users(id),
  resolved_action TEXT,  -- 'warned', 'content_removed', 'user_banned', 'dismissed'
  resolved_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

---

## 六、問卷管理

```
/admin/surveys

| 問卷名稱 | 狀態 | 填答數 | 完成率 | 分享數 | 建立日 | 操作 |
| 寵物默契測驗 | ✅ 上架 | 2,847 | 76% | 456 | 03/15 | [編輯][下架][數據] |

操作：
  - 建立新問卷 / 編輯 / 複製
  - 上架 / 下架 / 排程上架
  - 查看問卷數據（填答分佈、漏斗分析）
  - 匯出原始數據（CSV）
  - 設定是否需要 Z 幣解鎖
```

---

## 七、Z 幣經濟監控

```
/admin/zcoin

┌─ 經濟健康指標 ────────────────────┐
│  全平台 Z 幣總量：2,450,000       │
│  今日產出：+12,300 / 消耗：-8,700 │
│  淨增長率：+3,600（注意通膨⚠️）    │
│  平均每人餘額：245 Z幣             │
└──────────────────────────────────┘

┌─ 異常偵測 ────────────────────────┐
│  🔴 user_xyz 今日賺取 108 Z幣（接近上限）│
│  🟡 3 組帳號互刷按讚嫌疑           │
│  🟡 user_abc Z 幣餘額 15,000（異常高）│
└──────────────────────────────────┘

功能：
  - 手動調整使用者 Z 幣（附原因記錄）
  - 凍結可疑帳戶 Z 幣
  - 查看全平台交易流水
  - Z 幣產出/消耗趨勢圖
  - 各管道產出佔比
```

---

## 八、AI 成本監控

```
/admin/ai-cost
（已在 AI-Cost-Control-Spec.md 詳細定義）

顯示：
  - 本月累計成本 + 預算進度條
  - 各模型成本佔比（GPT-mini vs Claude vs TTS）
  - 各意圖成本佔比
  - 日成本趨勢
  - 預算告警狀態
  - 最貴的 Top 10 對話（debug）
```

---

## 九、金流訂單管理

```
/admin/orders

| 訂單號 | 使用者 | 金額 | Z幣 | 付款方式 | 狀態 | 時間 | 操作 |
| ZCOIN_xxx | 小美 | NT$79 | 300 | LINE Pay | ✅ | 09:31 | [詳情][退款] |

功能：
  - 搜尋（訂單號、使用者、金額）
  - 篩選（付款方式、狀態、日期）
  - 手動退款（需要輸入原因，通知 super_admin）
  - 匯出對帳單（CSV）
  - 每日自動核對（DB 金額 vs 金流商回報金額）
```

---

## 十、系統健康監控

```
/admin/system

┌─ 服務狀態 ─────────────────────┐
│  🟢 Web Server (Zeabur)        │
│  🟢 Supabase Database          │
│  🟢 Supabase Auth              │
│  🟢 Supabase Storage           │
│  🟢 OpenAI API                 │
│  🟢 Anthropic API              │
│  🟢 Azure Speech               │
│  🟢 LINE Pay                   │
│  🟢 Newebpay                   │
│  🟢 Cloudflare CDN             │
└────────────────────────────────┘

┌─ 效能指標 ─────────────────────┐
│  API 平均回應時間：120ms        │
│  錯誤率：0.02%                  │
│  DB 連線數：23/100              │
│  Storage 用量：2.3GB/10GB       │
└────────────────────────────────┘

健康檢查：
  - 每 5 分鐘 ping 所有外部服務
  - 任何服務掛掉 → LINE Notify 即時通知你
  - 錯誤率 > 1% → 自動告警
```

### 10.1 健康檢查實作

```typescript
// app/api/admin/health/route.ts

const SERVICES = [
  {
    name: 'Supabase DB',
    check: async () => {
      const { error } = await supabase.from('health_check').select('id').limit(1);
      return !error;
    },
  },
  {
    name: 'OpenAI API',
    check: async () => {
      try {
        await openai.models.list();
        return true;
      } catch { return false; }
    },
  },
  {
    name: 'Anthropic API',
    check: async () => {
      try {
        await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        });
        return true;
      } catch { return false; }
    },
  },
  {
    name: 'Azure Speech',
    check: async () => {
      // 簡單的 token 請求測試
      try {
        const res = await fetch(
          `https://${process.env.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
          { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY! } }
        );
        return res.ok;
      } catch { return false; }
    },
  },
  // LINE Pay, Newebpay, Stripe 等...
];

export async function GET() {
  const results = await Promise.all(
    SERVICES.map(async (svc) => ({
      name: svc.name,
      status: await svc.check() ? 'ok' : 'error',
      checkedAt: new Date().toISOString(),
    }))
  );

  const allOk = results.every(r => r.status === 'ok');
  if (!allOk) {
    const failed = results.filter(r => r.status === 'error').map(r => r.name);
    await sendLINENotify(`🚨 服務異常！\n${failed.join(', ')}`);
  }

  return Response.json({ status: allOk ? 'healthy' : 'degraded', services: results });
}
```

---

## 十一、反詐騙 & 安全防線

### 11.1 五道防線

```
第一道：註冊防線（擋機器人）
第二道：行為偵測（擋羊毛黨）
第三道：內容過濾（擋詐騙內容）
第四道：金流防線（擋洗錢/盜刷）
第五道：資料保護（擋數據外洩）
```

### 11.2 第一道：註冊防線

```typescript
// 註冊時的防線

const REGISTRATION_RULES = {
  // 1. 驗證碼（必須）
  captcha: true,  // hCaptcha 或 Turnstile（Cloudflare 免費）

  // 2. 手機或 LINE 驗證（至少一項）
  requireVerification: true,

  // 3. 同 IP 註冊限制
  maxRegistrationsPerIP: {
    perHour: 3,
    perDay: 5,
  },

  // 4. 同裝置指紋限制
  maxRegistrationsPerDevice: {
    perDay: 2,
  },

  // 5. 一次性信箱封鎖
  blockedEmailDomains: [
    'guerrillamail.com', 'tempmail.com', 'throwaway.email',
    'yopmail.com', 'mailinator.com', // ...更多
  ],

  // 6. VPN/Proxy 偵測
  blockVPN: false,  // 不完全封鎖，但標記風險
  flagVPN: true,    // 標記為高風險帳號

  // 7. 註冊後冷卻期
  cooldownBeforeActions: {
    sendMessage: 24 * 60 * 60,     // 24 小時後才能發私訊
    postStory: 1 * 60 * 60,        // 1 小時後才能發故事
    transferZcoin: 24 * 60 * 60,   // 24 小時後才能送禮
  },
};
```

### 11.3 第二道：行為偵測

```typescript
// lib/security/behaviorDetector.ts

interface RiskSignal {
  type: string;
  score: number;     // 0-100，越高越可疑
  details: string;
}

async function detectAbnormalBehavior(userId: string): Promise<RiskSignal[]> {
  const signals: RiskSignal[] = [];

  // 1. 批量操作偵測
  const recentActions = await getRecentActions(userId, '1 hour');
  if (recentActions.filter(a => a.action === 'reaction.add').length > 30) {
    signals.push({ type: 'mass_liking', score: 80, details: '1小時內按讚超過30次' });
  }

  // 2. 互刷偵測
  const mutualLikes = await getMutualLikes(userId, '24 hours');
  if (mutualLikes.length > 3) {
    signals.push({ type: 'mutual_farming', score: 70, details: `與 ${mutualLikes.length} 個帳號互刷` });
  }

  // 3. 多帳號偵測（同 IP 或同裝置指紋）
  const sameDeviceAccounts = await getSameDeviceAccounts(userId);
  if (sameDeviceAccounts.length > 1) {
    signals.push({ type: 'multi_account', score: 90, details: `同裝置 ${sameDeviceAccounts.length} 個帳號` });
  }

  // 4. 異常登入（突然從不同國家登入）
  const loginLocations = await getRecentLoginLocations(userId);
  if (hasGeoAnomaly(loginLocations)) {
    signals.push({ type: 'geo_anomaly', score: 60, details: '登入地點異常' });
  }

  // 5. Z 幣異常（短時間大量賺取或花費）
  const zcoinActivity = await getZcoinActivity(userId, '24 hours');
  if (zcoinActivity.earned > 80) {
    signals.push({ type: 'zcoin_farming', score: 75, details: `24小時賺取 ${zcoinActivity.earned} Z幣` });
  }

  // 總分超過 150 → 自動封鎖
  const totalScore = signals.reduce((sum, s) => sum + s.score, 0);
  if (totalScore >= 150) {
    await autoBanUser(userId, signals);
  } else if (totalScore >= 80) {
    // 加入觀察名單
    await addToWatchlist(userId, signals);
  }

  return signals;
}

// 定時跑（每小時掃描所有活躍使用者）
// 或即時觸發（每次使用者動作後計算）
```

### 11.4 第三道：內容過濾

（見第五章內容審核系統）

### 11.5 第四道：金流防線

```typescript
const PAYMENT_SECURITY = {
  // 1. 同帳號儲值頻率限制
  maxTopupsPerDay: 5,
  maxTopupsPerMonth: 20,

  // 2. 單日儲值金額上限
  maxDailyTopup: 5000,  // NT$

  // 3. 新帳號冷卻期
  newAccountTopupDelay: 24 * 60 * 60, // 註冊 24 小時後才能儲值

  // 4. 異常金額告警
  alertThreshold: 2000, // 單筆超過 NT$2000 通知管理員

  // 5. 退款異常偵測
  maxRefundsPerMonth: 3, // 超過 3 次退款 → 標記帳號

  // 6. 儲值後立即送禮偵測（洗錢嫌疑）
  giftCooldownAfterTopup: 24 * 60 * 60, // 儲值後 24 小時不能送禮
};
```

### 11.6 第五道：資料保護

```typescript
// 1. 資料加密
const DATA_PROTECTION = {
  // 傳輸加密：全站 HTTPS（Cloudflare 已有）
  transportEncryption: 'TLS 1.3',

  // 靜態加密：Supabase 預設加密
  atRestEncryption: 'AES-256',

  // 敏感欄位額外加密
  encryptedFields: ['phone_number', 'id_card_number'],

  // 個資存取紀錄
  piiAccessLog: true,  // 任何人查看個資都記錄
};

// 2. API 安全
const API_SECURITY = {
  // Rate Limiting
  rateLimit: {
    anonymous: '30/min',
    authenticated: '100/min',
    admin: '300/min',
  },

  // CORS
  allowedOrigins: [
    'https://insight.snowrealm.pet',
    'https://admin.snowrealm.pet',
  ],

  // API Key 管理
  rotateKeysEvery: '90 days',

  // SQL Injection 防護：Supabase 用 parameterized queries（預設安全）

  // XSS 防護：Next.js 預設 escape（安全），但 UGC 內容要額外 sanitize
  sanitizeUGC: true,
};

// 3. 後台存取安全
const ADMIN_SECURITY = {
  // 後台獨立域名
  adminDomain: 'https://admin.snowrealm.pet',

  // IP 白名單（可選，超嚴格模式）
  ipWhitelist: false, // 初期不開，VPN 使用者會被擋

  // 兩步驗證（2FA）
  require2FA: true,   // 所有管理員必須開

  // Session 過期
  sessionTimeout: 4 * 60 * 60, // 4 小時

  // 敏感操作需要重新輸入密碼
  reAuthForSensitive: true,
};
```

### 11.7 即時告警通知

```typescript
// lib/security/alertSystem.ts

type AlertLevel = 'info' | 'warning' | 'critical';

interface Alert {
  level: AlertLevel;
  title: string;
  details: string;
  action?: string;  // 建議動作
}

// 所有告警都送到你的 LINE
async function sendAlert(alert: Alert) {
  const emoji = { info: 'ℹ️', warning: '⚠️', critical: '🚨' };

  await sendLINENotify(
    `${emoji[alert.level]} ${alert.title}\n${alert.details}${alert.action ? `\n建議：${alert.action}` : ''}`
  );

  // 同時存入告警記錄表
  await supabase.from('system_alerts').insert({
    level: alert.level,
    title: alert.title,
    details: alert.details,
    acknowledged: false,
  });
}

// 自動告警規則
const AUTO_ALERTS = [
  { condition: '新帳號批量註冊（>10/小時）', level: 'critical', action: '檢查是否機器人攻擊' },
  { condition: '使用者被自動封鎖', level: 'warning', action: '確認是否誤判' },
  { condition: '單筆儲值 >NT$2000', level: 'info', action: '確認是否正常交易' },
  { condition: '任何服務掛掉', level: 'critical', action: '立即檢查' },
  { condition: 'AI 成本超預算 90%', level: 'warning', action: '考慮降級模型' },
  { condition: '退款率 >5%', level: 'warning', action: '檢查是否被盜刷' },
  { condition: '大量檢舉同一帳號', level: 'warning', action: '立即審核該帳號' },
];
```

---

## 十二、資料庫設計

```sql
-- 管理員帳號
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'analyst', 'support')),
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

-- 管理員操作日誌（永久保留）
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_admin ON admin_audit_log(admin_id, created_at DESC);
CREATE INDEX idx_audit_action ON admin_audit_log(action, created_at DESC);

-- 活動記錄（見 4.2）

-- 使用者狀態擴展
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'warned', 'muted', 'banned', 'deleted')),
  risk_score INTEGER DEFAULT 0,
  watchlist BOOLEAN DEFAULT FALSE,
  banned_at TIMESTAMPTZ,
  banned_reason TEXT,
  banned_until TIMESTAMPTZ,
  banned_by UUID REFERENCES admin_users(id),
  device_fingerprints TEXT[] DEFAULT '{}',
  known_ips INET[] DEFAULT '{}';

-- 觀察名單
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  reason TEXT NOT NULL,
  risk_signals JSONB,
  added_by TEXT NOT NULL, -- 'system' 或 admin_id
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES admin_users(id),
  resolved_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 系統告警
CREATE TABLE system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  details TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 裝置指紋（多帳號偵測用）
CREATE TABLE device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  fingerprint TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_device_fp ON device_fingerprints(fingerprint);
CREATE INDEX idx_device_user ON device_fingerprints(user_id);
```

---

## 十三、後台 UI 架構

### 13.1 路由結構

```
/admin/
├── page.tsx                    # 總覽儀表板
├── users/
│   ├── page.tsx                # 使用者列表
│   └── [userId]/page.tsx       # 使用者詳情
├── live-feed/page.tsx          # 即時活動流
├── moderation/page.tsx         # 內容審核佇列
├── files/page.tsx              # 檔案管理
├── conversations/page.tsx      # AI 對話記錄
├── surveys/
│   ├── page.tsx                # 問卷列表
│   └── [surveyId]/page.tsx     # 問卷詳情/編輯
├── zcoin/page.tsx              # Z 幣經濟監控
├── ai-cost/page.tsx            # AI 成本監控
├── orders/page.tsx             # 金流訂單
├── system/page.tsx             # 系統健康
├── alerts/page.tsx             # 告警中心
├── security/page.tsx           # 安全總覽（風險帳號、觀察名單）
├── analytics/page.tsx          # 數據分析
└── settings/
    ├── page.tsx                # 系統設定
    ├── team/page.tsx           # 團隊管理（加/刪管理員）
    └── audit-log/page.tsx      # 操作日誌
```

### 13.2 後台設計風格

```
後台不用液態玻璃風格（那是前台的）
後台用：
  - 乾淨的白底 + 細邊框
  - 左側導航欄
  - 資訊密度高（表格為主）
  - 即時更新（Realtime）
  - 響應式（手機也能緊急處理）
  
參考風格：Vercel Dashboard / Linear / Supabase Dashboard
```

---

## 十四、人數規模化策略

### 14.1 不同階段的管理策略

```
100 DAU（現在）：
  - 你一個人用手機看後台就夠
  - 自動審核 + 偶爾手動看一下
  - 不需要額外人力

1,000 DAU：
  - 你 + 合夥人兩人分工
  - AI 自動審核處理 90%
  - 每天花 15-30 分鐘看審核佇列
  - 設好告警，有事才處理

5,000 DAU：
  - 需要 1 名兼職 moderator
  - 每天會有 20-50 則需要人工審核
  - 開始需要客服人員處理問題

10,000+ DAU：
  - 3-5 人小團隊
  - 全職 moderator × 1-2
  - 客服 × 1
  - 你專注產品和策略
```

### 14.2 自動化優先

```
目標：90% 的事情不需要人介入

自動化清單：
  ✅ 內容審核（AI 第一層過濾）
  ✅ 詐騙偵測（行為分析自動封鎖）
  ✅ Z 幣異常偵測（自動標記）
  ✅ 系統健康檢查（自動告警）
  ✅ 過期訂單清理
  ✅ AI 成本超限降級
  ✅ 新帳號風險評分
  
需要人工：
  ❌ 模糊情況的審核判斷
  ❌ 客訴處理
  ❌ 退款決策
  ❌ 封鎖帳號的申訴
```

---

## 十五、驗收清單

### 權限系統
- [ ] 5 種角色正確定義
- [ ] 權限檢查中間件生效
- [ ] 所有操作記錄到 audit log
- [ ] 敏感操作 LINE 通知
- [ ] super_admin 只有一個

### 使用者管理
- [ ] 搜尋/篩選/排序正常
- [ ] 使用者詳情頁所有分頁
- [ ] 封鎖/解封/警告/禁言
- [ ] 強制登出正常
- [ ] Z 幣手動調整（附原因）

### 全數據監控
- [ ] 即時活動流正常推送
- [ ] 使用者所有動作都記錄到 activity_log
- [ ] 檔案管理可預覽/刪除
- [ ] AI 對話記錄可查看
- [ ] 篩選功能正常

### 內容審核
- [ ] AI 自動審核生效
- [ ] 關鍵字過濾生效
- [ ] 圖片審核生效
- [ ] 檢舉佇列正常
- [ ] 審核操作記錄

### 反詐騙
- [ ] 註冊驗證碼正常
- [ ] IP/裝置限制生效
- [ ] 行為偵測正常運作
- [ ] 自動封鎖正確觸發
- [ ] 觀察名單功能正常
- [ ] 金流異常偵測生效

### 系統監控
- [ ] 健康檢查每 5 分鐘
- [ ] 服務掛掉有 LINE 通知
- [ ] 告警中心正常顯示
- [ ] 所有告警可確認/處理

### 資料保護
- [ ] 全站 HTTPS
- [ ] API Rate Limiting
- [ ] CORS 正確設定
- [ ] 後台 2FA
- [ ] 敏感操作需重新驗證
- [ ] 個資存取有記錄
