'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdminSurvey } from '@/components/admin/AdminSurveyContext'
import type { InsightReport, InsightHighlight, InsightRecommendation } from '@/lib/insightEngine'
import type { StoryInsightReport } from '@/lib/storyEngine'

// ===== 型別 =====

interface ReportMeta {
  provider: string
  model: string
  keySource: string
  generatedAt: string
}

type ActiveTab = 'data' | 'story'

// ===== 數據報告子元件 =====

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

// ===== 故事報告子元件 =====

function StoryBodyRenderer({ body }: { body: string }) {
  return (
    <div className="text-sm text-white/80 leading-relaxed space-y-3">
      {body.split(/\n\n+/).map((paragraph, i) => (
        <p key={i} style={{ whiteSpace: 'pre-wrap' }}>
          {paragraph}
        </p>
      ))}
    </div>
  )
}

function PullQuoteCard({ quote }: { quote: string }) {
  return (
    <blockquote className="border-l-4 border-violet-500/60 bg-violet-500/5 rounded-r-xl pl-4 pr-4 py-3">
      <p className="text-sm text-white/75 leading-relaxed italic">「{quote}」</p>
    </blockquote>
  )
}

function StoryReportDisplay({ report }: { report: StoryInsightReport }) {
  return (
    <div className="space-y-6">
      {/* Story Title */}
      <div className="bg-linear-to-br from-rose-500/10 to-orange-500/5 border border-rose-500/20 rounded-2xl p-6 space-y-3">
        <h2 className="text-xl font-bold text-white">{report.storyTitle}</h2>
        {report.shareableOneLiner && (
          <p className="text-base text-rose-300 font-medium text-center py-2">
            ✨ {report.shareableOneLiner}
          </p>
        )}
      </div>

      {/* Story Body */}
      <div className="bg-t-card-bg border border-t-card-border rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-white/80">故事敘事</h3>
        <StoryBodyRenderer body={report.storyBody} />
      </div>

      {/* Pull Quotes */}
      {report.pullQuotes.length > 0 && (
        <div className="bg-t-card-bg border border-t-card-border rounded-2xl p-6 space-y-3">
          <h3 className="text-base font-semibold text-white/80">填答者的聲音</h3>
          <div className="space-y-3">
            {report.pullQuotes.map((quote, i) => (
              <PullQuoteCard key={i} quote={quote} />
            ))}
          </div>
        </div>
      )}

      {/* Key Data Points */}
      {report.keyDataPoints.length > 0 && (
        <div className="bg-t-card-bg border border-t-card-border rounded-2xl p-6 space-y-3">
          <h3 className="text-base font-semibold text-white/80">數據支撐</h3>
          <ul className="space-y-2">
            {report.keyDataPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                <span className="mt-0.5 text-violet-400 shrink-0">▸</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Unexpected Insight */}
      {report.unexpectedInsight && (
        <div className="bg-amber-500/8 border border-amber-500/30 rounded-2xl p-6 space-y-2">
          <h3 className="text-base font-semibold text-amber-300">💡 出人意料的發現</h3>
          <p className="text-sm text-white/75 leading-relaxed">{report.unexpectedInsight}</p>
        </div>
      )}
    </div>
  )
}

// ===== 主頁面 =====

export default function InsightPage() {
  const { selectedSurveyId } = useAdminSurvey()

  // 數據報告狀態
  const [report, setReport] = useState<InsightReport | null>(null)
  const [meta, setMeta] = useState<ReportMeta | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<Array<{ id: string; report: InsightReport; meta: ReportMeta; created_at: string }>>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // 故事模式狀態
  const [storyReport, setStoryReport] = useState<StoryInsightReport | null>(null)
  const [storyGenerating, setStoryGenerating] = useState(false)
  const [storyError, setStoryError] = useState('')

  // Tab 狀態
  const [activeTab, setActiveTab] = useState<ActiveTab>('data')

  const fetchHistory = useCallback(async () => {
    if (!selectedSurveyId) return
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/admin/ai-insight?surveyId=${selectedSurveyId}`)
      const data = await res.json() as { data?: Array<{ id: string; report: InsightReport; meta: ReportMeta; created_at: string }> }
      setHistory(data.data ?? [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [selectedSurveyId])

  useEffect(() => {
    setReport(null)
    setMeta(null)
    setHistory([])
    setStoryReport(null)
    setStoryError('')
    fetchHistory()
  }, [fetchHistory])

  async function handleDeleteReport(reportId: string) {
    try {
      await fetch(`/api/admin/ai-insight?id=${reportId}`, { method: 'DELETE' })
      await fetchHistory()
    } catch {
      /* silent */
    }
  }

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
      await fetchHistory()
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateStory() {
    if (!selectedSurveyId || storyGenerating) return
    setStoryGenerating(true)
    setStoryError('')

    try {
      const res = await fetch('/api/admin/ai-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: selectedSurveyId }),
      })

      const data = await res.json() as { report?: StoryInsightReport; error?: string }

      if (!res.ok) {
        setStoryError(data.error ?? '產生故事報告失敗')
        return
      }

      setStoryReport(data.report ?? null)
    } catch {
      setStoryError('網路錯誤，請稍後再試')
    } finally {
      setStoryGenerating(false)
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
        {activeTab === 'data' && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="px-5 py-2.5 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
          >
            {generating ? '🤖 分析中...' : report ? '🔄 重新產生' : '✨ 產生 AI 洞察報告'}
          </button>
        )}
        {activeTab === 'story' && (
          <button
            type="button"
            onClick={handleGenerateStory}
            disabled={storyGenerating}
            className="px-5 py-2.5 bg-linear-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
          >
            {storyGenerating ? '✍️ 撰寫中...' : storyReport ? '🔄 重新產生' : '📖 產生故事報告'}
          </button>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-slate-800/60 border border-slate-700 rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'data'
              ? 'bg-violet-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📊 數據報告
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('story')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'story'
              ? 'bg-rose-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📖 故事模式
        </button>
      </div>

      {/* ===== 數據報告 Tab ===== */}
      {activeTab === 'data' && (
        <div className="space-y-6">
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

          {/* History */}
          <div className="bg-t-card-bg border border-t-card-border rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white/80">📋 歷史報告</h2>

            {historyLoading && (
              <div className="text-sm text-slate-400 animate-pulse">載入中...</div>
            )}

            {!historyLoading && history.length === 0 && (
              <p className="text-sm text-slate-500">尚無歷史報告</p>
            )}

            {!historyLoading && history.length > 0 && (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 border border-slate-700 bg-slate-800/40 rounded-xl px-4 py-3 hover:border-violet-500/40 transition-colors"
                  >
                    <button
                      type="button"
                      className="flex-1 text-left cursor-pointer"
                      onClick={() => {
                        setReport(item.report)
                        setMeta(item.meta)
                      }}
                    >
                      <span className="text-sm text-white/80">
                        {new Date(item.created_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
                      </span>
                      <span className="ml-3 text-xs text-slate-500">
                        {item.meta?.provider}/{item.meta?.model}
                        {item.meta?.keySource === 'platform_key' ? '（免費額度）' : ''}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteReport(item.id)}
                      className="text-xs text-red-400/60 hover:text-red-400 transition-colors cursor-pointer px-2 py-1"
                      title="刪除此報告"
                    >
                      刪除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== 故事模式 Tab ===== */}
      {activeTab === 'story' && (
        <div className="space-y-6">
          {/* Error */}
          {storyError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
              {storyError}
            </div>
          )}

          {/* Loading skeleton */}
          {storyGenerating && !storyReport && (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-2xl h-32" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!storyGenerating && !storyReport && !storyError && (
            <div className="bg-t-card-bg border border-t-card-border rounded-2xl p-12 text-center space-y-4">
              <p className="text-5xl">📖</p>
              <p className="text-lg text-white/80">點擊「產生故事報告」開始撰寫</p>
              <p className="text-sm text-slate-400">
                AI 將從開放題回覆中提煉人文故事，讓數據變得有溫度
              </p>
              <p className="text-xs text-slate-500">人會忘記數字，但不會忘記一個好故事。</p>
            </div>
          )}

          {/* Story Report */}
          {storyReport && <StoryReportDisplay report={storyReport} />}
        </div>
      )}
    </div>
  )
}
