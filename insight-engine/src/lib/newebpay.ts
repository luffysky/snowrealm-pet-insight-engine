import { createCipheriv, createDecipheriv, createHash } from 'crypto'

const MERCHANT_ID = process.env.MIG_MERCHANT_ID || ''
const HASH_KEY = process.env.MIG_HASH_KEY || ''
const HASH_IV = process.env.MIG_HASH_IV || ''
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://insight.snowrealm.pet'

const NEWEBPAY_API = 'https://core.newebpay.com/MPG/mpg_gateway'

export interface PaymentRequest {
  tenantId: string
  plan: string
  period: 'monthly' | 'yearly'
  amount: number
  email: string
  description: string
}

export interface TradeInfo {
  MerchantID: string
  RespondType: string
  TimeStamp: string
  Version: string
  MerchantOrderNo: string
  Amt: number
  ItemDesc: string
  Email: string
  ReturnURL: string
  NotifyURL: string
  ClientBackURL: string
  CREDIT: number
}

function aesEncrypt(data: string): string {
  const cipher = createCipheriv('aes-256-cbc', HASH_KEY, HASH_IV)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex').toUpperCase()
}

export function aesDecrypt(encrypted: string): string {
  const decipher = createDecipheriv('aes-256-cbc', HASH_KEY, HASH_IV)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export function generateOrderNo(tenantId: string): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  const tag = tenantId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'XX'
  return `SR${tag}${ts}${rand}`.substring(0, 20)
}

export function createPaymentData(req: PaymentRequest) {
  const orderNo = generateOrderNo(req.tenantId)

  const tradeInfo: TradeInfo = {
    MerchantID: MERCHANT_ID,
    RespondType: 'JSON',
    TimeStamp: Math.floor(Date.now() / 1000).toString(),
    Version: '2.0',
    MerchantOrderNo: orderNo,
    Amt: req.amount,
    ItemDesc: req.description,
    Email: req.email,
    ReturnURL: `${BASE_URL}/api/payment/return`,
    NotifyURL: `${BASE_URL}/api/payment/notify`,
    ClientBackURL: `${BASE_URL}/insight-admin/subscription`,
    CREDIT: 1,
  }

  const tradeInfoStr = Object.entries(tradeInfo)
    .map(([key, val]) => `${key}=${val}`)
    .join('&')

  const encryptedTradeInfo = aesEncrypt(tradeInfoStr)
  const tradeSha = sha256(`HashKey=${HASH_KEY}&${encryptedTradeInfo}&HashIV=${HASH_IV}`)

  return {
    MerchantID: MERCHANT_ID,
    TradeInfo: encryptedTradeInfo,
    TradeSha: tradeSha,
    Version: '2.0',
    orderNo,
    paymentUrl: NEWEBPAY_API,
  }
}

export interface NotifyResult {
  Status: string
  Message: string
  Result: {
    MerchantID: string
    Amt: number
    TradeNo: string
    MerchantOrderNo: string
    PaymentType: string
    RespondCode: string
    IP: string
    EscrowBank: string
    PayTime: string
    [key: string]: unknown
  }
}

export function verifyAndDecryptNotify(tradeInfo: string, tradeSha: string): NotifyResult | null {
  const expectedSha = sha256(`HashKey=${HASH_KEY}&${tradeInfo}&HashIV=${HASH_IV}`)
  if (expectedSha !== tradeSha) {
    console.error('[newebpay] TradeSha mismatch')
    return null
  }

  try {
    const decrypted = aesDecrypt(tradeInfo)
    return JSON.parse(decrypted) as NotifyResult
  } catch (err) {
    console.error('[newebpay] Decrypt failed:', err)
    return null
  }
}
