import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

interface SeriesData {
  blog: {
    userSlug: string
    blogTitle: string | null
    authorName: string | null
    authorAvatar: string | null
  }
  series: {
    id: string
    title: string
    description: string | null
    cover_image: string | null
    is_completed: boolean
  }
  articles: {
    id: string
    title: string
    slug: string
    summary: string | null
    cover_image: string | null
    cover_image_position: string | null
    tags: string[]
    category: string | null
    view_count: number
    published_at: string
    series_order: number | null
  }[]
}

async function getSeriesData(userSlug: string, seriesId: string): Promise<SeriesData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/blogs/${userSlug}/series/${seriesId}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ userSlug: string; seriesId: string }> }): Promise<Metadata> {
  const { userSlug, seriesId } = await params
  const data = await getSeriesData(userSlug, seriesId)
  if (!data) return { title: '找不到系列' }
  const title = `${data.series.title} — ${data.blog.authorName ?? data.blog.userSlug}`
  const description = data.series.description ?? `${data.series.title} 系列文章`
  return {
    title,
    description,
    openGraph: { title, description },
  }
}

export default async function SeriesPage({ params }: { params: Promise<{ userSlug: string; seriesId: string }> }) {
  const { userSlug, seriesId } = await params
  const data = await getSeriesData(userSlug, seriesId)

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white/40">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg font-medium">找不到系列</p>
        </div>
      </div>
    )
  }

  const { blog, series, articles } = data

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ paddingBottom: 'var(--bnav-h, 76px)' }}>
      {/* Header */}
      <div className="border-b border-white/8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Link href={`/blogs/${blog.userSlug}`} className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors mb-6">
            ← 回到部落格
          </Link>

          <div className="flex items-start gap-4">
            {series.cover_image && (
              <Image src={series.cover_image} alt={series.title} width={80} height={80} className="rounded-xl object-cover shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-400/70 text-sm">📖 系列文章</span>
                {series.is_completed && (
                  <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300/70 text-[11px] rounded-full">已完結</span>
                )}
              </div>
              <h1 className="text-2xl font-bold">{series.title}</h1>
              {series.description && (
                <p className="text-sm text-white/50 mt-2 leading-relaxed">{series.description}</p>
              )}
              <p className="text-xs text-white/30 mt-2">共 {articles.length} 篇文章</p>
            </div>
          </div>
        </div>
      </div>

      {/* Article list */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {articles.length === 0 ? (
          <div className="text-center py-16 text-white/25">
            <p className="text-sm">此系列尚無公開文章</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article, index) => (
              <Link
                key={article.id}
                href={`/blogs/${blog.userSlug}/${article.slug}`}
                className="group flex gap-4 p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition-all"
              >
                {/* Order number */}
                <div className="shrink-0 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400/70 text-sm font-bold">
                  {article.series_order ?? index + 1}
                </div>

                {article.cover_image && (
                  <div className="shrink-0 w-20 h-14 rounded-lg overflow-hidden hidden sm:block">
                    <Image
                      src={article.cover_image}
                      alt={article.title}
                      width={80}
                      height={56}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ objectPosition: article.cover_image_position ?? 'center center' }}
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-white/90 group-hover:text-white transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                  {article.summary && (
                    <p className="text-sm text-white/40 mt-1 line-clamp-1 leading-relaxed">{article.summary}</p>
                  )}
                  <div className="flex items-center gap-2.5 mt-2 text-[11px] text-white/25">
                    <span>{new Date(article.published_at).toLocaleDateString('zh-TW')}</span>
                    <span>·</span>
                    <span>👁 {article.view_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Author info */}
        <div className="mt-12 pt-8 border-t border-white/8 flex items-center gap-3">
          {blog.authorAvatar ? (
            <Image src={blog.authorAvatar} alt={blog.authorName ?? ''} width={40} height={40} className="rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">✍️</div>
          )}
          <div>
            <Link href={`/blogs/${blog.userSlug}`} className="text-sm font-medium text-white/70 hover:text-white/90 transition-colors">
              {blog.authorName ?? blog.userSlug}
            </Link>
            <p className="text-xs text-white/30">{blog.blogTitle ?? '部落格'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
