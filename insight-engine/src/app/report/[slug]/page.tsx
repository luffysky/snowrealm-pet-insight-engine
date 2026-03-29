import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { InsightReport } from '@/lib/insightEngine'
import type { StoryInsightReport } from '@/lib/storyEngine'
import ReportViewer from './ReportViewer'

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
    ? (data.report as InsightReport).summary?.slice(0, 120)
    : (data.report as StoryInsightReport).shareableOneLiner ?? ''

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'
  return {
    metadataBase: new URL(baseUrl),
    title: `${title} — SnowRealm Insight Engine`,
    description: desc,
    openGraph: {
      title,
      description: desc ?? undefined,
      type: 'article',
      url: `${baseUrl}/report/${slug}`,
      siteName: 'SnowRealm Insight Engine',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc ?? undefined,
    },
  }
}

export default async function PublicReportPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const data = await fetchReport(slug)
  if (!data) notFound()

  const title = data.shareTitle ?? data.surveyTitle ?? 'AI 洞察報告'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'
  const shareUrl = `${baseUrl}/report/${slug}`

  return (
    <ReportViewer
      report={data.report}
      reportType={data.reportType}
      title={title}
      surveyTitle={data.surveyTitle}
      createdAt={data.createdAt}
      shareViews={data.shareViews}
      shareUrl={shareUrl}
    />
  )
}
