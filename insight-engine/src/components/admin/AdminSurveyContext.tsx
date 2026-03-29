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
  default:  { accent: 'text-cyan-400', accentBg: 'bg-cyan-500/10', accentBorder: 'border-cyan-400/30', navBg: 'bg-white/55 backdrop-blur-sm', navBorder: 'border-[#b8a9e8]/20', headerGlow: '', bodyBg: 'bg-transparent', cardBg: 'bg-white/40 backdrop-blur-sm', cardBorder: 'border-[#b8a9e8]/20', glowFrom: 'from-cyan-500/8', glowVia: 'via-indigo-500/5', btnBg: 'bg-cyan-600', btnHover: 'hover:bg-cyan-500' },
  game:     { accent: 'text-amber-400', accentBg: 'bg-amber-500/10', accentBorder: 'border-amber-400/30', navBg: 'bg-white/55 backdrop-blur-sm', navBorder: 'border-amber-900/30', headerGlow: 'shadow-amber-500/5', bodyBg: 'bg-[#0f0f1a]', cardBg: 'bg-[#1a1a2e]/60', cardBorder: 'border-amber-900/20', glowFrom: 'from-amber-500/8', glowVia: 'via-orange-500/5', btnBg: 'bg-amber-600', btnHover: 'hover:bg-amber-500' },
  cyber:    { accent: 'text-cyan-300', accentBg: 'bg-cyan-400/10', accentBorder: 'border-cyan-300/30', navBg: 'bg-gray-950/90', navBorder: 'border-cyan-900/30', headerGlow: 'shadow-cyan-500/5', bodyBg: 'bg-[#0a0a1a]', cardBg: 'bg-gray-900/50', cardBorder: 'border-cyan-900/20', glowFrom: 'from-cyan-400/8', glowVia: 'via-blue-500/5', btnBg: 'bg-cyan-500', btnHover: 'hover:bg-cyan-400' },
  ancient:  { accent: 'text-amber-300', accentBg: 'bg-amber-400/10', accentBorder: 'border-amber-300/30', navBg: 'bg-stone-950/90', navBorder: 'border-amber-800/20', headerGlow: '', bodyBg: 'bg-[#12100d]', cardBg: 'bg-stone-900/50', cardBorder: 'border-amber-800/15', glowFrom: 'from-amber-400/6', glowVia: 'via-yellow-600/4', btnBg: 'bg-amber-700', btnHover: 'hover:bg-amber-600' },
  sakura:   { accent: 'text-pink-400', accentBg: 'bg-pink-500/10', accentBorder: 'border-pink-400/30', navBg: 'bg-transparent/90', navBorder: 'border-pink-900/20', headerGlow: 'shadow-pink-500/5', bodyBg: 'bg-[#0f0a12]', cardBg: 'bg-white/40 backdrop-blur-sm', cardBorder: 'border-pink-900/15', glowFrom: 'from-pink-500/10', glowVia: 'via-rose-400/6', btnBg: 'bg-pink-600', btnHover: 'hover:bg-pink-500' },
  ocean:    { accent: 'text-blue-400', accentBg: 'bg-blue-500/10', accentBorder: 'border-blue-400/30', navBg: 'bg-transparent/90', navBorder: 'border-blue-900/20', headerGlow: 'shadow-blue-500/5', bodyBg: 'bg-[#0a0e18]', cardBg: 'bg-white/40 backdrop-blur-sm', cardBorder: 'border-blue-900/15', glowFrom: 'from-blue-500/8', glowVia: 'via-sky-400/5', btnBg: 'bg-blue-600', btnHover: 'hover:bg-blue-500' },
  forest:   { accent: 'text-emerald-400', accentBg: 'bg-emerald-500/10', accentBorder: 'border-emerald-400/30', navBg: 'bg-transparent/90', navBorder: 'border-emerald-900/20', headerGlow: 'shadow-emerald-500/5', bodyBg: 'bg-[#0a120e]', cardBg: 'bg-white/40 backdrop-blur-sm', cardBorder: 'border-emerald-900/15', glowFrom: 'from-emerald-500/8', glowVia: 'via-green-400/5', btnBg: 'bg-emerald-600', btnHover: 'hover:bg-emerald-500' },
  candy:    { accent: 'text-fuchsia-400', accentBg: 'bg-fuchsia-500/10', accentBorder: 'border-fuchsia-400/30', navBg: 'bg-transparent/90', navBorder: 'border-fuchsia-900/20', headerGlow: 'shadow-fuchsia-500/5', bodyBg: 'bg-[#12091a]', cardBg: 'bg-white/40 backdrop-blur-sm', cardBorder: 'border-fuchsia-900/15', glowFrom: 'from-fuchsia-500/10', glowVia: 'via-purple-400/6', btnBg: 'bg-fuchsia-600', btnHover: 'hover:bg-fuchsia-500' },
  noir:     { accent: 'text-[#3d3155]', accentBg: 'bg-white/5', accentBorder: 'border-white/20', navBg: 'bg-black/90', navBorder: 'border-white/10', headerGlow: '', bodyBg: 'bg-black', cardBg: 'bg-zinc-900/50', cardBorder: 'border-white/8', glowFrom: 'from-white/3', glowVia: 'via-zinc-400/2', btnBg: 'bg-zinc-700', btnHover: 'hover:bg-zinc-600' },
  sunset:   { accent: 'text-orange-400', accentBg: 'bg-orange-500/10', accentBorder: 'border-orange-400/30', navBg: 'bg-orange-950/80', navBorder: 'border-orange-900/30', headerGlow: 'shadow-orange-500/5', bodyBg: 'bg-[#1a0800]', cardBg: 'bg-orange-950/40', cardBorder: 'border-orange-900/20', glowFrom: 'from-orange-500/8', glowVia: 'via-red-500/5', btnBg: 'bg-orange-600', btnHover: 'hover:bg-orange-500' },
  neon:     { accent: 'text-fuchsia-400', accentBg: 'bg-fuchsia-500/10', accentBorder: 'border-fuchsia-400/30', navBg: 'bg-purple-950/90', navBorder: 'border-fuchsia-900/20', headerGlow: 'shadow-fuchsia-500/5', bodyBg: 'bg-[#05000f]', cardBg: 'bg-purple-950/40', cardBorder: 'border-fuchsia-900/20', glowFrom: 'from-fuchsia-500/10', glowVia: 'via-cyan-400/5', btnBg: 'bg-fuchsia-600', btnHover: 'hover:bg-fuchsia-500' },
  aurora:   { accent: 'text-teal-400', accentBg: 'bg-teal-500/10', accentBorder: 'border-teal-400/30', navBg: 'bg-teal-950/80', navBorder: 'border-teal-900/20', headerGlow: 'shadow-teal-500/5', bodyBg: 'bg-[#020b18]', cardBg: 'bg-teal-950/40', cardBorder: 'border-teal-900/15', glowFrom: 'from-teal-500/8', glowVia: 'via-emerald-400/5', btnBg: 'bg-teal-600', btnHover: 'hover:bg-teal-500' },
  space:    { accent: 'text-blue-400', accentBg: 'bg-blue-500/10', accentBorder: 'border-blue-400/30', navBg: 'bg-blue-950/80', navBorder: 'border-blue-900/20', headerGlow: 'shadow-blue-500/5', bodyBg: 'bg-[#00010d]', cardBg: 'bg-blue-950/40', cardBorder: 'border-blue-900/15', glowFrom: 'from-blue-500/8', glowVia: 'via-indigo-400/5', btnBg: 'bg-blue-600', btnHover: 'hover:bg-blue-500' },
  minimal:  { accent: 'text-gray-700', accentBg: 'bg-gray-100', accentBorder: 'border-gray-300', navBg: 'bg-white/95', navBorder: 'border-gray-200', headerGlow: '', bodyBg: 'bg-gray-50', cardBg: 'bg-white', cardBorder: 'border-gray-200', glowFrom: 'from-gray-200/50', glowVia: 'via-gray-100/30', btnBg: 'bg-gray-900', btnHover: 'hover:bg-gray-700' },
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
  sunset:   { '--t-accent': '#fb923c', '--t-accent-bg': 'rgba(249,115,22,0.1)', '--t-accent-border': 'rgba(251,146,60,0.3)', '--t-card-bg': 'rgba(67,20,7,0.4)', '--t-card-border': 'rgba(154,52,18,0.2)', '--t-btn': '#ea580c', '--t-btn-hover': '#f97316', '--t-glow-from': 'rgba(234,88,12,0.08)', '--t-glow-via': 'rgba(239,68,68,0.05)' },
  neon:     { '--t-accent': '#e879f9', '--t-accent-bg': 'rgba(217,70,239,0.1)', '--t-accent-border': 'rgba(232,121,249,0.3)', '--t-card-bg': 'rgba(59,7,100,0.4)', '--t-card-border': 'rgba(126,34,206,0.2)', '--t-btn': '#c026d3', '--t-btn-hover': '#d946ef', '--t-glow-from': 'rgba(217,70,239,0.1)', '--t-glow-via': 'rgba(34,211,238,0.05)' },
  aurora:   { '--t-accent': '#2dd4bf', '--t-accent-bg': 'rgba(20,184,166,0.1)', '--t-accent-border': 'rgba(45,212,191,0.3)', '--t-card-bg': 'rgba(4,44,46,0.4)', '--t-card-border': 'rgba(19,78,74,0.15)', '--t-btn': '#0d9488', '--t-btn-hover': '#14b8a6', '--t-glow-from': 'rgba(20,184,166,0.08)', '--t-glow-via': 'rgba(52,211,153,0.05)' },
  space:    { '--t-accent': '#60a5fa', '--t-accent-bg': 'rgba(59,130,246,0.1)', '--t-accent-border': 'rgba(96,165,250,0.3)', '--t-card-bg': 'rgba(15,23,42,0.4)', '--t-card-border': 'rgba(30,58,138,0.15)', '--t-btn': '#2563eb', '--t-btn-hover': '#3b82f6', '--t-glow-from': 'rgba(59,130,246,0.08)', '--t-glow-via': 'rgba(139,92,246,0.05)' },
  minimal:  { '--t-accent': '#374151', '--t-accent-bg': 'rgba(243,244,246,1)', '--t-accent-border': 'rgba(209,213,219,1)', '--t-card-bg': 'rgba(255,255,255,1)', '--t-card-border': 'rgba(229,231,235,1)', '--t-btn': '#111827', '--t-btn-hover': '#374151', '--t-glow-from': 'rgba(229,231,235,0.5)', '--t-glow-via': 'rgba(243,244,246,0.3)' },
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
