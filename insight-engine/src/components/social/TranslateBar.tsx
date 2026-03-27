'use client'

import { useState, useRef, useEffect } from 'react'
import { Languages, ChevronDown, Loader2 } from 'lucide-react'
import { useTranslate, TRANSLATE_LANGS } from '@/hooks/useTranslate'

interface TranslateBarProps {
  text: string
}

export function TranslateBar({ text }: TranslateBarProps) {
  const { translating, translated, targetLang, sourceLang, showTranslation, error, toggle, changeLang, setTargetLang } = useTranslate()
  const [showLangPicker, setShowLangPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowLangPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentLangLabel = TRANSLATE_LANGS.find(l => l.code === targetLang)?.label ?? targetLang

  return (
    <div className="mt-2">
      {/* Translate button row */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => toggle(text)}
          disabled={translating}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/8 transition-colors disabled:opacity-50"
        >
          {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
          {showTranslation ? '顯示原文' : translating ? '翻譯中...' : '翻譯'}
        </button>

        {/* Language selector */}
        <div ref={pickerRef} className="relative">
          <button
            onClick={() => setShowLangPicker(s => !s)}
            className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/35 hover:text-white/60 hover:bg-white/8 transition-colors"
          >
            {currentLangLabel}
            <ChevronDown className={`w-3 h-3 transition-transform ${showLangPicker ? 'rotate-180' : ''}`} />
          </button>
          {showLangPicker && (
            <div className="absolute bottom-full left-0 mb-1 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50 py-1 min-w-[110px]">
              {TRANSLATE_LANGS.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setShowLangPicker(false)
                    setTargetLang(lang.code)
                    if (showTranslation || translated) {
                      changeLang(lang.code, text)
                    }
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                    targetLang === lang.code
                      ? 'text-amber-300 bg-amber-500/10'
                      : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {sourceLang && showTranslation && (
          <span className="text-[10px] text-white/20">自動偵測: {sourceLang}</span>
        )}
      </div>

      {/* Translated content */}
      {showTranslation && translated && (
        <div className="mt-2 p-3 bg-blue-500/5 border border-blue-400/15 rounded-xl text-sm text-white/60 leading-relaxed relative">
          <p className="text-[10px] text-blue-400/50 mb-1 font-medium">翻譯結果</p>
          <p className="whitespace-pre-wrap break-words">{translated}</p>
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-400/70">{error}</p>
      )}
    </div>
  )
}
