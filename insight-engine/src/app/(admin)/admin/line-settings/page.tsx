'use client'

import { useEffect, useState, useCallback } from 'react'

interface ConfigItem {
  key: string
  label: string
  group: 'insight' | 'official' | 'admin'
  isSecret: boolean
  source: 'db' | 'env' | 'none'
  maskedValue: string | null
  description: string
}

const GROUP_META = {
  insight: { emoji: '🤖', title: 'Insight 問卷機器人', desc: '用於管理員通知推播' },
  official: { emoji: '📢', title: 'Official 官方帳號', desc: '用於用戶推播 / 廣播' },
  admin: { emoji: '👤', title: '管理員設定', desc: '' },
} as const

function SourceBadge({ source }: { source: string }) {
  if (source === 'db') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">DB</span>
  if (source === 'env') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">ENV</span>
  return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">未設定</span>
}

export default function LineSettingsPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; botName?: string; error?: string }>>({})
  const [testing, setTesting] = useState<string | null>(null)
  const [showValue, setShowValue] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<'settings' | 'guide'>('settings')

  const loadConfigs = useCallback(async () => {
    const res = await fetch('/api/admin/line-settings')
    const data = await res.json() as { configs: ConfigItem[] }
    setConfigs(data.configs)
  }, [])

  useEffect(() => {
    loadConfigs().finally(() => setLoading(false))
  }, [loadConfigs])

  const handleSave = async (key: string) => {
    if (!editValue.trim()) return
    setSaving(true)
    const res = await fetch('/api/admin/line-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: editValue.trim() }),
    })
    if (res.ok) {
      await loadConfigs()
      setEditingKey(null)
      setEditValue('')
    }
    setSaving(false)
  }

  const handleDelete = async (key: string) => {
    if (!confirm('確定刪除？將回退到 ENV 環境變數')) return
    await fetch(`/api/admin/line-settings?key=${key}`, { method: 'DELETE' })
    await loadConfigs()
  }

  const handleTest = async (channel: 'insight' | 'official') => {
    setTesting(channel)
    setTestResult((prev) => ({ ...prev, [channel]: undefined as never }))
    const res = await fetch('/api/admin/line-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel }),
    })
    const result = await res.json() as { ok: boolean; botName?: string; error?: string }
    setTestResult((prev) => ({ ...prev, [channel]: result }))
    setTesting(null)
  }

  const grouped = {
    insight: configs.filter((c) => c.group === 'insight'),
    official: configs.filter((c) => c.group === 'official'),
    admin: configs.filter((c) => c.group === 'admin'),
  }

  if (loading) return <p className="text-white/50">載入中...</p>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white/90">LINE 設定</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === 'settings' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>
            環境設定
          </button>
          <button type="button" onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === 'guide' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>
            設定指南
          </button>
        </div>
      </div>

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {(['insight', 'official', 'admin'] as const).map((group) => {
            const meta = GROUP_META[group]
            const items = grouped[group]
            const testKey = group === 'admin' ? null : group
            const result = testKey ? testResult[testKey] : null

            return (
              <section key={group} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white/80">{meta.emoji} {meta.title}</h2>
                    {meta.desc && <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>}
                  </div>
                  {testKey && (
                    <button type="button" onClick={() => handleTest(testKey)} disabled={testing === testKey}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 disabled:opacity-40 transition-colors cursor-pointer">
                      {testing === testKey ? '測試中...' : '🔍 測試連線'}
                    </button>
                  )}
                </div>

                {result && (
                  <div className={`rounded-lg p-3 text-sm ${result.ok ? 'bg-emerald-900/20 border border-emerald-700/30 text-emerald-300' : 'bg-red-900/20 border border-red-700/30 text-red-300'}`}>
                    {result.ok ? `✅ 連線成功 — Bot: ${result.botName ?? 'unknown'}` : `❌ 連線失敗 — ${result.error}`}
                  </div>
                )}

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.key} className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white/50 w-36 shrink-0">{item.label}</span>
                        <SourceBadge source={item.source} />

                        {editingKey === item.key ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              type={item.isSecret ? 'password' : 'text'}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder={item.isSecret ? '輸入新的值（明文不會傳至前端）' : '輸入值'}
                              autoComplete="off"
                              className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white/80"
                            />
                            <button type="button" onClick={() => handleSave(item.key)} disabled={saving}
                              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg text-sm cursor-pointer">
                              {saving ? '...' : '儲存'}
                            </button>
                            <button type="button" onClick={() => { setEditingKey(null); setEditValue('') }}
                              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm cursor-pointer">
                              取消
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-sm text-white/60 font-mono truncate max-w-xs">
                              {item.source === 'none'
                                ? '—'
                                : item.isSecret && !showValue[item.key]
                                  ? '••••••••'
                                  : item.maskedValue ?? '—'
                              }
                            </span>
                            {item.isSecret && item.source !== 'none' && (
                              <button type="button" onClick={() => setShowValue((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                                className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">
                                {showValue[item.key] ? '🙈' : '👁'}
                              </button>
                            )}
                            <button type="button" onClick={() => { setEditingKey(item.key); setEditValue('') }}
                              className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer ml-auto">
                              {item.source === 'none' ? '設定' : '修改'}
                            </button>
                            {item.source === 'db' && (
                              <button type="button" onClick={() => handleDelete(item.key)}
                                className="text-xs text-red-400 hover:text-red-300 cursor-pointer">
                                刪除
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}

          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 text-sm text-slate-500 space-y-1">
            <p>ℹ️ <strong className="text-slate-400">來源說明</strong></p>
            <p><span className="text-emerald-400">DB</span> = 已在後台設定（加密儲存）&nbsp;&nbsp;
              <span className="text-amber-400">ENV</span> = 使用環境變數備援&nbsp;&nbsp;
              <span className="text-red-400">未設定</span> = 尚無值</p>
            <p className="text-slate-600">敏感值（Token / Secret）以 AES-256-GCM 加密存儲，前端只顯示遮罩值</p>
          </div>
        </div>
      )}

      {activeTab === 'guide' && <SetupGuide />}
    </div>
  )
}

// ===== 設定指南（原本的文件內容） =====
function SetupGuide() {
  return (
    <div className="space-y-6">
      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-cyan-400">1. LINE Official Account Manager</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          前往{' '}
          <a href="https://manager.line.biz/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">
            manager.line.biz
          </a>{' '}
          管理官方帳號的基本資料。
        </p>
        <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
          <li><strong className="text-slate-300">帳號名稱</strong>：設定顯示名稱</li>
          <li><strong className="text-slate-300">大頭貼</strong>：上傳品牌 Logo（建議 640×640 px）</li>
          <li><strong className="text-slate-300">狀態消息</strong>：設定一行簡短描述</li>
        </ul>
      </section>

      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-cyan-400">2. 回應設定（重要！）</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          路徑：LINE Official Account Manager → 設定 → 回應設定
        </p>
        <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
          <li><strong className="text-slate-300">回應模式</strong>：選擇 <code className="bg-slate-700 px-1 rounded text-cyan-300">Bot</code></li>
          <li><strong className="text-slate-300">自動回應訊息</strong>：<code className="bg-slate-700 px-1 rounded text-red-300">停用</code></li>
          <li><strong className="text-slate-300">Webhook</strong>：<code className="bg-slate-700 px-1 rounded text-green-300">啟用</code></li>
        </ul>
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 text-sm text-amber-300">
          ⚠️ 必須關閉「自動回應訊息」，否則會跟 API 回覆衝突
        </div>
      </section>

      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-cyan-400">3. Webhook URL</h2>
        <div className="space-y-3">
          <div className="bg-slate-900 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">官方帳號（用戶互動）</p>
            <code className="text-sm text-green-300 break-all">
              https://insight-engine-sonwrealm-pet.zeabur.app/api/line/webhook/official
            </code>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">INSIGHT（管理員通知）</p>
            <code className="text-sm text-green-300 break-all">
              https://insight-engine-sonwrealm-pet.zeabur.app/api/line/webhook
            </code>
          </div>
        </div>
      </section>

      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-cyan-400">4. Rich Menu</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Rich Menu 已透過 API 自動建立。如需重新部署：
        </p>
        <div className="bg-slate-900 rounded-lg p-3">
          <code className="text-sm text-green-300">
            node --env-file=.env.local scripts/setup-rich-menu.mjs
          </code>
        </div>
      </section>

      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-cyan-400">5. 排程任務（Cron）</h2>
        <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
          <li><strong className="text-slate-300">問卷提醒</strong>：<code className="bg-slate-700 px-1 rounded text-green-300">GET /api/cron/remind</code></li>
          <li><strong className="text-slate-300">排程推播</strong>：<code className="bg-slate-700 px-1 rounded text-green-300">GET /api/cron/broadcast</code></li>
          <li><strong className="text-slate-300">週報推播</strong>：<code className="bg-slate-700 px-1 rounded text-green-300">GET /api/cron/weekly-report</code></li>
        </ul>
      </section>
    </div>
  )
}
