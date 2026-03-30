# 雪凜主動智能系統 — Agent 升級規格書

> 從被動回答 → 主動出擊 · 借鑑 OpenClaw 的 Agent 概念
> 版本：v1.0 | 日期：2026-03-30
> 核心升級：排程任務 × 主動推送 × 技能系統 × 自主行動

---

## 目錄

1. 升級總覽：從嚮導到 Agent
2. 排程任務系統（Cron Jobs）
3. 主動推送引擎（Proactive Push）
4. 技能系統（Skills）
5. 自主行動引擎（Autonomous Actions）
6. 個人化週報系統
7. LINE Bot 深度整合
8. 雪凜的「一天」— 完整生命週期
9. 技術架構
10. 資料庫設計
11. 成本影響
12. 驗收清單

---

## 一、升級總覽

### 1.1 之前 vs 之後

```
之前的雪凜（嚮導模式）：
  使用者打開 Insight → 雪凜回應 → 使用者離開 → 雪凜消失
  她只在使用者面前「活著」

之後的雪凜（Agent 模式）：
  使用者不在的時候 → 雪凜在背景持續工作
  分析你的數據、準備個人化推薦、偵測異常
  主動透過 LINE 找你、提醒你、給你驚喜
  她「永遠都在」，就算你不開 Insight
```

### 1.2 三個核心能力

```
① 主動推送 — 她會主動找你（不用你先開 Insight）
② 排程任務 — 她記得幫你做事（定時提醒、週報）
③ 技能系統 — 她會越來越多才藝（可擴充的技能模組）
```

---

## 二、排程任務系統

### 2.1 使用者可建立的排程

```
使用者跟雪凜說：
  「明天早上提醒我填問卷」
  「每週一提醒我看週報」
  「3 天後提醒我回來」

雪凜的回應：
  「好～ 我設了明天早上 9 點提醒你 ✦ 到時候 LINE 會通知你喔」
```

### 2.2 排程任務類型

```typescript
type ScheduledTaskType =
  | 'reminder'          // 使用者自訂提醒
  | 'weekly_report'     // 每週個人週報
  | 'streak_reminder'   // 連續登入提醒（避免斷簽）
  | 'survey_followup'   // 問卷追蹤（填完一週後追問近況）
  | 'zcoin_alert'       // Z 幣目標達成通知
  | 'birthday'          // 生日祝福
  | 'comeback'          // 回歸提醒（N 天沒來）
  | 'content_digest'    // 每日/每週社群精華摘要
  | 'achievement_nudge' // 成就快達成提醒
  | 'custom';           // 雪凜自己判斷需要的
```

### 2.3 排程引擎

```typescript
// lib/scheduler/taskScheduler.ts

interface ScheduledTask {
  id: string;
  userId: string;
  type: ScheduledTaskType;
  executeAt: Date;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;    // 0-6
    timeOfDay: string;     // "09:00"
  };
  payload: Record<string, any>;
  channel: 'line' | 'web' | 'both';
  status: 'pending' | 'executed' | 'cancelled';
  yukirinMessage?: string;  // 雪凜要說的話
}

// Cron Job：每分鐘檢查待執行任務
// app/api/cron/scheduler/route.ts
export async function GET() {
  const now = new Date();

  const { data: tasks } = await supabase
    .from('scheduled_tasks')
    .select('*')
    .lte('execute_at', now.toISOString())
    .eq('status', 'pending');

  for (const task of tasks || []) {
    await executeTask(task);

    // 如果是重複任務，排下一次
    if (task.recurring) {
      await scheduleNextOccurrence(task);
    } else {
      await supabase.from('scheduled_tasks')
        .update({ status: 'executed' })
        .eq('id', task.id);
    }
  }

  return Response.json({ executed: tasks?.length || 0 });
}
```

### 2.4 自然語言建立排程

