/**
 * LINE Rich Menu 建立腳本
 * 用法：node scripts/setup-rich-menu.mjs
 *
 * 建立一個 2 格 Rich Menu：
 *   左: 📋 填問卷
 *   右: 🐾 關於毛行天下
 */

import { deflateSync } from 'node:zlib'

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
if (!TOKEN) {
  console.error('❌ 請設定環境變數 LINE_CHANNEL_ACCESS_TOKEN')
  process.exit(1)
}

const SURVEY_URL = process.env.NEXT_PUBLIC_BASE_URL
  ? `${process.env.NEXT_PUBLIC_BASE_URL}/survey`
  : 'https://localhost:3000/survey'

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

  // Step 1: 建立 Rich Menu
  console.log('📋 Step 1: 建立 Rich Menu...')
  const richMenu = {
    size: { width: 2500, height: 843 },
    selected: true,
    name: '毛行天下選單',
    chatBarText: '🐾 打開選單',
    areas: [
      {
        bounds: { x: 0, y: 0, width: 1250, height: 843 },
        action: {
          type: 'uri',
          label: '填問卷',
          uri: SURVEY_URL,
        },
      },
      {
        bounds: { x: 1250, y: 0, width: 1250, height: 843 },
        action: {
          type: 'message',
          label: '關於毛行天下',
          text: '毛行天下',
        },
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
  const imageBuffer = createRichMenuPng(2500, 843)

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

// ----- 純 Node.js 產生 PNG（不需外部套件）-----

function createRichMenuPng(width, height) {
  // 左半：深藍 #0f172a | 右半：深紫 #1e1b4b
  // 中間分隔線：#334155
  const midX = Math.floor(width / 2)

  // 建立 raw pixel rows (每列前面加 filter byte 0)
  const rowSize = 1 + width * 3  // filter byte + RGB
  const rawData = Buffer.alloc(rowSize * height)

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize
    rawData[rowOffset] = 0 // filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3
      if (x === midX || x === midX - 1) {
        // 分隔線
        rawData[pixelOffset] = 0x33
        rawData[pixelOffset + 1] = 0x41
        rawData[pixelOffset + 2] = 0x55
      } else if (x < midX) {
        // 左：深藍
        rawData[pixelOffset] = 0x0f
        rawData[pixelOffset + 1] = 0x17
        rawData[pixelOffset + 2] = 0x2a
      } else {
        // 右：深紫
        rawData[pixelOffset] = 0x1e
        rawData[pixelOffset + 1] = 0x1b
        rawData[pixelOffset + 2] = 0x4b
      }
    }
  }

  const compressed = deflateSync(rawData)

  // 組裝 PNG
  const chunks = []

  // Signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // color type: RGB
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace
  chunks.push(pngChunk('IHDR', ihdr))

  // IDAT
  chunks.push(pngChunk('IDAT', compressed))

  // IEND
  chunks.push(pngChunk('IEND', Buffer.alloc(0)))

  return Buffer.concat(chunks)
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)

  const typeBuffer = Buffer.from(type, 'ascii')
  const crcInput = Buffer.concat([typeBuffer, data])
  const crc = crc32(crcInput)

  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc >>> 0, 0)

  return Buffer.concat([len, typeBuffer, data, crcBuf])
}

function crc32(buf) {
  // CRC-32 lookup table
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[i] = c
  }

  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

main().catch(console.error)
