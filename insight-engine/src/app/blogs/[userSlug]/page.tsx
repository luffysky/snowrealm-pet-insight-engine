import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

interface BlogData {
  blog: {
    userSlug: string
    blogTitle: string | null
    blogDesc: string | null
    authorName: string | null
    authorAvatar: string | null
  }
  articles: {
    id: string
    title: string
    slug: string
    summary: string | null
    cover_image: string | null
    cover_image_position: string | null
    tags: string[]
    view_count: number
    published_at: string
  }[]
}

async function getBlogData(userSlug: string): Promise<BlogData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/blogs/${userSlug}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ userSlug: string }> }): Promise<Metadata> {
  const { userSlug } = await params
  const data = await getBlogData(userSlug)
  if (!data) return { title: '找不到部落格' }
  const { blog } = data
  const title = blog.blogTitle ?? `${blog.authorName ?? userSlug} 的部落格`
  const description = blog.blogDesc ?? `閱讀 ${blog.authorName ?? userSlug} 的文章`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: blog.authorAvatar ? [blog.authorAvatar] : [],
    },
  }
}

export default async function BlogPage({ params }: { params: Promise<{ userSlug: string }> }) {
  const { userSlug } = await params
  const data = await getBlogData(userSlug)

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white/40">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg font-medium">找不到部落格</p>
          <p className="text-sm mt-2">該部落格可能不存在或已停用</p>
        </div>
      </div>
    )
  }

  const { blog, articles } = data

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ paddingBottom: 'var(--bnav-h, 76px)' }}>
      {/* Hero / Author info */}
      <div className="border-b border-white/8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            {blog.authorAvatar ? (
              <Image
                src={blog.authorAvatar}
                alt={blog.authorName ?? ''}
                width={72}
                height={72}
                className="rounded-full object-cover ring-2 ring-white/10"
              />
            ) : (
              <div className="w-18 h-18 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                ✍️
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {blog.blogTitle ?? `${blog.authorName ?? userSlug} 的部落格`}
              </h1>
              {blog.authorName && (
                <p className="text-sm text-white/50 mt-0.5">{blog.authorName}</p>
              )}
              {blog.blogDesc && (
                <p className="text-sm text-white/60 mt-2 leading-relaxed max-w-xl">{blog.blogDesc}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Article list */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {articles.length === 0 ? (
          <div className="text-center py-20 text-white/25">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-sm">還沒有公開文章</p>
          </div>
        ) : (
          <div className="space-y-6">
            {articles.map(article => (
              <Link
                key={article.id}
                href={`/blogs/${blog.userSlug}/${article.slug}`}
                className="group flex flex-col sm:flex-row gap-4 sm:gap-5 p-4 sm:p-5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 rounded-2xl transition-all"
              >
                {article.cover_image && (
                  <div className="shrink-0 w-full sm:w-28 h-40 sm:h-20 rounded-xl overflow-hidden">
                    <Image
                      src={article.cover_image}
                      alt={article.title}
                      width={112}
                      height={80}
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
                    <p className="text-sm text-white/45 mt-1.5 line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-white/25">
                    <span>{new Date(article.published_at).toLocaleDateString('zh-TW')}</span>
                    <span>·</span>
                    <span>👁 {article.view_count}</span>
                    {article.tags.length > 0 && (
                      <>
                        <span>·</span>
                        <div className="flex gap-1.5">
                          {article.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-white/5 rounded-md text-white/35">{tag}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
