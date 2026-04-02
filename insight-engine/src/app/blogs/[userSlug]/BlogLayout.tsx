'use client'

import { useState } from 'react'
import { ArticleList } from './ArticleList'
import { BlogSidebar } from './BlogSidebar'

interface Article {
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
}

interface Series {
  id: string
  title: string
  description: string | null
  cover_image: string | null
  is_completed: boolean
  article_count: number
}

interface OtherArticle {
  title: string
  slug: string
  blog_slug: string
  author_name: string
  author_avatar: string | null
  published_at: string
}

interface SimilarArticle {
  title: string
  slug: string
  blog_slug: string
  author_name: string
  tags: string[]
}

interface BlogLayoutProps {
  blogSlug: string
  articles: Article[]
  categories: string[]
  series: Series[]
  otherArticles: OtherArticle[]
  similarArticles: SimilarArticle[]
}

export function BlogLayout({ blogSlug, articles, categories, series, otherArticles, similarArticles }: BlogLayoutProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Client-side category filtering (sidebar controls this)
  const filteredArticles = activeCategory
    ? articles.filter(a => a.category === activeCategory)
    : articles

  return (
    <div className="flex gap-0 lg:gap-6">
      <BlogSidebar
        blogSlug={blogSlug}
        categories={categories}
        series={series}
        otherArticles={otherArticles}
        similarArticles={similarArticles}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <div className="flex-1 min-w-0">
        <ArticleList
          articles={filteredArticles}
          blogSlug={blogSlug}
          categories={categories}
          externalCategoryControl={activeCategory}
          onExternalCategoryChange={setActiveCategory}
        />
      </div>
    </div>
  )
}
