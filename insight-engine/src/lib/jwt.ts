/**
 * Lightweight JWT (HS256) — 使用 Web Crypto API
 * 同時支援 Edge Runtime (middleware) 和 Node.js (API routes)
 */
const ALGORITHM: HmacImportParams = { name: 'HMAC', hash: 'SHA-256' }
async function getSigningKey(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_SECRET ?? process.env.JWT_SECRET ?? process.env.NEXT_PUBLIC_JWT_SECRET
  if (!secret) throw new Error('Missing ADMIN_SECRET or JWT_SECRET')
  const keyData = new TextEncoder().encode(secret)
  return crypto.subtle.importKey('raw', keyData, ALGORITHM, false, ['sign', 'verify'])
}

function base64urlEncode(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4)
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export interface TokenPayload {
  sub: string   // admin_user.id
  name: string  // display_name
  tenants?: { tid: string; role: string }[] // 多租戶權限名單
  tid?: string   // 舊版相容 tenant slug
  role?: string  // 舊版相容 super_admin | admin | editor | viewer
  exp: number   // expiry (unix seconds)
}

export async function signToken(
  payload: Omit<TokenPayload, 'exp'>,
  expiresInSeconds = 86400,
): Promise<string> {
  const full: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  }
  const payloadBytes = new TextEncoder().encode(JSON.stringify(full))
  const payloadB64 = base64urlEncode(payloadBytes)
  const key = await getSigningKey()
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64))
  return `${payloadB64}.${base64urlEncode(new Uint8Array(sig))}`
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const dot = token.indexOf('.')
    if (dot < 0) return null
    const payloadB64 = token.slice(0, dot)
    const sigB64 = token.slice(dot + 1)
    const key = await getSigningKey()
    const sigBytes = new Uint8Array(sig)
    const valid = await crypto.subtle.verify(
      'HMAC', key, sigBytes, new TextEncoder().encode(payloadB64),
    )
    console.log('[MW VERIFY]', { valid, payloadLen: payloadB64.length, sigLen: sigB64.length })
    if (!valid) return null
    const payload: TokenPayload = JSON.parse(
      new TextDecoder().decode(base64urlDecode(payloadB64)),
    )
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch (err) {
    console.log('[MW VERIFY ERROR]', err)
    return null
  }
}
