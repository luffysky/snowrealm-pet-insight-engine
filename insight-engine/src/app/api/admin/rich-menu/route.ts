import { NextRequest, NextResponse } from 'next/server'
import { getLineConfig } from '@/lib/lineConfig'
import { getTenantContext, requireRole } from '@/lib/tenant'
import { getPrimarySurveySlug } from '@/lib/surveyRepo'
import sharp from 'sharp'

const LINE_API = 'https://api.line.me/v2/bot'

/** Rich Menu API 用：依 Channel 取 Access Token（官方帳號 vs Insight／問卷機器人各一組） */
async function getChannelAccessToken(
  tenantId: string,
  channel: 'official' | 'insight',
): Promise<string> {
  if (channel === 'insight') {
    return (await getLineConfig('INSIGHT_CHANNEL_ACCESS_TOKEN', tenantId)) ?? ''
  }
  return (await getLineConfig('OFFICIAL_CHANNEL_ACCESS_TOKEN', tenantId)) ?? ''
}

interface RichMenuItem {
  richMenuId: string
  name: string
  chatBarText: string
  selected: boolean
  size: { width: number; height: number }
  areas: { bounds: Record<string, number>; action: Record<string, string> }[]
  [key: string]: unknown
}

interface MenuButton {
  emoji: string
  label: string
  actionType: 'uri' | 'message'
  actionValue: string
  bg: string
}

const TEMPLATE_PRESETS: Record<string, { name: string; chatBarText: string; buttons: MenuButton[] }> = {
  official: {
    name: '官方帳號選單',
    chatBarText: '📋 打開選單',
    buttons: [
      { emoji: '📋', label: '填問卷', actionType: 'uri', actionValue: '{PUBLIC_SURVEY_URL}', bg: '#0e7990' },
      { emoji: '🎉', label: '封測報名', actionType: 'message', actionValue: '封測', bg: '#047e57' },
      { emoji: '📸', label: 'Instagram', actionType: 'uri', actionValue: '{IG_URL}', bg: '#7e22ce' },
      { emoji: '🌐', label: '官網', actionType: 'uri', actionValue: '{SITE_URL}', bg: '#075985' },
      { emoji: '📢', label: '最新消息', actionType: 'message', actionValue: '最新消息', bg: '#b45309' },
      { emoji: '💬', label: '聯絡我們', actionType: 'message', actionValue: '聯絡我們', bg: '#be123c' },
    ],
  },
  admin: {
    name: '後台管理選單',
    chatBarText: '📊 後台數據',
    buttons: [
      { emoji: '📊', label: '數據總覽', actionType: 'uri', actionValue: '{ADMIN_URL}', bg: '#1e3a5f' },
      { emoji: '📋', label: '填答列表', actionType: 'uri', actionValue: '{ADMIN_URL}/responses', bg: '#2d4a3e' },
      { emoji: '🏷️', label: '標籤分析', actionType: 'uri', actionValue: '{ADMIN_URL}/tags', bg: '#4a2d5e' },
      { emoji: '⚙️', label: '問卷管理', actionType: 'uri', actionValue: '{ADMIN_URL}/surveys', bg: '#3d2d1e' },
      { emoji: '📈', label: '漏斗分析', actionType: 'uri', actionValue: '{ADMIN_URL}/funnel', bg: '#1e3d4a' },
      { emoji: '🔗', label: '填寫問卷', actionType: 'uri', actionValue: '{PUBLIC_SURVEY_URL}', bg: '#0e7990' },
    ],
  },
}

/** LINE 內建瀏覽器常導致登入 Cookie 失效；URI 加上此 hash 改用手機預設瀏覽器開啟 */
function withLineExternalBrowser(uri: string): string {
  if (!uri.startsWith('http')) return uri
  if (uri.includes('openExternalBrowser')) return uri
  const pathOnly = uri.split('#')[0]
  return `${pathOnly}#openExternalBrowser=1`
}

async function resolveUrl(template: string, tenantId: string): Promise<string> {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://insight.snowrealm.pet').replace(/\/$/, '')
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://snowrealm.pet').replace(/\/$/, '')
  const igUrl = (process.env.NEXT_PUBLIC_IG_URL || siteUrl).replace(/\/$/, '')
  const dbSurveyUrl = await getLineConfig('RICH_MENU_SURVEY_URL', tenantId)
  const envSurvey = dbSurveyUrl ?? process.env.NEXT_PUBLIC_RICH_MENU_SURVEY_URL?.trim()
  const primarySlug = await getPrimarySurveySlug(tenantId)
  const publicSurveyUrl = envSurvey || (primarySlug ? `${baseUrl}/${tenantId}/${primarySlug}` : `${baseUrl}/`)

  return template
    .replace('{BASE_URL}', baseUrl)
    .replace('{PUBLIC_SURVEY_URL}', publicSurveyUrl)
    .replace('{ADMIN_URL}', `${baseUrl}/insight-admin/${tenantId}`)
    .replace('{SITE_URL}', siteUrl)
    .replace('{IG_URL}', igUrl)
}

