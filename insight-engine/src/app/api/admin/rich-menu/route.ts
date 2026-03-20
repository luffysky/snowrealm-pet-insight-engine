import { NextRequest, NextResponse } from 'next/server'

const TOKEN = () => process.env.LINE_OFFICIAL_CHANNEL_ACCESS_TOKEN ?? ''

const LINE_API = 'https://api.line.me/v2/bot'

interface RichMenuItem {
  richMenuId: string
  name: string
  chatBarText: string
  selected: boolean
  size: { width: number; height: number }
  areas: { bounds: Record<string, number>; action: Record<string, string> }[]
  [key: string]: unknown
}

/**
 * GET /api/admin/rich-menu
 * 列出所有 Rich Menu + 目前預設
 */
export async function GET(): Promise<NextResponse> {
  const token = TOKEN()
  if (!token) return NextResponse.json({ error: 'Missing LINE token' }, { status: 500 })

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

    return NextResponse.json({ menus, defaultId })
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
  const token = TOKEN()
  if (!token) return NextResponse.json({ error: 'Missing LINE token' }, { status: 500 })

  const body = await request.json() as { action: string; richMenuId?: string }

  try {
    switch (body.action) {
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
