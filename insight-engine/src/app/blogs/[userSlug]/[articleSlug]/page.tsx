import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

interface ArticleData {
  article: {
    id: string
    user_id: string
    title: string
    slug: string
    summary: string | null
    content: string
    cover_image: string | null
    cover_image_position: string | null
    tags: string[]
    is_public: boolean
    view_count: number
    seo_title: string | null
    seo_desc: string | null
    published_at: string
    author_name: string | null
    author_avatar: string | null
    blog_slug: string | null
  }
}

async function getArticle(userSlug: string, articleSlug: string): Promise<ArticleData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/blogs/${userSlug}/${articleSlug}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userSlug: string; articleSlug: string }>
}): Promise<Metadata> {
  const { userSlug, articleSlug } = await params
  const data = await getArticle(userSlug, articleSlug)
  if (!data) return { title: '文章不存在' }
  const { article } = data
  const title = article.seo_title ?? article.title
  const description = article.seo_desc ?? article.summary ?? ''
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: article.cover_image ? [article.cover_image] : [],
      type: 'article',
      publishedTime: article.published_at,
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ userSlug: string; articleSlug: string }>
}) {
  const { userSlug, articleSlug } = await params
  const data = await getArticle(userSlug, articleSlug)

  if (!data) notFound()

  const { article } = data
  const backSlug = article.blog_slug ?? userSlug

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ paddingBottom: 'var(--bnav-h, 76px)' }}>
      {/* Back link */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        <Link
          href={`/blogs/${backSlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          ← {article.author_name ?? '部落格'}
        </Link>
      </div>

      {/* Cover image */}
      {article.cover_image && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-6">
          <div className="relative w-full h-64 rounded-2xl overflow-hidden">
            <Image
              src={article.cover_image}
              alt={article.title}
              fill
              className="object-cover"
              style={{ objectPosition: article.cover_image_position ?? 'center center' }}
              priority
            />
          </div>
        </div>
      )}

      {/* Article header */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8">
        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-400/80 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{article.title}</h1>

        {article.summary && (
          <p className="text-base text-white/55 mt-3 leading-relaxed">{article.summary}</p>
        )}

        {/* Author + meta */}
        <div className="flex items-center gap-3 mt-5 pb-6 border-b border-white/8">
          {article.author_avatar ? (
            <Image
              src={article.author_avatar}
              alt={article.author_name ?? ''}
              width={36}
              height={36}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm">✍️</div>
          )}
          <div>
            <p className="text-sm font-medium text-white/75">{article.author_name ?? userSlug}</p>
            <p className="text-xs text-white/30">
              {new Date(article.published_at).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {' · '}
              👁 {article.view_count}
            </p>
          </div>
          {!article.is_public && (
            <span className="ml-auto text-xs px-2 py-0.5 bg-white/8 text-white/35 rounded-full">私人</span>
          )}
        </div>
      </div>

      {/* Content */}
      <article
        className="max-w-3xl mx-auto px-4 sm:px-6 py-8 prose prose-invert prose-slate max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-p:text-white/75 prose-p:leading-relaxed
          prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white/90
          prose-blockquote:border-amber-500/40 prose-blockquote:text-white/55
          prose-code:text-amber-300 prose-code:bg-white/5 prose-code:rounded prose-code:px-1
          prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/8
          prose-img:rounded-xl prose-img:shadow-lg
          prose-li:text-white/75
          prose-hr:border-white/10"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Footer */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <div className="border-t border-white/8 pt-8 flex items-center justify-between">
          <Link
            href={`/blogs/${backSlug}`}
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            ← 回到 {article.author_name ?? '部落格'}
          </Link>
          <div className="text-xs text-white/20">
            {new Date(article.published_at).toLocaleDateString('zh-TW')}
          </div>
        </div>
      </div>
    </div>
  )
}
