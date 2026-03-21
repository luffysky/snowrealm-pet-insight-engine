import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { queryOne } from '@/lib/db'
import { OrgSurveyClient } from './OrgSurveyClient'

interface Props {
  params: Promise<{ org: string; slug: string }>
}

interface SurveyMeta extends Record<string, unknown> {
  id: string
  tenant_id: string
  title: string
  cover_title: string
  cover_subtitle: string
}

/** 為公開問卷頁產生 title + OG metadata（從 DB survey + site_settings 讀取） */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { org, slug } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://insight.snowrealm.pet'

  const survey = await queryOne<SurveyMeta>(
    `SELECT id, tenant_id, title, cover_title, cover_subtitle FROM surveys WHERE slug = $1 AND status = 'published'`,
    [slug],
  )

  if (!survey || survey.tenant_id !== org) {
    return { title: '問卷不存在' }
  }

  // 取得租戶的 site_settings（OG image 等）
  const ss = await queryOne<Record<string, string>>(
    `SELECT og_image_url, og_site_name FROM site_settings WHERE tenant_id = $1`,
    [org],
  ).catch(() => null)

  const title = survey.cover_title || survey.title
  const description = survey.cover_subtitle || `${title} — 填寫問卷`
  const siteName = ss?.og_site_name || 'SnowRealm Insight Engine'
  const ogImage = ss?.og_image_url || undefined

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      siteName,
      locale: 'zh_TW',
      type: 'website',
      url: `/${org}/${slug}`,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

/**
 * 公開問卷頁面 — /{org}/{survey-slug}
 * Server component：驗證 org 與 survey 對應關係，通過後交給 client component
 */
export default async function OrgSurveyPage({ params }: Props) {
  const { org, slug } = await params

  const survey = await queryOne<{ id: string; tenant_id: string }>(
    `SELECT id, tenant_id FROM surveys WHERE slug = $1 AND status = 'published'`,
    [slug],
  )

  if (!survey || survey.tenant_id !== org) {
    notFound()
  }

  return <OrgSurveyClient slug={slug} />
}
