import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

/** 從 ADMIN_SECRET 取前 32 bytes 作為 AES-256 key */
function getEncryptionKey(): Buffer {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error('Missing ADMIN_SECRET for encryption')
  // SHA-256 of ADMIN_SECRET = exactly 32 bytes
  return Buffer.from(secret, 'hex').subarray(0, 32)
}

export interface EncryptedPayload {
  encrypted: string // hex
  iv: string        // hex
  tag: string       // hex
}

/** AES-256-GCM 加密 API Key */
export function encryptApiKey(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  }
}

/** AES-256-GCM 解密 API Key */
export function decryptApiKey(payload: EncryptedPayload): string {
  const key = getEncryptionKey()
  const iv = Buffer.from(payload.iv, 'hex')
  const tag = Buffer.from(payload.tag, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(payload.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/** 遮罩 API Key，只顯示前 8 + 後 4 字元 */
export function maskApiKey(key: string): string {
  if (key.length <= 12) return '****'
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`
}
