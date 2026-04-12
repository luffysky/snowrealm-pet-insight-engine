import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'

/**
 * POST /api/auth/supabase-token
 *
 * 為 YukiBoard App 簽發一個 YukiBoard Supabase 能認的標準 JWT。
 *
 * 流程：
 * 1. 驗證 Insight JWT（cookie 或 Authorization header）
 * 2. 取出 userId / displayName
 * 3. 用 YUKIBOARD_SUPABASE_JWT_SECRET 簽一個標準 3 段 HS256 JWT
 * 4. 回傳給 App，App 拿它打 YukiBoard Supabase（RLS 能認）
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 取得 Insight JWT ──
  let token: string | undefined

  // 優先從 Authorization header 取（App 端用這個）
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  }

  // fallback: cookie（Web 端用這個）
  if (!token) {
    const cookieStore = await cookies()
    token = cookieStore.get('admin_session')?.value
  }

  if (!token) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }

  // ── 驗證 Insight JWT ──
  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Token 無效或已過期' }, { status: 401 })
  }

  // ── 簽發 YukiBoard Supabase JWT ──
  const secret = process.env.YUKIBOARD_SUPABASE_JWT_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'Server 未設定 YUKIBOARD_SUPABASE_JWT_SECRET' },
      { status: 500 },
    )
  }

  const now = Math.floor(Date.now() / 1000)
  const supabasePayload = {
    // Supabase RLS 用的欄位
    userId: payload.sub,
    role: 'authenticated',
    // 額外資訊（方便 debug）
    displayName: payload.name,
    iss: 'insight-engine',
    iat: now,
    exp: now + 3600, // 1 小時有效
  }

  const supabaseJwt = await signSupabaseJwt(supabasePayload, secret)

  return NextResponse.json({
    token: supabaseJwt,
    expiresIn: 3600,
    userId: payload.sub,
  })
}

// ── 標準 3 段 HS256 JWT（Supabase PostgREST 格式）──

async function signSupabaseJwt(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }

  const headerB64 = b64url(new TextEncoder().encode(JSON.stringify(header)))
  const payloadB64 = b64url(new TextEncoder().encode(JSON.stringify(payload)))
  const signingInput = `${headerB64}.${payloadB64}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signingInput),
  )

  return `${signingInput}.${b64url(new Uint8Array(sig))}`
}

function b64url(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
