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

/** 每種主題對應的後台配色 */
export const ADMIN_THEME_COLORS: Record<SurveyTheme, {
  accent: string       // text accent color
  accentBg: string     // bg for active items
  accentBorder: string // border for active items
  navBg: string        // nav background
  navBorder: string    // nav bottom border
  headerGlow: string   // subtle glow on nav
}> = {
  default:  { accent: 'text-cyan-400', accentBg: 'bg-cyan-500/10', accentBorder: 'border-cyan-400/30', navBg: 'bg-slate-900/80', navBorder: 'border-slate-800', headerGlow: '' },
  game:     { accent: 'text-amber-400', accentBg: 'bg-amber-500/10', accentBorder: 'border-amber-400/30', navBg: 'bg-slate-900/80', navBorder: 'border-amber-900/30', headerGlow: 'shadow-amber-500/5' },
  cyber:    { accent: 'text-cyan-300', accentBg: 'bg-cyan-400/10', accentBorder: 'border-cyan-300/30', navBg: 'bg-gray-950/90', navBorder: 'border-cyan-900/30', headerGlow: 'shadow-cyan-500/5' },
  ancient:  { accent: 'text-amber-300', accentBg: 'bg-amber-400/10', accentBorder: 'border-amber-300/30', navBg: 'bg-stone-950/90', navBorder: 'border-amber-800/20', headerGlow: '' },
  sakura:   { accent: 'text-pink-400', accentBg: 'bg-pink-500/10', accentBorder: 'border-pink-400/30', navBg: 'bg-slate-950/90', navBorder: 'border-pink-900/20', headerGlow: 'shadow-pink-500/5' },
  ocean:    { accent: 'text-blue-400', accentBg: 'bg-blue-500/10', accentBorder: 'border-blue-400/30', navBg: 'bg-slate-950/90', navBorder: 'border-blue-900/20', headerGlow: 'shadow-blue-500/5' },
  forest:   { accent: 'text-emerald-400', accentBg: 'bg-emerald-500/10', accentBorder: 'border-emerald-400/30', navBg: 'bg-slate-950/90', navBorder: 'border-emerald-900/20', headerGlow: 'shadow-emerald-500/5' },
  candy:    { accent: 'text-fuchsia-400', accentBg: 'bg-fuchsia-500/10', accentBorder: 'border-fuchsia-400/30', navBg: 'bg-slate-950/90', navBorder: 'border-fuchsia-900/20', headerGlow: 'shadow-fuchsia-500/5' },
  noir:     { accent: 'text-white/80', accentBg: 'bg-white/5', accentBorder: 'border-white/20', navBg: 'bg-black/90', navBorder: 'border-white/10', headerGlow: '' },
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
