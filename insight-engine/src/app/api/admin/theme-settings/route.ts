import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query, queryOne, execute } from '@/lib/db'
import type { SurveyTheme, ThemeIntensity } from '@/types'

const VALID_THEMES: SurveyTheme[] = ['default', 'game', 'cyber', 'ancient', 'sakura', 'ocean', 'forest', 'candy', 'noir']

function isAdmin(cookieStore: Awaited<ReturnType<typeof cookies>>): boolean {
  const token = cookieStore.get('admin_token')
  return token?.value === process.env.ADMIN_SECRET
}

interface ThemeRow extends Record<string, unknown> {
  id: number
  survey_slug: string
  default_theme: string
  available_themes: SurveyTheme[]
  allow_user_choice: boolean
  theme_intensity: Record<string, number>
}

/** GET — 取得某問卷的主題設定 */
export async function GET(request: Request) {
  const jar = await cookies()
  if (!isAdmin(jar)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const row = await queryOne<ThemeRow>(
    `SELECT * FROM survey_theme_settings WHERE survey_slug = $1`, [slug]
  )

  if (!row) {
    return NextResponse.json({
      surveySlug: slug,
      defaultTheme: 'default',
      availableThemes: ['default'],
      allowUserChoice: false,
      themeIntensity: { default: 2, game: 2, cyber: 2 },
    })
  }

  return NextResponse.json({
    surveySlug: row.survey_slug,
    defaultTheme: row.default_theme,
    availableThemes: row.available_themes,
    allowUserChoice: row.allow_user_choice,
    themeIntensity: row.theme_intensity,
  })
}

/** POST — 建立/更新主題設定 */
export async function POST(request: Request) {
  const jar = await cookies()
  if (!isAdmin(jar)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { surveySlug, defaultTheme, availableThemes, allowUserChoice, themeIntensity } = body

  if (!surveySlug || typeof surveySlug !== 'string') {
    return NextResponse.json({ error: 'Missing surveySlug' }, { status: 400 })
  }

  // Validate
  const safeDefault: SurveyTheme = VALID_THEMES.includes(defaultTheme) ? defaultTheme : 'default'
  const safeAvailable: SurveyTheme[] = Array.isArray(availableThemes)
    ? availableThemes.filter((t: string) => VALID_THEMES.includes(t as SurveyTheme))
    : ['default']
  if (!safeAvailable.includes(safeDefault)) safeAvailable.unshift(safeDefault)

  const safeIntensity: Record<SurveyTheme, ThemeIntensity> = { default: 2, game: 2, cyber: 2, ancient: 2, sakura: 2, ocean: 2, forest: 2, candy: 2, noir: 2 }
  if (themeIntensity && typeof themeIntensity === 'object') {
    for (const key of VALID_THEMES) {
      const v = Number(themeIntensity[key])
      if (v >= 1 && v <= 3) safeIntensity[key] = v as ThemeIntensity
    }
  }

  await execute(
    `INSERT INTO survey_theme_settings (survey_slug, default_theme, available_themes, allow_user_choice, theme_intensity)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (survey_slug) DO UPDATE SET
       default_theme = EXCLUDED.default_theme,
       available_themes = EXCLUDED.available_themes,
       allow_user_choice = EXCLUDED.allow_user_choice,
       theme_intensity = EXCLUDED.theme_intensity,
       updated_at = now()`,
    [surveySlug, safeDefault, JSON.stringify(safeAvailable), !!allowUserChoice, JSON.stringify(safeIntensity)]
  )

  return NextResponse.json({ ok: true })
}
