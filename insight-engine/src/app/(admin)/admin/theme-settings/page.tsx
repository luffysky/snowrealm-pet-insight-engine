'use client'

import { useEffect, useState } from 'react'
import {
  shellClass,
  cardClass,
  progressTrackClass,
  progressBarClass,
  questionTitleClass,
  textareaClass,
  optionClass,
  checkboxClass,
  actionBtnClass,
  ctaBtnClass,
  stepTextClass,
} from '@/lib/themes'

type SurveyTheme = 'default' | 'game' | 'cyber' | 'ancient' | 'sakura' | 'ocean' | 'forest' | 'candy' | 'noir'
type Intensity = 1 | 2 | 3

interface ThemeSettings {
  surveySlug: string
  defaultTheme: SurveyTheme
  availableThemes: SurveyTheme[]
  allowUserChoice: boolean
  themeIntensity: Record<SurveyTheme, Intensity>
}

const THEME_INFO: { key: SurveyTheme; label: string; icon: string; desc: string }[] = [
  { key: 'default', label: '深空紫', icon: '🌌', desc: '沉穩優雅深色風格，適合正式問卷' },
  { key: 'game', label: '遊戲冒險', icon: '🎮', desc: 'RPG 冒險感 — XP 條、成就解鎖、卡牌翻轉' },
  { key: 'cyber', label: '未來科技', icon: '🔮', desc: '液態玻璃 — 霓虹光暈、水波邊框、掃描線' },
  { key: 'ancient', label: '古風水墨', icon: '🏯', desc: '水墨山水 — 宣紙質感、印章點綴、古典韻味' },
  { key: 'sakura', label: '櫻花夢境', icon: '🌸', desc: '粉色櫻花 — 柔和漸層、花瓣飄落、夢幻浪漫' },
  { key: 'ocean', label: '深海探索', icon: '🌊', desc: '深藍海洋 — 生物螢光、氣泡上浮、水波紋理' },
  { key: 'forest', label: '森林秘境', icon: '🌿', desc: '翠綠森林 — 螢火蟲光點、苔蘚質感、大地色調' },
  { key: 'candy', label: '糖果派對', icon: '🍬', desc: '繽紛粉彩 — 活潑圓潤、彈跳動效、歡樂氛圍' },
  { key: 'noir', label: '暗黑極簡', icon: '🖤', desc: '黑白對比 — 極簡俐落、打字機風格、高級質感' },
]

const INTENSITY_LABELS: Record<Intensity, { label: string; desc: string }> = {
  1: { label: '輕量', desc: '基本配色，幾乎無動效' },
  2: { label: '標準', desc: '基礎動畫 + 裝飾元素' },
  3: { label: '華麗', desc: '全部動效 + 成就 + 粒子特效' },
}

const SLUG = 'maoxingtianxia-mvp-survey'

