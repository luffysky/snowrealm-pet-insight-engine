'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Brain, Sparkles, ChevronRight, Share2, MessageCircleHeart } from 'lucide-react'
import { HomeNav } from '@/components/public/HomeNav'

// Three.js Canvas — dynamic import, SSR off
const ThreeCanvas = dynamic(() => import('@/components/public/HomeThreeCanvas'), { ssr: false })

// ===== 靜態資料 =====

const quizCards = [
  {
    emoji: '🪞',
    title: '你是不是其實讓人有壓力？',
    subtitle: '說說你平常怎麼跟人相處，說不定會看見一個自己從沒注意過的地方。',
    badge: '人際關係',
    href: '/explore',
  },
  {
    emoji: '💛',
    title: '你的愛，有多少是在照顧自己的？',
    subtitle: '在關係裡習慣配合別人的你，有時候可能忘了自己也需要被接住。',
    badge: '自我認識',
    href: '/explore',
  },
  {
    emoji: '✨',
    title: '你最被低估的特質是什麼？',
    subtitle: '有些優點你根本沒當回事，但身邊的人可能早就注意到了。',
    badge: '故事卡片',
    href: '/explore',
  },
]

const storyWall = [
  {
    quote: '「原來我那麼在意別人的眼光」',
    desc: '填完才意識到，我好多決定都是怕讓人失望，不是真的想要。',
  },
  {
    quote: '「我以為我很獨立，但其實只是習慣了不麻煩人」',
    desc: '不麻煩別人和不需要別人，是兩件不一樣的事。',
  },
  {
    quote: '「那個問題讓我停下來想了很久」',
    desc: '從來沒有人這樣問過我，連我自己也沒有。',
  },
]

// ===== 子元件 =====

function TypewriterText() {
  const fullText = '有些事，別人看得比你清楚。'
  const [text, setText] = useState('')

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      setText(fullText.slice(0, i + 1))
      i += 1
      if (i >= fullText.length) clearInterval(timer)
    }, 70)
    return () => clearInterval(timer)
  }, [])

  return <span>{text}</span>
}

function CuteBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/20 px-3 py-1 text-xs font-medium text-slate-700 shadow-[0_8px_30px_rgba(255,255,255,0.18)] backdrop-blur-xl">
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </span>
  )
}

// ===== 主頁面 =====

