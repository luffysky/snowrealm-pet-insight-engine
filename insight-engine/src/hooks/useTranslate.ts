import { useState, useCallback } from 'react'

const LANG_LABELS: Record<string, string> = {
  'zh-TW': '繁中',
  'zh-CN': '簡中',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
  'es': 'Español',
  'fr': 'Français',
}

export const TRANSLATE_LANGS = Object.entries(LANG_LABELS).map(([code, label]) => ({ code, label }))

export function useTranslate() {
  const [translating, setTranslating] = useState(false)
  const [translated, setTranslated] = useState<string | null>(null)
  const [targetLang, setTargetLang] = useState('en')
  const [sourceLang, setSourceLang] = useState<string | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const translate = useCallback(async (text: string, toLang: string) => {
    if (!text.trim()) return
    setTranslating(true)
    setError(null)
    try {
      // Strip HTML tags for translation
      const plainText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(toLang)}&dt=t&q=${encodeURIComponent(plainText)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('翻譯失敗')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await res.json() as any[]
      // Google Translate response: [[["translated", "original", null, null, 1],...], null, "detected-lang"]
      const translatedText = (data[0] as [string, string][]).map(([t]) => t).join('')
      const detected = data[2] as string
      setTranslated(translatedText)
      setSourceLang(detected)
      setShowTranslation(true)
    } catch {
      setError('翻譯失敗，請稍後再試')
    } finally {
      setTranslating(false)
    }
  }, [])

  const toggle = useCallback((text: string) => {
    if (showTranslation) {
      setShowTranslation(false)
    } else if (translated) {
      setShowTranslation(true)
    } else {
      translate(text, targetLang)
    }
  }, [showTranslation, translated, translate, targetLang])

  const changeLang = useCallback((lang: string, text: string) => {
    setTargetLang(lang)
    setTranslated(null)
    setShowTranslation(false)
    translate(text, lang)
  }, [translate])

  return { translating, translated, targetLang, sourceLang, showTranslation, error, toggle, changeLang, setTargetLang }
}
