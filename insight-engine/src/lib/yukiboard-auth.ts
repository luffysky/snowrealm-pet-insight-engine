import { verifyToken } from '@/lib/jwt'
import { queryOne } from '@/lib/db'

/**
 * 驗證 YukiBoard 請求的身份。
 * 接受兩種方式：
 * 1. Bearer token（已登入用戶）
 * 2. invite_code + device_id（邀請碼用戶）
 */
export async function verifyYukiBoardAuth(req: Request): Promise<{
  userId: string | null
  isLoggedIn: boolean
} | null> {
  const platformKey = req.headers.get('X-Platform-Key')
  if (platformKey !== process.env.PLATFORM_API_KEY) return null

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token) {
    const payload = await verifyToken(token)
    if (payload?.sub) return { userId: payload.sub, isLoggedIn: true }
  }

  return null
}

/**
 * 要求已登入（回傳 userId 或 null）
 */
export async function requireYukiBoardAuth(req: Request): Promise<string | null> {
  const result = await verifyYukiBoardAuth(req)
  return result?.userId ?? null
}
