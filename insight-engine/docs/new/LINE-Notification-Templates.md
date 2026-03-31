# LINE Flex Message 通知樣式 — 完整 JSON 模板

> 22 種通知樣式 × 三端 Bot × 完整 Flex Message JSON × 圖片欄位預留
> 版本：v2.0 | 日期：2026-03-31
> 圖片 URL 前綴：https://insight.snowrealm.pet/images/
> Official Bot（用戶端 14 種）× Insight Bot（管理員端 5 種）× INSIGHT_EXT Bot（B2B 3 種）

---

## 圖片素材清單（需要準備）

```
/public/images/
├── yukirin/
│   ├── yukirin-happy.png        雪凜開心（聊天、週報、新問卷）
│   ├── yukirin-excited.png      雪凜興奮（成就、問卷結果）
│   ├── yukirin-sad.png          雪凜難過（登入提醒、回歸）
│   ├── yukirin-thinking.png     雪凜思考（通用）
│   └── yukirin-wink.png         雪凜眨眼（推薦、商城）
├── riku/
│   ├── riku-neutral.png         凜空中性（凜空值班通知）
│   └── riku-shy.png             凜空害羞
├── zaicai/
│   ├── zaicai-happy.png         招財開心（Z 幣獲得）
│   ├── zaicai-excited.png       招財興奮（儲值成功）
│   ├── zaicai-sad.png           招財難過（餘額不足）
│   └── zaicai-coin.png          招財抱金幣（icon 用）
├── cards/
│   ├── story-card-bg.png        故事卡背景
│   └── achievement-bg.png       成就背景
└── system/
    ├── snowrealm-logo.png       品牌 logo
    └── alert-icon.png           告警 icon

所有圖片建議：
  - 頭像類：240×240px PNG 透明背景
  - 背景類：1040×585px（LINE 建議尺寸）
  - 放 Cloudflare R2，CDN 加速
```

---

## 一、雪凜聊天回覆

