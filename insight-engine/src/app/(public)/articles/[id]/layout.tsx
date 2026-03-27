import { type Metadata } from 'next'
import { getPost } from '@/lib/socialEngine'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id).catch(() => null)

  if (!post) {
    return { title: '文章不存在 | SnowRealm Insight' }
  }

  const title = post.title ?? post.content.slice(0, 60)
  const description = post.content.slice(0, 160)
  const image = post.images?.[0]?.url
  const pageUrl = `${BASE_URL}/articles/${id}`

  return {
    title: `${title} | SnowRealm Insight`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: pageUrl,
      siteName: 'SnowRealm Insight',
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
