/** Vercel 函式請求上限 4.5 MB，留點 multipart 空間，超過就直傳 R2。 */
const API_BODY_LIMIT = 4 * 1024 * 1024

const PRESIGN: Record<string, { route: string; kind: string }> = {
  '/api/upload/media': { route: '/api/upload/presign', kind: 'media' },
  '/api/upload/audio': { route: '/api/upload/presign', kind: 'audio' },
  '/api/upload/video': { route: '/api/upload/presign', kind: 'video' },
  '/api/admin/upload': { route: '/api/admin/upload-presign', kind: 'image' },
  '/api/admin/social/messages/upload': { route: '/api/admin/upload-presign', kind: 'dm' },
  '/api/super-admin/upload': { route: '/api/super-admin/upload-presign', kind: 'image' },
}

function dmMediaType(type: string): string {
  if (type.startsWith('image/')) return 'img'
  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('audio/')) return 'audio'
  return 'file'
}

/**
 * 取代 fetch(endpoint, { method: 'POST', body: fd })。
 * 小檔照舊走 API，大檔直傳 R2；回傳的 JSON 與原 API 相同（url / videoUrl / error）。
 */
export async function postUpload(endpoint: string, fd: FormData): Promise<Response> {
  const file = fd.get('file')
  const target = PRESIGN[endpoint]
  if (!(file instanceof File) || file.size <= API_BODY_LIMIT || !target) {
    return fetch(endpoint, { method: 'POST', body: fd })
  }

  const contentType = file.type.split(';')[0] || 'application/octet-stream'
  const folder = String(fd.get('folder') ?? '')
  const presign = await fetch(target.route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: target.kind, filename: file.name, contentType, size: file.size, folder }),
  })
  const signed = await presign.json().catch(() => ({}))
  if (!presign.ok) return Response.json(signed, { status: presign.status })

  const put = await fetch(signed.uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file })
  if (!put.ok) return Response.json({ error: '檔案上傳失敗，請稍後再試' }, { status: 502 })

  if (target.kind === 'video') {
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: signed.key, contentType }),
    })
  }
  if (endpoint === '/api/admin/upload') {
    await fetch(target.route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', url: signed.publicUrl, filename: file.name, contentType, size: file.size, folder }),
    }).catch(() => {})
  }
  return Response.json({
    success: true,
    url: signed.publicUrl,
    filename: file.name,
    mediaType: dmMediaType(contentType),
  })
}