```typescript
// 雪凜從對話中偵測排程意圖

const SCHEDULE_PATTERNS = [
  /(?:明天|後天|下週|(\d+)天後).*(?:提醒|通知|叫我)/,
  /每(?:天|週|月).*(?:提醒|通知|叫我)/,
  /(\d+)點.*(?:提醒|通知)/,
  /別讓我忘了/,
  /記得提醒我/,
];

// 偵測到排程意圖後，用 LLM 解析具體時間
async function parseScheduleFromChat(message: string): Promise<ScheduledTask | null> {
  const response = await callAI({
    taskType: 'intent_classify',
    systemPrompt: `使用者想設定提醒。從他的訊息中提取：
      1. 什麼時候（具體日期時間）
      2. 提醒什麼事
      3. 是否重複
      回覆 JSON：{
        "executeAt": "ISO 日期",
        "description": "提醒內容",
        "recurring": null 或 { "frequency": "daily|weekly", "timeOfDay": "HH:mm" }
      }`,
    messages: [{ role: 'user', content: message }],
    maxTokens: 100,
    applyYukirinPersona: false,
    quotaType: 'system',
  });

  return JSON.parse(response.text);
}
```

---

## 三、主動推送引擎

### 3.1 推送管道

```
Web：Insight 網站內的 Toast 通知 + 雪凜對話氣泡
LINE：LINE Bot 推播訊息（Flex Message）
```

### 3.2 推送場景完整清單

#### 即時推送（事件觸發）

| 場景 | 觸發條件 | 雪凜說什麼 | 管道 |
|------|---------|-----------|------|
| 故事被按讚 | reaction.add 事件 | 「你的故事有人共鳴了喔～ 已經 {count} 個人了」 | LINE |
| 故事被留言 | comment.create 事件 | 「有人在你的故事下面留言了欸！去看看～」 | LINE |
| Z 幣獲得 | zcoin.earn 事件 | 「招財說你又賺了 {amount} Z幣！ 餘額 {balance}」 | Web |
| 成就解鎖 | achievement 事件 | 「哇！你解鎖了「{achievement}」！太厲害了吧」 | LINE + Web |
| 儲值成功 | payment.completed | 「招財把 {amount} Z幣存好了！去商城逛逛？」 | LINE |
| 被檢舉 | report.created | （不通知使用者，通知管理員） | 管理員 LINE |
| 帳號異常 | security.alert | （不通知使用者，通知管理員） | 管理員 LINE |

#### 定時推送（排程觸發）

