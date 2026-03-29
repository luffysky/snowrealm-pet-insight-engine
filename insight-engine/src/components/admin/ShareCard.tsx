'use client'

import { useRef } from 'react'
import type { InsightReport } from '@/lib/insightEngine'
import type { StoryInsightReport } from '@/lib/storyEngine'
import { getIllustration } from '@/lib/shareCardIllustrations'

interface ShareCardProps {
  reportType: 'data' | 'story'
  report: InsightReport | StoryInsightReport
  surveyTitle: string
  shareUrl: string
  theme?: string
  industry?: string
  createdAt: string
  onImageSaved?: () => void
}

// 根據主題取得漸層背景
function getGradient(theme?: string): string {
  const gradients: Record<string, string> = {
    game:    'from-yellow-900/80 to-slate-900',
    cyber:   'from-cyan-900/80 to-slate-900',
    ancient: 'from-amber-900/80 to-slate-900',
    sakura:  'from-pink-900/80 to-slate-900',
    ocean:   'from-blue-900/80 to-slate-900',
    forest:  'from-emerald-900/80 to-slate-900',
    candy:   'from-purple-900/80 to-slate-900',
    noir:    'from-gray-900/90 to-black',
    default: 'from-violet-900/80 to-slate-900',
  }
  return gradients[theme ?? 'default'] ?? gradients.default
}

function getAccentColor(theme?: string): string {
  const colors: Record<string, string> = {
    game:    'text-yellow-300',
    cyber:   'text-cyan-300',
    ancient: 'text-amber-300',
    sakura:  'text-pink-300',
    ocean:   'text-blue-300',
    forest:  'text-emerald-300',
    candy:   'text-purple-300',
    noir:    'text-gray-300',
    default: 'text-violet-300',
  }
  return colors[theme ?? 'default'] ?? colors.default
}

function DataCard({
  report,
  surveyTitle,
  shareUrl,
  theme,
  industry,
  createdAt,
}: {
  report: InsightReport
  surveyTitle: string
  shareUrl: string
  theme?: string
  industry?: string
  createdAt: string
}) {
  const illustrations = getIllustration(theme, industry)
  const accent = getAccentColor(theme)
  const highlights = report.highlights?.slice(0, 3) ?? []
  const topRec = report.recommendations?.[0]

  return (
    <>
      {/* Illustration */}
      <div className="text-center text-5xl space-x-3 mb-4">
        {illustrations.map((e, i) => <span key={i}>{e}</span>)}
      </div>

      {/* Title block */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-1">
        <p className="text-base font-bold text-[#3d3155] leading-snug">{surveyTitle}</p>
        <p className={`text-sm font-medium ${accent}`}>AI 洞察報告</p>
      </div>

      {/* Summary */}
      {report.summary && (
        <p className="text-sm text-[#3d3155] leading-relaxed mb-4 line-clamp-3">
          {report.summary}
        </p>
      )}

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs text-[#b5a8d0] font-medium uppercase tracking-wide">關鍵發現</p>
          {highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="shrink-0 mt-0.5">
                {h.type === 'positive' ? '✅' : h.type === 'negative' ? '⚠️' : '📌'}
              </span>
              <span className="text-white/75">{h.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Top recommendation */}
      {topRec && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
          <p className="text-xs text-[#b5a8d0] mb-1">建議行動</p>
          <p className="text-sm text-[#3d3155]/85">🎯 {topRec.action}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-white/10 pt-3 space-y-1">
        <p className="text-xs text-[#8a7ca8] font-medium">SnowRealm Insight Engine</p>
        <p className="text-xs text-[#b5a8d0] font-mono truncate">{shareUrl}</p>
        <p className="text-xs text-[#b5a8d0]">
          {new Date(createdAt).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}
        </p>
      </div>
    </>
  )
}

function StoryCard({
  report,
  surveyTitle,
  shareUrl,
  theme,
  industry,
  createdAt,
}: {
  report: StoryInsightReport
  surveyTitle: string
  shareUrl: string
  theme?: string
  industry?: string
  createdAt: string
}) {
  const illustrations = getIllustration(theme, industry)
  const accent = getAccentColor(theme)
  const topQuote = report.pullQuotes?.[0]
  const topData = report.keyDataPoints?.slice(0, 3) ?? []

  return (
    <>
      {/* Illustration */}
      <div className="text-center text-5xl space-x-3 mb-4">
        {illustrations.map((e, i) => <span key={i}>{e}</span>)}
      </div>

      {/* Story Title block */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-1">
        <p className="text-base font-bold text-[#3d3155] leading-snug">{report.storyTitle}</p>
        <p className="text-xs text-[#b5a8d0]">{surveyTitle}</p>
      </div>

      {/* Pull quote */}
      {topQuote && (
        <blockquote className="border-l-4 border-rose-400/50 bg-rose-500/5 rounded-r-xl pl-3 pr-3 py-2.5 mb-4">
          <p className="text-sm text-[#3d3155]/75 italic leading-relaxed">「{topQuote}」</p>
        </blockquote>
      )}

      {/* Key data points */}
      {topData.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {topData.map((d, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className={`shrink-0 mt-0.5 text-xs ${accent}`}>▸</span>
              <span className="text-[#3d3155]">{d}</span>
            </div>
          ))}
        </div>
      )}

      {/* Shareable one-liner */}
      {report.shareableOneLiner && (
        <div className={`border border-white/10 rounded-xl p-3 mb-4 text-center ${accent} text-sm font-medium`}>
          ✨ {report.shareableOneLiner}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-white/10 pt-3 space-y-1">
        <p className="text-xs text-[#8a7ca8] font-medium">SnowRealm Insight Engine</p>
        <p className="text-xs text-[#b5a8d0] font-mono truncate">{shareUrl}</p>
        <p className="text-xs text-[#b5a8d0]">
          {new Date(createdAt).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}
        </p>
      </div>
    </>
  )
}

export function ShareCard({
  reportType,
  report,
  surveyTitle,
  shareUrl,
  theme,
  industry,
  createdAt,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const gradient = getGradient(theme)

  async function handleSaveImage() {
    const card = cardRef.current
    if (!card) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(card, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `insight-report-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      alert('儲存圖片失敗，請截圖儲存')
    }
  }

  return (
    <div className="relative">
      {/* Save button (outside card DOM for clean export) */}
      <button
        type="button"
        onClick={handleSaveImage}
        className="absolute top-2 right-2 z-10 bg-black/40 hover:bg-black/60 text-white text-xs px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
        title="儲存為圖片"
      >
        💾 儲存
      </button>

      {/* Card */}
      <div
        ref={cardRef}
        className={`w-[400px] max-w-full bg-linear-to-br ${gradient} border border-white/10 rounded-[20px] p-6`}
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {reportType === 'story' ? (
          <StoryCard
            report={report as StoryInsightReport}
            surveyTitle={surveyTitle}
            shareUrl={shareUrl}
            theme={theme}
            industry={industry}
            createdAt={createdAt}
          />
        ) : (
          <DataCard
            report={report as InsightReport}
            surveyTitle={surveyTitle}
            shareUrl={shareUrl}
            theme={theme}
            industry={industry}
            createdAt={createdAt}
          />
        )}
      </div>
    </div>
  )
}