export default function ThemeSettingsPage() {
  const [settings, setSettings] = useState<ThemeSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    fetch(`/api/admin/theme-settings?slug=${SLUG}`)
      .then(r => r.json())
      .then((data: ThemeSettings) => setSettings(data))
      .catch(() => setMessage({ type: 'err', text: '載入失敗' }))
  }, [])

  if (!settings) {
    return <div className="text-white/50 py-12 text-center">載入中...</div>
  }

  const toggleTheme = (key: SurveyTheme) => {
    const next = settings.availableThemes.includes(key)
      ? settings.availableThemes.filter(t => t !== key)
      : [...settings.availableThemes, key]
    // 至少保留一個
    if (next.length === 0) return
    // 如果移除了當前預設，改用第一個可用的
    const defaultTheme = next.includes(settings.defaultTheme) ? settings.defaultTheme : next[0]
    setSettings({ ...settings, availableThemes: next, defaultTheme })
  }

  const setIntensity = (key: SurveyTheme, level: Intensity) => {
    setSettings({
      ...settings,
      themeIntensity: { ...settings.themeIntensity, [key]: level },
    })
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/theme-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, surveySlug: SLUG }),
      })
      if (!res.ok) throw new Error('Save failed')
      setMessage({ type: 'ok', text: '已儲存' })
    } catch {
      setMessage({ type: 'err', text: '儲存失敗' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white/95">🎨 問卷主題設定</h1>
        <p className="text-sm text-white/50 mt-1">管理問卷可用風格、預設主題與裝飾強度</p>
      </div>

      {/* 允許使用者自選 */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.allowUserChoice}
            onChange={e => setSettings({ ...settings, allowUserChoice: e.target.checked })}
            className="w-5 h-5 rounded accent-cyan-400"
          />
          <div>
            <p className="text-white/90 font-medium">允許使用者自選主題</p>
            <p className="text-sm text-white/40">開啟後，問卷封面會顯示風格選擇器</p>
          </div>
        </label>
      </div>

      {/* 主題卡片 */}
      <div className="grid gap-4">
        {THEME_INFO.map(t => {
          const isAvailable = settings.availableThemes.includes(t.key)
          const isDefault = settings.defaultTheme === t.key
          const intensity = settings.themeIntensity[t.key] ?? 2

          return (
            <div
              key={t.key}
              className={`border rounded-2xl p-6 transition-all ${
                isAvailable
                  ? 'bg-white/5 border-white/15'
                  : 'bg-white/2 border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{t.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white/90">{t.label}</h3>
                      {isDefault && (
                        <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">
                          預設
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/40">{t.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* 設為預設按鈕 */}
                  {isAvailable && !isDefault && (
                    <button
                      onClick={() => setSettings({ ...settings, defaultTheme: t.key })}
                      className="text-xs px-3 py-1.5 border border-white/10 rounded-lg text-white/50 hover:text-cyan-400 hover:border-cyan-400/30 transition-colors cursor-pointer"
                    >
                      設為預設
                    </button>
                  )}
                  {/* 啟用/停用 */}
                  <button
                    onClick={() => toggleTheme(t.key)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      isAvailable
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                        : 'bg-white/5 text-white/40 border border-white/10'
                    }`}
                  >
                    {isAvailable ? '已啟用' : '已停用'}
                  </button>
                </div>
              </div>

              {/* 裝飾強度 */}
              {isAvailable && (
                <div className="border-t border-white/5 pt-4 mt-2">
                  <p className="text-sm text-white/50 mb-3">裝飾強度</p>
                  <div className="flex gap-3">
                    {([1, 2, 3] as Intensity[]).map(level => {
                      const info = INTENSITY_LABELS[level]
                      const isActive = intensity === level
                      return (
                        <button
                          key={level}
                          onClick={() => setIntensity(t.key, level)}
                          className={`flex-1 px-4 py-3 rounded-xl border text-center transition-all cursor-pointer ${
                            isActive
                              ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300'
                              : 'bg-white/3 border-white/8 text-white/40 hover:border-white/15'
                          }`}
                        >
                          <div className="text-sm font-medium">
                            {'✦'.repeat(level)}
                          </div>
                          <div className="text-xs mt-1 font-medium">{info.label}</div>
                          <div className="text-xs mt-0.5 opacity-60">{info.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 儲存按鈕 */}
      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 rounded-xl hover:bg-cyan-500/30 disabled:opacity-40 transition-colors cursor-pointer"
        >
          {saving ? '儲存中...' : '儲存設定'}
        </button>
        {message && (
          <span className={`text-sm ${message.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
            {message.text}
          </span>
        )}
      </div>

      {/* 預覽說明 */}
      <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-medium text-white/60 mb-3">裝飾強度說明</h3>
        <div className="space-y-3 text-sm text-white/40">
          <div>
            <span className="text-white/70 font-medium">🎮 遊戲冒險</span>
            <ul className="mt-1 ml-4 space-y-0.5 list-disc">
              <li>✦ 輕量：金色配色 + 基本卡片樣式</li>
              <li>✦✦ 標準：+ XP 進度條、冒險地圖節點</li>
              <li>✦✦✦ 華麗：+ 成就彈窗、confetti、打字機敘事、卡牌翻轉動效</li>
            </ul>
          </div>
          <div>
            <span className="text-white/70 font-medium">🔮 未來科技</span>
            <ul className="mt-1 ml-4 space-y-0.5 list-disc">
              <li>✦ 輕量：液態玻璃配色 + 基本毛玻璃效果</li>
              <li>✦✦ 標準：+ 流動光暈邊框、霓虹脈衝</li>
              <li>✦✦✦ 華麗：+ 掃描線、glitch 標題、粒子網格背景</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