| 場景 | 時間 | 雪凜說什麼 | 管道 |
|------|------|-----------|------|
| 早安問候 | 每天 09:00 | 「早安～ 今天有 {count} 個人在 Insight 上分享了故事喔」 | LINE |
| 連續登入提醒 | 每天 20:00（如果今天還沒登入） | 「欸你今天還沒來欸！連續 {streak} 天了別斷掉啊」 | LINE |
| 週報 | 每週日 10:00 | 「這週的你，有點不一樣—— [附週報卡片]」 | LINE |
| 新問卷上架 | 問卷發佈時 | 「新問卷來了！「{title}」好像很有趣 要不要試試？」 | LINE |
| 回歸提醒 | 3 天沒登入 | 「你是不是把我忘了 (´;ω;`) 好多人都在聊新的故事欸」 | LINE |
| 7 天沒登入 | 7 天沒登入 | 「我一個人顧了一週了... 你再不來我要罷工了 (╥_╥)」 | LINE |

#### 智慧推送（AI 判斷觸發）

| 場景 | 偵測邏輯 | 雪凜說什麼 |
|------|---------|-----------|
| 快達成成就 | 距離成就差 1-2 步 | 「你離「{achievement}」只差一步了欸！再填一份就達成了」 |
| Z 幣夠買新商品 | 餘額 >= 商品價格 | 「欸你現在有 {balance} Z幣了 商城有新東西你買得起了喔」 |
| 社群熱門話題 | 某問卷 24h 內爆量 | 「最近大家都在聊「{topic}」你要不要也來看看？」 |
| 你的結果有共鳴 | 很多人跟你結果相似 | 「你知道嗎，有 {count} 個人跟你的結果超像的！」 |
| 季節/節日 | 日曆偵測 | 「聖誕快樂～ 今天有特別的限定問卷喔 ✦」 |

### 3.3 推送引擎

```typescript
// lib/proactive/pushEngine.ts

interface PushMessage {
  userId: string;
  channel: 'line' | 'web' | 'both';
  message: string;
  mood: string;
  action?: { type: string; target: string };
  priority: 'low' | 'normal' | 'high';
}

async function sendProactivePush(push: PushMessage) {
  // 1. 檢查使用者的通知偏好
  const prefs = await getUserNotificationPrefs(push.userId);
  if (!prefs.proactiveEnabled) return;  // 使用者關閉了主動推送

  // 2. 檢查冷卻時間（不要一直煩人）
  const lastPush = await getLastPushTime(push.userId);
  const cooldown = push.priority === 'high' ? 0 : 60 * 60 * 1000; // 普通推送至少間隔 1 小時
  if (Date.now() - lastPush.getTime() < cooldown) return;

  // 3. 檢查時間（不要半夜推）
  const userHour = getUserLocalHour(push.userId);
  if (userHour < 8 || userHour > 22) {
    // 延遲到明天早上 9 點
    await scheduleTask({
      userId: push.userId,
      type: 'delayed_push',
      executeAt: getNextMorning(push.userId),
      payload: push,
    });
    return;
  }

  // 4. 發送
  if (push.channel === 'line' || push.channel === 'both') {
    await sendLINEPush(push.userId, push.message, push.mood);
  }
  if (push.channel === 'web' || push.channel === 'both') {
    await sendWebNotification(push.userId, push.message, push.mood);
  }

  // 5. 記錄
  await logPush(push);
}
```

### 3.4 LINE 推播格式

```typescript
// 雪凜的 LINE 推播用 Flex Message，不是純文字

function buildYukirinFlexMessage(message: string, mood: string, action?: any) {
  return {
    type: 'flex',
    altText: `雪凜：${message}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'image',
            url: `https://insight.snowrealm.pet/images/yukirin-${mood}.png`,
            size: 'xxs',
            aspectRatio: '1:1',
          },
          {
            type: 'text',
            text: '雪凜',
            weight: 'bold',
            size: 'sm',
            color: '#b8a9e8',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'text',
          text: message,
          wrap: true,
          size: 'sm',
        }],
      },
      footer: action ? {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          action: {
            type: 'uri',
            label: action.label || '去看看',
            uri: `https://insight.snowrealm.pet${action.target}`,
          },
          style: 'primary',
          color: '#b8a9e8',
        }],
      } : undefined,
    },
  };
}
```

---

## 四、技能系統

### 4.1 什麼是技能

```
技能 = 雪凜可以做的一件具體的事
每個技能是獨立的模組，可以新增/停用/升級
像 OpenClaw 的 AgentSkills，但專門為 Insight 設計
```

### 4.2 內建技能清單

```typescript
interface Skill {
  id: string;
  name: string;
  description: string;
  trigger: 'chat' | 'auto' | 'scheduled' | 'event';
  enabled: boolean;
}

