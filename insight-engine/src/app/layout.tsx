import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "毛行天下 — 寵物足跡問卷",
  description: "如果有一天牠不在了，你還能留下什麼？幫助我們打造更好的寵物紀錄平台。",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://survey.snowrealm.pet'),
  openGraph: {
    title: '毛行天下 — 如果有一天牠不在了，你還能留下什麼？',
    description: '我們正在設計一個真正能留下寵物足跡的地方。這份問卷不長，但你的回答，可能會幫助更多人留下重要的回憶。',
    siteName: '毛行天下',
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '毛行天下 — 寵物足跡問卷',
    description: '如果有一天牠不在了，你還能留下什麼？花 2 分鐘填寫問卷，幫助我們打造更好的寵物紀錄平台。',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
