'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, Sparkles, MessageCircleHeart, Brain } from 'lucide-react'
import { HomeNav } from '@/components/public/HomeNav'
import type { YukirinControls } from '@/components/public/yukirin/YukirinScene'

// VRM 場景 — dynamic + SSR off
const YukirinScene = dynamic(() => import('@/components/public/yukirin/YukirinScene'), { ssr: false })

// ===== 靜態資料 =====

const quizCards = [
  {
    emoji: '🪞',
    title: '你是不是其實讓人有壓力？',
    subtitle: '說說你平常怎麼跟人相處，說不定會看見一個自己從沒注意過的地方。',
    badge: '人際關係',
    href: '/explore',
    color: 'from-[#b8a9e8]/20 to-[#d8d0f0]/20',
  },
  {
    emoji: '💛',
    title: '你的愛，有多少是在照顧自己的？',
    subtitle: '在關係裡習慣配合別人的你，有時候可能忘了自己也需要被接住。',
    badge: '自我認識',
    href: '/explore',
    color: 'from-[#f5b8b5]/20 to-[#fdd5d1]/20',
  },
  {
    emoji: '✨',
    title: '你最被低估的特質是什麼？',
    subtitle: '有些優點你根本沒當回事，但身邊的人可能早就注意到了。',
    badge: '故事卡片',
    href: '/explore',
    color: 'from-[#a8d8ea]/20 to-[#d0eef7]/20',
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

function LavenderBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b8a9e8]/40 bg-[#b8a9e8]/15 px-3 py-1 text-xs font-medium text-[var(--lp-accent)]">
      <Sparkles className="h-3 w-3" />
      {children}
    </span>
  )
}

// ===== 主頁面 =====