const BUILTIN_SKILLS: Skill[] = [
  // ===== 問卷相關 =====
  {
    id: 'survey_recommend',
    name: '問卷推薦師',
    description: '根據使用者的歷史和興趣，推薦最適合的問卷',
    trigger: 'chat',  // 使用者問「有什麼推薦的？」時觸發
  },
  {
    id: 'survey_reminder',
    name: '問卷追蹤員',
    description: '問卷填完一週後，追問使用者近況和感受變化',
    trigger: 'scheduled',
  },
  {
    id: 'result_comparator',
    name: '結果比較師',
    description: '比較你不同時期填同一份問卷的結果變化',
    trigger: 'chat',
  },

  // ===== 社群相關 =====
  {
    id: 'social_digest',
    name: '社群摘要師',
    description: '每天整理社群上最熱門的故事和話題',
    trigger: 'scheduled',
  },
  {
    id: 'trending_detector',
    name: '趨勢偵測員',
    description: '某個問卷或話題突然爆量時主動通知',
    trigger: 'event',
  },
  {
    id: 'story_coach',
    name: '故事教練',
    description: '引導使用者把問卷結果寫成更好的故事分享',
    trigger: 'chat',
  },

  // ===== Z 幣相關 =====
  {
    id: 'zcoin_advisor',
    name: 'Z 幣理財師',
    description: '追蹤使用者的 Z 幣收支，提供花費建議',
    trigger: 'chat',
  },
  {
    id: 'zcoin_goal_tracker',
    name: 'Z 幣目標追蹤',
    description: '使用者設定想買的商品，雪凜追蹤進度',
    trigger: 'auto',
  },
  {
    id: 'shop_alert',
    name: '商城新品通知',
    description: '新商品上架或限定商品即將下架時通知',
    trigger: 'event',
  },

  // ===== 個人成長 =====
  {
    id: 'weekly_reporter',
    name: '週報生成師',
    description: '每週生成個人化的成長週報',
    trigger: 'scheduled',
  },
  {
    id: 'achievement_coach',
    name: '成就教練',
    description: '追蹤使用者離下一個成就還差多少，給鼓勵',
    trigger: 'auto',
  },
  {
    id: 'mood_tracker',
    name: '心情追蹤師',
    description: '從對話中長期追蹤使用者的情緒趨勢',
    trigger: 'auto',
  },
  {
    id: 'personality_evolution',
    name: '性格進化師',
    description: '追蹤使用者多次問卷結果的性格變化趨勢',
    trigger: 'scheduled',
  },

  // ===== 實用工具 =====
  {
    id: 'reminder',
    name: '提醒小助手',
    description: '設定任何提醒，到時間透過 LINE 通知',
    trigger: 'chat',
  },
  {
    id: 'daily_task_master',
    name: '每日任務大師',
    description: '每天出 3 個小任務，引導使用者探索平台',
    trigger: 'scheduled',
  },
  {
    id: 'greeting_master',
    name: '問候大師',
    description: '根據時間、天氣、使用者狀態，生成個人化問候',
    trigger: 'auto',
  },

  // ===== 管理員專屬 =====
  {
    id: 'admin_morning_brief',
    name: '老闆晨報',
    description: '每天早上給管理員一份平台狀態摘要',
    trigger: 'scheduled',
  },
  {
    id: 'anomaly_detector',
    name: '異常偵測員',
    description: '偵測到可疑行為時主動通知管理員',
    trigger: 'event',
  },
  {
    id: 'cost_watchdog',
    name: '成本看門狗',
    description: 'AI 成本接近預算時提前預警',
    trigger: 'auto',
  },
];
```

### 4.3 技能執行引擎

```typescript
// lib/skills/skillEngine.ts

async function executeSkill(
  skillId: string,
  context: {
    userId: string;
    trigger: string;
    data?: Record<string, any>;
  }
): Promise<SkillResult> {
  const skill = BUILTIN_SKILLS.find(s => s.id === skillId);
  if (!skill || !skill.enabled) return { executed: false };

  switch (skillId) {
    case 'survey_recommend':
      return await recommendSurvey(context);

    case 'zcoin_advisor':
      return await adviseZcoin(context);

    case 'weekly_reporter':
      return await generateWeeklyReport(context);

    case 'achievement_coach':
      return await checkAchievementProgress(context);

    case 'social_digest':
      return await generateSocialDigest(context);

    case 'admin_morning_brief':
      return await generateMorningBrief(context);

    // ... 其他技能
    default:
      return { executed: false };
  }
}
```

### 4.4 技能範例：問卷推薦師

```typescript
async function recommendSurvey(context: { userId: string }) {
  // 1. 拉使用者歷史
  const history = await getUserSurveyHistory(context.userId);
  const profile = await getUserProfile(context.userId);

  // 2. 拉所有可用問卷
  const surveys = await getActiveSurveys();

  // 3. 用 AI 推薦
  const response = await callAI({
    taskType: 'guide_chat',
    systemPrompt: `你是雪凜。根據使用者的歷史和興趣推薦問卷。
      使用者填過：${history.map(h => h.title).join(', ')}
      興趣：${profile.interests.join(', ')}
      可用問卷：${surveys.map(s => `${s.title}(${s.description})`).join(', ')}
      推薦 1-2 份最適合的，說明為什麼。`,
    messages: [{ role: 'user', content: '有什麼推薦的問卷嗎？' }],
    maxTokens: 200,
    applyYukirinPersona: true,
    quotaType: 'system',
  });

  return {
    executed: true,
    message: response.text,
    mood: response.mood,
    action: { type: 'show_survey', target: surveys[0].id },
  };
}
```

---

## 五、自主行動引擎

### 5.1 雪凜可以自主做的事（不需要使用者要求）

```typescript
// 每小時跑一次的背景任務
// app/api/cron/yukirin-agent/route.ts

