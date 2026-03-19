import crypto from 'crypto'

const SCRYPT_KEYLEN = 64
const SCRYPT_COST = 16384
const SCRYPT_BLOCK = 8
const SCRYPT_PARALLEL = 1

/** 雜湊密碼（scrypt + random salt） */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      SCRYPT_KEYLEN,
      { N: SCRYPT_COST, r: SCRYPT_BLOCK, p: SCRYPT_PARALLEL },
      (err, derivedKey) => {
        if (err) reject(err)
        else resolve(`${salt}:${derivedKey.toString('hex')}`)
      },
    )
  })
}

/** 驗證密碼 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':')
  if (!salt || !key) return false
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      SCRYPT_KEYLEN,
      { N: SCRYPT_COST, r: SCRYPT_BLOCK, p: SCRYPT_PARALLEL },
      (err, derivedKey) => {
        if (err) reject(err)
        else resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey))
      },
    )
  })
}

/** 產生邀請 token */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
