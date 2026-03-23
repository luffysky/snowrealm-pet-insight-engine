'use client'

import { useState } from 'react'
import { useAdminSurvey } from '@/components/admin/AdminSurveyContext'
import type { InsightReport, InsightHighlight, InsightRecommendation } from '@/lib/insightEngine'

// ===== 型別 =====

interface ReportMeta {
  provider: string
  model: string
  keySource: string
  generatedAt: string
}

// ===== 子元件 =====

const HIGHLIGHT_STYLES = {
  positive: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    icon: '✅',
    label: 'text-emerald-400',
  },
  negative: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    icon: '⚠️',
    label: 'text-red-400',
  },
  neutral: {
    border: 'border-slate-500/30',
    bg: 'bg-slate-500/5',
    icon: '📌',
    label: 'text-slate-400',
  },
} as const

const PRIORITY_STYLES = {
  high: { badge: 'bg-red-500/20 text-red-400', label: '高優先' },
  medium: { badge: 'bg-amber-500/20 text-amber-400', label: '中優先' },
  low: { badge: 'bg-slate-500/20 text-slate-400', label: '低優先' },
} as const

function HighlightCard({ item }: { item: InsightHighlight }) {
  const style = HIGHLIGHT_STYLES[item.type]
  return (
    <div className={`border ${style.border} ${style.bg} rounded-xl p-4 space-y-1`}>
      <div className={`text-sm font-medium ${style.label} flex items-center gap-2`}>
        <span>{style.icon}</span>
        {item.title}
      </div>
      <p className="text-sm text-white/70 leading-relaxed">{item.detail}</p>
    </div>
  )
}

function RecommendationCard({ item }: { item: InsightRecommendation }) {
  const style = PRIORITY_STYLES[item.priority]
  return (
    <div className="border border-slate-700 bg-slate-800/40 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
          {style.label}
        </span>
        <span className="text-sm font-medium text-white">{item.action}</span>
      </div>
      <p className="text-sm text-slate-400 leading-relaxed">{item.reason}</p>
    </div>
  )
}

function InsightSection({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-t-card-bg border border-t-card-border rounded-2xl p-6 space-y-2">
      <h2 className="text-base font-semibold text-white/80">{title}</h2>
      <p className="text-sm text-white/65 leading-relaxed">{content}</p>
    </div>
  )
}

// ===== 主頁面 =====

export default function InsightPage() {
  const { selectedSurveyId } = useAdminSurvey()
  const [report, setReport] = useState<InsightReport | null>(null)
  const [meta, setMeta] = useState<ReportMeta | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    if (!selectedSurveyId || generating) return
    setGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/admin/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: selectedSurveyId }),
      })

      const data = await res.json() as { report?: InsightReport; meta?: ReportMeta; error?: string }

      if (!res.ok) {
        setError(data.error ?? '產生報告失敗')
        return
      }

      setReport(data.report ?? null)
      setMeta(data.meta ?? null)
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setGenerating(false)
    }
  }

  if (!selectedSurveyId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">🔍 AI 洞察報告</h1>
        <div className="bg-t-card-bg border border-t-card-border rounded-2xl p-8 text-center space-y-3">
          <p className="text-4xl">📊</p>
          <p className="text-lg text-white/80">請先選擇問卷</p>
          <p className="text-sm text-slate-400">從頂部選擇器選取問卷後，再產生 AI 洞察報告</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">🔍 AI 洞察報告</h1>
          <p className="text-slate-400 mt-1 text-sm">AI 自動分析問卷數據，產出洞察與建議</p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="px-5 py-2.5 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
        >
          {generating ? '🤖 分析中...' : report ? '🔄 重新產生' : '✨ 產生 AI 洞察報告'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {generating && !report && (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-2xl h-32" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!generating && !report && !error && (
        <div className="bg-t-card-bg border border-t-card-border rounded-2xl p-12 text-center space-y-4">
          <p className="text-5xl">🔍</p>
          <p className="text-lg text-white/80">點擊「產生 AI 洞察報告」開始分析</p>
          <p className="text-sm text-slate-400">AI 將讀取此問卷的所有統計數據，輸出洞察與優化建議</p>
        </div>
      )}

      {/* Report */}
      {report && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-linear-to-br from-violet-500/10 to-indigo-500/5 border border-violet-500/20 rounded-2xl p-6 space-y-2">
            <h2 className="text-base font-semibold text-violet-300">整體洞察</h2>
            <p className="text-white/85 leading-relaxed">{report.summary}</p>
          </div>

          {/* Highlights */}
          {report.highlights.length > 0 && (
            <div className="bg-t-card-bg border border-t-card-border rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-white/80">重點發現</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.highlights.map((item, i) => (
                  <HighlightCard key={i} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="bg-t-card-bg border border-t-card-border rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-white/80">優化建議</h2>
              <div className="space-y-3">
                {report.recommendations.map((item, i) => (
                  <RecommendationCard key={i} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Funnel & Audience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InsightSection title="📉 漏斗洞察" content={report.funnelInsight} />
            <InsightSection title="👥 受眾洞察" content={report.audienceInsight} />
          </div>

          {/* Meta */}
          {meta && (
            <p className="text-xs text-slate-600 text-right">
              由 {meta.provider}/{meta.model} 產生
              {meta.keySource === 'platform_key' ? '（免費額度）' : ''}
              ・{new Date(meta.generatedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