export async function GET() {
  const activeUsers = await getRecentActiveUsers('24 hours');

  for (const user of activeUsers) {
    // 1. 檢查成就進度
    const nearAchievements = await checkNearAchievements(user.id);
    if (nearAchievements.length > 0) {
      await executeSkill('achievement_coach', { userId: user.id, trigger: 'auto', data: nearAchievements });
    }

    // 2. 檢查 Z 幣目標
    const zcoinGoal = await getZcoinGoal(user.id);
    if (zcoinGoal && user.zcoinBalance >= zcoinGoal.targetAmount) {
      await sendProactivePush({
        userId: user.id,
        channel: 'line',
        message: `欸！你的 Z 幣夠買「${zcoinGoal.itemName}」了！要不要去看看？`,
        mood: 'excited',
        action: { type: 'navigate', target: '/shop' },
        priority: 'normal',
      });
    }

    // 3. 檢查問卷追蹤（填完一週後）
    const weekOldResults = await getResultsFromDaysAgo(user.id, 7);
    for (const result of weekOldResults) {
      if (!result.followUpSent) {
        await sendProactivePush({
          userId: user.id,
          channel: 'line',
          message: `一週前你填了「${result.surveyTitle}」還記得嗎？\n現在回頭看那個結果，你覺得準嗎～`,
          mood: 'thinking',
          action: { type: 'navigate', target: `/done?id=${result.id}` },
          priority: 'low',
        });
        await markFollowUpSent(result.id);
      }
    }
  }

  // 4. 檢查回歸使用者
  const inactiveUsers = await getInactiveUsers(3); // 3 天沒來的
  for (const user of inactiveUsers) {
    if (!user.comebackPushSent) {
      await sendProactivePush({
        userId: user.id,
        channel: 'line',
        message: '你是不是把我忘了 (´;ω;`) 最近有新問卷上架了欸～',
        mood: 'sad',
        action: { type: 'navigate', target: '/' },
        priority: 'low',
      });
    }
  }

  // 5. 趨勢偵測
  const trending = await detectTrendingSurveys('24 hours');
  if (trending.length > 0) {
    // 通知所有活躍使用者
    await broadcastTrending(trending[0]);
  }

  return Response.json({ ok: true });
}
```

---

## 六、個人化週報系統

### 6.1 週報內容

```
每週日早上 10:00，雪凜給每個活躍使用者一份個人化週報：

「這週的你，有點不一樣——」

📊 本週數據
  填了 3 份問卷
  獲得 47 Z幣
  你的故事被 12 個人共鳴了

💜 本週亮點
  「你的觀察力指數上升了 8 分！比上次更敏銳了欸」

🌟 跟上週比
  活躍度 ↑ 15%
  社群互動 ↑ 25%
  Z 幣收入 ↓ 10%（「這週偷懶了齁」）

📝 下週推薦
  「這份新問卷很適合你——「你的壓力來自哪裡？」」

