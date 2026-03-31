/**
 * LINE Flex Message 通知樣式模板
 *
 * 22 種通知 × 三端 Bot × 角色頭像系統
 * 官方圖片 URL 前綴：https://insight.snowrealm.pet/images/
 *
 * 設計版本：v2.0 | 2026-03-31
 */

import type { LineMessage } from '@/lib/line'

// ─── 型別 ────────────────────────────────────────────────────────────────────

type FlexMessage = LineMessage

// ─── 一、角色聊天回覆 ─────────────────────────────────────────────────────────

/** 雪凜聊天回覆 Flex */
export function yukirinChatReply(
  text: string[],
  mood: string,
  buttons?: { label: string; uri: string }[]
): FlexMessage {
  const avatarUrl = `https://insight.snowrealm.pet/images/yukirin/yukirin-${mood}.png`

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
          { type: 'image', url: avatarUrl, size: 'xxs', aspectRatio: '1:1', aspectMode: 'cover', flex: 0 },
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
          color: '#b8a9e8',
          height: 'sm',
        })),
        spacing: 'sm',
        paddingAll: '12px',
      } : undefined,
    },
  }
}

/** 凜空聊天回覆 Flex */
export function rikuChatReply(
  text: string[],
  mood: string,
  buttons?: { label: string; uri: string }[]
): FlexMessage {
  const avatarUrl = `https://insight.snowrealm.pet/images/riku/riku-${mood}.png`

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
          { type: 'image', url: avatarUrl, size: 'xxs', aspectRatio: '1:1', aspectMode: 'cover', flex: 0 },
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
  }
}

// ─── 二、Z 幣通知 ─────────────────────────────────────────────────────────────

export function zcoinNotification(
  type: 'earn' | 'spend' | 'topup',
  amount: number,
  balance: number,
  description: string,
  goalItem?: { name: string; price: number }
): FlexMessage {
  const isPositive = type !== 'spend'
  const accentColor = isPositive ? '#e8a828' : '#999999'
  const bgColor = isPositive ? '#FFF8E8' : '#F5F5F5'
  const zaicaiMood = isPositive ? 'happy' : 'sad'

  const progressBar = goalItem ? [{
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
    margin: 'md' as const,
  }, {
    type: 'text' as const,
    text: `距離「${goalItem.name}」還差 ${Math.max(goalItem.price - balance, 0)} Z幣`,
    size: 'xxs' as const,
    color: '#999999',
    margin: 'sm' as const,
  }] : []

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
            size: 'xxs', aspectRatio: '1:1', aspectMode: 'cover', flex: 0,
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
            size: 'xl', weight: 'bold', color: accentColor, align: 'end', flex: 0,
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
          ...progressBar,
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          action: { type: 'uri', label: '查看 Z 幣明細', uri: 'https://insight.snowrealm.pet/profile#zcoin' },
          style: 'link',
          color: accentColor,
          height: 'sm',
        }],
        paddingAll: '8px',
      },
    },
  }
}

// ─── 三、問卷結果 / 故事卡 ────────────────────────────────────────────────────

export function storyCardNotification(
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
                size: 'xxs', aspectRatio: '1:1', aspectMode: 'cover', flex: 0,
              },
              {
                type: 'text',
                text: '雪凜說：你的結果出來了！',
                size: 'xs', color: '#b8a9e8', weight: 'bold', flex: 1, margin: 'sm',
              },
            ],
          },
          { type: 'text', text: title, weight: 'bold', size: 'lg', margin: 'md', wrap: true },
          { type: 'text', text: subtitle, size: 'sm', color: '#888888', wrap: true, margin: 'sm' },
          {
            type: 'box',
            layout: 'horizontal',
            contents: tags.map(tag => ({
              type: 'box' as const,
              layout: 'vertical' as const,
              contents: [{ type: 'text' as const, text: tag, size: 'xxs' as const, color: '#b8a9e8', align: 'center' as const }],
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
            action: { type: 'uri', label: '查看完整結果', uri: `https://insight.snowrealm.pet/done?id=${resultId || ''}` },
            style: 'primary', color: '#b8a9e8', height: 'sm', flex: 1,
          },
          {
            type: 'button',
            action: { type: 'uri', label: '分享給朋友', uri: `https://insight.snowrealm.pet/share?id=${resultId || ''}` },
            style: 'secondary', height: 'sm', flex: 1,
          },
        ],
        spacing: 'sm',
        paddingAll: '12px',
      },
    },
  }
}

// ─── 四、週報卡片 ─────────────────────────────────────────────────────────────

