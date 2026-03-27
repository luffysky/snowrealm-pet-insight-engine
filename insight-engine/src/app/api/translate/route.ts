import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

export async function POST(req: NextRequest) {
  const body = await req.json() as { text?: string; targetLang?: string }
  const { text, targetLang = 'zh-TW' } = body

  if (!text?.trim()) {
    return NextResponse.json({ error: '缺少文字' }, { status: 400 })
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Google API Key 未設定' }, { status: 500 })
  }

  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        format: 'text',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[translate] Google API error:', err)
      return NextResponse.json({ error: '翻譯失敗' }, { status: 500 })
    }

    const data = await res.json() as {
      data: { translations: { translatedText: string; detectedSourceLanguage?: string }[] }
    }

    const translation = data.data.translations[0]
    return NextResponse.json({
      translated: translation.translatedText,
      sourceLang: translation.detectedSourceLanguage ?? 'auto',
    })
  } catch (err) {
    console.error('[translate] Error:', err)
    return NextResponse.json({ error: '翻譯服務暫時無法使用' }, { status: 500 })
  }
}