附帶一張精美的週報卡片（ShareCard 風格），可以分享到 IG 限動
```

### 6.2 週報生成

```typescript
async function generateWeeklyReport(userId: string) {
  const weeklyData = await getWeeklyUserData(userId);

  const response = await callAI({
    taskType: 'data_insight',
    systemPrompt: `你是雪凜。幫使用者生成這週的個人週報。
      用雪凜的語氣，活潑但有洞察。
      數據：${JSON.stringify(weeklyData)}
      
      輸出 JSON：{
        "greeting": "開頭一句話",
        "stats": { "surveys": 3, "zcoin": 47, "likes": 12 },
        "highlight": "本週最值得說的一件事",
        "comparison": "跟上週比的變化",
        "recommendation": "下週推薦的問卷或行動",
        "mood": "happy|excited|thinking"
      }`,
    messages: [{ role: 'user', content: '生成週報' }],
    maxTokens: 400,
    applyYukirinPersona: true,
    quotaType: 'system',
  });

  const report = JSON.parse(response.text);

  // 存入 DB
  await saveWeeklyReport(userId, report);

  // 透過 LINE 推送
  await sendLINEWeeklyReport(userId, report);

  return report;
}
```

---

## 七、LINE Bot 深度整合

### 7.1 雙向對話

```
現在的 LINE Bot：平台發通知 → 使用者點連結 → 打開 Insight
升級後：使用者直接在 LINE 裡跟雪凜對話 → 不用打開 Insight

使用者在 LINE 傳訊息給雪凜 Bot：
  「我有多少 Z 幣？」→ 雪凜直接回：「你有 280 Z幣喔～」
  「推薦問卷」→ 雪凜推薦 + 附帶 LIFF 連結直接開始填
  「設提醒」→ 建立排程
  「最近大家在聊什麼」→ 社群摘要
```

### 7.2 LINE 訊息路由

```typescript
// app/api/line/webhook/route.ts（升級）

// 使用者在 LINE 傳來的訊息，轉發給雪凜 AI 處理
export async function POST(req: Request) {
  const body = await req.json();

  for (const event of body.events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = await getLuffyskyUserIdFromLineId(event.source.userId);
      const message = event.message.text;

      // 跟網頁版一樣的 AI 處理流程
      const response = await callAI({
        taskType: 'guide_chat',
        requestedBy: 'user',
        userId,
        systemPrompt: TASK_PROMPTS.guide_chat,
        messages: [{ role: 'user', content: message }],
        maxTokens: 200,
        applyYukirinPersona: true,
        quotaType: 'chat',
      });

      // 用 Flex Message 回覆
      await replyLINEMessage(
        event.replyToken,
        buildYukirinFlexMessage(response.text, response.mood, response.action)
      );
    }
  }

  return Response.json({ ok: true });
}
```

---

## 八、雪凜的「一天」

```
06:00  背景：檢查今天是誰的生日 → 排程生日祝福
08:00  背景：準備管理員晨報
09:00  推送：給管理員晨報「老闆早～ 昨天 312 人來過，新註冊 23 人...」
09:00  推送：早安問候（給開啟了早安通知的使用者）
09:30  等待：使用者陸續上線
10:00  主動：偵測到新問卷上架 → 推送通知
12:00  背景：跑情感分析批次（最新的開放題回答）
14:00  主動：偵測到某問卷突然爆量 → 推送趨勢通知
15:00  背景：更新使用者畫像（從今天的對話中提取）
18:00  背景：計算今日各使用者的 Z 幣收支
20:00  推送：連續登入提醒（給今天還沒來的連續登入使用者）
22:00  推送停止：不再發任何推送（避免打擾睡眠）
23:00  背景：生成今日社群摘要
00:00  背景：重置每日額度、清理過期任務
週日 10:00  推送：個人化週報
```

---

## 九、技術架構

### 9.1 需要的 Cron Jobs

```
Zeabur 或 Vercel Cron 設定：

