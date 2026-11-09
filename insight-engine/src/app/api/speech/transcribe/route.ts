import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { checkRateLimit } from '@/lib/rateLimit'
import { queryOne } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

const SAMPLE_BYTES_PER_SECOND = 32_000 // 16 kHz、16-bit、單聲道
const MAX_SECONDS = 60 // Azure 短音訊 REST API 的上限
const MAX_BYTES = MAX_SECONDS * SAMPLE_BYTES_PER_SECOND + 44
const DAILY_SECONDS_PER_USER = 600

const LANGUAGES: Record<string, string> = {
  zh: 'zh-TW',
  'zh-tw': 'zh-TW',
  'zh-cn': 'zh-CN',
  en: 'en-US',
  'en-us': 'en-US',
  ja: 'ja-JP',
  'ja-jp': 'ja-JP',
  ko: 'ko-KR',
  'ko-kr': 'ko-KR',
}

async function getUserId(req: NextRequest): Promise<string | null> {
  const header = req.headers.get('authorization')
  const token = header?.startsWith('Bearer ')
    ? header.slice(7)
    : (await cookies()).get('admin_session')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  return payload?.sub ?? null
}

/**
 * POST /api/speech/transcribe?language=zh-TW
 *
 * YukiBoard 的語音辨識代理：App 送 16 kHz 單聲道 WAV，伺服器帶金鑰呼叫 Azure。
 * Azure 金鑰不能打包進 APK，所以一定要經過這裡。
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const key = process.env.AZURE_SPEECH_KEY?.trim()
  const region = process.env.AZURE_SPEECH_REGION?.trim().toLowerCase()
  if (!key || !region) {
    return NextResponse.json({ error: '語音服務尚未設定' }, { status: 503 })
  }

  if (!checkRateLimit(`stt:${userId}`, 30, 60_000).allowed) {
    return NextResponse.json({ error: '語音辨識太頻繁，請稍後再試' }, { status: 429 })
  }

  if (Number(req.headers.get('content-length') ?? 0) > MAX_BYTES) {
    return NextResponse.json({ error: '語音太長，單次上限 60 秒' }, { status: 413 })
  }
  const audio = Buffer.from(await req.arrayBuffer())
  if (audio.length > MAX_BYTES) {
    return NextResponse.json({ error: '語音太長，單次上限 60 秒' }, { status: 413 })
  }
  if (
    audio.length <= 44 ||
    audio.toString('ascii', 0, 4) !== 'RIFF' ||
    audio.toString('ascii', 8, 12) !== 'WAVE'
  ) {
    return NextResponse.json({ error: '音訊格式不正確' }, { status: 400 })
  }

  const seconds = Math.ceil((audio.length - 44) / SAMPLE_BYTES_PER_SECOND)
  // 原子累加：超過每日額度時不會更新，也就不會回傳列
  const usage = await queryOne(
    `INSERT INTO speech_usage (user_id, day, seconds)
     VALUES ($1, CURRENT_DATE, $2)
     ON CONFLICT (user_id, day) DO UPDATE SET seconds = speech_usage.seconds + EXCLUDED.seconds
     WHERE speech_usage.seconds + EXCLUDED.seconds <= $3
     RETURNING seconds`,
    [userId, seconds, DAILY_SECONDS_PER_USER],
  )
  if (!usage) {
    return NextResponse.json({ error: '今天的語音額度已用完' }, { status: 429 })
  }

  const requested = (req.nextUrl.searchParams.get('language') ?? '').toLowerCase()
  const language = LANGUAGES[requested] ?? 'zh-TW'

  try {
    const response = await fetch(
      `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language}&format=simple`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
          Accept: 'application/json',
        },
        body: audio,
        signal: AbortSignal.timeout(40_000),
      },
    )
    if (response.status === 429) {
      return NextResponse.json({ error: '語音服務本月額度已滿或忙碌中' }, { status: 429 })
    }
    if (!response.ok) {
      console.error('[speech] Azure 回應錯誤', response.status)
      return NextResponse.json({ error: '語音辨識失敗' }, { status: 502 })
    }
    const result = (await response.json()) as { RecognitionStatus?: string; DisplayText?: string }
    const text = result.RecognitionStatus === 'Success' ? (result.DisplayText ?? '') : ''
    return NextResponse.json({ text, status: result.RecognitionStatus ?? 'Unknown' })
  } catch (err) {
    console.error('[speech] 呼叫 Azure 失敗', err)
    return NextResponse.json({ error: '語音辨識失敗' }, { status: 502 })
  }
}