```typescript
// lib/line/flexTemplates.ts

function yukirinChatReply(
  text: string[],      // 多行訊息
  mood: string,        // 表情 → 對應頭像
  buttons?: { label: string; uri: string }[]
): FlexMessage {
  const avatarUrl = `https://insight.snowrealm.pet/images/yukirin/yukirin-${mood}.png`;

  return {
    type: 'flex',
    altText: `雪凜：${text[0]}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'image',
            url: avatarUrl,
            size: 'xxs',
            aspectRatio: '1:1',
            aspectMode: 'cover',
            flex: 0,
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '雪凜', weight: 'bold', size: 'sm', color: '#b8a9e8' },
              { type: 'text', text: 'SnowRealm Insight', size: 'xxs', color: '#999999' },
            ],
            paddingStart: '10px',
          },
        ],
        paddingAll: '12px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: text.map(line => ({
          type: 'text',
          text: line,
          size: 'sm',
          color: '#333333',
          wrap: true,
          margin: 'sm',
        })),
        paddingAll: '14px',
        paddingTop: '0px',
      },
      footer: buttons ? {
        type: 'box',
        layout: buttons.length === 1 ? 'vertical' : 'horizontal',
        contents: buttons.map(btn => ({
          type: 'button',
          action: {
            type: 'uri',
            label: btn.label,
            uri: btn.uri,
          },
          style: 'primary',
          color: '#b8a9e8',
          height: 'sm',
        })),
        spacing: 'sm',
        paddingAll: '12px',
      } : undefined,
    },
  };
}

// 凜空版本
function rikuChatReply(
  text: string[],
  mood: string,
  buttons?: { label: string; uri: string }[]
): FlexMessage {
  const avatarUrl = `https://insight.snowrealm.pet/images/riku/riku-${mood}.png`;

  return {
    type: 'flex',
    altText: `凜空：${text[0]}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'image',
            url: avatarUrl,
            size: 'xxs',
            aspectRatio: '1:1',
            aspectMode: 'cover',
            flex: 0,
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '凜空', weight: 'bold', size: 'sm', color: '#c94a4a' },
              { type: 'text', text: 'SnowRealm Insight', size: 'xxs', color: '#999999' },
            ],
            paddingStart: '10px',
          },
        ],
        paddingAll: '12px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: text.map(line => ({
          type: 'text', text: line, size: 'sm', color: '#333333', wrap: true, margin: 'sm',
        })),
        paddingAll: '14px',
        paddingTop: '0px',
      },
      footer: buttons ? {
        type: 'box',
        layout: buttons.length === 1 ? 'vertical' : 'horizontal',
        contents: buttons.map(btn => ({
          type: 'button',
          action: { type: 'uri', label: btn.label, uri: btn.uri },
          style: 'primary',
          color: '#c94a4a',
          height: 'sm',
        })),
        spacing: 'sm',
        paddingAll: '12px',
      } : undefined,
    },
  };
}
```

---

## 二、Z 幣獲得 / 消費通知

```typescript
function zcoinNotification(
  type: 'earn' | 'spend' | 'topup',
  amount: number,
  balance: number,
  description: string,
  goalItem?: { name: string; price: number }
): FlexMessage {
  const isPositive = type !== 'spend';
  const zaicaiMood = isPositive ? 'happy' : 'sad';
  const accentColor = isPositive ? '#e8a828' : '#999999';
  const bgColor = isPositive ? '#FFF8E8' : '#F5F5F5';

  return {
    type: 'flex',
    altText: `Z幣 ${isPositive ? '+' : '-'}${amount}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'horizontal',
        backgroundColor: bgColor,
        contents: [
          {
            type: 'image',
            url: `https://insight.snowrealm.pet/images/zaicai/zaicai-${zaicaiMood}.png`,
            size: 'xxs',
            aspectRatio: '1:1',
            aspectMode: 'cover',
            flex: 0,
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '招財通知', weight: 'bold', size: 'sm', color: accentColor },
              { type: 'text', text: description, size: 'xxs', color: '#888888' },
            ],
            paddingStart: '10px',
            flex: 1,
          },
          {
            type: 'text',
            text: `${isPositive ? '+' : '-'}${amount}`,
            size: 'xl',
            weight: 'bold',
            color: accentColor,
            align: 'end',
            flex: 0,
          },
        ],
        paddingAll: '14px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '目前餘額', size: 'sm', color: '#999999', flex: 1 },
              { type: 'text', text: `${balance} Z幣`, size: 'sm', weight: 'bold', align: 'end', flex: 0 },
            ],
          },
          ...(goalItem ? [
            {
              type: 'box' as const,
              layout: 'vertical' as const,
              contents: [
                {
                  type: 'box' as const,
                  layout: 'vertical' as const,
                  contents: [{
                    type: 'box' as const,
                    layout: 'vertical' as const,
                    contents: [{ type: 'filler' as const }],
                    width: `${Math.min(Math.round(balance / goalItem.price * 100), 100)}%`,
                    backgroundColor: accentColor,
                    height: '4px',
                    cornerRadius: '2px',
                  }],
                  backgroundColor: '#EEEEEE',
                  height: '4px',
                  cornerRadius: '2px',
                  margin: 'md',
                },
                {
                  type: 'text' as const,
                  text: `距離「${goalItem.name}」還差 ${Math.max(goalItem.price - balance, 0)} Z幣`,
                  size: 'xxs',
                  color: '#999999',
                  margin: 'sm',
                },
              ],
            },
          ] : []),
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          action: {
            type: 'uri',
            label: '查看 Z 幣明細',
            uri: 'https://insight.snowrealm.pet/profile#zcoin',
          },
          style: 'link',
          color: accentColor,
          height: 'sm',
        }],
        paddingAll: '8px',
      },
    },
  };
}
```

---

## 三、問卷結果 / 故事卡

```typescript
function storyCardNotification(
  title: string,
  subtitle: string,
  tags: string[],
  cardImageUrl?: string,
  resultId?: string
): FlexMessage {
  return {
    type: 'flex',
    altText: `你的故事卡：${title}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      hero: {
        type: 'image',
        url: cardImageUrl || 'https://insight.snowrealm.pet/images/cards/story-card-bg.png',
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'image',
                url: 'https://insight.snowrealm.pet/images/yukirin/yukirin-excited.png',
                size: 'xxs',
                aspectRatio: '1:1',
                aspectMode: 'cover',
                flex: 0,
              },
              {
                type: 'text',
                text: '雪凜說：你的結果出來了！',
                size: 'xs',
                color: '#b8a9e8',
                weight: 'bold',
                flex: 1,
                margin: 'sm',
              },
            ],
          },
          {
            type: 'text',
            text: title,
            weight: 'bold',
            size: 'lg',
            margin: 'md',
            wrap: true,
          },
          {
            type: 'text',
            text: subtitle,
            size: 'sm',
            color: '#888888',
            wrap: true,
            margin: 'sm',
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: tags.map(tag => ({
              type: 'box' as const,
              layout: 'vertical' as const,
              contents: [{
                type: 'text' as const,
                text: tag,
                size: 'xxs',
                color: '#b8a9e8',
                align: 'center' as const,
              }],
              backgroundColor: '#F0EDFF',
              cornerRadius: '8px',
              paddingAll: '4px',
              paddingStart: '10px',
              paddingEnd: '10px',
              flex: 0,
            })),
            spacing: 'sm',
            margin: 'lg',
          },
        ],
        paddingAll: '16px',
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '查看完整結果',
              uri: `https://insight.snowrealm.pet/done?id=${resultId || ''}`,
            },
            style: 'primary',
            color: '#b8a9e8',
            height: 'sm',
            flex: 1,
          },
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '分享給朋友',
              uri: `https://insight.snowrealm.pet/share?id=${resultId || ''}`,
            },
            style: 'secondary',
            height: 'sm',
            flex: 1,
          },
        ],
        spacing: 'sm',
        paddingAll: '12px',
      },
    },
  };
}
```

---

## 四、週報卡片

```typescript
function weeklyReportNotification(
  stats: {
    surveysCompleted: number;
    zcoinEarned: number;
    storiesLiked: number;
    streakDays: number;
  },
  highlight: string,
  changes: string,
  weekLabel: string
): FlexMessage {
  return {
    type: 'flex',
    altText: `雪凜的週報：${highlight}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'image',
            url: 'https://insight.snowrealm.pet/images/yukirin/yukirin-happy.png',
            size: 'xxs',
            aspectRatio: '1:1',
            aspectMode: 'cover',
            flex: 0,
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '雪凜的週報', weight: 'bold', size: 'sm', color: '#b8a9e8' },
              { type: 'text', text: weekLabel, size: 'xxs', color: '#999999' },
            ],
            paddingStart: '10px',
          },
        ],
        paddingAll: '14px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          // 四宮格數據
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: String(stats.surveysCompleted), size: 'xl', weight: 'bold', align: 'center' },
                  { type: 'text', text: '問卷完成', size: 'xxs', color: '#999999', align: 'center' },
                ],
                backgroundColor: '#F8F8F8',
                cornerRadius: '8px',
                paddingAll: '10px',
                flex: 1,
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: String(stats.zcoinEarned), size: 'xl', weight: 'bold', align: 'center', color: '#e8a828' },
                  { type: 'text', text: 'Z 幣獲得', size: 'xxs', color: '#999999', align: 'center' },
                ],
                backgroundColor: '#F8F8F8',
                cornerRadius: '8px',
                paddingAll: '10px',
                flex: 1,
                margin: 'sm',
              },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: String(stats.storiesLiked), size: 'xl', weight: 'bold', align: 'center', color: '#e85d75' },
                  { type: 'text', text: '故事共鳴', size: 'xxs', color: '#999999', align: 'center' },
                ],
                backgroundColor: '#F8F8F8',
                cornerRadius: '8px',
                paddingAll: '10px',
                flex: 1,
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: String(stats.streakDays), size: 'xl', weight: 'bold', align: 'center', color: '#4CAF50' },
                  { type: 'text', text: '連續登入', size: 'xxs', color: '#999999', align: 'center' },
                ],
                backgroundColor: '#F8F8F8',
                cornerRadius: '8px',
                paddingAll: '10px',
                flex: 1,
                margin: 'sm',
              },
            ],
            margin: 'sm',
          },
          // 分隔線
          { type: 'separator', margin: 'lg' },
          // 雪凜洞察
          {
            type: 'text',
            text: `「${highlight}」`,
            size: 'sm',
            color: '#333333',
            wrap: true,
            margin: 'lg',
            style: 'italic',
          },
          {
            type: 'text',
            text: changes,
            size: 'xs',
            color: '#999999',
            margin: 'sm',
          },
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '看完整週報',
              uri: 'https://insight.snowrealm.pet/profile#weekly-report',
            },
            style: 'primary',
            color: '#b8a9e8',
            height: 'sm',
            flex: 1,
          },
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '分享到 IG',
              uri: 'https://insight.snowrealm.pet/share/weekly',
            },
            style: 'secondary',
            height: 'sm',
            flex: 1,
          },
        ],
        spacing: 'sm',
        paddingAll: '12px',
      },
    },
  };
}
```

---

## 五、成就解鎖

```typescript
function achievementNotification(
  achievementName: string,
  description: string,
  zcoinReward: number,
  rarity: string,         // '3%' 等
  achievementIcon: string  // emoji 或 icon URL
): FlexMessage {
  return {
    type: 'flex',
    altText: `成就解鎖：${achievementName}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'image',
            url: 'https://insight.snowrealm.pet/images/yukirin/yukirin-excited.png',
            size: 'sm',
            aspectRatio: '1:1',
            aspectMode: 'cover',
          },
          { type: 'text', text: '成就解鎖！', size: 'md', weight: 'bold', color: '#FFFFFF', align: 'center' },
          { type: 'text', text: achievementName, size: 'xl', weight: 'bold', color: '#FFFFFF', align: 'center', margin: 'sm' },
          { type: 'text', text: description, size: 'xs', color: '#FFFFFFCC', align: 'center', margin: 'sm' },
        ],
        backgroundColor: '#b8a9e8',
        paddingAll: '20px',
        justifyContent: 'center',
        alignItems: 'center',
        background: {
          type: 'linearGradient',
          angle: '135deg',
          startColor: '#b8a9e8',
          endColor: '#f5b8b5',
        },
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '獎勵', size: 'sm', color: '#999999', flex: 1 },
              { type: 'text', text: `+${zcoinReward} Z幣`, size: 'sm', weight: 'bold', color: '#e8a828', align: 'end', flex: 0 },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '稀有度', size: 'sm', color: '#999999', flex: 1 },
              { type: 'text', text: `只有 ${rarity} 的人達成`, size: 'sm', weight: 'bold', align: 'end', flex: 0 },
            ],
            margin: 'sm',
          },
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          action: {
            type: 'uri',
            label: '查看所有成就',
            uri: 'https://insight.snowrealm.pet/profile#achievements',
          },
          style: 'primary',
          color: '#b8a9e8',
          height: 'sm',
        }],
        paddingAll: '12px',
      },
    },
  };
}
```

---

## 六、連續登入提醒 / 回歸提醒

```typescript
function streakReminderNotification(
  streakDays: number,
  tomorrowBonus: number
): FlexMessage {
  // 生成 7 天的圓圈
  const dayCircles = [];
  for (let i = 1; i <= 7; i++) {
    const dayInWeek = ((streakDays - 1) % 7) + 1; // 目前在第幾天
    const completed = i <= (streakDays % 7 || 7);
    const isNext = i === (streakDays % 7 || 7) + 1;

    dayCircles.push({
      type: 'box' as const,
      layout: 'vertical' as const,
      contents: [{
        type: 'text' as const,
        text: String(i),
        size: 'xxs' as const,
        align: 'center' as const,
        color: completed ? '#FFFFFF' : (isNext ? '#b8a9e8' : '#CCCCCC'),
      }],
      width: '28px',
      height: '28px',
      cornerRadius: '14px',
      backgroundColor: completed ? '#4CAF50' : '#F0F0F0',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: isNext ? '1.5px' : '0px',
      borderColor: isNext ? '#b8a9e8' : undefined,
    });
  }

  return {
    type: 'flex',
    altText: `雪凜：連續 ${streakDays} 天了別斷掉啊`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'image',
            url: 'https://insight.snowrealm.pet/images/yukirin/yukirin-sad.png',
            size: 'xxs',
            aspectRatio: '1:1',
            aspectMode: 'cover',
            flex: 0,
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '雪凜', weight: 'bold', size: 'sm', color: '#b8a9e8' },
            ],
            paddingStart: '10px',
          },
        ],
        paddingAll: '12px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '欸你今天還沒來欸', size: 'sm', color: '#333333' },
          { type: 'text', text: `連續 ${streakDays} 天了別斷掉啊`, size: 'sm', color: '#333333', margin: 'sm' },
          tomorrowBonus > 0 ? {
            type: 'text' as const,
            text: `明天第 ${streakDays + 1} 天有加碼 +${tomorrowBonus} Z幣`,
            size: 'sm' as const,
            color: '#e8a828',
            margin: 'sm' as const,
          } : { type: 'filler' as const },
          {
            type: 'box',
            layout: 'horizontal',
            contents: dayCircles,
            spacing: 'sm',
            margin: 'lg',
            justifyContent: 'center',
            backgroundColor: '#F8F8F8',
            cornerRadius: '8px',
            paddingAll: '10px',
          },
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          action: {
            type: 'uri',
            label: '去 Insight 簽到',
            uri: 'https://insight.snowrealm.pet/',
          },
          style: 'primary',
          color: '#b8a9e8',
          height: 'sm',
        }],
        paddingAll: '12px',
      },
    },
  };
}

