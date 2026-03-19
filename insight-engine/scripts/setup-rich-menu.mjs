/**
 * LINE Rich Menu 建立腳本（6 格版本）
 * 用法：node scripts/setup-rich-menu.mjs
 *
 * 建立 2×3 格 Rich Menu：
 *   Row 1: 📋 填問卷 | 🎉 封測報名 | 📸 Instagram
 *   Row 2: 🌐 官網    | 📢 最新消息 | 💬 聯絡我們
 */

import sharp from 'sharp'

const TOKEN = process.env.LINE_OFFICIAL_CHANNEL_ACCESS_TOKEN
if (!TOKEN) {
  console.error('❌ 請設定環境變數 LINE_OFFICIAL_CHANNEL_ACCESS_TOKEN')
  process.exit(1)
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'
const SURVEY_URL = `${BASE_URL}/survey`
const IG_URL = 'https://www.instagram.com/snowrealm.pet?igsh=Y2x1cTRiM3N3NGpw'

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
}

async function main() {
  // Step 0: 先刪除既有的預設 Rich Menu（避免衝突）
  console.log('🧹 清除舊的預設 Rich Menu...')
  await fetch('https://api.line.me/v2/bot/user/all/richmenu', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${TOKEN}` },
  }).catch(() => {})

  // Step 1: 建立 Rich Menu (2×3 = 6 格)
  console.log('📋 Step 1: 建立 Rich Menu (6 格)...')
  const colW = Math.floor(2500 / 3) // ~833
  const rowH = Math.floor(1686 / 2) // ~843
  const richMenu = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: '毛行天下選單 v2',
    chatBarText: '🐾 打開選單',
    areas: [
      // Row 1
      {
        bounds: { x: 0, y: 0, width: colW, height: rowH },
        action: { type: 'uri', label: '填問卷', uri: SURVEY_URL },
      },
      {
        bounds: { x: colW, y: 0, width: colW, height: rowH },
        action: { type: 'message', label: '封測報名', text: '封測' },
      },
      {
        bounds: { x: colW * 2, y: 0, width: 2500 - colW * 2, height: rowH },
        action: { type: 'uri', label: 'Instagram', uri: IG_URL },
      },
      // Row 2
      {
        bounds: { x: 0, y: rowH, width: colW, height: 1686 - rowH },
        action: { type: 'uri', label: '官網', uri: 'https://snowrealm.pet' },
      },
      {
        bounds: { x: colW, y: rowH, width: colW, height: 1686 - rowH },
        action: { type: 'message', label: '最新消息', text: '最新消息' },
      },
      {
        bounds: { x: colW * 2, y: rowH, width: 2500 - colW * 2, height: 1686 - rowH },
        action: { type: 'message', label: '聯絡我們', text: '聯絡我們' },
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

  // Step 2: 產生並上傳 Rich Menu 圖片 (6 格品牌色)
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
    console.log('⚠️  請手動到 LINE Official Account Manager 上傳 Rich Menu 圖片')
    console.log('   Rich Menu ID:', richMenuId)
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
    console.log('✅ 已設為預設 Rich Menu！')
  }

  console.log('\n🎉 完成！所有 LINE 好友開啟聊天室都會看到選單')
}

// ----- SVG + sharp 產生 PNG（6 格品牌色 + 文字標籤）-----

async function createRichMenuPng(width, height) {
  const colW = Math.floor(width / 3)
  const rowH = Math.floor(height / 2)

  // 6 格配置：[背景色, emoji, 標籤]
  const cells = [
    // Row 1
    [{ bg: '#0e7990', emoji: '📋', label: '填問卷' }],
    [{ bg: '#047e57', emoji: '🎉', label: '封測報名' }],
    [{ bg: '#7e22ce', emoji: '📸', label: 'Instagram' }],
    // Row 2
    [{ bg: '#075985', emoji: '🌐', label: '官網' }],
    [{ bg: '#b45309', emoji: '📢', label: '最新消息' }],
    [{ bg: '#be123c', emoji: '💬', label: '聯絡我們' }],
  ]

  // 建構 SVG
  const rects = []
  const texts = []

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const idx = row * 3 + col
      const cell = cells[idx][0]
      const x = col * colW
      const y = row * rowH
      const w = col === 2 ? width - colW * 2 : colW
      const h = row === 1 ? height - rowH : rowH

      rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cell.bg}" />`)

      // 分隔線
      if (col > 0) {
        rects.push(`<line x1="${col * colW}" y1="${y}" x2="${col * colW}" y2="${y + h}" stroke="#1e293b" stroke-width="3" />`)
      }
      if (row > 0) {
        rects.push(`<line x1="${x}" y1="${rowH}" x2="${x + w}" y2="${rowH}" stroke="#1e293b" stroke-width="3" />`)
      }

      const cx = x + w / 2
      const cy = y + h / 2

      // Emoji（上方）
      texts.push(`<text x="${cx}" y="${cy - 40}" text-anchor="middle" dominant-baseline="central" font-size="100" fill="white">${cell.emoji}</text>`)

      // 文字標籤（下方）
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
