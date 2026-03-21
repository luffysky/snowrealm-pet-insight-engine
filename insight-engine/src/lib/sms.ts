import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

/**
 * AWS SNS SMS 發送模組
 *
 * 環境變數：
 * - AWS_SNS_ACCESS_KEY_ID
 * - AWS_SNS_SECRET_ACCESS_KEY
 * - AWS_SNS_REGION（預設 ap-northeast-1）
 */

let _snsClient: SNSClient | null = null

function getSNSClient(): SNSClient {
  if (!_snsClient) {
    const region = process.env.AWS_SNS_REGION || 'ap-northeast-1'
    const accessKeyId = process.env.AWS_SNS_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SNS_SECRET_ACCESS_KEY

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('Missing AWS_SNS_ACCESS_KEY_ID or AWS_SNS_SECRET_ACCESS_KEY')
    }

    _snsClient = new SNSClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    })
  }
  return _snsClient
}

/** 格式化手機號碼為 E.164 格式 */
export function formatPhoneE164(phone: string, defaultCountryCode = '+886'): string {
  // 移除空格、破折號
  let cleaned = phone.replace(/[\s\-()]/g, '')

  // 如果已經有 + 開頭，直接回傳
  if (cleaned.startsWith('+')) return cleaned

  // 台灣號碼：09xxxxxxxx → +886 9xxxxxxxx
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1)
  }

  return `${defaultCountryCode}${cleaned}`
}

/** 驗證手機號碼格式 */
export function isValidPhone(phone: string): boolean {
  const e164 = formatPhoneE164(phone)
  // E.164：+ 加上 7~15 位數字
  return /^\+[1-9]\d{6,14}$/.test(e164)
}

interface SendSmsResult {
  success: boolean
  messageId?: string
  error?: string
}

/** 發送 SMS 簡訊 */
export async function sendSms(phone: string, message: string): Promise<SendSmsResult> {
  const phoneNumber = formatPhoneE164(phone)

  try {
    const client = getSNSClient()
    const result = await client.send(
      new PublishCommand({
        PhoneNumber: phoneNumber,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional', // 交易型，送達率高
          },
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: 'SnowRealm',
          },
        },
      })
    )

    return { success: true, messageId: result.MessageId }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('[SMS Error]', errorMessage)

    // 開發環境不中斷流程
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SMS DEV] 模擬發送至 ${phoneNumber}: ${message}`)
      return { success: true, messageId: 'dev-mock' }
    }

    return { success: false, error: errorMessage }
  }
}

/** 發送驗證碼簡訊 */
export async function sendVerificationSms(phone: string, code: string): Promise<SendSmsResult> {
  const message = `【SnowRealm】您的驗證碼是 ${code}，10 分鐘內有效。請勿將驗證碼告知他人。`
  return sendSms(phone, message)
}