export function weeklyReportNotification(
  stats: { surveysCompleted: number; zcoinEarned: number; storiesLiked: number; streakDays: number },
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
            size: 'xxs', aspectRatio: '1:1', aspectMode: 'cover', flex: 0,
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
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box', layout: 'vertical',
                contents: [
                  { type: 'text', text: String(stats.surveysCompleted), size: 'xl', weight: 'bold', align: 'center' },
                  { type: 'text', text: '問卷完成', size: 'xxs', color: '#999999', align: 'center' },
                ],
                backgroundColor: '#F8F8F8', cornerRadius: '8px', paddingAll: '10px', flex: 1,
              },
              {
                type: 'box', layout: 'vertical',
                contents: [
                  { type: 'text', text: String(stats.zcoinEarned), size: 'xl', weight: 'bold', align: 'center', color: '#e8a828' },
                  { type: 'text', text: 'Z 幣獲得', size: 'xxs', color: '#999999', align: 'center' },
                ],
                backgroundColor: '#F8F8F8', cornerRadius: '8px', paddingAll: '10px', flex: 1, margin: 'sm',
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
                  { type: 'text', text: String(stats.storiesLiked), size: 'xl', weight: 'bold', align: 'center', color: '#e85d75' },
                  { type: 'text', text: '故事共鳴', size: 'xxs', color: '#999999', align: 'center' },
                ],
                backgroundColor: '#F8F8F8', cornerRadius: '8px', paddingAll: '10px', flex: 1,
              },
              {
                type: 'box', layout: 'vertical',
                contents: [
                  { type: 'text', text: String(stats.streakDays), size: 'xl', weight: 'bold', align: 'center', color: '#4CAF50' },
                  { type: 'text', text: '連續登入', size: 'xxs', color: '#999999', align: 'center' },
                ],
                backgroundColor: '#F8F8F8', cornerRadius: '8px', paddingAll: '10px', flex: 1, margin: 'sm',
              },
            ],
            margin: 'sm',
          },
          { type: 'separator', margin: 'lg' },
          { type: 'text', text: `「${highlight}」`, size: 'sm', color: '#333333', wrap: true, margin: 'lg', style: 'italic' },
          { type: 'text', text: changes, size: 'xs', color: '#999999', margin: 'sm' },
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'button',
            action: { type: 'uri', label: '看完整週報', uri: 'https://insight.snowrealm.pet/profile#weekly-report' },
            style: 'primary', color: '#b8a9e8', height: 'sm', flex: 1,
          },
          {
            type: 'button',
            action: { type: 'uri', label: '分享到 IG', uri: 'https://insight.snowrealm.pet/share/weekly' },
            style: 'secondary', height: 'sm', flex: 1,
          },
        ],
        spacing: 'sm',
        paddingAll: '12px',
      },
    },
  }
}

// ─── 五、成就解鎖 ─────────────────────────────────────────────────────────────

export function achievementNotification(
  achievementName: string,
  description: string,
  zcoinReward: number,
  rarity: string,
  achievementIcon: string
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
            size: 'sm', aspectRatio: '1:1', aspectMode: 'cover',
          },
          { type: 'text', text: '成就解鎖！', size: 'md', weight: 'bold', color: '#FFFFFF', align: 'center' },
          { type: 'text', text: achievementName, size: 'xl', weight: 'bold', color: '#FFFFFF', align: 'center', margin: 'sm' },
          { type: 'text', text: description, size: 'xs', color: '#FFFFFFCC', align: 'center', margin: 'sm' },
        ],
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
            type: 'box', layout: 'horizontal',
            contents: [
              { type: 'text', text: '獎勵', size: 'sm', color: '#999999', flex: 1 },
              { type: 'text', text: `+${zcoinReward} Z幣`, size: 'sm', weight: 'bold', color: '#e8a828', align: 'end', flex: 0 },
            ],
          },
          {
            type: 'box', layout: 'horizontal',
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
        type: 'box', layout: 'vertical',
        contents: [{
          type: 'button',
          action: { type: 'uri', label: '查看所有成就', uri: 'https://insight.snowrealm.pet/profile#achievements' },
          style: 'primary', color: '#b8a9e8', height: 'sm',
        }],
        paddingAll: '12px',
      },
    },
  }
}

// ─── 六、連續登入提醒 / 回歸提醒 ─────────────────────────────────────────────

