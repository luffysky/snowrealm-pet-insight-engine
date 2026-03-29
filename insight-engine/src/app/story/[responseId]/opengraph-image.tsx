import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '我的故事卡片'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ responseId: string }>
}) {
  const { responseId } = await params

  let surveyTitle = '問卷故事卡片'
  let oneLiner = ''
  let facts: string[] = []

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://insight.snowrealm.pet'
    const res = await fetch(`${baseUrl}/api/story-card/${responseId}`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json() as {
        surveyTitle?: string
        shareableOneLiner?: string
        personalFacts?: string[]
      }
      surveyTitle = data.surveyTitle ?? surveyTitle
      oneLiner = data.shareableOneLiner ?? ''
      facts = (data.personalFacts ?? []).slice(0, 2)
    }
  } catch { /* 使用預設值 */ }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          fontFamily: 'sans-serif',
          padding: '60px 72px',
        }}
      >
        {/* Top: badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              fontSize: 16,
              color: '#a78bfa',
              padding: '6px 18px',
              border: '1.5px solid rgba(167,139,250,0.3)',
              borderRadius: 20,
              background: 'rgba(167,139,250,0.08)',
              letterSpacing: 1,
            }}
          >
            ✨ 我的故事卡片
          </div>
        </div>

        {/* Middle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, justifyContent: 'center' }}>
          {/* Survey title */}
          <div style={{ fontSize: 22, color: '#94a3b8', fontWeight: 500 }}>
            {surveyTitle}
          </div>

          {/* One-liner */}
          {oneLiner && (
            <div
              style={{
                fontSize: oneLiner.length > 30 ? 36 : 44,
                fontWeight: 'bold',
                color: '#f1f5f9',
                lineHeight: 1.3,
                maxWidth: '88%',
              }}
            >
              {oneLiner.length > 60 ? oneLiner.slice(0, 60) + '...' : oneLiner}
            </div>
          )}

          {/* Personal facts */}
          {facts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {facts.map((fact, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 20,
                    color: '#c4b5fd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ color: '#7c3aed', fontSize: 18 }}>•</span>
                  {fact.length > 50 ? fact.slice(0, 50) + '...' : fact}
                </div>
              ))}
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
          <div style={{ fontSize: 18, color: '#a78bfa', fontWeight: 600 }}>
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
