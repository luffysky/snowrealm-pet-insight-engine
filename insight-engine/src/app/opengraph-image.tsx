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
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 24 }}>🐾</div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: '#f1f5f9',
            textAlign: 'center',
            lineHeight: 1.3,
            maxWidth: '80%',
          }}
        >
          如果有一天牠不在了
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: '#f1f5f9',
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          你還能留下什麼？
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#94a3b8',
            marginTop: 24,
            textAlign: 'center',
            maxWidth: '70%',
          }}
        >
          花 2 分鐘填寫問卷，幫助我們打造更好的寵物紀錄平台
        </div>
        <div
          style={{
            fontSize: 20,
            color: '#22d3ee',
            marginTop: 40,
            padding: '12px 32px',
            border: '2px solid rgba(34, 211, 238, 0.3)',
            borderRadius: 16,
          }}
        >
          SnowRealm Insight Engine
        </div>
      </div>
    ),
    { ...size }
  )
}