export function streakReminderNotification(
  streakDays: number,
  tomorrowBonus: number
): FlexMessage {
  const dayCircles = Array.from({ length: 7 }, (_, i) => {
    const day = i + 1
    const completed = day <= (streakDays % 7 || 7)
    const isNext = day === (streakDays % 7 || 7) + 1

    return {
      type: 'box' as const,
      layout: 'vertical' as const,
      contents: [{
        type: 'text' as const,
        text: String(day),
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
    }
  })

  return {
    type: 'flex',
    altText: `雪凜：連續 ${streakDays} 天了別斷掉啊`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'horizontal',
        contents: [
          { type: 'image', url: 'https://insight.snowrealm.pet/images/yukirin/yukirin-sad.png', size: 'xxs', aspectRatio: '1:1', aspectMode: 'cover', flex: 0 },
          {
            type: 'box', layout: 'vertical',
            contents: [{ type: 'text', text: '雪凜', weight: 'bold', size: 'sm', color: '#b8a9e8' }],
            paddingStart: '10px',
          },
        ],
        paddingAll: '12px',
      },
      body: {
        type: 'box', layout: 'vertical',
        contents: [
          { type: 'text', text: '欸你今天還沒來欸', size: 'sm', color: '#333333' },
          { type: 'text', text: `連續 ${streakDays} 天了別斷掉啊`, size: 'sm', color: '#333333', margin: 'sm' },
          ...(tomorrowBonus > 0 ? [{
            type: 'text' as const,
            text: `明天第 ${streakDays + 1} 天有加碼 +${tomorrowBonus} Z幣`,
            size: 'sm' as const, color: '#e8a828', margin: 'sm' as const,
          }] : []),
          {
            type: 'box', layout: 'horizontal',
            contents: dayCircles,
            spacing: 'sm', margin: 'lg',
            justifyContent: 'center',
            backgroundColor: '#F8F8F8', cornerRadius: '8px', paddingAll: '10px',
          },
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box', layout: 'vertical',
        contents: [{
          type: 'button',
          action: { type: 'uri', label: '去 Insight 簽到', uri: 'https://insight.snowrealm.pet/' },
          style: 'primary', color: '#b8a9e8', height: 'sm',
        }],
        paddingAll: '12px',
      },
    },
  }
}

export function comebackNotification(
  daysSince: number,
  character: 'yukirin' | 'riku'
): FlexMessage {
  const isYukirin = character === 'yukirin'
  const lines = isYukirin
    ? [`你是不是把我忘了`, `我一個人顧了 ${daysSince} 天欸`, `最近有新問卷 快來看看`]
    : [`...${daysSince} 天沒來了`, `她一直在唸`, `有空回來看看`]
  const color = isYukirin ? '#b8a9e8' : '#c94a4a'
  const name = isYukirin ? '雪凜' : '凜空'
  const avatarUrl = isYukirin
    ? 'https://insight.snowrealm.pet/images/yukirin/yukirin-sad.png'
    : 'https://insight.snowrealm.pet/images/riku/riku-neutral.png'

  return {
    type: 'flex',
    altText: `${name}：${lines[0]}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'horizontal',
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
        type: 'box', layout: 'vertical',
        contents: lines.map(line => ({
          type: 'text' as const, text: line, size: 'sm' as const, color: '#333333', wrap: true, margin: 'sm' as const,
        })),
        paddingAll: '14px', paddingTop: '0px',
      },
      footer: {
        type: 'box', layout: 'vertical',
        contents: [{
          type: 'button',
          action: { type: 'uri', label: '回去看看', uri: 'https://insight.snowrealm.pet/' },
          style: 'primary', color, height: 'sm',
        }],
        paddingAll: '12px',
      },
    },
  }
}

// ─── 七、新問卷上架通知 ───────────────────────────────────────────────────────

export function newSurveyNotification(
  survey: { title: string; duration: string; completedCount: number; tags: string[]; id: string },
  character: 'yukirin' | 'riku' = 'yukirin'
): FlexMessage {
  const isYukirin = character === 'yukirin'
  const line = isYukirin ? '新問卷來了！這份蠻適合你的' : '新問卷...可以看看'
  const color = isYukirin ? '#b8a9e8' : '#c94a4a'
  const name = isYukirin ? '雪凜' : '凜空'
  const mood = isYukirin ? 'happy' : 'neutral'
  const avatarUrl = `https://insight.snowrealm.pet/images/${isYukirin ? 'yukirin' : 'riku'}/${isYukirin ? 'yukirin' : 'riku'}-${mood}.png`

  return {
    type: 'flex',
    altText: `${name}：新問卷「${survey.title}」`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'horizontal',
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
        type: 'box', layout: 'vertical',
        contents: [
          { type: 'text', text: line, size: 'sm', color: '#333333' },
          {
            type: 'box', layout: 'vertical',
            contents: [
              { type: 'text', text: survey.title, size: 'md', weight: 'bold', wrap: true },
              { type: 'text', text: `${survey.duration} · 已有 ${survey.completedCount} 人填過`, size: 'xs', color: '#999999', margin: 'sm' },
              {
                type: 'box', layout: 'horizontal',
                contents: survey.tags.slice(0, 3).map(tag => ({
                  type: 'box' as const, layout: 'vertical' as const,
                  contents: [{ type: 'text' as const, text: tag, size: 'xxs' as const, color, align: 'center' as const }],
                  backgroundColor: isYukirin ? '#F0EDFF' : '#FFF0F0',
                  cornerRadius: '8px',
                  paddingAll: '3px', paddingStart: '8px', paddingEnd: '8px',
                  flex: 0,
                })),
                spacing: 'sm', margin: 'md',
              },
            ],
            backgroundColor: '#F8F8F8', cornerRadius: '8px', paddingAll: '12px', margin: 'md',
          },
        ],
        paddingAll: '14px', paddingTop: '0px',
      },
      footer: {
        type: 'box', layout: 'horizontal',
        contents: [
          {
            type: 'button',
            action: { type: 'uri', label: '去填填看', uri: `https://insight.snowrealm.pet/survey/${survey.id}` },
            style: 'primary', color, height: 'sm', flex: 1,
          },
          {
            type: 'button',
            action: { type: 'message', label: '之後再說', text: '之後再說' },
            style: 'secondary', height: 'sm', flex: 1,
          },
        ],
        spacing: 'sm', paddingAll: '12px',
      },
    },
  }
}

