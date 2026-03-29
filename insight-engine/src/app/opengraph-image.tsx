import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'SnowRealm Insight Engine'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: 72, marginBottom: 28 }}>✨</div>

        {/* Title */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 'bold',
            color: '#f1f5f9',
            textAlign: 'center',
            lineHeight: 1.25,
            maxWidth: '80%',
          }}
        >
          SnowRealm Insight Engine
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 26,
            color: '#94a3b8',
            marginTop: 20,
            textAlign: 'center',
            maxWidth: '65%',
            lineHeight: 1.5,
          }}
        >
          AI 智慧問卷引擎 — 從問卷建立到 AI 洞察的一站式平台
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 40,
          }}
        >
          {['📊 數據分析', '🤖 AI 洞察', '💬 LINE 整合'].map((item) => (
            <div
              key={item}
              style={{
                fontSize: 18,
                color: '#22d3ee',
                padding: '10px 24px',
                border: '1.5px solid rgba(34, 211, 238, 0.3)',
                borderRadius: 24,
                background: 'rgba(34, 211, 238, 0.06)',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
