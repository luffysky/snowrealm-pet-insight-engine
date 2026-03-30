'use client'
/**
 * 頁面狀態追蹤 Hook
 * 追蹤頁面、停留時間、滾動速度、打字狀態
 */

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { UserState } from './ruleEngine'

export interface PageTrackerOptions {
  isAdmin?: boolean
  userId?: string
  nickname?: string
  selectedCharacter?: 'yukirin' | 'riku'
  zcoinBalance?: number
  visitCount?: number
  streakDays?: number
  surveysCompleted?: number
}

interface ScrollTracker {
  lastY: number
  lastTime: number
  speed: UserState['scrollSpeed']
}

export function usePageTracker(opts: PageTrackerOptions = {}): UserState {
  const pathname = usePathname()
  const [timeOnPage, setTimeOnPage] = useState(0)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [scrollSpeed, setScrollSpeed] = useState<UserState['scrollSpeed']>('idle')
  const [isTyping, setIsTyping] = useState(false)
  const [pageVisitCount, setPageVisitCount] = useState(1)

  const pageEnterTimeRef = useRef(Date.now())
  const scrollRef = useRef<ScrollTracker>({ lastY: 0, lastTime: Date.now(), speed: 'idle' })
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollSpeedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPathRef = useRef(pathname)

  // 計算 daysSinceLastVisit（簡化版：從 localStorage 讀取）
  const daysSinceLastVisit = (() => {
    if (typeof window === 'undefined') return 0
    const last = localStorage.getItem('yukirin-last-visit')
    if (!last) return 0
    const diff = Date.now() - parseInt(last, 10)
    return Math.floor(diff / 86400000)
  })()

  // 每秒更新停留時間
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeOnPage(Math.floor((Date.now() - pageEnterTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 頁面切換重置
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname
      pageEnterTimeRef.current = Date.now()
      setTimeOnPage(0)
      setScrollPosition(0)
      setScrollSpeed('idle')

      // 更新頁面訪問計數
      const key = `yukirin-page-visit-${pathname}-${new Date().toDateString()}`
      const count = parseInt(localStorage.getItem(key) ?? '0', 10) + 1
      localStorage.setItem(key, String(count))
      setPageVisitCount(count)

      // 更新最後訪問時間
      localStorage.setItem('yukirin-last-visit', String(Date.now()))
    }
  }, [pathname])

  // 初始化頁面訪問計數
  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = `yukirin-page-visit-${pathname}-${new Date().toDateString()}`
    const count = parseInt(localStorage.getItem(key) ?? '0', 10) + 1
    localStorage.setItem(key, String(count))
    setPageVisitCount(count)
    localStorage.setItem('yukirin-last-visit', String(Date.now()))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 滾動追蹤
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1)
      setScrollPosition(Math.round((scrollY / maxScroll) * 100))

      const now = Date.now()
      const tracker = scrollRef.current
      const dt = now - tracker.lastTime
      const dy = Math.abs(scrollY - tracker.lastY)

      if (dt > 0) {
        const pxPerSec = (dy / dt) * 1000
        let speed: UserState['scrollSpeed'] = 'idle'
        if (pxPerSec > 3000) speed = 'crazy'
        else if (pxPerSec > 1000) speed = 'fast'
        else if (pxPerSec > 100) speed = 'normal'
        scrollRef.current = { lastY: scrollY, lastTime: now, speed }
        setScrollSpeed(speed)

        if (scrollSpeedTimerRef.current) clearTimeout(scrollSpeedTimerRef.current)
        scrollSpeedTimerRef.current = setTimeout(() => setScrollSpeed('idle'), 2000)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 打字偵測
  useEffect(() => {
    const handleKeydown = () => {
      setIsTyping(true)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => setIsTyping(false), 3000)
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  const now = new Date()
  const currentHour = now.getHours()
  const dayOfWeek = now.getDay()

  return {
    userId: opts.userId ?? '',
    nickname: opts.nickname ?? '',
    isAdmin: opts.isAdmin ?? false,
    selectedCharacter: opts.selectedCharacter ?? 'yukirin',

    currentPage: pathname ?? '/',
    timeOnPage,
    scrollPosition,
    scrollSpeed,
    isTyping,
    lastClickTarget: '',
    pageVisitCount,

    currentSurveyId: null,
    currentQuestionIndex: 0,
    totalQuestions: 0,

    isGuideOpen: false,
    currentSessionRounds: 0,

    visitCount: opts.visitCount ?? 0,
    surveysCompleted: opts.surveysCompleted ?? 0,
    zcoinBalance: opts.zcoinBalance ?? 0,
    streakDays: opts.streakDays ?? 0,
    daysSinceLastVisit,

    currentHour,
    dayOfWeek,
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
  }
}
