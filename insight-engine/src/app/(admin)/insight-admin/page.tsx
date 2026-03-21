'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/admin'
import { LineChartBlock, BarChartBlock, PieChartBlock } from '@/components/admin'
import { ResponseTable } from '@/components/admin'
import SummaryButton from '@/components/admin/SummaryButton'
import { useAdminSurvey } from '@/components/admin/AdminSurveyContext'
import type { DashboardStats, ResponseListItem } from '@/types'

export default function AdminDashboardPage() {
  const { selectedSurveyId } = useAdminSurvey()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentResponses, setRecentResponses] = useState<ResponseListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedSurveyId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const q = `?surveyId=${selectedSurveyId}`
    Promise.all([
      fetch(`/api/admin/stats${q}`).then(r => r.json()),
      fetch(`/api/admin/responses${q}&pageSize=10`).then(r => r.json()),
    ])
      .then(([s, r]) => {
        setStats(s)
        setRecentResponses(r.data ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedSurveyId])

  if (loading) return <p className="text-slate-400 animate-pulse">載入中…</p>

  if (!selectedSurveyId || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="bg-t-card-bg border border-t-card-border rounded-2xl p-8 text-center space-y-4">
          <p className="text-4xl">📊</p>
          <p className="text-lg text-white/80">尚未建立問卷</p>
          <p className="text-sm text-slate-400">前往「問卷管理」建立你的第一份問卷，開始收集數據</p>
        </div>
      </div>
    )
  }

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
      <SummaryButton surveyId={selectedSurveyId} />

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
        <ResponseTable responses={recentResponses} />
      </div>
    </div>
  )
}
