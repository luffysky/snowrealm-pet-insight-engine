import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import type { SurveyTheme } from '@/types'

interface ThemeRow extends Record<string, unknown> {
  default_theme: string
  available_themes: SurveyTheme[]
  allow_user_choice: boolean
  theme_intensity: Record<string, number>
}

/** 公開 API — 前端取得問卷的主題設定（不需登入） */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const row = await queryOne<ThemeRow>(
    `SELECT default_theme, available_themes, allow_user_choice, theme_intensity
     FROM survey_theme_settings WHERE survey_slug = $1`,
    [slug]
  )

  if (!row) {
    return NextResponse.json({
      defaultTheme: 'default',
      availableThemes: ['default'],
      allowUserChoice: false,
      themeIntensity: { default: 2, game: 2, cyber: 2 },
    })
  }

  return NextResponse.json({
    defaultTheme: row.default_theme,
    availableThemes: row.available_themes,
    allowUserChoice: row.allow_user_choice,
    themeIntensity: row.theme_intensity,
  })
}
