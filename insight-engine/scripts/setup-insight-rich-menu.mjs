/**
 * 問卷帳號 LINE Rich Menu 建立腳本
 * 用法：node scripts/setup-insight-rich-menu.mjs
 *
 * 對象：問卷 LINE 帳號 (@762wxvfb)
 * 不是毛行天下官方帳號！
 *
 * 建立 2×3 格 Rich Menu：
 *   Row 1: 📊 數據總覽 | 📋 填答列表 | 🏷️ 標籤分析
 *   Row 2: ⚙️ 問卷管理 | 📈 漏斗分析 | 🔗 填寫問卷
 */

import sharp from 'sharp'

const TOKEN = process.env.LINE_INSIGHT_CHANNEL_ACCESS_TOKEN
if (!TOKEN) {
  console.error('❌ 請設定環境變數 LINE_INSIGHT_CHANNEL_ACCESS_TOKEN')
  process.exit(1)
}

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://insight-engine-sonwrealm-pet.zeabur.app'
const ADMIN = `${BASE}/admin`

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
}

async function main() {
  // Step 0: 清除舊的預設 Rich Menu
  console.log('🧹 清除問卷帳號舊的預設 Rich Menu...')
  await fetch('https://api.line.me/v2/bot/user/all/richmenu', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${TOKEN}` },
  }).catch(() => {})

  // Step 1: 建立 Rich Menu (2×3 = 6 格)
  console.log('📋 Step 1: 建立問卷帳號 Rich Menu...')
  const colW = Math.floor(2500 / 3) // ~833
  const rowH = Math.floor(1686 / 2) // ~843
  const richMenu = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: '問卷後台選單 v1',
    chatBarText: '📊 後台數據',
    areas: [
      // Row 1
      {
        bounds: { x: 0, y: 0, width: colW, height: rowH },
        action: { type: 'uri', label: '數據總覽', uri: ADMIN },
      },
      {
        bounds: { x: colW, y: 0, width: colW, height: rowH },
        action: { type: 'uri', label: '填答列表', uri: `${ADMIN}/responses` },
      },
      {
        bounds: { x: colW * 2, y: 0, width: 2500 - colW * 2, height: rowH },
        action: { type: 'uri', label: '標籤分析', uri: `${ADMIN}/tags` },
      },
      // Row 2
      {
        bounds: { x: 0, y: rowH, width: colW, height: 1686 - rowH },
        action: { type: 'uri', label: '問卷管理', uri: `${ADMIN}/surveys` },
      },
      {
        bounds: { x: colW, y: rowH, width: colW, height: 1686 - rowH },
        action: { type: 'uri', label: '漏斗分析', uri: `${ADMIN}/funnel` },
      },
      {
        bounds: { x: colW * 2, y: rowH, width: 2500 - colW * 2, height: 1686 - rowH },
        action: { type: 'uri', label: '填寫問卷', uri: BASE },
      },
    ],
  }

  const createRes = await fetch('https://api.line.me/v2/bot/richmenu', {
    method: 'POST',
    headers,
    body: JSON.stringify(richMenu),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    console.error('❌ 建立失敗:', err)
    process.exit(1)
  }

  const { richMenuId } = await createRes.json()
  console.log('✅ Rich Menu ID:', richMenuId)

  // Step 2: 產生並上傳 Rich Menu 圖片
  console.log('🖼️  Step 2: 產生並上傳 Rich Menu 圖片...')
  const imageBuffer = await createRichMenuPng(2500, 1686)

  const uploadRes = await fetch(
    `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'image/png',
      },
      body: imageBuffer,
    }
  )

  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    console.error('❌ 圖片上傳失敗:', err)
    console.log('⚠️  Rich Menu ID:', richMenuId)
  } else {
    console.log('✅ 圖片上傳成功')
  }

  // Step 3: 設為預設 Rich Menu
  console.log('🔗 Step 3: 設為預設 Rich Menu...')
  const defaultRes = await fetch(
    `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
    }
  )

  if (!defaultRes.ok) {
    const err = await defaultRes.text()
    console.error('❌ 設為預設失敗:', err)
  } else {
    console.log('✅ 已設為問卷帳號的預設 Rich Menu！')
  }

  console.log('\n🎉 完成！問卷帳號 (@762wxvfb) 的好友開啟聊天室都會看到後台選單')
}

// ----- SVG + sharp 產生 PNG（6 格深色系）-----

async function createRichMenuPng(width, height) {
  const colW = Math.floor(width / 3)
  const rowH = Math.floor(height / 2)

  // 6 格配置：後台管理風格深色系
  const cells = [
    // Row 1
    { bg: '#1e3a5f', emoji: '📊', label: '數據總覽' },
    { bg: '#2d4a3e', emoji: '📋', label: '填答列表' },
    { bg: '#4a2d5e', emoji: '🏷️', label: '標籤分析' },
    // Row 2
    { bg: '#3d2d1e', emoji: '⚙️', label: '問卷管理' },
    { bg: '#1e3d4a', emoji: '📈', label: '漏斗分析' },
    { bg: '#0e7990', emoji: '🔗', label: '填寫問卷' },
  ]

  const rects = []
  const texts = []

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const idx = row * 3 + col
      const cell = cells[idx]
      const x = col * colW
      const y = row * rowH
      const w = col === 2 ? width - colW * 2 : colW
      const h = row === 1 ? height - rowH : rowH

      rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cell.bg}" />`)

      if (col > 0) {
        rects.push(`<line x1="${col * colW}" y1="${y}" x2="${col * colW}" y2="${y + h}" stroke="#0f172a" stroke-width="3" />`)
      }
      if (row > 0) {
        rects.push(`<line x1="${x}" y1="${rowH}" x2="${x + w}" y2="${rowH}" stroke="#0f172a" stroke-width="3" />`)
      }

      const cx = x + w / 2
      const cy = y + h / 2

      texts.push(`<text x="${cx}" y="${cy - 40}" text-anchor="middle" dominant-baseline="central" font-size="100" fill="white">${cell.emoji}</text>`)
      texts.push(`<text x="${cx}" y="${cy + 100}" text-anchor="middle" dominant-baseline="central" font-size="72" font-weight="bold" fill="white" font-family="'Noto Sans TC','Microsoft JhengHei','PingFang TC','Helvetica Neue',sans-serif">${cell.label}</text>`)
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${rects.join('\n  ')}
  ${texts.join('\n  ')}
</svg>`

  return sharp(Buffer.from(svg)).png().toBuffer()
}

main().catch(console.error)
