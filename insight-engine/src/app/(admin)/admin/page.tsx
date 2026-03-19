import { getDashboardStats, getResponseList } from '@/lib/stats'
import { StatCard } from '@/components/admin'
import { LineChartBlock, BarChartBlock, PieChartBlock } from '@/components/admin'
import { ResponseTable } from '@/components/admin'
import SummaryButton from '@/components/admin/SummaryButton'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()
  const recentResponses = await getResponseList(1, 10)

  const emotionData = stats.emotionDistribution
    .filter((d) => d.tagKey === 'emotion_level')
    .map((d) => ({ label: d.tagValue, count: d.count }))

  const highEmotionCount = emotionData.find((d) => d.label === 'high')?.count ?? 0
  const highEmotionRate =
    stats.totalResponses > 0
      ? ((highEmotionCount / stats.totalResponses) * 100).toFixed(1)
      : '0'

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* 自動摘要 */}
      <SummaryButton />

      {/* KPI 卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="總填寫數" value={stats.totalResponses} />
        <StatCard
          title="完成率"
          value={`${(stats.completionRate * 100).toFixed(1)}%`}
          subtitle={`${stats.completedResponses} 份完成`}
        />
        <StatCard title="今日新增" value={stats.todayResponses} />
        <StatCard
          title="高情感比例"
          value={`${highEmotionRate}%`}
          subtitle={`${highEmotionCount} 位高情感用戶`}
        />
      </div>

      {/* 趨勢圖 */}
      <LineChartBlock title="最近 7 天填寫趨勢" data={stats.dailyTrend} />

      {/* 功能偏好 + 情感分佈 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChartBlock
          title="功能偏好 Top 5"
          data={stats.topFeatures.map((f) => ({
            label: f.feature,
            count: f.count,
          }))}
        />
        <PieChartBlock title="情感等級分佈" data={emotionData} />
      </div>

      {/* 最近填答 */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">最近填答</h2>
        <ResponseTable responses={recentResponses.data} />
      </div>
    </div>
  )
}
