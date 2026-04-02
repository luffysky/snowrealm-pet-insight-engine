import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import {
  ReadingProgress,
  ArticleReactions,
  ArticleComments,
  ArticleThemeToggle,
  TableOfContents,
  AuthorCard,
  RelatedArticles,
  FontSizeToggle,
  CodeHighlighter,
  CodeCopyButtons,
  type Heading,
} from './ArticleClient'
import ShareArticleButton from './ShareArticleButton'
import { ArticlePasswordGate } from './ArticlePasswordGate'

interface ArticleNav { title: string; slug: string }

interface SeriesArticle { id: string; title: string; slug: string; series_order: number | null }

interface ArticleData {
  is_password_protected?: boolean
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
    is_password_protected?: boolean
    view_count: number
    seo_title: string | null
    seo_desc: string | null
    series_id: string | null
    series_order: number | null
    published_at: string
    author_name: string | null
    author_avatar: string | null
    blog_slug: string | null
  }
  prev: ArticleNav | null
  next: ArticleNav | null
  series: { id: string; title: string; is_completed: boolean; articles: SeriesArticle[] } | null
}

async function getArticle(userSlug: string, articleSlug: string, notrack = false): Promise<ArticleData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const url = `${baseUrl}/api/blogs/${userSlug}/${articleSlug}${notrack ? '?notrack=1' : ''}`
    // 轉發瀏覽器 cookies（包含 article_unlock_* cookie）到 API
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
    const res = await fetch(url, {
      cache: 'no-store',
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    })
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
  const data = await getArticle(userSlug, articleSlug, true)
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

function estimateReadTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, '').length
  return Math.max(1, Math.round(words / 400))
}

