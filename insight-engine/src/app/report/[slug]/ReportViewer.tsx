'use client'

import { useState } from 'react'
import type { InsightReport, InsightHighlight, InsightRecommendation } from '@/lib/insightEngine'
import type { StoryInsightReport } from '@/lib/storyEngine'

type RenderMode = 'cards' | 'magazine' | 'minimal' | 'cinematic'

interface Props {
  report: InsightReport | StoryInsightReport
  reportType: 'data' | 'story'
  title: string
  surveyTitle: string | null
  createdAt: string
  shareViews: number
  shareUrl: string
}

const MODE_OPTIONS: { key: RenderMode; label: string; icon: string }[] = [
  { key: 'cards',     label: '卡片',   icon: '🃏' },
  { key: 'magazine',  label: '雜誌',   icon: '📰' },
  { key: 'minimal',   label: '極簡',   icon: '⬜' },
  { key: 'cinematic', label: '電影',   icon: '🎬' },
]

// ─── Cards mode ─────────────────────────────────────────────────────────────

function CardsData({ report }: { report: InsightReport }) {
  const priorityColor = (p: string) =>
    p === 'high' ? 'text-red-400 bg-red-400/10' : p === 'medium' ? 'text-amber-400 bg-amber-400/10' : 'text-green-400 bg-green-400/10'

  return (
    <div className="space-y-5">
      <div className="lg-lavender-sharp lg-xl relative p-6">
        <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">整體洞察</p>
        <p className="text-white/85 leading-relaxed text-sm">{report.summary}</p>
      </div>

      {report.funnelInsight && (
        <div className="lg-lavender-sharp lg-xl relative p-6">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">漏斗分析</p>
          <p className="text-white/75 text-sm leading-relaxed">{report.funnelInsight}</p>
        </div>
      )}

      {report.audienceInsight && (
        <div className="lg-lavender-sharp lg-xl relative p-6">
          <p className="text-xs font-semibold text-teal-400 uppercase tracking-widest mb-3">受眾洞察</p>
          <p className="text-white/75 text-sm leading-relaxed">{report.audienceInsight}</p>
        </div>
      )}

      {report.highlights?.length > 0 && (
        <div className="lg-lavender-sharp lg-xl relative p-6 space-y-3">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">重點發現</p>
          {report.highlights.map((h: InsightHighlight, i: number) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 shrink-0 text-base">
                {h.type === 'positive' ? '✅' : h.type === 'negative' ? '⚠️' : '📌'}
              </span>
              <div>
                <span className="text-white/85 font-medium">{h.title}</span>
                {h.detail && <p className="text-white/55 text-xs mt-0.5">{h.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {report.recommendations?.length > 0 && (
        <div className="lg-lavender-sharp lg-xl relative p-6 space-y-4">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest">優化建議</p>
          {report.recommendations.map((r: InsightRecommendation, i: number) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${priorityColor(r.priority)}`}>
                {r.priority === 'high' ? '高' : r.priority === 'medium' ? '中' : '低'}
              </span>
              <div>
                <p className="text-white/85">{r.action}</p>
                {r.reason && <p className="text-white/50 text-xs mt-0.5">{r.reason}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CardsStory({ report }: { report: StoryInsightReport }) {
  return (
    <div className="space-y-5">
      <div className="lg-lavender-sharp lg-xl relative p-6">
        <h2 className="text-xl font-bold text-white mb-2">{report.storyTitle}</h2>
        {report.shareableOneLiner && (
          <p className="text-rose-300 text-sm font-medium">✨ {report.shareableOneLiner}</p>
        )}
      </div>

      <div className="lg-lavender-sharp lg-xl relative p-6">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">故事敘事</p>
        <div className="text-sm text-white/75 leading-relaxed space-y-3">
          {report.storyBody.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>

      {report.keyDataPoints?.length > 0 && (
        <div className="lg-lavender-sharp lg-xl relative p-6 space-y-2">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">數據支撐</p>
          {report.keyDataPoints.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-white/75">
              <span className="text-violet-400 shrink-0">▸</span> {d}
            </div>
          ))}
        </div>
      )}

      {report.pullQuotes?.length > 0 && (
        <div className="lg-lavender-sharp lg-xl relative p-6 space-y-4">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">填答者的聲音</p>
          {report.pullQuotes.map((q, i) => (
            <blockquote key={i} className="border-l-4 border-violet-500/60 pl-4 text-sm text-white/70 italic">
              「{q}」
            </blockquote>
          ))}
        </div>
      )}

      {report.unexpectedInsight && (
        <div className="lg-lavender-sharp lg-xl relative p-6">
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-2">出人意料的發現</p>
          <p className="text-white/80 text-sm">{report.unexpectedInsight}</p>
        </div>
      )}
    </div>
  )
}

// ─── Magazine mode ───────────────────────────────────────────────────────────

function MagazineData({ report }: { report: InsightReport }) {
  return (
    <div className="space-y-10 text-slate-800">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-slate-800/30" />
          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500">整體洞察</span>
          <div className="h-px flex-1 bg-slate-800/30" />
        </div>
        <p className="text-lg leading-relaxed text-slate-700 font-light">{report.summary}</p>
      </div>

      {(report.funnelInsight || report.audienceInsight) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {report.funnelInsight && (
            <div className="border-t-2 border-slate-800 pt-4">
              <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">漏斗分析</p>
              <p className="text-sm text-slate-600 leading-relaxed">{report.funnelInsight}</p>
            </div>
          )}
          {report.audienceInsight && (
            <div className="border-t-2 border-slate-800 pt-4">
              <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">受眾洞察</p>
              <p className="text-sm text-slate-600 leading-relaxed">{report.audienceInsight}</p>
            </div>
          )}
        </div>
      )}

      {report.highlights?.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-slate-800/30" />
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500">重點發現</span>
            <div className="h-px flex-1 bg-slate-800/30" />
          </div>
          <div className="space-y-4">
            {report.highlights.map((h: InsightHighlight, i: number) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-200 last:border-0">
                <span className="text-2xl leading-none shrink-0">
                  {h.type === 'positive' ? '✅' : h.type === 'negative' ? '⚠️' : '📌'}
                </span>
                <div>
                  <p className="font-semibold text-slate-800">{h.title}</p>
                  {h.detail && <p className="text-sm text-slate-500 mt-0.5">{h.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.recommendations?.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-slate-800/30" />
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500">優化建議</span>
            <div className="h-px flex-1 bg-slate-800/30" />
          </div>
          <ol className="space-y-4">
            {report.recommendations.map((r: InsightRecommendation, i: number) => (
              <li key={i} className="flex gap-4">
                <span className="text-3xl font-black text-slate-200 leading-none shrink-0 w-8">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{r.action}</p>
                  {r.reason && <p className="text-xs text-slate-500 mt-0.5">{r.reason}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function MagazineStory({ report }: { report: StoryInsightReport }) {
  return (
    <div className="space-y-10 text-slate-800">
      {report.shareableOneLiner && (
        <p className="text-2xl font-light italic text-slate-600 border-l-4 border-slate-800 pl-5">
          {report.shareableOneLiner}
        </p>
      )}

      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-slate-800/30" />
          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500">故事敘事</span>
          <div className="h-px flex-1 bg-slate-800/30" />
        </div>
        <div className="space-y-4 text-slate-700 leading-relaxed">
          {report.storyBody.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>

      {report.pullQuotes?.length > 0 && (
        <div className="space-y-6">
          {report.pullQuotes.map((q, i) => (
            <div key={i} className="text-center py-6 border-y border-slate-200">
              <p className="text-xl italic font-light text-slate-700">「{q}」</p>
            </div>
          ))}
        </div>
      )}

      {report.keyDataPoints?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {report.keyDataPoints.map((d, i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      )}

      {report.unexpectedInsight && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <p className="text-xs uppercase tracking-widest font-bold text-amber-600 mb-1">驚喜發現</p>
          <p className="text-slate-700 text-sm">{report.unexpectedInsight}</p>
        </div>
      )}
    </div>
  )
}

// ─── Minimal mode ────────────────────────────────────────────────────────────

function MinimalData({ report }: { report: InsightReport }) {
  return (
    <div className="space-y-8 text-gray-700 font-light">
      <p className="text-base leading-loose">{report.summary}</p>

      {report.highlights?.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-3">重點</p>
          <ul className="space-y-2">
            {report.highlights.map((h: InsightHighlight, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                <span className="text-gray-300 mt-1 shrink-0">—</span>
                <span className={h.type === 'negative' ? 'text-red-600' : h.type === 'positive' ? 'text-green-700' : 'text-gray-600'}>
                  {h.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.funnelInsight && (
        <div>
          <p className="text-xs text-gray-400 mb-2">漏斗</p>
          <p className="text-sm text-gray-600 leading-relaxed">{report.funnelInsight}</p>
        </div>
      )}

      {report.audienceInsight && (
        <div>
          <p className="text-xs text-gray-400 mb-2">受眾</p>
          <p className="text-sm text-gray-600 leading-relaxed">{report.audienceInsight}</p>
        </div>
      )}

      {report.recommendations?.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-3">行動建議</p>
          <ol className="space-y-2">
            {report.recommendations.map((r: InsightRecommendation, i: number) => (
              <li key={i} className="text-sm text-gray-600 leading-relaxed">
                <span className="text-gray-400 mr-2">{i + 1}.</span>{r.action}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function MinimalStory({ report }: { report: StoryInsightReport }) {
  return (
    <div className="space-y-8 text-gray-700 font-light">
      {report.shareableOneLiner && (
        <p className="text-lg italic text-gray-500">{report.shareableOneLiner}</p>
      )}
      <div className="text-sm leading-loose space-y-4">
        {report.storyBody.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {report.pullQuotes?.length > 0 && (
        <div className="space-y-3">
          {report.pullQuotes.map((q, i) => (
            <p key={i} className="text-sm italic text-gray-400 pl-4 border-l border-gray-200">「{q}」</p>
          ))}
        </div>
      )}
      {report.unexpectedInsight && (
        <div>
          <p className="text-xs text-gray-400 mb-1">發現</p>
          <p className="text-sm text-gray-600">{report.unexpectedInsight}</p>
        </div>
      )}
    </div>
  )
}

// ─── Cinematic mode ──────────────────────────────────────────────────────────

function CinematicData({ report }: { report: InsightReport }) {
  return (
    <div className="space-y-16">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4">Overview</p>
        <p className="text-lg text-white/80 leading-relaxed font-light">{report.summary}</p>
      </div>

      {report.highlights?.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-8">Highlights</p>
          <div className="space-y-6">
            {report.highlights.map((h: InsightHighlight, i: number) => (
              <div key={i} className="group">
                <div className="flex items-start gap-4">
                  <span className="text-white/20 text-4xl font-black leading-none shrink-0 w-10">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className={`font-semibold ${h.type === 'positive' ? 'text-emerald-400' : h.type === 'negative' ? 'text-red-400' : 'text-white/80'}`}>
                      {h.title}
                    </p>
                    {h.detail && <p className="text-white/40 text-sm mt-1">{h.detail}</p>}
                  </div>
                </div>
                <div className="h-px bg-white/5 mt-6" />
              </div>
            ))}
          </div>
        </div>
      )}

      {(report.funnelInsight || report.audienceInsight) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {report.funnelInsight && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-3">Funnel</p>
              <p className="text-sm text-white/55 leading-relaxed">{report.funnelInsight}</p>
            </div>
          )}
          {report.audienceInsight && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-3">Audience</p>
              <p className="text-sm text-white/55 leading-relaxed">{report.audienceInsight}</p>
            </div>
          )}
        </div>
      )}

      {report.recommendations?.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-8">Recommendations</p>
          <div className="space-y-6">
            {report.recommendations.map((r: InsightRecommendation, i: number) => (
              <div key={i} className="flex gap-4 items-start">
                <div className={`w-1 self-stretch rounded-full shrink-0 ${r.priority === 'high' ? 'bg-red-500' : r.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <div>
                  <p className="text-white/80 text-sm">{r.action}</p>
                  {r.reason && <p className="text-white/35 text-xs mt-1">{r.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CinematicStory({ report }: { report: StoryInsightReport }) {
  return (
    <div className="space-y-16">
      {report.shareableOneLiner && (
        <p className="text-2xl text-white/70 font-light italic leading-relaxed">
          {report.shareableOneLiner}
        </p>
      )}

      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-6">Story</p>
        <div className="text-white/60 leading-loose text-sm font-light space-y-5">
          {report.storyBody.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>

      {report.pullQuotes?.length > 0 && (
        <div className="space-y-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">Voices</p>
          {report.pullQuotes.map((q, i) => (
            <p key={i} className="text-xl font-light text-white/50 italic pl-5 border-l border-white/15">
              「{q}」
            </p>
          ))}
        </div>
      )}

      {report.keyDataPoints?.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-6">Data</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.keyDataPoints.map((d, i) => (
              <div key={i} className="border border-white/5 bg-white/3 rounded-xl p-4 text-sm text-white/55 leading-relaxed">
                {d}
              </div>
            ))}
          </div>
        </div>
      )}

      {report.unexpectedInsight && (
        <div className="border-l-2 border-amber-500/60 pl-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-500/80 mb-2">Unexpected</p>
          <p className="text-white/60 text-sm">{report.unexpectedInsight}</p>
        </div>
      )}
    </div>
  )
}

// ─── Mode wrapper ────────────────────────────────────────────────────────────

const MODE_WRAPPERS: Record<RenderMode, string> = {
  cards:     'bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white',
  magazine:  'bg-white text-slate-800',
  minimal:   'bg-gray-50 text-gray-800',
  cinematic: 'bg-black text-white',
}

const HEADER_STYLES: Record<RenderMode, { title: string; meta: string; brand: string }> = {
  cards:     { title: 'text-2xl font-bold text-white', meta: 'text-sm text-slate-400', brand: 'text-xs text-white/30 uppercase tracking-widest' },
  magazine:  { title: 'text-3xl font-black text-slate-900', meta: 'text-sm text-slate-400', brand: 'text-xs text-slate-400 uppercase tracking-widest' },
  minimal:   { title: 'text-xl font-semibold text-gray-900', meta: 'text-xs text-gray-400', brand: 'text-xs text-gray-400' },
  cinematic: { title: 'text-3xl font-light tracking-tight text-white', meta: 'text-[10px] uppercase tracking-[0.25em] text-white/30', brand: 'text-[9px] uppercase tracking-[0.35em] text-white/20' },
}

const FOOTER_STYLES: Record<RenderMode, { wrap: string; text: string; cta: string }> = {
  cards:     { wrap: 'border-t border-white/10', text: 'text-sm text-white/50', cta: 'bg-violet-600 hover:bg-violet-500 text-white' },
  magazine:  { wrap: 'border-t border-slate-200', text: 'text-sm text-slate-400', cta: 'bg-slate-900 hover:bg-slate-700 text-white' },
  minimal:   { wrap: 'border-t border-gray-200', text: 'text-xs text-gray-400', cta: 'border border-gray-300 hover:bg-gray-100 text-gray-700' },
  cinematic: { wrap: 'border-t border-white/5', text: 'text-xs text-white/20 uppercase tracking-widest', cta: 'border border-white/20 hover:bg-white/10 text-white/60' },
}

function CopyButton({ url, mode }: { url: string; mode: RenderMode }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const colors: Record<RenderMode, string> = {
    cards:     'text-violet-400 hover:text-violet-300 border-violet-500/30 hover:border-violet-400/50',
    magazine:  'text-slate-600 hover:text-slate-800 border-slate-300',
    minimal:   'text-gray-500 hover:text-gray-700 border-gray-200',
    cinematic: 'text-white/20 hover:text-white/40 border-white/10',
  }

  return (
    <button
      onClick={copy}
      className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${colors[mode]}`}
    >
      {copied ? '✓ 已複製' : '複製連結'}
    </button>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ReportViewer({
  report, reportType, title, surveyTitle, createdAt, shareViews, shareUrl
}: Props) {
  const [mode, setMode] = useState<RenderMode>('cards')
  const hs = HEADER_STYLES[mode]
  const fs = FOOTER_STYLES[mode]
  const isStory = reportType === 'story'

  const renderContent = () => {
    if (mode === 'cards')     return isStory ? <CardsStory report={report as StoryInsightReport} />     : <CardsData report={report as InsightReport} />
    if (mode === 'magazine')  return isStory ? <MagazineStory report={report as StoryInsightReport} />  : <MagazineData report={report as InsightReport} />
    if (mode === 'minimal')   return isStory ? <MinimalStory report={report as StoryInsightReport} />   : <MinimalData report={report as InsightReport} />
    if (mode === 'cinematic') return isStory ? <CinematicStory report={report as StoryInsightReport} /> : <CinematicData report={report as InsightReport} />
    return null
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${MODE_WRAPPERS[mode]}`}>
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* Mode picker */}
        <div className="flex items-center justify-between">
          <div className={`text-[10px] uppercase tracking-widest ${mode === 'cinematic' ? 'text-white/20' : mode === 'cards' ? 'text-white/30' : 'text-gray-400'}`}>
            顯示模式
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-black/10">
            {MODE_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setMode(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mode === opt.key
                    ? mode === 'cinematic' || mode === 'cards'
                      ? 'bg-white/15 text-white'
                      : 'bg-white shadow-sm text-slate-800'
                    : mode === 'cinematic' || mode === 'cards'
                      ? 'text-white/40 hover:text-white/70'
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="space-y-1">
          <p className={hs.brand}>SnowRealm Insight Engine</p>
          <h1 className={hs.title}>{title}</h1>
          <div className={`flex items-center gap-3 flex-wrap ${hs.meta}`}>
            <span>{isStory ? '📖 故事報告' : '📊 數據報告'}</span>
            <span>·</span>
            <span>{new Date(createdAt).toLocaleDateString('zh-TW')}</span>
            {shareViews > 0 && (
              <>
                <span>·</span>
                <span>👁 {shareViews} 次查看</span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {renderContent()}

        {/* Footer */}
        <div className={`pt-8 space-y-4 ${fs.wrap}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className={fs.text}>由 SnowRealm Insight Engine 生成</p>
            <CopyButton url={shareUrl} mode={mode} />
          </div>
          <div className="text-center space-y-3">
            <p className={mode === 'cards' ? 'text-white/70 text-sm' : mode === 'cinematic' ? 'text-white/30 text-sm' : 'text-gray-600 text-sm'}>
              想為你的問卷也生成 AI 洞察？
            </p>
            <a
              href={process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'}
              className={`inline-block px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${fs.cta}`}
            >
              免費試用 30 天
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
