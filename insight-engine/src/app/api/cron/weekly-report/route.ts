import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { pushLineMessage } from '@/lib/line'
import { getDashboardStats } from '@/lib/stats'
import { getStyle } from '@/lib/lineStyles'

const TW_TZ = 'Asia/Taipei'

/**
 * GET /api/cron/weekly-report
 * 每週自動產出 Flex Message 週報，推播給所有管理員
 * 可由 Zeabur Cron 或外部排程呼叫
 */
export async function GET(): Promise<NextResponse> {
  try {
    const stats = await getDashboardStats()

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - 7)

    // 本週區間標籤
    const formatDate = (d: Date) =>
      d.toLocaleDateString('zh-TW', { timeZone: TW_TZ, month: '2-digit', day: '2-digit' })
    const period = `${formatDate(weekStart)} ~ ${formatDate(now)}`

    // 計算本週新增填答數
    const weeklyRow = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM responses WHERE created_at >= NOW() - INTERVAL '7 days'`
    )
    const weeklyCount = parseInt(weeklyRow[0]?.count ?? '0', 10)

    // 高情感
    const highEmotion = stats.emotionDistribution.find(
      (d) => d.tagKey === 'emotion_level' && d.tagValue === 'high'
    )
    const highEmotionRate =
      stats.totalResponses > 0
        ? ((highEmotion?.count ?? 0) / stats.totalResponses * 100).toFixed(1)
        : '0'

    // Top 3 功能
    const topFeatures = stats.topFeatures.slice(0, 3)

    // 趨勢方向
    const trend = stats.dailyTrend
    const recentHalf = trend.slice(Math.floor(trend.length / 2))
    const olderHalf = trend.slice(0, Math.floor(trend.length / 2))
    const recentAvg = recentHalf.reduce((s, d) => s + d.count, 0) / (recentHalf.length || 1)
    const olderAvg = olderHalf.reduce((s, d) => s + d.count, 0) / (olderHalf.length || 1)
    const trendIcon = recentAvg > olderAvg ? '📈' : recentAvg < olderAvg ? '📉' : '➡️'

    const style = await getStyle('weekly_report')
    const hColor = style?.header_color ?? '#1a365d'
    const hEmoji = style?.header_emoji ?? '📊'

    const flexMessage = {
      type: 'flex',
      altText: `${hEmoji} 毛行天下週報 ${period}`,
      contents: {
        type: 'bubble',
        size: 'mega',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: hColor,
          paddingAll: '16px',
          contents: [
            { type: 'text', text: `${hEmoji} 週報摘要`, color: '#ffffff', weight: 'bold', size: 'xl' },
            { type: 'text', text: period, color: '#90cdf4', size: 'sm', margin: 'sm' },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'lg',
          paddingAll: '16px',
          contents: [
            // KPI 區塊
            {
              type: 'box',
              layout: 'vertical',
              spacing: 'sm',
              contents: [
                { type: 'text', text: '📋 基本數據', weight: 'bold', size: 'md', color: '#333333' },
                kpiRow('累計填寫', `${stats.totalResponses} 份`),
                kpiRow('本週新增', `${weeklyCount} 份 ${trendIcon}`),
                kpiRow('完成率', `${(stats.completionRate * 100).toFixed(1)}%`),
                kpiRow('高情感比例', `${highEmotionRate}% (${highEmotion?.count ?? 0} 位)`),
              ],
            },
            { type: 'separator', color: '#e2e8f0' },
            // Top 功能
            {
              type: 'box',
              layout: 'vertical',
              spacing: 'sm',
              contents: [
                { type: 'text', text: '🔥 熱門功能 Top 3', weight: 'bold', size: 'md', color: '#333333' },
                ...topFeatures.map((f, i) => ({
                  type: 'text' as const,
                  text: `${['🥇', '🥈', '🥉'][i]} ${f.feature}（${f.count} 票）`,
                  size: 'sm' as const,
                  color: '#555555',
                })),
                ...(topFeatures.length === 0
                  ? [{ type: 'text' as const, text: '尚無資料', size: 'sm' as const, color: '#999999' }]
                  : []),
              ],
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `產出時間 ${now.toLocaleString('zh-TW', { timeZone: TW_TZ })}`,
              size: 'xxs',
              color: '#aaaaaa',
              align: 'center',
            },
          ],
        },
      },
    }

    await pushLineMessage([flexMessage])

    // 記錄 notification_logs
    await query(
      `INSERT INTO notification_logs (rule_id, trigger_type, recipient_type, recipient_id, status)
       VALUES (NULL, 'weekly_report', 'admin', 'all_admins', 'sent')`
    )

    return NextResponse.json({ sent: true, weeklyCount, totalResponses: stats.totalResponses })
  } catch (err) {
    console.error('[weekly-report] Error:', err)
    return NextResponse.json({ error: '週報產生失敗' }, { status: 500 })
  }
}

function kpiRow(label: string, value: string) {
  return {
    type: 'box' as const,
    layout: 'horizontal' as const,
    contents: [
      { type: 'text' as const, text: label, color: '#8b8b8b', size: 'sm' as const, flex: 3 },
      { type: 'text' as const, text: value, color: '#333333', size: 'sm' as const, flex: 5, align: 'end' as const },
    ],
  }
}