// 回歸提醒（久沒來）
function comebackNotification(
  daysSince: number,
  character: 'yukirin' | 'riku'
): FlexMessage {
  const isYukirin = character === 'yukirin';
  const lines = isYukirin
    ? [`你是不是把我忘了`, `我一個人顧了 ${daysSince} 天欸`, `最近有新問卷 快來看看`]
    : [`...${daysSince} 天沒來了`, `她一直在唸`, `有空回來看看`];
  const mood = isYukirin ? 'sad' : 'neutral';
  const color = isYukirin ? '#b8a9e8' : '#c94a4a';
  const name = isYukirin ? '雪凜' : '凜空';
  const avatarUrl = isYukirin
    ? 'https://insight.snowrealm.pet/images/yukirin/yukirin-sad.png'
    : 'https://insight.snowrealm.pet/images/riku/riku-neutral.png';

  return {
    type: 'flex',
    altText: `${name}：${lines[0]}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          { type: 'image', url: avatarUrl, size: 'xxs', aspectRatio: '1:1', aspectMode: 'cover', flex: 0 },
          {
            type: 'box', layout: 'vertical',
            contents: [{ type: 'text', text: name, weight: 'bold', size: 'sm', color }],
            paddingStart: '10px',
          },
        ],
        paddingAll: '12px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: lines.map(line => ({
          type: 'text' as const, text: line, size: 'sm' as const, color: '#333333', wrap: true, margin: 'sm' as const,
        })),
        paddingAll: '14px',
        paddingTop: '0px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          action: { type: 'uri', label: '回去看看', uri: 'https://insight.snowrealm.pet/' },
          style: 'primary',
          color,
          height: 'sm',
        }],
        paddingAll: '12px',
      },
    },
  };
}
```

---

## 七、新問卷上架通知

```typescript
function newSurveyNotification(
  survey: {
    title: string;
    duration: string;      // '3 分鐘'
    completedCount: number;
    tags: string[];
    id: string;
  },
  character: 'yukirin' | 'riku'
): FlexMessage {
  const isYukirin = character === 'yukirin';
  const line = isYukirin ? '新問卷來了！這份蠻適合你的' : '新問卷...可以看看';
  const color = isYukirin ? '#b8a9e8' : '#c94a4a';
  const name = isYukirin ? '雪凜' : '凜空';
  const mood = isYukirin ? 'happy' : 'neutral';
  const avatarUrl = `https://insight.snowrealm.pet/images/${isYukirin ? 'yukirin' : 'riku'}/${isYukirin ? 'yukirin' : 'riku'}-${mood}.png`;

  return {
    type: 'flex',
    altText: `${name}：新問卷「${survey.title}」`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          { type: 'image', url: avatarUrl, size: 'xxs', aspectRatio: '1:1', aspectMode: 'cover', flex: 0 },
          {
            type: 'box', layout: 'vertical',
            contents: [{ type: 'text', text: name, weight: 'bold', size: 'sm', color }],
            paddingStart: '10px',
          },
        ],
        paddingAll: '12px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: line, size: 'sm', color: '#333333' },
          // 問卷卡片
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: survey.title, size: 'md', weight: 'bold', wrap: true },
              { type: 'text', text: `${survey.duration} · 已有 ${survey.completedCount} 人填過`, size: 'xs', color: '#999999', margin: 'sm' },
              {
                type: 'box',
                layout: 'horizontal',
                contents: survey.tags.slice(0, 3).map(tag => ({
                  type: 'box' as const,
                  layout: 'vertical' as const,
                  contents: [{ type: 'text' as const, text: tag, size: 'xxs' as const, color, align: 'center' as const }],
                  backgroundColor: isYukirin ? '#F0EDFF' : '#FFF0F0',
                  cornerRadius: '8px',
                  paddingAll: '3px',
                  paddingStart: '8px',
                  paddingEnd: '8px',
                  flex: 0,
                })),
                spacing: 'sm',
                margin: 'md',
              },
            ],
            backgroundColor: '#F8F8F8',
            cornerRadius: '8px',
            paddingAll: '12px',
            margin: 'md',
          },
        ],
        paddingAll: '14px',
        paddingTop: '0px',
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'button',
            action: { type: 'uri', label: '去填填看', uri: `https://insight.snowrealm.pet/survey/${survey.id}` },
            style: 'primary',
            color,
            height: 'sm',
            flex: 1,
          },
          {
            type: 'button',
            action: { type: 'message', label: '之後再說', text: '之後再說' },
            style: 'secondary',
            height: 'sm',
            flex: 1,
          },
        ],
        spacing: 'sm',
        paddingAll: '12px',
      },
    },
  };
}
```

---

## 八、管理員告警通知

```typescript
function adminAlertNotification(
  alert: {
    level: 'info' | 'warning' | 'critical';
    title: string;
    details: Record<string, string>;
    action?: string;
    targetUserId?: string;
  }
): FlexMessage {
  const colors = {
    info: { bg: '#E3F2FD', text: '#1565C0', bar: '#2196F3' },
    warning: { bg: '#FFF8E1', text: '#E65100', bar: '#FF9800' },
    critical: { bg: '#FFEBEE', text: '#C62828', bar: '#F44336' },
  };
  const c = colors[alert.level];
  const emoji = { info: 'ℹ️', warning: '⚠️', critical: '🚨' };

  return {
    type: 'flex',
    altText: `${emoji[alert.level]} ${alert.title}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'horizontal',
        backgroundColor: c.bg,
        contents: [
          {
            type: 'image',
            url: 'https://insight.snowrealm.pet/images/system/snowrealm-logo.png',
            size: 'xxs',
            aspectRatio: '1:1',
            aspectMode: 'cover',
            flex: 0,
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '系統告警', weight: 'bold', size: 'sm', color: c.text },
              { type: 'text', text: alert.level.toUpperCase(), size: 'xxs', color: c.text },
            ],
            paddingStart: '10px',
          },
        ],
        paddingAll: '14px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: alert.title, size: 'md', weight: 'bold', color: c.text, wrap: true },
          // 動態 key-value 列
          ...Object.entries(alert.details).map(([key, value]) => ({
            type: 'box' as const,
            layout: 'horizontal' as const,
            contents: [
              { type: 'text' as const, text: key, size: 'sm' as const, color: '#999999', flex: 1 },
              { type: 'text' as const, text: value, size: 'sm' as const, weight: 'bold' as const, align: 'end' as const, flex: 0, color: key === '風險分數' ? c.text : '#333333' },
            ],
            margin: 'sm' as const,
          })),
          // 建議動作
          ...(alert.action ? [{
            type: 'text' as const,
            text: `建議：${alert.action}`,
            size: 'xs' as const,
            color: '#999999',
            margin: 'lg' as const,
            wrap: true,
          }] : []),
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          ...(alert.targetUserId ? [{
            type: 'button' as const,
            action: {
              type: 'uri' as const,
              label: '確認封鎖',
              uri: `https://insight.snowrealm.pet/admin/users/${alert.targetUserId}`,
            },
            style: 'primary' as const,
            color: c.bar,
            height: 'sm' as const,
            flex: 1,
          }] : []),
          {
            type: 'button' as const,
            action: {
              type: 'uri' as const,
              label: '進入後台',
              uri: 'https://insight.snowrealm.pet/admin/security',
            },
            style: 'secondary' as const,
            height: 'sm' as const,
            flex: 1,
          },
        ],
        spacing: 'sm',
        paddingAll: '12px',
      },
    },
  };
}
```

---

## 九、統一發送函式

```typescript
// lib/line/pushManager.ts

