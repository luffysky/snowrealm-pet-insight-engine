import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: '部落格',
  description: '探索所有公開部落格',
}

interface BlogItem {
  userSlug: string
  blogTitle: string | null
  blogDesc: string | null
  authorName: string | null
  authorAvatar: string | null
  articleCount: number
  latestPublishedAt: string | null
}

async function getBlogs(): Promise<BlogItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/blogs`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json() as { blogs: BlogItem[] }
    return data.blogs ?? []
  } catch {
    return []
  }
}

export default async function BlogsPage() {
  const blogs = await getBlogs()

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ paddingBottom: 'var(--bnav-h, 76px)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">部落格</h1>
          <p className="text-sm text-white/45 mt-1.5">探索所有公開文章與創作者</p>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-24 text-white/25">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-sm">目前還沒有公開部落格</p>
          </div>
        ) : (
          <div className="space-y-4">
            {blogs.map(blog => (
              <Link
                key={blog.userSlug}
                href={`/blogs/${blog.userSlug}`}
                className="group flex items-start gap-4 p-4 sm:p-5 lg-dark-sharp lg-shimmer lg-lg relative overflow-hidden hover:bg-white/[0.03] transition-all"
              >
                {/* Avatar */}
                {blog.authorAvatar ? (
                  <Image
                    src={blog.authorAvatar}
                    alt={blog.authorName ?? ''}
                    width={52}
                    height={52}
                    className="rounded-full object-cover ring-2 ring-white/8 shrink-0"
                  />
                ) : (
                  <div className="w-13 h-13 shrink-0 rounded-full bg-white/8 flex items-center justify-center text-xl">
                    ✍️
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-white/90 group-hover:text-white transition-colors line-clamp-1">
                    {blog.blogTitle ?? `${blog.authorName ?? blog.userSlug} 的部落格`}
                  </h2>
                  {blog.authorName && (
                    <p className="text-xs text-white/40 mt-0.5">{blog.authorName}</p>
                  )}
                  {blog.blogDesc && (
                    <p className="text-sm text-white/50 mt-1.5 line-clamp-2 leading-relaxed">{blog.blogDesc}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2.5 text-[11px] text-white/25">
                    <span>📝 {blog.articleCount} 篇文章</span>
                    {blog.latestPublishedAt && (
                      <>
                        <span>·</span>
                        <span>最新：{new Date(blog.latestPublishedAt).toLocaleDateString('zh-TW')}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/[0.07] via-violet-500/[0.05] to-slate-900 px-6 py-8 sm:px-10 sm:py-10 text-center">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="text-3xl mb-3">✍️</div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">開始你自己的部落格</h2>
              <p className="text-sm text-white/50 leading-relaxed max-w-md mx-auto mb-6">
                加入 SnowRealm，擁有屬於你的寫作空間。<br />
                AI 輔助寫作、系列文章、讀者互動，一鍵開啟。
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register?redirect=/insight-admin/blog"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500/90 hover:bg-amber-500 text-black font-semibold text-sm rounded-2xl transition-colors"
                >
                  免費開始寫作 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
