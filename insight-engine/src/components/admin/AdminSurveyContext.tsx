'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { SurveyTheme } from '@/types'

interface SurveyOption {
  id: string
  title: string
  slug: string
  status: string
  is_primary: boolean
}

interface AdminSurveyContextValue {
  surveys: SurveyOption[]
  selectedSurveyId: string | null
  selectedSurvey: SurveyOption | null
  theme: SurveyTheme
  setSelectedSurveyId: (id: string | null) => void
  refreshSurveys: () => Promise<void>
}

const AdminSurveyContext = createContext<AdminSurveyContextValue>({
  surveys: [],
  selectedSurveyId: null,
  selectedSurvey: null,
  theme: 'default',
  setSelectedSurveyId: () => {},
  refreshSurveys: async () => {},
})

export function useAdminSurvey() {
  return useContext(AdminSurveyContext)
}

/** 快速取得後台主題色（theme + tc） */
export function useAdminTheme() {
  const { theme } = useAdminSurvey()
  return { theme, tc: ADMIN_THEME_COLORS[theme] }
}

/** 每種主題對應的後台配色 */
export const ADMIN_THEME_COLORS: Record<SurveyTheme, {
  accent: string       // text accent color
  accentBg: string     // bg for active items
  accentBorder: string // border for active items
  navBg: string        // nav background
  navBorder: string    // nav bottom border
  headerGlow: string   // subtle glow on nav
  bodyBg: string       // main body background
  cardBg: string       // card / section background
  cardBorder: string   // card border
  glowFrom: string     // decorative glow gradient from
  glowVia: string      // decorative glow gradient via
  btnBg: string        // primary button bg
  btnHover: string     // primary button hover
}> = {
  default:  { accent: 'text-cyan-400', accentBg: 'bg-cyan-500/10', accentBorder: 'border-cyan-400/30', navBg: 'bg-slate-900/80', navBorder: 'border-slate-800', headerGlow: '', bodyBg: 'bg-slate-950', cardBg: 'bg-slate-900/60', cardBorder: 'border-slate-800', glowFrom: 'from-cyan-500/8', glowVia: 'via-indigo-500/5', btnBg: 'bg-cyan-600', btnHover: 'hover:bg-cyan-500' },
  game:     { accent: 'text-amber-400', accentBg: 'bg-amber-500/10', accentBorder: 'border-amber-400/30', navBg: 'bg-slate-900/80', navBorder: 'border-amber-900/30', headerGlow: 'shadow-amber-500/5', bodyBg: 'bg-[#0f0f1a]', cardBg: 'bg-[#1a1a2e]/60', cardBorder: 'border-amber-900/20', glowFrom: 'from-amber-500/8', glowVia: 'via-orange-500/5', btnBg: 'bg-amber-600', btnHover: 'hover:bg-amber-500' },
  cyber:    { accent: 'text-cyan-300', accentBg: 'bg-cyan-400/10', accentBorder: 'border-cyan-300/30', navBg: 'bg-gray-950/90', navBorder: 'border-cyan-900/30', headerGlow: 'shadow-cyan-500/5', bodyBg: 'bg-[#0a0a1a]', cardBg: 'bg-gray-900/50', cardBorder: 'border-cyan-900/20', glowFrom: 'from-cyan-400/8', glowVia: 'via-blue-500/5', btnBg: 'bg-cyan-500', btnHover: 'hover:bg-cyan-400' },
  ancient:  { accent: 'text-amber-300', accentBg: 'bg-amber-400/10', accentBorder: 'border-amber-300/30', navBg: 'bg-stone-950/90', navBorder: 'border-amber-800/20', headerGlow: '', bodyBg: 'bg-[#12100d]', cardBg: 'bg-stone-900/50', cardBorder: 'border-amber-800/15', glowFrom: 'from-amber-400/6', glowVia: 'via-yellow-600/4', btnBg: 'bg-amber-700', btnHover: 'hover:bg-amber-600' },
  sakura:   { accent: 'text-pink-400', accentBg: 'bg-pink-500/10', accentBorder: 'border-pink-400/30', navBg: 'bg-slate-950/90', navBorder: 'border-pink-900/20', headerGlow: 'shadow-pink-500/5', bodyBg: 'bg-[#0f0a12]', cardBg: 'bg-slate-900/50', cardBorder: 'border-pink-900/15', glowFrom: 'from-pink-500/10', glowVia: 'via-rose-400/6', btnBg: 'bg-pink-600', btnHover: 'hover:bg-pink-500' },
  ocean:    { accent: 'text-blue-400', accentBg: 'bg-blue-500/10', accentBorder: 'border-blue-400/30', navBg: 'bg-slate-950/90', navBorder: 'border-blue-900/20', headerGlow: 'shadow-blue-500/5', bodyBg: 'bg-[#0a0e18]', cardBg: 'bg-slate-900/50', cardBorder: 'border-blue-900/15', glowFrom: 'from-blue-500/8', glowVia: 'via-sky-400/5', btnBg: 'bg-blue-600', btnHover: 'hover:bg-blue-500' },
  forest:   { accent: 'text-emerald-400', accentBg: 'bg-emerald-500/10', accentBorder: 'border-emerald-400/30', navBg: 'bg-slate-950/90', navBorder: 'border-emerald-900/20', headerGlow: 'shadow-emerald-500/5', bodyBg: 'bg-[#0a120e]', cardBg: 'bg-slate-900/50', cardBorder: 'border-emerald-900/15', glowFrom: 'from-emerald-500/8', glowVia: 'via-green-400/5', btnBg: 'bg-emerald-600', btnHover: 'hover:bg-emerald-500' },
  candy:    { accent: 'text-fuchsia-400', accentBg: 'bg-fuchsia-500/10', accentBorder: 'border-fuchsia-400/30', navBg: 'bg-slate-950/90', navBorder: 'border-fuchsia-900/20', headerGlow: 'shadow-fuchsia-500/5', bodyBg: 'bg-[#12091a]', cardBg: 'bg-slate-900/50', cardBorder: 'border-fuchsia-900/15', glowFrom: 'from-fuchsia-500/10', glowVia: 'via-purple-400/6', btnBg: 'bg-fuchsia-600', btnHover: 'hover:bg-fuchsia-500' },
  noir:     { accent: 'text-white/80', accentBg: 'bg-white/5', accentBorder: 'border-white/20', navBg: 'bg-black/90', navBorder: 'border-white/10', headerGlow: '', bodyBg: 'bg-black', cardBg: 'bg-zinc-900/50', cardBorder: 'border-white/8', glowFrom: 'from-white/3', glowVia: 'via-zinc-400/2', btnBg: 'bg-zinc-700', btnHover: 'hover:bg-zinc-600' },
}