import { Client as LineClient } from '@line/bot-sdk';

const lineClient = new LineClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

// 根據使用者的 LINE ID 發送 Flex Message
async function pushLineNotification(
  userId: string,
  flexMessage: FlexMessage
) {
  const supabase = await createClient();

  // 1. 取得使用者的 LINE ID
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('line_user_id, notification_prefs')
    .eq('user_id', userId)
    .single();

  if (!profile?.line_user_id) return; // 沒綁 LINE

  // 2. 檢查通知偏好
  const prefs = profile.notification_prefs || {};
  if (prefs.proactive_enabled === false) return; // 使用者關閉了

  // 3. 檢查安靜時間
  const hour = new Date().getHours();
  const quietStart = prefs.quiet_hours_start || 22;
  const quietEnd = prefs.quiet_hours_end || 8;
  if (hour >= quietStart || hour < quietEnd) return; // 安靜時間不發

  // 4. 發送
  await lineClient.pushMessage(profile.line_user_id, flexMessage);

  // 5. 記錄
  await supabase.from('push_log').insert({
    user_id: userId,
    channel: 'line',
    message: flexMessage.altText,
    trigger_type: flexMessage.altText.split('：')[0],
  });
}

// 管理員告警（不受安靜時間限制）
async function pushAdminAlert(flexMessage: FlexMessage) {
  const supabase = await createClient();

  const { data: admins } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('is_active', true);

  for (const admin of admins || []) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('line_user_id')
      .eq('user_id', admin.user_id)
      .single();

    if (profile?.line_user_id) {
      await lineClient.pushMessage(profile.line_user_id, flexMessage);
    }
  }
}
```

---

## 十、使用範例

```typescript
// 各場景呼叫範例