// ─── 八、管理員告警通知 ───────────────────────────────────────────────────────

export function adminAlertNotification(alert: {
  level: 'info' | 'warning' | 'critical'
  title: string
  details: Record<string, string>
  action?: string
  targetUserId?: string
}): FlexMessage {
  const colors = {
    info:     { bg: '#E3F2FD', text: '#1565C0', bar: '#2196F3' },
    warning:  { bg: '#FFF8E1', text: '#E65100', bar: '#FF9800' },
    critical: { bg: '#FFEBEE', text: '#C62828', bar: '#F44336' },
  }
  const c = colors[alert.level]
  const emoji = { info: 'ℹ️', warning: '⚠️', critical: '🚨' }

  return {
    type: 'flex',
    altText: `${emoji[alert.level]} ${alert.title}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'horizontal',
        backgroundColor: c.bg,
        contents: [
          {
            type: 'image',
            url: 'https://insight.snowrealm.pet/images/system/snowrealm-logo.png',
            size: 'xxs', aspectRatio: '1:1', aspectMode: 'cover', flex: 0,
          },
          {
            type: 'box', layout: 'vertical',
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
        type: 'box', layout: 'vertical',
        contents: [
          { type: 'text', text: alert.title, size: 'md', weight: 'bold', color: c.text, wrap: true },
          ...Object.entries(alert.details).map(([key, value]) => ({
            type: 'box' as const, layout: 'horizontal' as const,
            contents: [
              { type: 'text' as const, text: key, size: 'sm' as const, color: '#999999', flex: 1 },
              { type: 'text' as const, text: value, size: 'sm' as const, weight: 'bold' as const, align: 'end' as const, flex: 0, color: key === '風險分數' ? c.text : '#333333' },
            ],
            margin: 'sm' as const,
          })),
          ...(alert.action ? [{
            type: 'text' as const,
            text: `建議：${alert.action}`,
            size: 'xs' as const, color: '#999999', margin: 'lg' as const, wrap: true,
          }] : []),
        ],
        paddingAll: '14px',
      },
      footer: {
        type: 'box', layout: 'horizontal',
        contents: [
          ...(alert.targetUserId ? [{
            type: 'button' as const,
            action: { type: 'uri' as const, label: '確認封鎖', uri: `https://insight.snowrealm.pet/admin/users/${alert.targetUserId}` },
            style: 'primary' as const, color: c.bar, height: 'sm' as const, flex: 1,
          }] : []),
          {
            type: 'button' as const,
            action: { type: 'uri' as const, label: '進入後台', uri: 'https://insight.snowrealm.pet/admin/security' },
            style: 'secondary' as const, height: 'sm' as const, flex: 1,
          },
        ],
        spacing: 'sm', paddingAll: '12px',
      },
    },
  }
}
