import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'AI 洞察報告'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // 從公開 API 取報告資料
  let title = 'AI 洞察報告'
  let description = ''
  let isStory = false

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'
    const res = await fetch(`${baseUrl}/api/report/${slug}`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json() as {
        shareTitle?: string | null
        surveyTitle?: string | null
        reportType?: string
        report?: { summary?: string; shareableOneLiner?: string }
      }
      title = data.shareTitle ?? data.surveyTitle ?? 'AI 洞察報告'
      isStory = data.reportType === 'story'
      description = isStory
        ? (data.report?.shareableOneLiner ?? '')
        : (data.report?.summary?.slice(0, 100) ?? '')
    }
  } catch { /* 使用預設值 */ }

  const emoji = isStory ? '📖' : '📊'
  const badge = isStory ? '故事報告' : '數據報告'
  const accentColor = isStory ? '#a78bfa' : '#22d3ee'
  const bgGradient = isStory
    ? 'linear-gradient(135deg, #0f0a1e 0%, #1e1035 50%, #0f0a1e 100%)'
    : 'linear-gradient(135deg, #0a1628 0%, #0f2d4a 50%, #0a1628 100%)'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: bgGradient,
          fontFamily: 'sans-serif',
          padding: '60px 72px',
        }}
      >
        {/* Top: badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              fontSize: 16,
              color: accentColor,
              padding: '6px 18px',
              border: `1.5px solid ${accentColor}44`,
              borderRadius: 20,
              background: `${accentColor}11`,
              letterSpacing: 1,
            }}
          >
            {emoji} {badge}
          </div>
        </div>

        {/* Middle: title + description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, justifyContent: 'center' }}>
          <div
            style={{
              fontSize: title.length > 20 ? 44 : 54,
              fontWeight: 'bold',
              color: '#f1f5f9',
              lineHeight: 1.25,
              maxWidth: '90%',
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: 22,
                color: '#94a3b8',
                lineHeight: 1.55,
                maxWidth: '85%',
              }}
            >
              {description.length > 90 ? description.slice(0, 90) + '...' : description}
            </div>
          )}
        </div>

        {/* Bottom: branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 24,
          }}
        >
          <div style={{ fontSize: 18, color: accentColor, fontWeight: 600 }}>
            SnowRealm Insight Engine
          </div>
          <div style={{ fontSize: 16, color: '#475569' }}>
            AI 智慧問卷平台
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