/** CSS custom property hex/rgba values for each theme — used by layout to set CSS vars */
export const THEME_CSS_VALUES: Record<SurveyTheme, Record<string, string>> = {
  default:  { '--t-accent': '#22d3ee', '--t-accent-bg': 'rgba(6,182,212,0.1)', '--t-accent-border': 'rgba(34,211,238,0.3)', '--t-card-bg': 'rgba(15,23,42,0.6)', '--t-card-border': '#1e293b', '--t-btn': '#0891b2', '--t-btn-hover': '#06b6d4', '--t-glow-from': 'rgba(6,182,212,0.08)', '--t-glow-via': 'rgba(99,102,241,0.05)' },
  game:     { '--t-accent': '#fbbf24', '--t-accent-bg': 'rgba(245,158,11,0.1)', '--t-accent-border': 'rgba(251,191,36,0.3)', '--t-card-bg': 'rgba(26,26,46,0.6)', '--t-card-border': 'rgba(120,53,15,0.2)', '--t-btn': '#d97706', '--t-btn-hover': '#f59e0b', '--t-glow-from': 'rgba(245,158,11,0.08)', '--t-glow-via': 'rgba(249,115,22,0.05)' },
  cyber:    { '--t-accent': '#67e8f9', '--t-accent-bg': 'rgba(34,211,238,0.1)', '--t-accent-border': 'rgba(103,232,249,0.3)', '--t-card-bg': 'rgba(17,24,39,0.5)', '--t-card-border': 'rgba(22,78,99,0.2)', '--t-btn': '#06b6d4', '--t-btn-hover': '#22d3ee', '--t-glow-from': 'rgba(34,211,238,0.08)', '--t-glow-via': 'rgba(59,130,246,0.05)' },
  ancient:  { '--t-accent': '#fcd34d', '--t-accent-bg': 'rgba(251,191,36,0.1)', '--t-accent-border': 'rgba(252,211,77,0.3)', '--t-card-bg': 'rgba(28,25,23,0.5)', '--t-card-border': 'rgba(146,64,14,0.15)', '--t-btn': '#b45309', '--t-btn-hover': '#d97706', '--t-glow-from': 'rgba(251,191,36,0.06)', '--t-glow-via': 'rgba(202,138,4,0.04)' },
  sakura:   { '--t-accent': '#f472b6', '--t-accent-bg': 'rgba(236,72,153,0.1)', '--t-accent-border': 'rgba(244,114,182,0.3)', '--t-card-bg': 'rgba(15,23,42,0.5)', '--t-card-border': 'rgba(131,24,67,0.15)', '--t-btn': '#db2777', '--t-btn-hover': '#ec4899', '--t-glow-from': 'rgba(236,72,153,0.1)', '--t-glow-via': 'rgba(251,113,133,0.06)' },
  ocean:    { '--t-accent': '#60a5fa', '--t-accent-bg': 'rgba(59,130,246,0.1)', '--t-accent-border': 'rgba(96,165,250,0.3)', '--t-card-bg': 'rgba(15,23,42,0.5)', '--t-card-border': 'rgba(30,58,138,0.15)', '--t-btn': '#2563eb', '--t-btn-hover': '#3b82f6', '--t-glow-from': 'rgba(59,130,246,0.08)', '--t-glow-via': 'rgba(56,189,248,0.05)' },
  forest:   { '--t-accent': '#34d399', '--t-accent-bg': 'rgba(16,185,129,0.1)', '--t-accent-border': 'rgba(52,211,153,0.3)', '--t-card-bg': 'rgba(15,23,42,0.5)', '--t-card-border': 'rgba(6,78,59,0.15)', '--t-btn': '#059669', '--t-btn-hover': '#10b981', '--t-glow-from': 'rgba(16,185,129,0.08)', '--t-glow-via': 'rgba(74,222,128,0.05)' },
  candy:    { '--t-accent': '#e879f9', '--t-accent-bg': 'rgba(217,70,239,0.1)', '--t-accent-border': 'rgba(232,121,249,0.3)', '--t-card-bg': 'rgba(15,23,42,0.5)', '--t-card-border': 'rgba(112,26,117,0.15)', '--t-btn': '#c026d3', '--t-btn-hover': '#d946ef', '--t-glow-from': 'rgba(217,70,239,0.1)', '--t-glow-via': 'rgba(168,85,247,0.06)' },
  noir:     { '--t-accent': 'rgba(255,255,255,0.8)', '--t-accent-bg': 'rgba(255,255,255,0.05)', '--t-accent-border': 'rgba(255,255,255,0.2)', '--t-card-bg': 'rgba(24,24,27,0.5)', '--t-card-border': 'rgba(255,255,255,0.08)', '--t-btn': '#3f3f46', '--t-btn-hover': '#52525b', '--t-glow-from': 'rgba(255,255,255,0.03)', '--t-glow-via': 'rgba(161,161,170,0.02)' },
}

