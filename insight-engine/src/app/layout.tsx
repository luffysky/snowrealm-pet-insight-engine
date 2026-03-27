import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { queryOne } from "@/lib/db";
import { BottomNav } from "@/components/social/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 預設 meta（DB 讀取失敗時使用）
const DEFAULT_TITLE = 'SnowRealm Insight Engine — 問卷系統'
const DEFAULT_DESC = '免費建立你的專屬問卷系統，支持多租戶、數據分析、LINE 整合。'

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://insight.snowrealm.pet'

  // 嘗試從 DB 讀主 tenant 的 site_settings
  let s: Record<string, string> | null = null
  try {
    s = await queryOne<Record<string, string>>(
      `SELECT * FROM site_settings ORDER BY created_at ASC LIMIT 1`
    )
  } catch { /* DB 不可用時用預設值 */ }

  const title = s?.site_title || DEFAULT_TITLE
  const desc = s?.site_description || DEFAULT_DESC
  const ogTitle = s?.og_title || title
  const ogDesc = s?.og_description || desc
  const ogImage = s?.og_image_url || undefined
  const siteName = s?.og_site_name || 'SnowRealm Insight Engine'
  const locale = s?.og_locale || 'zh_TW'
  const twitterCard = (s?.twitter_card as 'summary_large_image' | 'summary') || 'summary_large_image'

  return {
    title,
    description: desc,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      siteName,
      locale,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: twitterCard,
      title: ogTitle,
      description: ogDesc,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(s?.favicon_url ? { icons: { icon: s.favicon_url } } : {}),
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        {/* 避免 FOUC：在 CSS 渲染前立即套用深色模式 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ui-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&d))document.documentElement.classList.add('dark')}catch(e){}})();`,
          }}
        />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Insight" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
