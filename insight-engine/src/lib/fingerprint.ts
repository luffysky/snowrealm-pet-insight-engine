/** 瀏覽器端指紋產生（非精確，用於 soft dedup） */
export async function generateFingerprint(): Promise<string> {
  const parts = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency?.toString() ?? '',
  ]

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 50
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(80, 0, 60, 20)
      ctx.fillStyle = '#069'
      ctx.fillText('fp_test', 2, 15)
      parts.push(canvas.toDataURL())
    }
  } catch {
    // canvas blocked
  }

  const data = new TextEncoder().encode(parts.join('|'))
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