// 1. 雪凜聊天回覆
await pushLineNotification(userId, yukirinChatReply(
  ['你有 280 Z幣喔', '要不要去商城看看', '最近有新的貼圖包還不錯'],
  'happy',
  [
    { label: '去商城逛逛', uri: 'https://insight.snowrealm.pet/shop' },
    { label: '繼續聊天', uri: 'https://insight.snowrealm.pet/guide' },
  ]
));

// 2. Z 幣獲得
await pushLineNotification(userId, zcoinNotification(
  'earn', 5, 285, '分享問卷成功',
  { name: '雪凜聖誕裝', price: 500 }
));

// 3. 故事卡
await pushLineNotification(userId, storyCardNotification(
  '你最被低估的，是觀察力',
  '你早就看懂很多事了，只是習慣不說。',
  ['共感力超強', '直覺型', '溫柔守護者'],
  undefined,
  'result_abc123'
));

// 4. 週報
await pushLineNotification(userId, weeklyReportNotification(
  { surveysCompleted: 3, zcoinEarned: 47, storiesLiked: 12, streakDays: 7 },
  '你的觀察力指數上升了 8 分，比上次更敏銳了欸',
  '活躍度 ↑15% · 社群互動 ↑25%',
  '3/24 - 3/30'
));

// 5. 成就
await pushLineNotification(userId, achievementNotification(
  '故事達人', '發佈了 10 篇故事', 50, '3%', '🏆'
));

// 6. 連續登入提醒
await pushLineNotification(userId, streakReminderNotification(6, 5));

// 7. 回歸提醒
await pushLineNotification(userId, comebackNotification(5, 'yukirin'));

// 8. 新問卷
await pushLineNotification(userId, newSurveyNotification({
  title: '你的壓力來自哪裡？',
  duration: '3 分鐘',
  completedCount: 847,
  tags: ['心理探索', '熱門'],
  id: 'survey_xyz',
}, 'yukirin'));

// 9. 管理員告警
await pushAdminAlert(adminAlertNotification({
  level: 'critical',
  title: '帳號異常封鎖',
  details: {
    '使用者': 'user_xyz',
    '原因': '多帳號偵測',
    '風險分數': '92',
    '關聯帳號': '3 個',
    '時間': '09:28',
  },
  action: '確認是否誤判',
  targetUserId: 'user_xyz',
}));
```
---

## 通用工具函式

```typescript
// lib/line/flexHelpers.ts

// 漸層色 icon 生成器（暫替圖片用）
// LINE Flex 不支援漸層，用純色 + emoji 代替
function makeIconHeader(
  emoji: string,
  title: string,
  subtitle: string,
  bgColor: string,
  textColor: string
) {
  return {
    type: 'box',
    layout: 'horizontal',
    backgroundColor: bgColor,
    contents: [
      {
        type: 'box',
        layout: 'vertical',
        contents: [{ type: 'text', text: emoji, size: 'xl', align: 'center' }],
        width: '40px',
        height: '40px',
        cornerRadius: '20px',
        backgroundColor: '#FFFFFF33',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 0,
      },
      {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: title, weight: 'bold', size: 'sm', color: textColor },
          { type: 'text', text: subtitle, size: 'xxs', color: textColor + 'CC' },
        ],
        paddingStart: '12px',
      },
    ],
    paddingAll: '14px',
  };
}

function makeStatRow(label: string, value: string, valueColor?: string) {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: label, size: 'sm', color: '#999999', flex: 1 },
      { type: 'text', text: value, size: 'sm', weight: 'bold', align: 'end', flex: 0, color: valueColor || '#333333' },
    ],
    margin: 'sm',
  };
}

