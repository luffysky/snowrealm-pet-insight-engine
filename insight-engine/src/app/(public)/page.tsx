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
    title: '你是不是其實讓人有壓力？',
    subtitle: '3 分鐘，看見別人不敢告訴你的那一面',
    badge: '最熱門',
  },
  {
    title: '你的戀愛致命弱點是什麼？',
    subtitle: '有點刺但不傷人，結果讓人忍不住傳給朋友',
    badge: '情緒共鳴',
  },
  {
    title: '朋友眼中的你，跟你想的一樣嗎？',
    subtitle: '把你沒看見的自己，變成一張值得收藏的小卡',
    badge: '故事感',
  },
]

const storyWall = [
  {
    title: '原來我在朋友眼中是那個總是先道歉的人',
    desc: '你以為你在包容，別人覺得你其實是在逃避。',
  },
  {
    title: '你以為你很主動，但別人覺得你有距離感',
    desc: '有些事，別人看得比你清楚。',
  },
  {
    title: '測完才知道，我最被低估的是觀察力',
    desc: '你不是沒有才華，只是還沒被看見。',
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
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#fff8fd_0%,#eef8ff_38%,#dff1ff_68%,#d9ecff_100%)] text-slate-800">
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
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/explore" className="rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs text-slate-600 backdrop-blur-xl">
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
              <CuteBadge>AI 智慧問卷</CuteBadge>
              <CuteBadge>認知落差引擎</CuteBadge>
              <CuteBadge>Story Card</CuteBadge>
            </div>

            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-800 md:text-6xl md:leading-[1.06]">
              不是每份測驗，
              <span className="block bg-gradient-to-r from-sky-600 via-cyan-500 to-violet-500 bg-clip-text text-transparent">
                都能讓人忍不住分享。
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
              從一個好玩的小問卷開始，看見你沒看見的自己。
              不是冷冰冰的功能介紹，是一個讓人想點、想玩、想收藏的認知入口。
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
                { value: '不硬銷', label: '先玩再說' },
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
                    <p className="text-xs font-semibold tracking-[0.2em] text-sky-700/75">FEATURED CARD</p>
                    <h3 className="mt-2 text-lg font-bold text-slate-800 md:text-2xl">你最被低估的是觀察力</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 md:text-base">
                      你不是沒有才華，只是還沒被看見。測完才知道，你早就看懂了。
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
              <p className="text-sm font-semibold tracking-[0.18em] text-sky-700/75">HOT QUIZZES</p>
              <h2 className="mt-2 text-2xl font-black text-slate-800 md:text-3xl">先放讓人會上癮的問卷</h2>
            </div>
            <Link href="/explore" className="hidden rounded-full border border-white/30 bg-white/25 px-4 py-2 text-sm text-slate-600 backdrop-blur-xl transition hover:bg-white/35 md:block">
              看更多
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {quizCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 + index * 0.08 }}
                className="group rounded-[28px] border border-white/30 bg-white/18 p-5 shadow-[0_16px_40px_rgba(122,162,230,0.14)] backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/24"
              >
                <span className="inline-flex rounded-full border border-white/40 bg-white/32 px-3 py-1 text-xs font-semibold text-pink-600">
                  {card.badge}
                </span>
                <h3 className="mt-4 text-xl font-bold leading-8 text-slate-800">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{card.subtitle}</p>
                <Link href="/explore" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition group-hover:gap-3">
                  立刻開始
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 故事牆 + CTA */}
        <section className="mt-12 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[30px] border border-white/30 bg-white/18 p-6 shadow-[0_16px_40px_rgba(122,162,230,0.12)] backdrop-blur-2xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-sky-700/75">SOCIAL PROOF</p>
            <h2 className="mt-2 text-2xl font-black text-slate-800 md:text-3xl">大家正在收藏的故事牆</h2>
            <div className="mt-5 space-y-3">
              {storyWall.map((item, idx) => (
                <div key={item.title} className="rounded-[24px] border border-white/30 bg-white/22 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 md:text-lg">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
                    </div>
                    <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-600">
                      #{idx + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/30 bg-gradient-to-br from-white/24 to-white/14 p-6 shadow-[0_16px_40px_rgba(122,162,230,0.12)] backdrop-blur-2xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-sky-700/75">GENTLE CTA</p>
            <h2 className="mt-2 text-2xl font-black text-slate-800 md:text-3xl">先讓人好奇，再讓人留下</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              首頁不要一直講功能。先給一個好玩、有共鳴、會讓人想試的入口。
              等他玩了一陣子、收藏了幾張卡片、開始有感覺，之後再慢慢把更深的世界打開。
            </p>
            <div className="mt-6 rounded-[24px] border border-white/30 bg-white/24 p-4">
              <div className="flex items-center gap-3 text-slate-700">
                <div className="rounded-2xl bg-violet-100 p-2">
                  <Brain className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">首頁任務只有一個</p>
                  <p className="text-xs text-slate-500">讓人點進第一份問卷，不是看功能介紹。</p>
                </div>
              </div>
            </div>
            <Link
              href="/register"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-400 via-sky-400 to-violet-400 px-5 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(132,163,255,0.34)] transition hover:scale-[1.01]"
            >
              做出第一張會被分享的卡片
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
    </div>
  )
}