export function AdminSurveyProvider({ children }: { children: ReactNode }) {
  const [surveys, setSurveys] = useState<SurveyOption[]>([])
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const [theme, setTheme] = useState<SurveyTheme>('default')

  const refreshSurveys = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/surveys')
      if (!res.ok) return
      const data = (await res.json()) as SurveyOption[]
      setSurveys(data)
      // 若尚未選取，預設選主問卷或第一個
      if (!selectedSurveyId || !data.find(s => s.id === selectedSurveyId)) {
        const primary = data.find(s => s.is_primary)
        setSelectedSurveyId(primary?.id ?? data[0]?.id ?? null)
      }
    } catch { /* ignore */ }
  }, [selectedSurveyId])

  useEffect(() => { refreshSurveys() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 當選取的問卷變動，載入其主題
  useEffect(() => {
    if (!selectedSurveyId) return
    const survey = surveys.find(s => s.id === selectedSurveyId)
    if (!survey) return

    fetch(`/api/surveys/theme?slug=${survey.slug}`)
      .then(r => r.json())
      .then((data: { defaultTheme?: SurveyTheme }) => {
        setTheme(data.defaultTheme ?? 'default')
      })
      .catch(() => setTheme('default'))
  }, [selectedSurveyId, surveys])

  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId) ?? null

  return (
    <AdminSurveyContext.Provider
      value={{ surveys, selectedSurveyId, selectedSurvey, theme, setSelectedSurveyId, refreshSurveys }}
    >
      {children}
    </AdminSurveyContext.Provider>
  )
}
