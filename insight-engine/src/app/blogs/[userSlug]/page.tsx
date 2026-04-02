import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleList } from './ArticleList'
import { SubscribeForm } from './SubscribeForm'

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
    category: string | null
    view_count: number
    published_at: string
  }[]
  categories?: string[]
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

  const { blog, articles, categories } = data

  return (
    <div className="blog-list-root min-h-screen bg-slate-950 text-white" style={{ paddingBottom: 'var(--bnav-h, 76px)' }}>
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
        <ArticleList articles={articles} blogSlug={blog.userSlug} categories={categories ?? []} />

        {/* Email 訂閱 */}
        <SubscribeForm userSlug={blog.userSlug} />

        {/* CTA — 引導建立自己的部落格 */}
        <div className="mt-16 mb-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/[0.07] via-violet-500/[0.05] to-slate-900 px-6 py-8 sm:px-10 sm:py-10 text-center">
            {/* Decorative blobs */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="text-3xl mb-3">✍️</div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                你也想寫自己的部落格？
              </h2>
              <p className="text-sm text-white/50 leading-relaxed max-w-md mx-auto mb-6">
                加入 SnowRealm，獲得你自己的部落格空間。<br />
                支援 AI 輔助寫作、自訂主題、系列文章，以及完整的讀者互動功能。
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register?redirect=/insight-admin/blog"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500/90 hover:bg-amber-500 text-black font-semibold text-sm rounded-2xl transition-colors"
                >
                  免費開始寫作 →
                </Link>
                <Link
                  href="/blogs"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-white/70 text-sm rounded-2xl border border-white/10 transition-colors"
                >
                  探索更多部落格
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