// BLOG-5: Process headings — inject id attrs and anchor links
function processHeadings(html: string): { processedHtml: string; headings: Heading[] } {
  const headings: Heading[] = []
  const idCounts: Record<string, number> = {}

  const processed = html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/h[23]>/g, (match, tag, attrs, inner) => {
    const level = parseInt(tag[1], 10) as 2 | 3
    const text = inner.replace(/<[^>]*>/g, '').trim()
    const baseId = text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60)

    // Deduplicate ids in case same heading text appears more than once
    const count = idCounts[baseId] ?? 0
    idCounts[baseId] = count + 1
    const id = count === 0 ? baseId : `${baseId}-${count}`

    headings.push({ id, text, level })

    const anchorLink = `<a href="#${id}" class="heading-anchor" aria-label="直接連結">#</a>`
    return `<${tag}${attrs} id="${id}">${inner}${anchorLink}</${tag}>`
  })

  return { processedHtml: processed, headings }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ userSlug: string; articleSlug: string }>
}) {
  const { userSlug, articleSlug } = await params
  const data = await getArticle(userSlug, articleSlug)
  if (!data) notFound()

  // 密碼保護 → 顯示解鎖表單
  if (data.is_password_protected) {
    return (
      <ArticlePasswordGate
        userSlug={userSlug}
        articleSlug={articleSlug}
        title={data.article.title}
        coverImage={data.article.cover_image}
        coverImagePosition={data.article.cover_image_position}
        summary={data.article.summary}
        authorName={data.article.author_name}
      />
    )
  }

  const { article, prev, next, series } = data
  const backSlug = article.blog_slug ?? userSlug
  const readTime = estimateReadTime(article.content)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'
  const shareUrl = `${baseUrl}/blogs/${backSlug}/${articleSlug}`

  // BLOG-5: pre-process headings server-side
  const { processedHtml, headings } = processHeadings(article.content)

  return (
    <div className="blog-article-root min-h-screen bg-slate-950 text-white" style={{ paddingBottom: 'var(--bnav-h, 76px)' }}>
      <ReadingProgress />

      {/* Cover image — full bleed */}
      {article.cover_image && (
        <div className="relative w-full h-[45vh] min-h-[240px] max-h-[480px] overflow-hidden">
          <Image
            src={article.cover_image}
            alt={article.title}
            fill
            className="object-cover"
            style={{ objectPosition: article.cover_image_position ?? 'center center' }}
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-5 sm:px-6">

        {/* Breadcrumbs + theme toggle + font size toggle */}
        <nav className={`flex items-center gap-1.5 text-xs text-white/30 ${article.cover_image ? '-mt-6 relative z-10' : 'pt-10'}`}>
          <Link href="/blogs" className="hover:text-white/60 transition-colors">部落格</Link>
          <span>/</span>
          <Link href={`/blogs/${backSlug}`} className="hover:text-white/60 transition-colors">
            {article.author_name ?? backSlug}
          </Link>
          <span>/</span>
          <span className="text-white/50 truncate max-w-[160px]">{article.title}</span>
          <span className="ml-auto flex items-center gap-1.5">
            <FontSizeToggle />
            <ArticleThemeToggle />
          </span>
        </nav>

        {/* Article header */}
        <header className="mt-6 mb-10">
          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {article.tags.map(tag => (
                <span key={tag} className="text-[11px] px-2.5 py-0.5 bg-amber-500/10 text-amber-400/70 rounded-full border border-amber-500/15">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-white">
            {article.title}
          </h1>

          {article.summary && (
            <p className="text-base text-white/50 mt-3 leading-relaxed">
              {article.summary}
            </p>
          )}

          {/* Author meta row */}
          <div className="flex items-center gap-3 mt-6 py-4 border-y border-white/[0.07]">
            {article.author_avatar ? (
              <Image
                src={article.author_avatar}
                alt={article.author_name ?? ''}
                width={40}
                height={40}
                className="rounded-full object-cover ring-2 ring-white/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center text-base">
                ✍️
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80">{article.author_name ?? userSlug}</p>
              <div className="flex items-center gap-2 text-xs text-white/30 mt-0.5">
                <span>
                  {new Date(article.published_at).toLocaleDateString('zh-TW', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
                <span>·</span>
                <span>約 {readTime} 分鐘讀完</span>
                <span>·</span>
                <span>👁 {article.view_count.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* BLOG-1: Table of Contents (shown only if >= 3 headings) */}
        {headings.length >= 3 && (
          <TableOfContents headings={headings} />
        )}

        {/* BLOG-18: Syntax highlighting + copy buttons for code blocks */}
        <CodeHighlighter />
        <CodeCopyButtons />

        {/* Article content */}
        <article
          className="blog-content prose prose-invert max-w-none
            prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
            prose-p:text-white/75 prose-p:leading-[1.85] prose-p:my-5
            prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white/90 prose-strong:font-semibold
            prose-em:text-white/70
            prose-blockquote:border-l-2 prose-blockquote:border-amber-500/50 prose-blockquote:bg-white/[0.02] prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:pl-4 prose-blockquote:text-white/55 prose-blockquote:not-italic
            prose-code:text-amber-300 prose-code:bg-amber-500/10 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/8 prose-pre:rounded-2xl prose-pre:shadow-xl
            prose-img:rounded-2xl prose-img:shadow-xl prose-img:my-8
            prose-li:text-white/70 prose-li:leading-relaxed
            prose-ol:my-5 prose-ul:my-5
            prose-h1:text-2xl prose-h1:mt-10 prose-h1:mb-4
            prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
            prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2"
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />

        {/* Series navigation */}
        {series && (
          <div className="mt-12 pt-8 border-t border-white/[0.07]">
            <div className="lg-dark-sharp lg-shimmer lg-lg relative overflow-hidden">
              <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📚</span>
                  <div>
                    <p className="text-xs text-white/40">系列文章</p>
                    <p className="text-sm font-semibold text-white/85">{series.title}</p>
                  </div>
                </div>
                {series.is_completed && (
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/20">已完結</span>
                )}
              </div>
              <div className="divide-y divide-white/[0.05]">
                {series.articles.map((a, idx) => {
                  const isCurrent = a.id === article.id
                  return (
                    <Link
                      key={a.id}
                      href={isCurrent ? '#' : `/blogs/${backSlug}/${a.slug}`}
                      className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                        isCurrent
                          ? 'bg-amber-500/10 cursor-default'
                          : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCurrent ? 'bg-amber-500/30 text-amber-300' : 'bg-white/8 text-white/35'
                      }`}>
                        {a.series_order ?? idx + 1}
                      </span>
                      <span className={`text-sm leading-snug line-clamp-1 flex-1 ${
                        isCurrent ? 'text-amber-300 font-medium' : 'text-white/60'
                      }`}>
                        {a.title}
                      </span>
                      {isCurrent && <span className="shrink-0 text-[10px] text-amber-400/70">本篇</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* BLOG-3: Author Card */}
        <div className="mt-12 pt-8 border-t border-white/[0.07]">
          <AuthorCard
            userSlug={userSlug}
            authorName={article.author_name ?? userSlug}
            authorAvatar={article.author_avatar}
            blogSlug={backSlug}
          />
        </div>

        {/* Reactions + Share */}
        <div className="mt-8 pt-8 border-t border-white/[0.07] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <p className="text-xs text-white/30 mb-3">覺得這篇文章如何？</p>
              <ArticleReactions userSlug={backSlug} articleSlug={articleSlug} />
            </div>
            <ShareArticleButton
              title={article.title}
              summary={article.summary ?? ''}
              author={article.author_name ?? userSlug}
              url={shareUrl}
            />
          </div>
        </div>

        {/* BLOG-4: Related Articles */}
        <RelatedArticles
          userSlug={userSlug}
          articleSlug={articleSlug}
          tags={article.tags}
          blogSlug={backSlug}
        />

        {/* Prev / Next navigation */}
        {(prev || next) && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prev ? (
              <Link
                href={`/blogs/${backSlug}/${prev.slug}`}
                className="group flex flex-col gap-1.5 p-4 lg-dark-sharp lg-lg relative hover:bg-white/[0.03] transition-all"
              >
                <span className="text-[11px] text-white/30 flex items-center gap-1">
                  ← 上一篇
                </span>
                <span className="text-sm text-white/70 font-medium group-hover:text-white/90 transition-colors line-clamp-2 leading-snug">
                  {prev.title}
                </span>
              </Link>
            ) : <div />}
            {next ? (
              <Link
                href={`/blogs/${backSlug}/${next.slug}`}
                className="group flex flex-col gap-1.5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] hover:border-white/15 transition-all text-right sm:items-end"
              >
                <span className="text-[11px] text-white/30 flex items-center gap-1 justify-end">
                  下一篇 →
                </span>
                <span className="text-sm text-white/70 font-medium group-hover:text-white/90 transition-colors line-clamp-2 leading-snug">
                  {next.title}
                </span>
              </Link>
            ) : <div />}
          </div>
        )}

        {/* Comments */}
        <div className="mt-12 pt-8 border-t border-white/[0.07]">
          <ArticleComments userSlug={backSlug} articleSlug={articleSlug} />
        </div>

        {/* CTA — 引導建立自己的部落格 */}
        <div className="mt-12 pt-8 border-t border-white/[0.07]">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/[0.07] via-violet-500/[0.05] to-slate-900 px-6 py-7 sm:px-8 sm:py-8 text-center">
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="text-2xl mb-2">✍️</div>
              <h2 className="text-base sm:text-lg font-bold text-white mb-1.5">
                你也想擁有自己的部落格？
              </h2>
              <p className="text-xs text-white/45 leading-relaxed max-w-sm mx-auto mb-5">
                加入 SnowRealm，馬上開始寫作。<br />
                支援 AI 輔助、系列文章、讀者互動。
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <Link
                  href="/register?redirect=/insight-admin/blog"
                  className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500/90 hover:bg-amber-500 text-black font-semibold text-sm rounded-2xl transition-colors"
                >
                  免費開始寫作 →
                </Link>
                <Link
                  href="/blogs"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white/60 text-sm rounded-2xl border border-white/10 transition-colors"
                >
                  探索更多部落格
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pb-16 flex items-center justify-between text-xs text-white/20">
          <Link href={`/blogs/${backSlug}`} className="hover:text-white/50 transition-colors">
            ← 回到 {article.author_name ?? '部落格'}
          </Link>
          <span>{new Date(article.published_at).toLocaleDateString('zh-TW')}</span>
        </div>
      </div>
    </div>
  )
}