async function generateMenuImage(
  buttons: MenuButton[],
  width: number,
  height: number,
  backgroundImageBase64?: string,
): Promise<Buffer> {
  const colW = Math.floor(width / 3)
  const rowH = Math.floor(height / 2)
  const rects: string[] = []
  const texts: string[] = []

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const idx = row * 3 + col
      if (idx >= buttons.length) break
      const btn = buttons[idx]
      const x = col * colW
      const y = row * rowH
      const w = col === 2 ? width - colW * 2 : colW
      const h = row === 1 ? height - rowH : rowH

      if (backgroundImageBase64) {
        // 自訂背景圖模式：每格加半透明暗底讓文字可讀 + 白色分隔線
        rects.push(`<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" fill="rgba(0,0,0,0.42)" rx="6" />`)
        if (col > 0) rects.push(`<line x1="${col * colW}" y1="${y}" x2="${col * colW}" y2="${y + h}" stroke="rgba(255,255,255,0.35)" stroke-width="4" />`)
        if (row > 0) rects.push(`<line x1="${x}" y1="${rowH}" x2="${x + w}" y2="${rowH}" stroke="rgba(255,255,255,0.35)" stroke-width="4" />`)
      } else {
        // 純色模式
        rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${btn.bg}" />`)
        if (col > 0) rects.push(`<line x1="${col * colW}" y1="${y}" x2="${col * colW}" y2="${y + h}" stroke="#0f172a" stroke-width="3" />`)
        if (row > 0) rects.push(`<line x1="${x}" y1="${rowH}" x2="${x + w}" y2="${rowH}" stroke="#0f172a" stroke-width="3" />`)
      }

      const cx = x + w / 2
      const cy = y + h / 2
      texts.push(`<text x="${cx}" y="${cy - 40}" text-anchor="middle" dominant-baseline="central" font-size="100" fill="white">${btn.emoji}</text>`)
      texts.push(`<text x="${cx}" y="${cy + 100}" text-anchor="middle" dominant-baseline="central" font-size="72" font-weight="bold" fill="white" font-family="sans-serif">${btn.label}</text>`)
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${rects.join('')}${texts.join('')}</svg>`
  const overlayBuf = await sharp(Buffer.from(svg)).png().toBuffer()

  if (backgroundImageBase64) {
    // 把上傳的圖片 resize 到指定尺寸，再合成文字 overlay
    const bgBuf = Buffer.from(backgroundImageBase64, 'base64')
    return sharp(bgBuf)
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .composite([{ input: overlayBuf, blend: 'over' }])
      .png()
      .toBuffer()
  }

  return sharp(Buffer.from(svg)).png().toBuffer()
}

/**
 * GET /api/admin/rich-menu?channel=official|insight
 * 列出該 Messaging API Channel 的 Rich Menu + 目前預設（每個 Bot 各自一組）
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { tenantId } = await getTenantContext()
  const ch = request.nextUrl.searchParams.get('channel') === 'insight' ? 'insight' : 'official'
  const token = await getChannelAccessToken(tenantId, ch)
  if (!token) {
    return NextResponse.json(
      { error: ch === 'insight' ? '缺少 Insight Channel Access Token' : '缺少 Official Channel Access Token' },
      { status: 500 },
    )
  }

  try {
    // 取得所有 Rich Menu
    const listRes = await fetch(`${LINE_API}/richmenu/list`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    })
    const listData = await listRes.json() as { richmenus?: RichMenuItem[] }
    const menus = listData.richmenus ?? []

    // 取得目前預設的 Rich Menu ID
    let defaultId: string | null = null
    const defaultRes = await fetch(`${LINE_API}/user/all/richmenu`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    })
    if (defaultRes.ok) {
      const data = await defaultRes.json() as { richMenuId?: string }
      defaultId = data.richMenuId ?? null
    }

    return NextResponse.json({
      menus,
      defaultId,
      channel: ch,
      /** 供後台編輯器載入：佔位符於 resolveUrl 替換 */
      presets: TEMPLATE_PRESETS,
      placeholders: [
        '{PUBLIC_SURVEY_URL}',
        '{ADMIN_URL}',
        '{SITE_URL}',
        '{IG_URL}',
        '{BASE_URL}',
      ],
    })
  } catch (err) {
    console.error('[rich-menu] GET error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/**
 * POST /api/admin/rich-menu
 * action: 'set-default' | 'delete' | 'unset-default'
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleCheck = await requireRole('admin')
  if (roleCheck instanceof NextResponse) return roleCheck
  const { tenantId } = roleCheck

  const body = await request.json() as {
    action: string
    richMenuId?: string
    template?: string
    channel?: 'official' | 'insight'
    buttons?: MenuButton[]
    chatBarText?: string
    /** 自訂選單名稱（LINE 後台顯示） */
    menuName?: string
    /** 自訂背景圖（base64，前端 canvas 縮圖後傳入） */
    backgroundImage?: string
  }

  /** 列表／設預設／刪除 所操作的 Bot（與建立時 channel 一致） */
  const listChannel: 'official' | 'insight' = body.channel === 'insight' ? 'insight' : 'official'
  const token = await getChannelAccessToken(tenantId, listChannel)
  if (!token && body.action !== 'create') {
    return NextResponse.json(
      { error: listChannel === 'insight' ? '缺少 Insight Channel Access Token' : '缺少 Official Channel Access Token' },
      { status: 500 },
    )
  }

  try {
    switch (body.action) {
      case 'create': {
        const preset = body.template ? TEMPLATE_PRESETS[body.template] : null
        const buttons = body.buttons || preset?.buttons
        if (!buttons || buttons.length !== 6) {
          return NextResponse.json({ error: '需要 6 個按鈕' }, { status: 400 })
        }

        const resolvedButtons = await Promise.all(
          buttons.map(async b => {
            const raw = await resolveUrl(b.actionValue, tenantId)
            const actionValue = b.actionType === 'uri' ? withLineExternalBrowser(raw) : raw
            return { ...b, actionValue }
          })
        )

        const colW = Math.floor(2500 / 3)
        const rowH = Math.floor(1686 / 2)
        const menuDef = {
          size: { width: 2500, height: 1686 },
          selected: true,
          name: (body.menuName?.trim() || preset?.name || 'Custom Menu').slice(0, 120),
          chatBarText: body.chatBarText || preset?.chatBarText || '📋 打開選單',
          areas: resolvedButtons.map((btn, idx) => {
            const row = Math.floor(idx / 3)
            const col = idx % 3
            return {
              bounds: {
                x: col * colW,
                y: row * rowH,
                width: col === 2 ? 2500 - colW * 2 : colW,
                height: row === 1 ? 1686 - rowH : rowH,
              },
              action: btn.actionType === 'uri'
                ? { type: 'uri', label: btn.label, uri: btn.actionValue }
                : { type: 'message', label: btn.label, text: btn.actionValue },
            }
          }),
        }

        const createChannel: 'official' | 'insight' = body.channel === 'insight' ? 'insight' : 'official'
        const createToken = await getChannelAccessToken(tenantId, createChannel)
        if (!createToken) {
          return NextResponse.json(
            { error: createChannel === 'insight' ? '缺少 Insight Channel Access Token' : '缺少 Official Channel Access Token' },
            { status: 500 },
          )
        }

        const createRes = await fetch(`${LINE_API}/richmenu`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${createToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(menuDef),
          signal: AbortSignal.timeout(15000),
        })
        if (!createRes.ok) {
          const err = await createRes.text()
          return NextResponse.json({ error: `建立失敗: ${err}` }, { status: createRes.status })
        }
        const { richMenuId: newId } = await createRes.json() as { richMenuId: string }

        const imgBuf = await generateMenuImage(resolvedButtons, 2500, 1686, body.backgroundImage)
        // fetch BodyInit 不接受 Node Buffer（Zeabur/TS 嚴格編譯會報錯）
        const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${newId}/content`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${createToken}`, 'Content-Type': 'image/png' },
          body: new Uint8Array(imgBuf),
          signal: AbortSignal.timeout(30000),
        })
        if (!uploadRes.ok) {
          return NextResponse.json({ error: '圖片上傳失敗', richMenuId: newId }, { status: 500 })
        }

        // Set as default
        await fetch(`${LINE_API}/user/all/richmenu/${newId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${createToken}` },
          signal: AbortSignal.timeout(10000),
        })

        return NextResponse.json({ ok: true, richMenuId: newId })
      }

      case 'set-default': {
        if (!body.richMenuId) return NextResponse.json({ error: '缺少 richMenuId' }, { status: 400 })
        const res = await fetch(`${LINE_API}/user/all/richmenu/${body.richMenuId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) {
          const err = await res.text()
          return NextResponse.json({ error: err }, { status: res.status })
        }
        return NextResponse.json({ ok: true })
      }

      case 'unset-default': {
        const res = await fetch(`${LINE_API}/user/all/richmenu`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) {
          const err = await res.text()
          return NextResponse.json({ error: err }, { status: res.status })
        }
        return NextResponse.json({ ok: true })
      }

      case 'delete': {
        if (!body.richMenuId) return NextResponse.json({ error: '缺少 richMenuId' }, { status: 400 })
        const res = await fetch(`${LINE_API}/richmenu/${body.richMenuId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) {
          const err = await res.text()
          return NextResponse.json({ error: err }, { status: res.status })
        }
        return NextResponse.json({ ok: true })
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 })
    }
  } catch (err) {
    console.error('[rich-menu] POST error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