export default function HomePage() {
  const yukirinRef = useRef<YukirinControls | null>(null)

  const handleYukirinLoad = useCallback((controls: YukirinControls) => {
    yukirinRef.current = controls
    // 入場後切換到 happy 表情
    setTimeout(() => controls.setMood('happy', 600), 800)
  }, [])

  const floatingDots = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        left: `${6 + ((i * 9) % 88)}%`,
        top: `${8 + ((i * 13) % 78)}%`,
        delay: i * 0.22,
        duration: 3.5 + (i % 3),
      })),
    []
  )

  return (
    <div
      className="home-page min-h-screen overflow-hidden"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {/* 背景裝飾 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-5%] h-80 w-80 rounded-full bg-[#b8a9e8]/25 blur-3xl" />
        <div className="absolute right-[-8%] top-[10%] h-72 w-72 rounded-full bg-[#f5b8b5]/20 blur-3xl" />
        <div className="absolute bottom-[-8%] left-[18%] h-80 w-80 rounded-full bg-[#a8d8ea]/20 blur-3xl" />
        <div className="absolute bottom-[20%] right-[5%] h-56 w-56 rounded-full bg-[#b8a9e8]/15 blur-3xl" />
        {floatingDots.map((dot) => (
          <motion.div
            key={dot.id}
            className="absolute h-2.5 w-2.5 rounded-full bg-[#b8a9e8]/50 shadow-[0_0_20px_rgba(184,169,232,0.6)]"
            style={{ left: dot.left, top: dot.top }}
            animate={{ y: [0, -14, 0], opacity: [0.35, 0.85, 0.35], scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: dot.duration, delay: dot.delay, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Nav */}
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#b8a9e8]/40 bg-[#b8a9e8]/15 shadow-[0_8px_20px_rgba(184,169,232,0.2)]">
            <Brain className="h-5 w-5 text-[var(--lp-accent)]" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-[var(--lp-accent)]">SNOWREALM INSIGHT</p>
            <p className="text-xs text-[var(--lp-body)]">AI 智慧問卷平台</p>
          </div>
        </div>
        <HomeNav />
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-20 md:px-8 lg:px-10">
        {/* Hero */}
        <section className="grid items-center gap-8 pt-3 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:pt-8">
          {/* 左側文字 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className="order-2 lg:order-1"
          >
            <div className="inline-flex flex-wrap items-center gap-2">
              <LavenderBadge>免費填答</LavenderBadge>
              <LavenderBadge>自我探索</LavenderBadge>
              <LavenderBadge>Story Card</LavenderBadge>
            </div>

            <h1 className="mt-5 max-w-2xl text-3xl font-black leading-tight tracking-tight text-[var(--lp-h)] sm:text-4xl md:text-5xl md:leading-[1.1]">
              有些問題，
              <span className="block bg-gradient-to-r from-[#b8a9e8] via-[#d4a8d8] to-[#f5b8b5] bg-clip-text text-transparent">
                你可能從沒問過自己。
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--lp-body)] md:text-lg">
              填一填，說不定會看見一個陌生又熟悉的自己。
              每份問卷最後會給你一張專屬的故事卡片，可以收藏，也可以傳給懂你的人。
            </p>

            <div className="mt-4 inline-flex items-center rounded-full border border-[#b8a9e8]/30 bg-[#b8a9e8]/10 px-4 py-2 text-sm text-[var(--lp-body)]">
              <MessageCircleHeart className="mr-2 h-4 w-4 text-[#f5b8b5]" />
              <TypewriterText />
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#b8a9e8] via-[#c8a8d8] to-[#f5b8b5] px-6 py-4 text-base font-semibold text-white shadow-[0_12px_32px_rgba(184,169,232,0.4)] transition hover:scale-[1.02] hover:shadow-[0_16px_40px_rgba(184,169,232,0.5)]"
              >
                先玩一份熱門測驗
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#b8a9e8]/40 bg-[#b8a9e8]/12 px-6 py-4 text-base font-medium text-[var(--lp-accent)] backdrop-blur-xl transition hover:bg-[#b8a9e8]/20"
              >
                免費建立問卷
                <Sparkles className="h-4 w-4 text-[#b8a9e8]" />
              </Link>
            </div>

            <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
              {[
                { value: '3 分鐘', label: '快速完成' },
                { value: '可收藏', label: 'Story Card' },
                { value: '放心填', label: '不追蹤身份' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#b8a9e8]/25 bg-white/40 px-3 py-4 shadow-[0_4px_16px_rgba(184,169,232,0.12)] backdrop-blur-xl"
                >
                  <div className="text-lg font-black text-[var(--lp-h)]">{item.value}</div>
                  <div className="mt-0.5 text-xs text-[var(--lp-body)]">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 右側雪凜 VRM 場景 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
            className="order-1 lg:order-2"
          >
            <div className="relative overflow-hidden rounded-[32px] border border-[#b8a9e8]/30 bg-gradient-to-br from-[#eee8ff]/60 to-[#ffeef5]/60 shadow-[0_24px_80px_rgba(184,169,232,0.25)] backdrop-blur-xl">
              {/* 內層光暈 */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#b8a9e8]/10 via-transparent to-[#f5b8b5]/10 pointer-events-none" />

              {/* VRM 場景區域 */}
              <div className="h-[320px] w-full md:h-[460px]">
                <YukirinScene
                  cameraMode="fullBody"
                  mood="happy"
                  showBackground
                  onLoad={handleYukirinLoad}
                />
              </div>

              {/* 下方故事卡浮層 */}
              <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-[24px] border border-white/40 bg-white/35 p-4 shadow-[0_8px_32px_rgba(184,169,232,0.2)] backdrop-blur-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-[var(--lp-accent)]">你的故事卡片</p>
                    <h3 className="mt-1.5 text-base font-bold text-[var(--lp-h)] md:text-lg">你最被低估的，是觀察力</h3>
                    <p className="mt-1 text-sm leading-5 text-[var(--lp-body)]">
                      你早就看懂很多事了，只是習慣不說。
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl border border-[#b8a9e8]/30 bg-[#b8a9e8]/15 p-2.5">
                    <span className="text-lg">✨</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 熱門問卷 — 水平捲動 */}
        <section className="mt-14 md:mt-18">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[var(--lp-accent)]">最近大家在問自己的幾件事</p>
              <h2 className="mt-1.5 text-xl font-black text-[var(--lp-h)] sm:text-2xl md:text-3xl">你想先從哪一個開始？</h2>
            </div>
            <Link href="/explore" className="hidden rounded-full border border-[#b8a9e8]/30 bg-[#b8a9e8]/10 px-4 py-2 text-sm text-[var(--lp-accent)] transition hover:bg-[#b8a9e8]/20 md:block">
              看更多
            </Link>
          </div>

          {/* 水平捲動容器 */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            {quizCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 + index * 0.08 }}
                className={`group min-w-[78vw] shrink-0 rounded-[24px] border border-[#b8a9e8]/25 bg-gradient-to-br ${card.color} p-5 shadow-[0_8px_24px_rgba(184,169,232,0.12)] backdrop-blur-xl transition hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(184,169,232,0.2)] sm:min-w-[60vw] md:min-w-0`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{card.emoji}</span>
                  <span className="inline-flex rounded-full border border-[#b8a9e8]/40 bg-white/50 px-2.5 py-0.5 text-xs font-semibold text-[var(--lp-accent)]">
                    {card.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold leading-snug text-[var(--lp-h)] md:text-lg">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--lp-body)]">{card.subtitle}</p>
                <Link href={card.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--lp-accent)] transition group-hover:gap-2.5">
                  去填填看
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 故事牆 + CTA */}
        <section className="mt-12 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          {/* 故事牆 */}
          <div className="rounded-[28px] border border-[#b8a9e8]/25 bg-white/25 p-6 shadow-[0_8px_32px_rgba(184,169,232,0.1)] backdrop-blur-xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-[var(--lp-accent)]">填完之後，他們這樣說</p>
            <h2 className="mt-2 text-xl font-black text-[var(--lp-h)] md:text-2xl">有些答案，填完才知道</h2>
            <div className="mt-5 space-y-3">
              {storyWall.map((item) => (
                <div key={item.quote} className="rounded-[20px] border border-[#b8a9e8]/20 bg-white/35 p-4">
                  <p className="text-sm font-bold text-[var(--lp-h)] md:text-base leading-snug">{item.quote}</p>
                  <p className="mt-2 text-xs leading-5 text-[var(--lp-body)] md:text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
            <Link href="/explore" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--lp-accent)] transition hover:gap-2.5">
              看更多故事牆
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Story Card CTA */}
          <div className="rounded-[28px] border border-[#f5b8b5]/30 bg-gradient-to-br from-[#ffeef5]/60 to-[#eee8ff]/60 p-6 shadow-[0_8px_32px_rgba(245,184,181,0.12)] backdrop-blur-xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-[var(--lp-accent)]">每一份問卷，都會給你一張卡片</p>
            <h2 className="mt-2 text-xl font-black text-[var(--lp-h)] md:text-2xl">不只是測驗，是你的一小片故事</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--lp-body)]">
              填完之後，我們會用你的回答生成一張專屬的故事卡片。
              不是評分，不是排名，是一個只屬於你的小畫面。
            </p>
            <div className="mt-5 rounded-[18px] border border-[#b8a9e8]/25 bg-white/40 p-4">
              <div className="flex items-center gap-3 text-[var(--lp-h)]">
                <div className="rounded-xl bg-[#b8a9e8]/20 p-2">
                  <Brain className="h-4 w-4 text-[var(--lp-accent)]" />
                </div>
                <div>
                  <p className="text-sm font-bold">你的答案，只有你知道</p>
                  <p className="text-xs text-[var(--lp-body)]">所有回答只用來生成你的故事，不做其他用途。</p>
                </div>
              </div>
            </div>
            <Link
              href="/explore"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] px-5 py-4 text-base font-semibold text-white shadow-[0_12px_32px_rgba(184,169,232,0.35)] transition hover:scale-[1.01]"
            >
              去填一份看看
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#b8a9e8]/20 bg-white/20 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 lg:px-10">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-[var(--lp-accent)]" />
              <span className="text-sm font-semibold tracking-wide text-[var(--lp-accent)]">SNOWREALM INSIGHT</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-[var(--lp-body)]">
              <Link href="/explore" className="hover:text-[var(--lp-h)] transition-colors">探索問卷</Link>
              <Link href="/pricing" className="hover:text-[var(--lp-h)] transition-colors">定價方案</Link>
              <Link href="/privacy" className="hover:text-[var(--lp-h)] transition-colors">隱私權政策</Link>
              <Link href="/terms" className="hover:text-[var(--lp-h)] transition-colors">使用條款</Link>
              <Link href="/login" className="hover:text-[var(--lp-h)] transition-colors">登入</Link>
              <Link href="/register" className="hover:text-[var(--lp-h)] transition-colors">免費註冊</Link>
            </div>
            <p className="text-xs text-[var(--lp-muted)]">© 2026 SnowRealm. All rights reserved.</p>
          </div>
        </div>
      </footer>

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
      className="fixed z-50 w-14 h-14 bg-gradient-to-br from-[#b8a9e8] to-[#f5b8b5] text-white rounded-full shadow-lg shadow-[#b8a9e8]/40 flex items-center justify-center text-xl transition-all hover:scale-105 active:scale-95"
      style={{ bottom: 'calc(var(--bnav-h, 4.75rem) + 1rem)', left: '1rem' }}
      title="發布文章"
    >
      ✍️
    </Link>
  )
}
