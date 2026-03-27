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
      // Strip HTML tags for plain text
      const plainText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: plainText, targetLang: toLang }),
      })
      if (!res.ok) throw new Error('翻譯失敗')
      const data = await res.json() as { translated: string; sourceLang: string }
      setTranslated(data.translated)
      setSourceLang(data.sourceLang)
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