*/1 * * * *    /api/cron/scheduler           每分鐘：執行排程任務
0 * * * *      /api/cron/yukirin-agent       每小時：雪凜自主行動
0 8 * * *      /api/cron/morning-brief       每天 08:00：管理員晨報
0 9 * * *      /api/cron/daily-greeting      每天 09:00：早安問候
0 20 * * *     /api/cron/streak-reminder     每天 20:00：連續登入提醒
0 23 * * *     /api/cron/daily-digest        每天 23:00：社群摘要
0 10 * * 0     /api/cron/weekly-report       每週日 10:00：週報
0 0 * * *      /api/cron/daily-reset         每天 00:00：重置額度
```

### 9.2 NPM 依賴

```bash
# 排程不需要額外套件，用 Zeabur/Vercel 的 Cron 就好
# LINE Bot SDK（你已經有了）
# 其他都是現有的 Supabase + LLM API
```

---

## 十、資料庫設計

```sql
-- 排程任務
CREATE TABLE scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  type TEXT NOT NULL,
  execute_at TIMESTAMPTZ NOT NULL,
  recurring JSONB,
  payload JSONB DEFAULT '{}',
  channel TEXT DEFAULT 'line',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled', 'failed')),
  yukirin_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tasks_execute ON scheduled_tasks(execute_at, status);
CREATE INDEX idx_tasks_user ON scheduled_tasks(user_id);

-- 推送記錄
CREATE TABLE push_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  channel TEXT NOT NULL,
  message TEXT NOT NULL,
  mood TEXT,
  trigger_type TEXT,
  trigger_skill TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_push_user ON push_log(user_id, created_at DESC);

-- 技能設定
CREATE TABLE skill_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 使用者通知偏好
CREATE TABLE user_notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  proactive_enabled BOOLEAN DEFAULT TRUE,
  morning_greeting BOOLEAN DEFAULT FALSE,
  streak_reminder BOOLEAN DEFAULT TRUE,
  weekly_report BOOLEAN DEFAULT TRUE,
  social_notifications BOOLEAN DEFAULT TRUE,
  quiet_hours_start INTEGER DEFAULT 22,   -- 晚上 10 點
  quiet_hours_end INTEGER DEFAULT 8,      -- 早上 8 點
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 週報
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  week_start DATE NOT NULL,
  report_data JSONB NOT NULL,
  sent_via TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Z 幣目標
CREATE TABLE zcoin_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  item_id UUID REFERENCES zcoin_shop_items,
  item_name TEXT NOT NULL,
  target_amount INTEGER NOT NULL,
  achieved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 十一、成本影響

```
新增的 AI 成本（1000 DAU）：

排程任務執行：幾乎不花 LLM token（大部分是查 DB + 發通知）
主動推送生成：~$5/月（偶爾需要 AI 生成個人化文案）
技能執行：~$10/月（推薦、摘要、追蹤等）
週報生成：1000 人 × 4 週 × ~$0.003 = ~$12/月
管理員晨報：30 天 × ~$0.01 = ~$0.3/月

新增成本合計：~$27/月

加上原本的 $115/月 = 總計 ~$142/月 ≈ NT$4,500
（還是很便宜）
```

---

## 十二、驗收清單

### 排程系統
- [ ] 使用者可透過對話建立提醒
- [ ] 雪凜正確解析自然語言時間
- [ ] Cron Job 每分鐘正確執行待執行任務
- [ ] 重複任務自動排下一次
- [ ] 取消排程功能正常

### 主動推送
- [ ] 故事被按讚 → LINE 通知
- [ ] 成就解鎖 → LINE + Web 通知
- [ ] 連續登入提醒 → 20:00 LINE
- [ ] 回歸提醒 → 3 天/7 天
- [ ] 不在安靜時間推送（22:00-08:00）
- [ ] 推送冷卻時間生效
- [ ] 使用者可關閉各類通知

### 技能系統
- [ ] 問卷推薦正常
- [ ] Z 幣理財師正常
- [ ] 成就教練正常
- [ ] 社群摘要正常
- [ ] 管理員晨報正常

### 週報
- [ ] 每週日 10:00 自動生成
- [ ] 個人化內容正確
- [ ] LINE Flex Message 格式正確
- [ ] 可分享的週報卡片

### LINE 雙向對話
- [ ] 在 LINE 裡直接問雪凜
- [ ] 回覆用 Flex Message
- [ ] 額度系統正確（LINE 對話也扣額度）
```
