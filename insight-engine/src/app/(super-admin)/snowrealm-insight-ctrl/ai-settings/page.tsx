'use client'

import { useState, useEffect } from 'react'
import { Save, RotateCcw, Bot, Crown, TestTube2, Check } from 'lucide-react'
import type { YukirinPromptSettings } from '@/app/api/super-admin/ai-prompt/route'

type Tab = 'user' | 'admin'

const DEFAULT_FORBIDDEN = [
  '我可以幫你',
  '根據分析',
  '首先...其次',
  '希望這對你有幫助',
  '非常感謝',
  '請問有什麼我可以',
]

export default function AiSettingsPage() {
  const [tab, setTab] = useState<Tab>('user')
  const [settings, setSettings] = useState<YukirinPromptSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [forbiddenText, setForbiddenText] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [testResult, setTestResult] = useState<{ text: string; mood: string } | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetch('/api/super-admin/ai-prompt')
      .then(r => r.ok ? r.json() : null)
      .then((d: YukirinPromptSettings | null) => {
        if (!d) return
        setSettings(d)
        setForbiddenText((d.forbiddenPhrases ?? DEFAULT_FORBIDDEN).join('\n'))
      })
      .catch(() => {})
  }, [])

  const update = (patch: Partial<YukirinPromptSettings>) => {
    setSettings(s => s ? { ...s, ...patch } : null)
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const payload: YukirinPromptSettings = {
        ...settings,
        forbiddenPhrases: forbiddenText.split('\n').map(s => s.trim()).filter(Boolean),
      }
      const res = await fetch('/api/super-admin/ai-prompt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!testMessage.trim() || testing) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/guide/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage, isAdminTest: tab === 'admin' }),
      })
      const data = await res.json() as { reply?: string; text?: string; mood?: string }
      setTestResult({
        text: data.reply ?? data.text ?? '（無回應）',
        mood: data.mood ?? 'neutral',
      })
    } catch {
      setTestResult({ text: '測試失敗，請確認 AI Key 已設定', mood: 'sad' })
    } finally {
      setTesting(false)
    }
  }

  const handleReset = () => {
    if (!confirm('確定要還原為預設值嗎？')) return
    fetch('/api/super-admin/ai-prompt')
      .then(r => r.json())
      .then((d: YukirinPromptSettings) => {
        setSettings(d)
        setForbiddenText((d.forbiddenPhrases ?? DEFAULT_FORBIDDEN).join('\n'))
      })
      .catch(() => {})
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            AI 指令控制台
          </h1>
          <p className="text-sm text-white/40 mt-0.5">控制雪凜對不同用戶群的行為與語氣</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            還原預設
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{ background: saved ? 'rgba(34,197,94,0.2)' : 'rgba(168,139,250,0.2)', color: saved ? '#4ade80' : '#c4b5fd' }}
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? '儲存中...' : saved ? '已儲存' : '儲存設定'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/8 w-fit">
        {([
          { key: 'user', label: '一般使用者', icon: Bot },
          { key: 'admin', label: '老闆（我）', icon: Crown },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all"
            style={tab === key
              ? { background: 'rgba(168,139,250,0.2)', color: '#c4b5fd' }
              : { color: 'rgba(255,255,255,0.4)' }
            }
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* User Tab */}
      {tab === 'user' && (
        <div className="space-y-4">
          {/* Base System Prompt */}
          <Section title="雪凜基礎人設" desc="所有使用者看到的核心人格設定">
            <textarea
              value={settings.basePrompt}
              onChange={e => update({ basePrompt: e.target.value })}
              rows={8}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 outline-none focus:border-purple-500/50 resize-none font-mono leading-relaxed"
            />
          </Section>

          {/* Forbidden phrases */}
          <Section title="禁止語句" desc="雪凜絕對不能說的詞句，每行一個">
            <textarea
              value={forbiddenText}
              onChange={e => setForbiddenText(e.target.value)}
              rows={7}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 outline-none focus:border-purple-500/50 resize-none font-mono"
              placeholder={DEFAULT_FORBIDDEN.join('\n')}
            />
            <p className="text-[11px] text-white/25 mt-1">目前 {forbiddenText.split('\n').filter(Boolean).length} 個禁止語句</p>
          </Section>

          {/* Response format */}
          <Section title="回應格式" desc="JSON 格式包含 mood 欄位，可驅動 VRM 表情">
            <div className="flex gap-3">
              {([
                { value: 'json', label: 'JSON（text + mood + action）', desc: '驅動 VRM 表情動畫' },
                { value: 'text', label: '純文字', desc: '不驅動動畫' },
              ] as const).map(opt => (
                <label
                  key={opt.value}
                  className="flex items-start gap-2.5 flex-1 p-3 rounded-xl border cursor-pointer transition-all"
                  style={settings.responseFormat === opt.value
                    ? { borderColor: 'rgba(168,139,250,0.4)', background: 'rgba(168,139,250,0.08)' }
                    : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }
                  }
                >
                  <input
                    type="radio"
                    name="responseFormat"
                    value={opt.value}
                    checked={settings.responseFormat === opt.value}
                    onChange={() => update({ responseFormat: opt.value })}
                    className="mt-0.5 accent-purple-400"
                  />
                  <div>
                    <p className="text-sm text-white/80 font-medium">{opt.label}</p>
                    <p className="text-[11px] text-white/35 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </Section>

          {/* Nickname */}
          <Section title="暱稱記憶" desc="第一次對話時詢問使用者暱稱">
            <label className="flex items-center gap-2.5 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={settings.askNickname}
                onChange={e => update({ askNickname: e.target.checked })}
                className="w-4 h-4 accent-purple-400 cursor-pointer"
              />
              <span className="text-sm text-white/70">啟用暱稱詢問</span>
            </label>
            {settings.askNickname && (
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">詢問方式</label>
                <input
                  type="text"
                  value={settings.nicknameQuestion}
                  onChange={e => update({ nicknameQuestion: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 outline-none focus:border-purple-500/50"
                />
              </div>
            )}
          </Section>
        </div>
      )}

      {/* Admin Tab */}
      {tab === 'admin' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-sm text-amber-300/80">
            <Crown className="w-4 h-4 shrink-0" />
            僅當你（super_admin）登入時，雪凜會切換成以下模式
          </div>

          {/* Admin title */}
          <Section title="稱謂" desc="雪凜叫你的方式">
            <input
              type="text"
              value={settings.adminTitle}
              onChange={e => update({ adminTitle: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 outline-none focus:border-amber-500/50 max-w-xs"
            />
          </Section>

          {/* Admin extra prompt */}
          <Section title="老闆專屬 System Prompt" desc="附加在基礎人設後面，覆蓋一般使用者設定">
            <textarea
              value={settings.adminExtraPrompt}
              onChange={e => update({ adminExtraPrompt: e.target.value })}
              rows={7}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 outline-none focus:border-amber-500/50 resize-none font-mono leading-relaxed"
            />
          </Section>

          {/* Trigger phrases */}
          <Section title="觸發詞回應設定" desc="可用 {dau} {diff} {days} {count} {name} 等變數">
            <div className="space-y-3">
              {([
                { field: 'adminLoginGreeting', label: '登入問候', hint: '可用 {dau}、{diff}（vs 昨天）' },
                { field: 'adminNightGreeting', label: '深夜登入（22:00–06:00）', hint: '' },
                { field: 'adminAwayGreeting', label: '超過 3 天沒登入', hint: '可用 {days}' },
                { field: 'adminBragMessage', label: '邀功訊息', hint: '可用 {count}（今日對話數）' },
              ] as const).map(({ field, label, hint }) => (
                <div key={field}>
                  <label className="text-xs text-white/40 mb-1.5 block">
                    {label}
                    {hint && <span className="ml-2 text-white/20">{hint}</span>}
                  </label>
                  <input
                    type="text"
                    value={settings[field]}
                    onChange={e => update({ [field]: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 outline-none focus:border-amber-500/50"
                  />
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Test panel */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/6 flex items-center gap-2">
          <TestTube2 className="w-4 h-4 text-teal-400" />
          <p className="text-sm font-medium text-white/60">
            即時測試（{tab === 'user' ? '一般使用者模式' : '老闆模式'}）
          </p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleTest() }}
              placeholder="輸入測試訊息..."
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder-white/20 outline-none focus:border-teal-500/40"
            />
            <button
              onClick={handleTest}
              disabled={testing || !testMessage.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 disabled:opacity-40 transition-colors"
            >
              {testing ? '...' : '發送'}
            </button>
          </div>
          {testResult && (
            <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/8">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-white/30">雪凜回覆</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300">{testResult.mood}</span>
              </div>
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{testResult.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-white/80">{title}</p>
        <p className="text-xs text-white/30 mt-0.5">{desc}</p>
      </div>
      {children}
    </div>
  )
}
