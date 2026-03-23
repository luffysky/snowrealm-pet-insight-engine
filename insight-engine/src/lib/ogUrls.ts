/**
 * 分享預覽（Open Graph / Twitter）爬蟲需要絕對網址的圖片。
 * R2 上傳回傳的已是 https；若手動填相對路徑則併入站台根網址。
 */
export function toAbsoluteOgImageUrl(
  raw: string | null | undefined,
  siteBase: string,
): string | undefined {
  const s = raw?.trim()
  if (!s) return undefined
  if (/^https?:\/\//i.test(s)) return s
  const base = siteBase.replace(/\/$/, '')
  const path = s.startsWith('/') ? s : `/${s}`
  try {
    return new URL(path, `${base}/`).href
  } catch {
    return s
  }
}