export default function HomePage() {
  const floatingDots = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${6 + ((i * 7) % 88)}%`,
        top: `${8 + ((i * 13) % 78)}%`,
        delay: i * 0.18,
        duration: 3 + (i % 4),
      })),
    []
  )

  return (
    <div className="home-page min-h-screen overflow-hidden text-slate-800">
      {/* 背景裝飾 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-4%] h-64 w-64 rounded-full bg-pink-200/45 blur-3xl" />
        <div className="absolute right-[-6%] top-[8%] h-72 w-72 rounded-full bg-cyan-200/45 blur-3xl" />
        <div className="absolute bottom-[-6%] left-[20%] h-72 w-72 rounded-full bg-violet-200/35 blur-3xl" />
        {floatingDots.map((dot) => (
          <motion.div
            key={dot.id}
            className="absolute h-3 w-3 rounded-full bg-white/60 shadow-[0_0_25px_rgba(255,255,255,0.8)]"
            style={{ left: dot.left, top: dot.top }}
            animate={{ y: [0, -12, 0], opacity: [0.45, 0.95, 0.45], scale: [1, 1.25, 1] }}
            transition={{ repeat: Infinity, duration: dot.duration, delay: dot.delay, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Nav */}
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-white/25 shadow-[0_12px_30px_rgba(126,177,255,0.16)] backdrop-blur-xl">
            <Brain className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-sky-700/80">SNOWREALM INSIGHT</p>
            <p className="text-xs text-slate-500">AI 智慧問卷平台</p>
          </div>
        </div>

        <nav className="hidden items-center gap-3 md:flex">
          <Link href="/explore" className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm text-slate-600 backdrop-blur-xl transition hover:bg-white/35">
            熱門測驗
          </Link>
          <Link href="/explore" className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm text-slate-600 backdrop-blur-xl transition hover:bg-white/35">
            探索問卷
          </Link>
          <HomeNav />
        </nav>

        {/* 手機版 */}
        <div className="flex items-center gap-2 md:hidden min-w-0 overflow-hidden">
          <Link href="/explore" className="shrink-0 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs text-slate-600 backdrop-blur-xl">
            探索
          </Link>
          <HomeNav />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-16 md:px-8 lg:px-10">
        {/* Hero */}
        <section className="grid items-center gap-8 pt-3 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-8">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className="order-2 lg:order-1"
          >
            <div className="inline-flex flex-wrap items-center gap-2">
              <CuteBadge>免費填答</CuteBadge>
              <CuteBadge>自我探索</CuteBadge>
              <CuteBadge>Story Card</CuteBadge>
            </div>

            <h1 className="mt-5 max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-800 sm:text-4xl md:text-6xl md:leading-[1.06]">
              有些問題，
              <span className="block bg-gradient-to-r from-sky-600 via-cyan-500 to-violet-500 bg-clip-text text-transparent">
                你可能從沒問過自己。
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
              填一填，說不定會看見一個陌生又熟悉的自己。
              每份問卷最後會給你一張專屬的故事卡片，可以收藏，也可以傳給懂你的人。
            </p>

            <div className="mt-4 inline-flex items-center rounded-full border border-white/35 bg-white/25 px-4 py-2 text-sm text-slate-600 shadow-[0_12px_30px_rgba(145,188,255,0.14)] backdrop-blur-xl">
              <MessageCircleHeart className="mr-2 h-4 w-4 text-pink-500" />
              <TypewriterText />
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-violet-400 px-6 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(83,173,255,0.35)] transition hover:scale-[1.02]"
              >
                先玩一份熱門測驗
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 bg-white/25 px-6 py-4 text-base font-medium text-slate-700 backdrop-blur-xl transition hover:bg-white/40"
              >
                免費建立問卷
                <Sparkles className="h-4 w-4 text-violet-500" />
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {[
                { value: '3 分鐘', label: '快速完成' },
                { value: '可收藏', label: 'Story Card' },
                { value: '放心填', label: '不追蹤身份' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/30 bg-white/18 px-4 py-4 shadow-[0_10px_30px_rgba(135,170,230,0.12)] backdrop-blur-xl"
                >
                  <div className="text-xl font-black text-slate-800">{item.value}</div>
                  <div className="mt-1 text-sm text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Three.js 浮空星球 */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: 'easeOut' }}
            className="order-1 lg:order-2"
          >
            <div className="relative overflow-hidden rounded-[32px] border border-white/30 bg-white/16 shadow-[0_24px_80px_rgba(96,146,255,0.20)] backdrop-blur-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
              <div className="h-[320px] w-full md:h-[480px]">
                <ThreeCanvas />
              </div>

              <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-[28px] border border-white/35 bg-white/28 p-4 shadow-[0_14px_40px_rgba(255,255,255,0.12)] backdrop-blur-2xl md:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-sky-700/75">你的故事卡片</p>
                    <h3 className="mt-2 text-lg font-bold text-slate-800 md:text-2xl">你最被低估的，是觀察力</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 md:text-base">
                      你早就看懂很多事了，只是習慣不說。
                    </p>
                  </div>
                  <div className="hidden rounded-2xl border border-white/35 bg-white/35 p-3 md:block">
                    <Share2 className="h-5 w-5 text-sky-600" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 熱門測驗 */}
        <section className="mt-12 md:mt-16">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-sky-700/75">最近大家在問自己的幾件事</p>
              <h2 className="mt-2 text-xl font-black text-slate-800 sm:text-2xl md:text-3xl">你想先從哪一個開始？</h2>
            </div>
            <Link href="/explore" className="hidden rounded-full border border-white/30 bg-white/25 px-4 py-2 text-sm text-slate-600 backdrop-blur-xl transition hover:bg-white/35 md:block">
              看更多
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {quizCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 + index * 0.08 }}
                className="group rounded-[28px] border border-white/30 bg-white/18 p-5 shadow-[0_16px_40px_rgba(122,162,230,0.14)] backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/24"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{card.emoji}</span>
                  <span className="inline-flex rounded-full border border-white/40 bg-white/32 px-3 py-1 text-xs font-semibold text-sky-600">
                    {card.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold leading-8 text-slate-800">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{card.subtitle}</p>
                <Link href={card.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition group-hover:gap-3">
                  去填填看
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 故事牆 + CTA */}
        <section className="mt-12 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[30px] border border-white/30 bg-white/18 p-6 shadow-[0_16px_40px_rgba(122,162,230,0.12)] backdrop-blur-2xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-sky-700/75">填完之後，他們這樣說</p>
            <h2 className="mt-2 text-2xl font-black text-slate-800 md:text-3xl">有些答案，填完才知道</h2>
            <div className="mt-5 space-y-3">
              {storyWall.map((item) => (
                <div key={item.quote} className="rounded-[24px] border border-white/30 bg-white/22 p-4">
                  <p className="text-base font-bold text-slate-800 md:text-lg leading-snug">{item.quote}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
            <Link href="/explore" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:gap-3">
              看更多故事牆
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-[30px] border border-white/30 bg-gradient-to-br from-white/24 to-white/14 p-6 shadow-[0_16px_40px_rgba(122,162,230,0.12)] backdrop-blur-2xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-sky-700/75">每一份問卷，都會給你一張卡片</p>
            <h2 className="mt-2 text-2xl font-black text-slate-800 md:text-3xl">不只是測驗，是你的一小片故事</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              填完之後，我們會用你的回答生成一張專屬的故事卡片。
              不是評分，不是排名，是一個只屬於你的小畫面。
              有時候看到的，會讓你想傳給那個最懂你的人。
            </p>
            <div className="mt-6 rounded-[24px] border border-white/30 bg-white/24 p-4">
              <div className="flex items-center gap-3 text-slate-700">
                <div className="rounded-2xl bg-sky-100 p-2">
                  <Brain className="h-4 w-4 text-sky-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">你的答案，只有你知道</p>
                  <p className="text-xs text-slate-500">所有回答只用來生成你的故事，不做其他用途。</p>
                </div>
              </div>
            </div>
            <Link
              href="/explore"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-violet-400 px-5 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(132,163,255,0.34)] transition hover:scale-[1.01]"
            >
              去填一份看看
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/20 bg-white/10 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 lg:px-10">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-sky-600" />
              <span className="text-sm font-semibold tracking-wide text-sky-700/80">SNOWREALM INSIGHT</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <Link href="/explore" className="hover:text-slate-700 transition-colors">探索問卷</Link>
              <Link href="/pricing" className="hover:text-slate-700 transition-colors">定價方案</Link>
              <Link href="/privacy" className="hover:text-slate-700 transition-colors">隱私權政策</Link>
              <Link href="/terms" className="hover:text-slate-700 transition-colors">使用條款</Link>
              <Link href="/login" className="hover:text-slate-700 transition-colors">登入</Link>
              <Link href="/register" className="hover:text-slate-700 transition-colors">免費註冊</Link>
            </div>
            <p className="text-xs text-slate-400">© 2026 SnowRealm. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* 發文 FAB — 固定右下角，已登入才顯示 */}
      <WriteFab />
    </div>
  )
}

function WriteFab() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.userId) setShow(true) })
      .catch(() => {})
  }, [])
  if (!show) return null
  return (
    <Link
      href="/write"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-sky-500 hover:bg-sky-400 text-white rounded-full shadow-lg shadow-sky-500/30 flex items-center justify-center text-2xl transition-all hover:scale-105 active:scale-95"
      title="發布文章"
    >
      ✍️
    </Link>
  )
}
