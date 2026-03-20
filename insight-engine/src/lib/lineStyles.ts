import { query } from './db'

interface NotificationStyle {
  [key: string]: unknown
  id: string
  label: string
  header_color: string
  header_emoji: string
  header_text: string
  footer_label: string
  footer_url: string
  footer_color: string
  is_active: boolean
}

type LineMessage = { type: string; [key: string]: unknown }

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? ''

/** 取得指定通知樣式設定（快取 5 分鐘） */
let styleCache: { data: NotificationStyle[]; ts: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

async function getStyles(): Promise<NotificationStyle[]> {
  const now = Date.now()
  if (styleCache && now - styleCache.ts < CACHE_TTL) return styleCache.data
  try {
    const rows = await query<NotificationStyle>(
      `SELECT * FROM line_notification_styles WHERE is_active = true`
    )
    styleCache = { data: rows, ts: now }
    return rows
  } catch {
    return styleCache?.data ?? []
  }
}

export async function getStyle(id: string): Promise<NotificationStyle | null> {
  const styles = await getStyles()
  return styles.find((s) => s.id === id) ?? null
}

/** 清除快取（樣式更新後呼叫） */
export function invalidateStyleCache(): void {
  styleCache = null
}

/**
 * 根據 DB 樣式設定產出 Flex Message bubble
 */
export function buildFlexBubble(opts: {
  style: NotificationStyle
  bodyRows: { label: string; value: string }[]
  footerUrl?: string
  altText?: string
  /** 覆蓋 header 文字 */
  headerOverride?: string
}): LineMessage {
  const { style, bodyRows, footerUrl, altText, headerOverride } = opts
  const headerText = headerOverride ?? `${style.header_emoji} ${style.header_text}`
  const resolvedUrl = (footerUrl ?? style.footer_url)
    .replace(/\{\{[^}]*\}\}/g, '')

  const bubble: Record<string, unknown> = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: style.header_color,
      paddingAll: '16px',
      contents: [
        {
          type: 'text',
          text: headerText,
          color: '#ffffff',
          weight: 'bold',
          size: 'lg',
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: bodyRows.map((row) => ({
        type: 'box',
        layout: 'horizontal',
        contents: [
          { type: 'text', text: row.label, color: '#8b8b8b', size: 'sm', flex: 2 },
          { type: 'text', text: row.value, color: '#333333', size: 'sm', flex: 5, wrap: true },
        ],
      })),
    },
  }

  // Footer with button (only if footer_label is set)
  if (style.footer_label && resolvedUrl) {
    const fullUrl = resolvedUrl.startsWith('http') ? resolvedUrl : `${BASE_URL}${resolvedUrl}`
    bubble.footer = {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: { type: 'uri', label: style.footer_label, uri: fullUrl },
          style: 'primary',
          color: style.footer_color,
        },
      ],
    }
  }

  return {
    type: 'flex',
    altText: altText ?? headerText,
    contents: bubble,
  }
}
