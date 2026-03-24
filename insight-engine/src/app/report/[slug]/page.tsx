import type { Metadata } from 'next'
import type { InsightReport, InsightHighlight, InsightRecommendation } from '@/lib/insightEngine'
import type { StoryInsightReport } from '@/lib/storyEngine'

// ===== 型別 =====

interface PublicReportData {
  report: InsightReport | StoryInsightReport
  meta: Record<string, unknown>
  shareTitle: string | null
  reportType: 'data' | 'story'
  createdAt: string
  shareViews: number
}

// ===== Metadata =====

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''

  try {
    const res = await fetch(`${baseUrl}/api/report/${slug}`, { cache: 'no-store' })
    if (!res.ok) return { title: '報告不存在 — SnowRealm Insight Engine' }

    const data = (await res.json()) as PublicReportData
    const title = data.shareTitle ?? 'AI 洞察報告'
    let description = ''

    if (data.reportType === 'story') {
      const r = data.report as StoryInsightReport
      description = r.shareableOneLiner ?? r.storyBody?.slice(0, 100) ?? ''
    } else {
      const r = data.report as InsightReport
      description = r.summary?.slice(0, 100) ?? ''
    }

    return {
      title: `${title} — SnowRealm Insight Engine`,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/report/${slug}`,
        siteName: 'SnowRealm Insight Engine',
      },
    }
  } catch {
    return { title: 'AI 洞察報告 — SnowRealm Insight Engine' }
  }
}

// ===== 子元件：數據報告 =====

function DataReport({ report }: { report: InsightReport }) {
  const highlightColors: Record<InsightHighlight['type'], string> = {
    positive: 'border-emerald-500/40 bg-emerald-500/5',
    negative: 'border-red-500/40 bg-red-500/5',
    neutral: 'border-slate-500/40 bg-slate-500/5',
  }
  const highlightIcons: Record<InsightHighlight['type'], string> = {
    positive: '✅',
    negative: '⚠️',
    neutral: '📌',
  }
  const priorityIcons: Record<InsightRecommendation['priority'], string> = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  }

  return (
    <div className="space-y-8">
      {/* 摘要 */}
      {report.summary && (
        <section>
          <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">報告摘要</h2>
          <p className="text-white/80 text-sm leading-relaxed">{report.summary}</p>
        </section>
      )}

      {/* 關鍵發現 */}
      {report.highlights?.length > 0 && (
        <section>
          <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">關鍵發現</h2>
          <ul className="space-y-3">
            {report.highlights.map((h, i) => (
              <li
                key={i}
                className={`rounded-xl px-4 py-3.5 border ${highlightColors[h.type]}`}
              >
                <p className="text-white/90 text-sm font-semibold mb-0.5">
                  {highlightIcons[h.type]} {h.title}
                </p>
                <p className="text-white/60 text-xs leading-relaxed">{h.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 漏斗洞察 */}
      {report.funnelInsight && (
        <section>
          <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">漏斗分析</h2>
          <p className="text-white/70 text-sm leading-relaxed">{report.funnelInsight}</p>
        </section>
      )}

      {/* 受眾洞察 */}
      {report.audienceInsight && (
        <section>
          <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">受眾分析</h2>
          <p className="text-white/70 text-sm leading-relaxed">{report.audienceInsight}</p>
        </section>
      )}

      {/* 建議行動 */}
      {report.recommendations?.length > 0 && (
        <section>
          <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">建議行動</h2>
          <ul className="space-y-3">
            {report.recommendations.map((r, i) => (
              <li key={i} className="bg-slate-700/40 rounded-xl px-4 py-3.5">
                <p className="text-white/90 text-sm font-semibold mb-0.5">
                  {priorityIcons[r.priority]} {r.action}
                </p>
                <p className="text-white/50 text-xs leading-relaxed">{r.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

// ===== 子元件：故事報告 =====

function StoryReport({ report }: { report: StoryInsightReport }) {
  // 將 markdown 段落渲染成 <p> 標籤（不引入外部依賴）
  const paragraphs = report.storyBody
    ?.split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0) ?? []

  return (
    <div className="space-y-8">
      {/* 故事標題 */}
      {report.storyTitle && (
        <h2 className="text-white text-2xl font-bold leading-snug">{report.storyTitle}</h2>
      )}

      {/* 引言 */}
      {report.pullQuotes?.length > 0 && (
        <div className="space-y-3">
          {report.pullQuotes.map((quote, i) => (
            <blockquote
              key={i}
              className="border-l-4 border-amber-400/60 pl-4 py-1"
            >
              <p className="text-amber-300/90 text-sm italic leading-relaxed">「{quote}」</p>
            </blockquote>
          ))}
        </div>
      )}

      {/* 故事正文 */}
      {paragraphs.length > 0 && (
        <section className="space-y-4">
          {paragraphs.map((paragraph, i) => {
            // markdown 標題行
            if (paragraph.startsWith('## ')) {
              return (
                <h3 key={i} className="text-white/80 text-base font-semibold mt-6 first:mt-0">
                  {paragraph.slice(3)}
                </h3>
              )
            }
            if (paragraph.startsWith('# ')) {
              return (
                <h3 key={i} className="text-white text-lg font-bold mt-6 first:mt-0">
                  {paragraph.slice(2)}
                </h3>
              )
            }
            return (
              <p key={i} className="text-white/75 text-sm leading-relaxed">
                {paragraph}
              </p>
            )
          })}
        </section>
      )}

      {/* 數據支撐 */}
      {report.keyDataPoints?.length > 0 && (
        <section>
          <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">數據支撐</h2>
          <ul className="space-y-2">
            {report.keyDataPoints.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm text-white/70">
                <span className="text-emerald-400 shrink-0">📊</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 出人意料的發現 */}
      {report.unexpectedInsight && (
        <section className="bg-violet-500/10 border border-violet-500/30 rounded-xl px-4 py-4">
          <p className="text-violet-300/80 text-xs font-semibold uppercase tracking-wider mb-2">
            出人意料的發現
          </p>
          <p className="text-white/80 text-sm leading-relaxed">{report.unexpectedInsight}</p>
        </section>
      )}

      {/* 可分享的標語 */}
      {report.shareableOneLiner && (
        <section className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl px-5 py-4 text-center">
          <p className="text-amber-300 text-base font-semibold leading-snug">
            {report.shareableOneLiner}
          </p>
        </section>
      )}
    </div>
  )
}

// ===== 頁面 =====

export default async function PublicReportPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''

  let data: PublicReportData | null = null
  let fetchError = false

  try {
    const res = await fetch(`${baseUrl}/api/report/${slug}`, { cache: 'no-store' })
    if (res.ok) {
      data = (await res.json()) as PublicReportData
    } else {
      fetchError = true
    }
  } catch {
    fetchError = true
  }

  // 404 / 錯誤狀態
  if (fetchError || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-5xl">📭</div>
        <p className="text-white/60 text-center text-sm max-w-xs">
          報告不存在或已被取消分享，請確認連結是否正確。
        </p>
        <a href="/" className="text-emerald-400 underline text-sm hover:text-emerald-300 transition-colors">
          回到首頁
        </a>
      </div>
    )
  }

  const reportTitle = data.shareTitle ?? 'AI 洞察報告'
  const isStory = data.reportType === 'story'
  const formattedDate = new Date(data.createdAt).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">

        {/* 品牌 header */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-white/30 text-xs font-medium tracking-widest uppercase">
            SnowRealm Insight Engine
          </span>
          <span className="text-white/20 text-xs">·</span>
          <span className="text-white/30 text-xs">AI 洞察報告</span>
        </div>

        {/* 報告卡片 */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">

          {/* 頁首 */}
          <div className={`px-6 py-6 ${isStory
            ? 'bg-gradient-to-r from-violet-700 to-purple-700'
            : 'bg-gradient-to-r from-indigo-700 to-blue-700'
          }`}>
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-2">
              {isStory ? '📖 故事洞察報告' : '📊 數據洞察報告'}
            </p>
            <h1 className="text-white text-xl font-bold leading-snug">{reportTitle}</h1>
            <p className="text-white/50 text-xs mt-2">{formattedDate}</p>
          </div>

          {/* 報告內容 */}
          <div className="px-6 py-6">
            {isStory
              ? <StoryReport report={data.report as StoryInsightReport} />
              : <DataReport report={data.report as InsightReport} />
            }
          </div>

        </div>

        {/* 瀏覽次數 */}
        <p className="mt-4 text-center text-white/25 text-xs">
          👁 已被查看 {data.shareViews} 次
        </p>

        {/* CTA */}
        <div className="mt-10 bg-slate-800/60 rounded-2xl border border-slate-700/50 px-6 py-6 text-center">
          <p className="text-white/60 text-sm mb-1">由 SnowRealm Insight Engine 生成</p>
          <p className="text-white/40 text-xs mb-4">
            想為你的問卷也生成 AI 洞察報告？
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-900/30"
          >
            免費試用 30 天 →
          </a>
        </div>

        {/* 底部 */}
        <p className="mt-8 text-center text-white/15 text-xs">
          Powered by SnowRealm Insight Engine · insight.snowrealm.pet
        </p>

      </div>
    </div>
  )
}
