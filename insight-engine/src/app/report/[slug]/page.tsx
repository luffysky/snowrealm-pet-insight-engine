import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { InsightReport, InsightHighlight, InsightRecommendation } from '@/lib/insightEngine'
import type { StoryInsightReport } from '@/lib/storyEngine'

interface PublicReport {
  report: InsightReport | StoryInsightReport
  meta: { provider: string; model: string; generatedAt: string }
  reportType: 'data' | 'story'
  shareTitle: string | null
  surveyTitle: string | null
  shareViews: number
  createdAt: string
}

async function fetchReport(slug: string): Promise<PublicReport | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/report/${slug}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json() as Promise<PublicReport>
  } catch {
    return null
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const data = await fetchReport(slug)
  if (!data) return { title: 'Not Found' }

  const title = data.shareTitle ?? data.surveyTitle ?? 'AI 洞察報告'
  const desc = data.reportType === 'data'
    ? (data.report as InsightReport).summary?.slice(0, 100)
    : (data.report as StoryInsightReport).shareableOneLiner ?? ''

  return {
    title: `${title} — SnowRealm Insight Engine`,
    description: desc,
    openGraph: {
      title,
      description: desc ?? undefined,
      type: 'article',
    },
  }
}

function DataReportView({ report }: { report: InsightReport }) {
  return (
    <div className="space-y-6">
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-violet-300 mb-2">整體洞察</h2>
        <p className="text-white/85 leading-relaxed text-sm">{report.summary}</p>
      </div>

      {report.highlights?.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
          <h2 className="text-base font-semibold text-white/80">重點發現</h2>
          {report.highlights.map((h: InsightHighlight, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm text-white/70">
              <span>{h.type === 'positive' ? '✅' : h.type === 'negative' ? '⚠️' : '📌'}</span>
              <span>{h.title} — {h.detail}</span>
            </div>
          ))}
        </div>
      )}

      {report.recommendations?.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
          <h2 className="text-base font-semibold text-white/80">優化建議</h2>
          {report.recommendations.map((r: InsightRecommendation, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-amber-400 mt-0.5 shrink-0">🎯</span>
              <div>
                <span className="text-white/80">{r.action}</span>
                {r.reason && <p className="text-white/50 text-xs mt-0.5">{r.reason}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StoryReportView({ report }: { report: StoryInsightReport }) {
  return (
    <div className="space-y-6">
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 space-y-2">
        <h2 className="text-xl font-bold text-white">{report.storyTitle}</h2>
        {report.shareableOneLiner && (
          <p className="text-rose-300 font-medium text-sm">✨ {report.shareableOneLiner}</p>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-white/80 mb-3">故事敘事</h3>
        <div className="text-sm text-white/75 leading-relaxed space-y-3">
          {report.storyBody.split(/\n\n+/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>

      {report.pullQuotes?.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
          <h3 className="text-base font-semibold text-white/80">填答者的聲音</h3>
          {report.pullQuotes.map((q, i) => (
            <blockquote key={i} className="border-l-4 border-violet-500/60 pl-4 text-sm text-white/70 italic">
              「{q}」
            </blockquote>
          ))}
        </div>
      )}
    </div>
  )
}

export default async function PublicReportPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const data = await fetchReport(slug)
  if (!data) notFound()

  const title = data.shareTitle ?? data.surveyTitle ?? 'AI 洞察報告'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-xs text-white/30 font-medium tracking-wider uppercase">
            SnowRealm Insight Engine
          </p>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-sm text-slate-400">
            {data.reportType === 'story' ? '📖 故事報告' : '📊 數據報告'}
            {' '}·{' '}
            {new Date(data.createdAt).toLocaleDateString('zh-TW')}
            {data.shareViews > 0 && (
              <span className="ml-2 text-slate-500">👁 {data.shareViews} 次查看</span>
            )}
          </p>
        </div>

        {/* Report Content */}
        {data.reportType === 'story'
          ? <StoryReportView report={data.report as StoryInsightReport} />
          : <DataReportView report={data.report as InsightReport} />
        }

        {/* Footer CTA */}
        <div className="border-t border-white/10 pt-8 text-center space-y-4">
          <p className="text-sm text-white/50">由 SnowRealm Insight Engine 生成</p>
          <p className="text-white/70">想為你的問卷也生成 AI 洞察？</p>
          <a
            href={baseUrl}
            className="inline-block px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            免費試用 30 天
          </a>
        </div>
      </div>
    </div>
  )
}
