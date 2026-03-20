import crypto from 'crypto'

const SECRET = process.env.ADMIN_SECRET ?? ''
const TOKEN_EXPIRY_MS = 30 * 60 * 1000 // 30 分鐘

/**
 * 產生帶簽名的 LINE 身份 token
 * 格式: base64url(userId:expiresAt:signature)
 */
export function createLineToken(userId: string): string {
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS
  const payload = `${userId}:${expiresAt}`
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 16)
  const raw = `${payload}:${sig}`
  return Buffer.from(raw).toString('base64url')
}

/**
 * 驗證並解碼 LINE token
 * 回傳 userId 或 null（過期/偽造）
 */
export function verifyLineToken(token: string): string | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString()
    const parts = raw.split(':')
    if (parts.length !== 3) return null

    const [userId, expiresAtStr, sig] = parts
    const expiresAt = parseInt(expiresAtStr, 10)

    // 過期檢查
    if (isNaN(expiresAt) || Date.now() > expiresAt) return null

    // 簽名驗證
    const payload = `${userId}:${expiresAtStr}`
    const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 16)

    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null

    return userId
  } catch {
    return null
  }
}