function makeButton(label: string, uri: string, color: string, style: 'primary' | 'secondary' | 'link' = 'primary') {
  return {
    type: 'button',
    action: { type: 'uri', label, uri },
    style,
    color: style === 'secondary' ? undefined : color,
    height: 'sm',
    flex: 1,
  };
}
```

---

## 一、Official Bot — 用戶端通知（6 種）

### 1.1 客服工單回覆

```typescript
function supportTicketReply(
  ticketTitle: string,
  replyPreview: string,
  ticketId: string
): FlexMessage {
  return {
    type: 'flex',
    altText: `客服回覆：${ticketTitle}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: makeIconHeader('💬', '客服回覆', '你的工單有新回覆', '#E8F5E9', '#2E7D32'),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: ticketTitle, size: 'sm', weight: 'bold', wrap: true },
              { type: 'text', text: replyPreview, size: 'xs', color: '#666666', wrap: true, margin: 'sm', maxLines: 3 },
            ],
            backgroundColor: '#F8F8F8',
            cornerRadius: '8px',
            paddingAll: '12px',
          },
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [makeButton('查看完整回覆', `https://insight.snowrealm.pet/support/${ticketId}`, '#4CAF50')],
        paddingAll: '12px',
      },
    },
  };
}
```

### 1.2 試用到期提醒

```typescript
function trialExpiringNotification(
  daysLeft: number,
  planName: string
): FlexMessage {
  const isUrgent = daysLeft <= 1;
  const bgColor = isUrgent ? '#FFF3E0' : '#E3F2FD';
  const textColor = isUrgent ? '#E65100' : '#1565C0';
  const emoji = isUrgent ? '⏰' : '📋';

  return {
    type: 'flex',
    altText: `試用即將到期：還剩 ${daysLeft} 天`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: makeIconHeader(emoji, '試用到期提醒', `${planName} 方案`, bgColor, textColor),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: daysLeft === 0
              ? '你的試用今天到期！'
              : `你的試用還剩 ${daysLeft} 天`,
            size: 'md',
            weight: 'bold',
            wrap: true,
          },
          {
            type: 'text',
            text: '升級後可以繼續使用所有 Pro 功能',
            size: 'xs',
            color: '#999999',
            margin: 'sm',
          },
          // 進度條
          {
            type: 'box',
            layout: 'vertical',
            contents: [{
              type: 'box',
              layout: 'vertical',
              contents: [{ type: 'filler' }],
              width: `${Math.max(100 - (daysLeft / 14 * 100), 5)}%`,
              backgroundColor: textColor,
              height: '4px',
              cornerRadius: '2px',
            }],
            backgroundColor: '#EEEEEE',
            height: '4px',
            cornerRadius: '2px',
            margin: 'lg',
          },
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          makeButton('立即升級', 'https://insight.snowrealm.pet/pricing', textColor),
          makeButton('之後再說', 'https://insight.snowrealm.pet/', '#999999', 'secondary'),
        ],
        spacing: 'sm',
        paddingAll: '12px',
      },
    },
  };
}
```

### 1.3 訂閱付款成功

```typescript
function subscriptionPaymentSuccess(
  planName: string,
  amount: number,
  nextBillingDate: string,
  orderId: string
): FlexMessage {
  return {
    type: 'flex',
    altText: `付款成功：${planName}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: makeIconHeader('✅', '付款成功', '訂閱確認', '#E8F5E9', '#2E7D32'),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          makeStatRow('方案', planName),
          makeStatRow('金額', `NT$${amount}`),
          makeStatRow('訂單號', orderId),
          makeStatRow('下次扣款', nextBillingDate),
          { type: 'separator', margin: 'lg' },
          {
            type: 'text',
            text: '感謝你的支持！所有 Pro 功能已開通',
            size: 'xs',
            color: '#4CAF50',
            margin: 'lg',
            wrap: true,
          },
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [makeButton('查看訂單', `https://insight.snowrealm.pet/profile#orders`, '#4CAF50')],
        paddingAll: '12px',
      },
    },
  };
}
```

### 1.4 好友加入通知

```typescript
function friendJoinedNotification(
  friendName: string,
  referralReward: number
): FlexMessage {
  return {
    type: 'flex',
    altText: `${friendName} 加入了 Insight！`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: makeIconHeader('🎉', '好友加入', '你的推薦成功了', '#F3E5F5', '#7B1FA2'),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${friendName} 透過你的邀請加入了！`,
            size: 'sm',
            weight: 'bold',
            wrap: true,
          },
          {
            type: 'text',
            text: `已完成第一份問卷`,
            size: 'xs',
            color: '#999999',
            margin: 'sm',
          },
          { type: 'separator', margin: 'lg' },
          makeStatRow('推薦獎勵', `+${referralReward} Z幣`, '#e8a828'),
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          makeButton('繼續邀請朋友', 'https://insight.snowrealm.pet/invite', '#7B1FA2'),
          makeButton('查看 Z 幣', 'https://insight.snowrealm.pet/profile#zcoin', '#999999', 'secondary'),
        ],
        spacing: 'sm',
        paddingAll: '12px',
      },
    },
  };
}
```

### 1.5 問卷截止提醒

```typescript
function surveyDeadlineReminder(
  surveyTitle: string,
  hoursLeft: number,
  surveyId: string,
  progress: number  // 0-100 填了多少
): FlexMessage {
  const isUrgent = hoursLeft <= 24;

  return {
    type: 'flex',
    altText: `問卷即將截止：${surveyTitle}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: makeIconHeader(
        isUrgent ? '🔥' : '⏰',
        '問卷截止提醒',
        isUrgent ? `剩不到 ${hoursLeft} 小時！` : `還有 ${Math.ceil(hoursLeft / 24)} 天`,
        isUrgent ? '#FFF3E0' : '#E3F2FD',
        isUrgent ? '#E65100' : '#1565C0'
      ),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: surveyTitle, size: 'sm', weight: 'bold', wrap: true },
              {
                type: 'text',
                text: progress > 0
                  ? `你已經填了 ${progress}%，差一點就完成了！`
                  : '你還沒開始填喔',
                size: 'xs',
                color: '#999999',
                margin: 'sm',
                wrap: true,
              },
            ],
            backgroundColor: '#F8F8F8',
            cornerRadius: '8px',
            paddingAll: '12px',
          },
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [makeButton(
          progress > 0 ? '繼續填寫' : '去填問卷',
          `https://insight.snowrealm.pet/survey/${surveyId}`,
          isUrgent ? '#E65100' : '#1565C0'
        )],
        paddingAll: '12px',
      },
    },
  };
}
```

### 1.6 Z 幣餘額不足警告

```typescript
function zcoinLowBalanceAlert(
  balance: number,
  threshold: number
): FlexMessage {
  return {
    type: 'flex',
    altText: `Z 幣餘額不足：${balance}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: makeIconHeader('🐹', '招財提醒', 'Z 幣餘額偏低', '#FFF8E1', '#F57F17'),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `你的 Z 幣只剩 ${balance} 了`,
            size: 'sm',
            weight: 'bold',
          },
          {
            type: 'text',
            text: '招財替你擔心中...',
            size: 'xs',
            color: '#999999',
            margin: 'sm',
          },
          { type: 'separator', margin: 'lg' },
          {
            type: 'text',
            text: '賺 Z 幣的方式：',
            size: 'xs',
            color: '#666666',
            margin: 'lg',
          },
          { type: 'text', text: '· 填問卷 +3', size: 'xs', color: '#999999', margin: 'sm' },
          { type: 'text', text: '· 分享結果 +5', size: 'xs', color: '#999999', margin: 'xs' },
          { type: 'text', text: '· 每日任務 +9', size: 'xs', color: '#999999', margin: 'xs' },
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          makeButton('去賺 Z 幣', 'https://insight.snowrealm.pet/', '#F57F17'),
          makeButton('儲值', 'https://insight.snowrealm.pet/topup', '#999999', 'secondary'),
        ],
        spacing: 'sm',
        paddingAll: '12px',
      },
    },
  };
}
```

---

## 二、Insight Bot — 管理員端通知（5 種）

### 2.1 第一筆回覆

```typescript
function firstResponseNotification(
  surveyTitle: string,
  respondentName: string,
  surveyId: string
): FlexMessage {
  return {
    type: 'flex',
    altText: `🎉 「${surveyTitle}」收到第一筆回覆！`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: makeIconHeader('🎉', '第一筆回覆！', surveyTitle, '#E8F5E9', '#2E7D32'),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${respondentName} 剛完成了問卷`,
            size: 'sm',
            wrap: true,
          },
          {
            type: 'text',
            text: '你的問卷開始收到回覆了！',
            size: 'xs',
            color: '#4CAF50',
            margin: 'sm',
          },
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          makeButton('查看回覆', `https://insight.snowrealm.pet/admin/surveys/${surveyId}/responses`, '#4CAF50'),
          makeButton('分享問卷', `https://insight.snowrealm.pet/share/survey/${surveyId}`, '#999999', 'secondary'),
        ],
        spacing: 'sm',
        paddingAll: '12px',
      },
    },
  };
}
```

### 2.2 回覆里程碑

```typescript
function responseMilestoneNotification(
  surveyTitle: string,
  count: number,  // 100, 500, 1000
  surveyId: string
): FlexMessage {
  return {
    type: 'flex',
    altText: `🏆 「${surveyTitle}」達到 ${count} 筆回覆！`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: makeIconHeader('🏆', '回覆里程碑', `${count} 筆達成！`, '#FFF8E1', '#F57F17'),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: surveyTitle, size: 'sm', weight: 'bold', wrap: true },
          {
            type: 'text',
            text: `已收到 ${count} 筆回覆`,
            size: 'xl',
            weight: 'bold',
            color: '#F57F17',
            margin: 'md',
            align: 'center',
          },
          {
            type: 'text',
            text: count >= 300 ? '數據量足夠跑統計分析了！' : `再收集 ${300 - count} 筆就能跑統計分析`,
            size: 'xs',
            color: '#999999',
            margin: 'sm',
            align: 'center',
          },
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          makeButton('查看數據', `https://insight.snowrealm.pet/admin/surveys/${surveyId}/analytics`, '#F57F17'),
          makeButton('跑 AI 分析', `https://insight.snowrealm.pet/admin/surveys/${surveyId}/ai-insight`, '#999999', 'secondary'),
        ],
        spacing: 'sm',
        paddingAll: '12px',
      },
    },
  };
}
```

### 2.3 每日摘要

```typescript
function dailyDigestNotification(
  stats: {
    dau: number;
    newUsers: number;
    responsesToday: number;
    revenueToday: number;
    aiCostToday: number;
    pendingReports: number;
  },
  date: string
): FlexMessage {
  return {
    type: 'flex',
    altText: `📊 每日摘要 ${date}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: makeIconHeader('📊', '每日摘要', date, '#E3F2FD', '#1565C0'),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          // 四宮格
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box', layout: 'vertical',
                contents: [
                  { type: 'text', text: String(stats.dau), size: 'lg', weight: 'bold', align: 'center' },
                  { type: 'text', text: 'DAU', size: 'xxs', color: '#999999', align: 'center' },
                ],
                backgroundColor: '#F8F8F8', cornerRadius: '8px', paddingAll: '8px', flex: 1,
              },
              {
                type: 'box', layout: 'vertical',
                contents: [
                  { type: 'text', text: String(stats.newUsers), size: 'lg', weight: 'bold', align: 'center', color: '#4CAF50' },
                  { type: 'text', text: '新註冊', size: 'xxs', color: '#999999', align: 'center' },
                ],
                backgroundColor: '#F8F8F8', cornerRadius: '8px', paddingAll: '8px', flex: 1, margin: 'sm',
              },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box', layout: 'vertical',
                contents: [
                  { type: 'text', text: String(stats.responsesToday), size: 'lg', weight: 'bold', align: 'center' },
                  { type: 'text', text: '回覆數', size: 'xxs', color: '#999999', align: 'center' },
                ],
                backgroundColor: '#F8F8F8', cornerRadius: '8px', paddingAll: '8px', flex: 1,
              },
              {
                type: 'box', layout: 'vertical',
                contents: [
                  { type: 'text', text: `NT$${stats.revenueToday}`, size: 'lg', weight: 'bold', align: 'center', color: '#e8a828' },
                  { type: 'text', text: '營收', size: 'xxs', color: '#999999', align: 'center' },
                ],
                backgroundColor: '#F8F8F8', cornerRadius: '8px', paddingAll: '8px', flex: 1, margin: 'sm',
              },
            ],
            margin: 'sm',
          },
          { type: 'separator', margin: 'lg' },
          makeStatRow('AI 成本', `$${stats.aiCostToday.toFixed(2)} USD`),
          makeStatRow('待處理檢舉', String(stats.pendingReports), stats.pendingReports > 0 ? '#F44336' : '#4CAF50'),
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [makeButton('進入後台', 'https://insight.snowrealm.pet/admin', '#1565C0')],
        paddingAll: '12px',
      },
    },
  };
}
```

### 2.4 高棄卷率預警

```typescript
function highAbandonmentAlert(
  surveyTitle: string,
  abandonRate: number,
  totalStarts: number,
  totalCompletes: number,
  surveyId: string
): FlexMessage {
  const isHighRisk = abandonRate > 50;

  return {
    type: 'flex',
    altText: `⚠️ 「${surveyTitle}」棄卷率 ${abandonRate}%`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: makeIconHeader(
        isHighRisk ? '🔴' : '🟡',
        '高棄卷率預警',
        surveyTitle,
        isHighRisk ? '#FFEBEE' : '#FFF8E1',
        isHighRisk ? '#C62828' : '#F57F17'
      ),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `棄卷率 ${abandonRate}%`,
            size: 'xl',
            weight: 'bold',
            color: isHighRisk ? '#C62828' : '#F57F17',
            align: 'center',
          },
          // 進度條（完成 vs 放棄）
          {
            type: 'box',
            layout: 'vertical',
            contents: [{
              type: 'box', layout: 'vertical',
              contents: [{ type: 'filler' }],
              width: `${100 - abandonRate}%`,
              backgroundColor: '#4CAF50',
              height: '6px',
              cornerRadius: '3px',
            }],
            backgroundColor: isHighRisk ? '#EF9A9A' : '#FFE082',
            height: '6px',
            cornerRadius: '3px',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: `完成 ${totalCompletes}`, size: 'xxs', color: '#4CAF50' },
              { type: 'text', text: `放棄 ${totalStarts - totalCompletes}`, size: 'xxs', color: '#999999', align: 'end' },
            ],
            margin: 'sm',
          },
          { type: 'separator', margin: 'lg' },
          {
            type: 'text',
            text: abandonRate > 50
              ? '建議：檢查問卷長度或題目難度'
              : '建議：持續觀察，可能是正常範圍',
            size: 'xs',
            color: '#999999',
            margin: 'md',
            wrap: true,
          },
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          makeButton('查看問卷', `https://insight.snowrealm.pet/admin/surveys/${surveyId}`, isHighRisk ? '#C62828' : '#F57F17'),
          makeButton('編輯問卷', `https://insight.snowrealm.pet/admin/surveys/${surveyId}/edit`, '#999999', 'secondary'),
        ],
        spacing: 'sm',
        paddingAll: '12px',
      },
    },
  };
}
```

### 2.5 新客服工單

```typescript
function newSupportTicketNotification(
  ticketTitle: string,
  userName: string,
  priority: 'low' | 'normal' | 'high' | 'urgent',
  ticketId: string
): FlexMessage {
  const priorityConfig = {
    low: { emoji: '🟢', color: '#4CAF50', label: '低' },
    normal: { emoji: '🟡', color: '#FF9800', label: '一般' },
    high: { emoji: '🟠', color: '#E65100', label: '高' },
    urgent: { emoji: '🔴', color: '#C62828', label: '緊急' },
  };
  const p = priorityConfig[priority];

  return {
    type: 'flex',
    altText: `${p.emoji} 新客服工單：${ticketTitle}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: makeIconHeader('🎫', '新客服工單', `優先級：${p.label}`, '#F3E5F5', '#7B1FA2'),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: ticketTitle, size: 'sm', weight: 'bold', wrap: true },
          makeStatRow('提交者', userName),
          makeStatRow('優先級', `${p.emoji} ${p.label}`, p.color),
          makeStatRow('工單號', ticketId),
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [makeButton('處理工單', `https://insight.snowrealm.pet/admin/support/${ticketId}`, '#7B1FA2')],
        paddingAll: '12px',
      },
    },
  };
}
```

---

## 三、INSIGHT_EXT Bot — B2B 租戶端通知（3 種）

### 3.1 AI 報告生成完成

```typescript
function aiReportCompleteNotification(
  reportType: 'insight' | 'story' | 'sentiment',
  surveyTitle: string,
  tenantName: string,
  reportId: string
): FlexMessage {
  const typeConfig = {
    insight: { emoji: '📊', label: '數據洞察報告', color: '#1565C0', bg: '#E3F2FD' },
    story: { emoji: '📖', label: '故事洞察報告', color: '#7B1FA2', bg: '#F3E5F5' },
    sentiment: { emoji: '💭', label: '情感分析報告', color: '#00695C', bg: '#E0F2F1' },
  };
  const t = typeConfig[reportType];

  return {
    type: 'flex',
    altText: `${t.emoji} ${t.label}已生成：${surveyTitle}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: makeIconHeader(t.emoji, t.label, `${tenantName}`, t.bg, t.color),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: surveyTitle, size: 'sm', weight: 'bold', wrap: true },
          {
            type: 'text',
            text: 'AI 分析已完成，報告可以查看了',
            size: 'xs',
            color: '#999999',
            margin: 'sm',
          },
          makeStatRow('報告類型', t.label),
          makeStatRow('生成時間', new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })),
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [makeButton('查看報告', `https://insight.snowrealm.pet/reports/${reportId}`, t.color)],
        paddingAll: '12px',
      },
    },
  };
}
```

### 3.2 平台公告

```typescript
function platformAnnouncementNotification(
  title: string,
  content: string,
  announcementId: string,
  level: 'info' | 'update' | 'maintenance'
): FlexMessage {
  const levelConfig = {
    info: { emoji: 'ℹ️', color: '#1565C0', bg: '#E3F2FD', label: '公告' },
    update: { emoji: '🆕', color: '#2E7D32', bg: '#E8F5E9', label: '更新' },
    maintenance: { emoji: '🔧', color: '#E65100', bg: '#FFF3E0', label: '維護通知' },
  };
  const l = levelConfig[level];

  return {
    type: 'flex',
    altText: `${l.emoji} ${l.label}：${title}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: makeIconHeader(l.emoji, `SnowRealm ${l.label}`, 'insight.snowrealm.pet', l.bg, l.color),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: title, size: 'md', weight: 'bold', wrap: true },
          { type: 'text', text: content, size: 'sm', color: '#666666', wrap: true, margin: 'md', maxLines: 5 },
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [makeButton('查看詳情', `https://insight.snowrealm.pet/announcements/${announcementId}`, l.color)],
        paddingAll: '12px',
      },
    },
  };
}
```

### 3.3 租戶問卷里程碑

```typescript
function tenantSurveyMilestoneNotification(
  tenantName: string,
  surveyTitle: string,
  target: number,
  current: number,
  surveyId: string
): FlexMessage {
  const achieved = current >= target;

  return {
    type: 'flex',
    altText: achieved
      ? `🎯 「${surveyTitle}」達成 ${target} 筆目標！`
      : `📈 「${surveyTitle}」已達 ${current}/${target} 筆`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: makeIconHeader(
        achieved ? '🎯' : '📈',
        achieved ? '目標達成！' : '問卷進度更新',
        tenantName,
        achieved ? '#E8F5E9' : '#E3F2FD',
        achieved ? '#2E7D32' : '#1565C0'
      ),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: surveyTitle, size: 'sm', weight: 'bold', wrap: true },
          {
            type: 'text',
            text: `${current} / ${target} 筆`,
            size: 'xl',
            weight: 'bold',
            color: achieved ? '#2E7D32' : '#1565C0',
            align: 'center',
            margin: 'md',
          },
          // 進度條
          {
            type: 'box',
            layout: 'vertical',
            contents: [{
              type: 'box', layout: 'vertical',
              contents: [{ type: 'filler' }],
              width: `${Math.min(Math.round(current / target * 100), 100)}%`,
              backgroundColor: achieved ? '#4CAF50' : '#1565C0',
              height: '6px',
              cornerRadius: '3px',
            }],
            backgroundColor: '#EEEEEE',
            height: '6px',
            cornerRadius: '3px',
            margin: 'sm',
          },
          {
            type: 'text',
            text: achieved
              ? '回覆目標已達成！可以開始分析了'
              : `還差 ${target - current} 筆達成目標`,
            size: 'xs',
            color: '#999999',
            margin: 'md',
            align: 'center',
          },
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          makeButton('查看結果', `https://insight.snowrealm.pet/surveys/${surveyId}/results`, achieved ? '#2E7D32' : '#1565C0'),
          ...(achieved ? [makeButton('跑 AI 分析', `https://insight.snowrealm.pet/surveys/${surveyId}/ai`, '#999999', 'secondary')] : []),
        ],
        spacing: 'sm',
        paddingAll: '12px',
      },
    },
  };
}
```

---

## 四、完整通知清單總覽

```
Official Bot（用戶端）— 14 種：
  ✅ 雪凜聊天回覆          LINE-Notification-Templates.md
  ✅ Z 幣獲得/消費         LINE-Notification-Templates.md
  ✅ 問卷結果/故事卡       LINE-Notification-Templates.md
  ✅ 週報卡片              LINE-Notification-Templates.md
  ✅ 成就解鎖              LINE-Notification-Templates.md
  ✅ 連續登入/回歸提醒     LINE-Notification-Templates.md
  ✅ 新問卷上架            LINE-Notification-Templates.md
  ✅ 管理員告警            LINE-Notification-Templates.md
  ✅ 客服工單回覆          本檔案
  ✅ 試用到期提醒          本檔案
  ✅ 訂閱付款成功          本檔案
  ✅ 好友加入通知          本檔案
  ✅ 問卷截止提醒          本檔案
  ✅ Z幣餘額不足警告       本檔案

Insight Bot（管理員端）— 5 種：
  ✅ 第一筆回覆            本檔案
  ✅ 回覆里程碑            本檔案
  ✅ 每日摘要              本檔案
  ✅ 高棄卷率預警          本檔案
  ✅ 新客服工單            本檔案

INSIGHT_EXT Bot（B2B 租戶端）— 3 種：
  ✅ AI 報告生成完成       本檔案
  ✅ 平台公告              本檔案
  ✅ 租戶問卷里程碑        本檔案

總計：22 種通知樣式
```
