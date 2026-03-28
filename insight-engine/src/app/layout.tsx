import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { queryOne } from "@/lib/db";
import { BottomNav } from "@/components/social/BottomNav";
import { FloatingChat } from "@/components/social/FloatingChat";
import { PwaInstallBanner } from "@/components/social/PwaInstallBanner";

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

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
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/splash/iphone-se.png" media="(device-width:320px) and (device-height:568px) and (-webkit-device-pixel-ratio:2)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-8.png" media="(device-width:375px) and (device-height:667px) and (-webkit-device-pixel-ratio:2)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-x.png" media="(device-width:375px) and (device-height:812px) and (-webkit-device-pixel-ratio:3)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-xr.png" media="(device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:2)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-12.png" media="(device-width:390px) and (device-height:844px) and (-webkit-device-pixel-ratio:3)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-14-pro.png" media="(device-width:393px) and (device-height:852px) and (-webkit-device-pixel-ratio:3)" />
        <link rel="apple-touch-startup-image" href="/splash/ipad.png" media="(device-width:768px) and (device-height:1024px) and (-webkit-device-pixel-ratio:2)" />
        <link rel="apple-touch-startup-image" href="/splash/ipad-pro-11.png" media="(device-width:834px) and (device-height:1194px) and (-webkit-device-pixel-ratio:2)" />
        {/* SW registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});})}`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <BottomNav />
        <PwaInstallBanner />
        <FloatingChat />
      </body>
    </html>
  );
}
