'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/admin'
import { LineChartBlock, BarChartBlock, PieChartBlock } from '@/components/admin'
import { ResponseTable } from '@/components/admin'
import SummaryButton from '@/components/admin/SummaryButton'
import { useAdminSurvey } from '@/components/admin/AdminSurveyContext'
import type { DashboardStats, ResponseListItem } from '@/types'

function formatCompletionTime(seconds: number): string {
  if (seconds <= 0) return '—'
  const min = Math.floor(seconds / 60)
  const sec = Math.round(seconds % 60)
  if (min === 0) return `${sec} 秒`
  return `${min} 分 ${sec} 秒`
}

function getQualityLabel(score: number): string {
  if (score >= 80) return '優良'
  if (score >= 60) return '良好'
  if (score >= 40) return '普通'
  return '待改善'
}

const QUALITY_COLOR: Record<string, string> = {
  '優良': 'text-emerald-500',
  '良好': 'text-[#b8a9e8]',
  '普通': 'text-amber-500',
  '待改善': 'text-red-400',
}

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

  if (loading) return <p className="text-[#6b5fa8] animate-pulse">載入中…</p>

  if (!selectedSurveyId || !stats) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155]" style={{ fontFamily: 'var(--font-zen-maru), var(--font-noto-tc), sans-serif' }}>Dashboard</h1>
        <div className="rounded-[20px] border border-[#b8a9e8]/25 bg-white/40 backdrop-blur-sm p-6 sm:p-8 text-center space-y-4 shadow-[0_4px_20px_rgba(184,169,232,0.12)]">
          <p className="text-4xl">📊</p>
          <p className="text-lg text-[#3d3155] font-medium">尚未建立問卷</p>
          <p className="text-sm text-[#8a7ca8]">前往「問卷管理」建立你的第一份問卷，開始收集數據</p>
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

  const qualityLabel = getQualityLabel(stats.responseQuality?.score ?? 0)
  const qualityIssues = stats.responseQuality?.issues
  const qualitySubtitle = qualityIssues
    ? `空白 ${qualityIssues.emptyTextAnswers} · 過短 ${qualityIssues.shortAnswers} · 同答案 ${qualityIssues.samePattern}`
    : undefined

  const velocityData = (stats.responseVelocity ?? []).map((v) => ({
    label: v.bucket,
    count: v.count,
  }))

  return (
    <div className="space-y-4 sm:space-y-8">
      <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155]" style={{ fontFamily: 'var(--font-zen-maru), var(--font-noto-tc), sans-serif' }}>Dashboard</h1>

      {/* 自動摘要 */}
      <SummaryButton surveyId={selectedSurveyId} />

      {/* KPI 卡片 — 第一排 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        <StatCard title="總填寫數" value={stats.totalResponses} />
        <StatCard
          title="完成率"
          value={`${(stats.completionRate * 100).toFixed(1)}%`}
          subtitle={`${stats.completedResponses} 份完成`}
        />
        <StatCard title="今日新增" value={stats.todayResponses} />
      </div>

      {/* KPI 卡片 — 第二排 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          title="平均填答時間"
          value={formatCompletionTime(stats.avgCompletionTime ?? 0)}
        />
        <div className="rounded-[20px] border border-[#b8a9e8]/25 bg-white/40 backdrop-blur-sm p-4 sm:p-6 shadow-[0_4px_20px_rgba(184,169,232,0.10)]">
          <p className="text-xs sm:text-sm text-[#8a7ca8] mb-1">數據品質</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-bold text-[#6b5fa8]">{stats.responseQuality?.score ?? 0}</p>
            <span className={`text-sm font-medium ${QUALITY_COLOR[qualityLabel] ?? 'text-[#8a7ca8]'}`}>
              {qualityLabel}
            </span>
          </div>
          {qualitySubtitle && (
            <p className="text-xs text-[#6b5fa8] mt-1">{qualitySubtitle}</p>
          )}
        </div>
        <StatCard
          title="高情感比例"
          value={`${highEmotionRate}%`}
          subtitle={`${highEmotionCount} 位高情感用戶`}
        />
      </div>

      {/* 趨勢圖 */}
      <LineChartBlock title="最近 7 天填寫趨勢" data={stats.dailyTrend} />

      {/* 回覆速度 + 功能偏好 + 情感分佈 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
        {velocityData.length > 0 && (
          <BarChartBlock title="回覆速度分佈" data={velocityData} />
        )}
        <BarChartBlock
          title="功能偏好 Top 5"
          data={stats.topFeatures.map((f) => ({
            label: f.feature,
            count: f.count,
          }))}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
        <PieChartBlock title="情感等級分佈" data={emotionData} />
      </div>

      {/* 最近填答 */}
      <div>
        <h2 className="text-lg font-semibold text-[#3d3155] mb-4">最近填答</h2>
        <ResponseTable responses={recentResponses} />
      </div>
    </div>
  )
}
