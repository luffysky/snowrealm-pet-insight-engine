'use client'

import { useEffect, useState, useCallback } from 'react'

type GroupKey = 'insight' | 'official' | 'admin' | 'richmenu' | 'login'

interface ConfigItem {
  key: string
  label: string
  group: GroupKey
  isSecret: boolean
  source: 'db' | 'env' | 'none'
  maskedValue: string | null
  description: string
}

const GROUP_META: Record<GroupKey, { emoji: string; title: string; desc: string }> = {
  insight:  { emoji: '🤖', title: 'Insight 問卷機器人', desc: '用於管理員通知推播' },
  official: { emoji: '📢', title: 'Official 官方帳號', desc: '用於用戶推播 / 廣播' },
  admin:    { emoji: '👤', title: '管理員設定', desc: '' },
  richmenu: { emoji: '📱', title: 'Rich Menu 設定', desc: '填答後切換選單 / LIFF / 加好友連結' },
  login:    { emoji: '🔑', title: 'LINE Login', desc: 'OAuth 登入設定（LINE Login Channel）' },
}

const EXAMPLE_FORMAT: Record<string, string> = {
  INSIGHT_CHANNEL_ACCESS_TOKEN: 'xxxxxxxxxxxxxxxxxxxxxxxxxxx...',
  INSIGHT_CHANNEL_SECRET: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  INSIGHT_CHANNEL_ID: '20XXXXXXXX',
  INSIGHT_LINE_ID: '@your-bot-id',
  OFFICIAL_CHANNEL_ACCESS_TOKEN: 'xxxxxxxxxxxxxxxxxxxxxxxxxxx...',
  OFFICIAL_CHANNEL_SECRET: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  OFFICIAL_CHANNEL_ID: '20XXXXXXXX',
  OFFICIAL_LINE_ID: '@your-bot-id',
  ADMIN_USER_ID: 'Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
}

function SourceBadge({ source, verified }: { source: string; verified?: boolean | null }) {
  if (verified === true) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">✓ 已驗證</span>
  if (verified === false) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">✗ 驗證失敗</span>
  if (source === 'db') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">DB</span>
  if (source === 'env') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">ENV</span>
  return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400">未設定</span>
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

  const grouped: Record<GroupKey, ConfigItem[]> = {
    insight:  configs.filter((c) => c.group === 'insight'),
    official: configs.filter((c) => c.group === 'official'),
    admin:    configs.filter((c) => c.group === 'admin'),
    richmenu: configs.filter((c) => c.group === 'richmenu'),
    login:    configs.filter((c) => c.group === 'login'),
  }

  if (loading) return <p className="text-white/50">載入中...</p>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white/90">LINE 設定</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === 'settings' ? 'bg-t-accent-bg text-t-accent border border-t-card-border' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>
            環境設定
          </button>
          <button type="button" onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === 'guide' ? 'bg-t-accent-bg text-t-accent border border-t-card-border' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>
            設定指南
          </button>
        </div>
      </div>

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {(['insight', 'official', 'admin', 'richmenu', 'login'] as const).map((group) => {
            const meta = GROUP_META[group]
            const items = grouped[group]
            const testKey = (group === 'insight' || group === 'official') ? group : null
            const result = testKey ? testResult[testKey] : null

            return (
              <section key={group} className="bg-t-card-bg border border-t-card-border rounded-2xl p-6 space-y-4">
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
                  {items.map((item) => {
                    const isTokenKey = item.key.endsWith('CHANNEL_ACCESS_TOKEN')
                    const channelForKey = item.key.startsWith('INSIGHT_') ? 'insight' : item.key.startsWith('OFFICIAL_') ? 'official' : null
                    const channelResult = channelForKey ? testResult[channelForKey] : null
                    const verified = isTokenKey && channelResult ? channelResult.ok : null

                    return (
                      <div key={item.key} className="flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                          <div className="sm:w-36 sm:shrink-0 space-y-0.5">
                            <span className="text-sm text-white/50">{item.label}</span>
                            {item.description && (
                              <p className="text-[10px] text-slate-600 leading-tight">{item.description}</p>
                            )}
                          </div>
                          <SourceBadge source={item.source} verified={item.source !== 'none' ? verified : null} />

                          {editingKey === item.key ? (
                            <div className="flex-1 w-full min-w-0 flex flex-col gap-2 sm:flex-row sm:items-center">
                              <input
                                type={item.isSecret ? 'password' : 'text'}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder={EXAMPLE_FORMAT[item.key] || '輸入值'}
                                autoComplete="off"
                                className="w-full min-w-0 flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white/80 placeholder:text-slate-600"
                              />
                              <div className="flex gap-2 shrink-0">
                                <button type="button" onClick={() => handleSave(item.key)} disabled={saving}
                                  className="px-3 py-1.5 bg-t-btn hover:bg-t-btn-hover disabled:opacity-40 text-white rounded-lg text-sm cursor-pointer">
                                  {saving ? '...' : '儲存'}
                                </button>
                                <button type="button" onClick={() => { setEditingKey(null); setEditValue('') }}
                                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm cursor-pointer">
                                  取消
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 w-full min-w-0 flex flex-col gap-2 sm:flex-row sm:items-center">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className={`text-sm font-mono truncate min-w-0 flex-1 sm:max-w-xs ${item.source === 'none' ? 'text-slate-600 italic' : 'text-white/60'}`}>
                                  {item.source === 'none'
                                    ? EXAMPLE_FORMAT[item.key] || '尚未設定'
                                    : item.isSecret && !showValue[item.key]
                                      ? '••••••••'
                                      : item.maskedValue ?? '—'
                                  }
                                </span>
                                {item.isSecret && item.source !== 'none' && (
                                  <button type="button" onClick={() => setShowValue((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                                    className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer shrink-0">
                                    {showValue[item.key] ? '🙈' : '👁'}
                                  </button>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 shrink-0 sm:ml-auto">
                                <button type="button" onClick={() => { setEditingKey(item.key); setEditValue('') }}
                                  className="text-xs text-t-accent hover:text-t-accent cursor-pointer">
                                  {item.source === 'none' ? '設定' : '修改'}
                                </button>
                                {item.source === 'db' && (
                                  <button type="button" onClick={() => handleDelete(item.key)}
                                    className="text-xs text-red-400 hover:text-red-300 cursor-pointer">
                                    刪除
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}

          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 text-sm text-slate-500 space-y-1">
            <p>ℹ️ <strong className="text-slate-400">來源說明</strong></p>
            <p><span className="text-emerald-400">✓ 已驗證</span> = 測試連線成功&nbsp;&nbsp;
              <span className="text-cyan-400">DB</span> = 已在後台設定（加密儲存）&nbsp;&nbsp;
              <span className="text-amber-400">ENV</span> = 使用環境變數&nbsp;&nbsp;
              <span className="text-slate-400">未設定</span> = 灰色為範例格式</p>
            <p className="text-slate-600">敏感值（Token / Secret）以 AES-256-GCM 加密存儲，前端只顯示遮罩值</p>
          </div>
        </div>
      )}

      {activeTab === 'guide' && <SetupGuide />}
    </div>
  )
}

// ===== 設定指南 =====
function SetupGuide() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const CopyBlock = ({ label, value, id }: { label: string; value: string; id: string }) => (
    <div className="bg-slate-900 rounded-lg p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <code className="text-sm text-green-300 break-all">{value}</code>
      </div>
      <button type="button" onClick={() => copy(value, id)}
        className="shrink-0 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 transition-colors cursor-pointer">
        {copied === id ? '✅ 已複製' : '📋 複製'}
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Step 0: Overview */}
      <section className="bg-linear-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-700/30 rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-semibold text-t-accent">📖 串接 LINE 功能教學</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          要在本系統使用 LINE 推播、自動回覆、問卷提醒等功能，您需要先到 LINE 開發者後台建立自己的 Channel，
          然後將取得的金鑰填入左邊的「環境設定」分頁，並在 <strong className="text-white/90">Messaging API</strong> 設定
          Webhook URL 且 Verify 成功。完成後系統才能收事件、發訊息。
        </p>
        <p className="text-xs text-slate-500">
          更完整的「官方帳號 vs Insight、Rich Menu、Webhook 是否互斥」說明見專案{' '}
          <code className="text-slate-400">docs/line-official-vs-insight.md</code>。
        </p>
        <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-400 space-y-1">
          <p>💡 <strong className="text-slate-300">需要的東西</strong></p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>一個 LINE 帳號</li>
            <li>LINE 官方帳號（免費方案即可）</li>
            <li>約 10 分鐘設定時間</li>
          </ul>
        </div>
      </section>

      {/* Step 1 */}
      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-t-accent-bg text-t-accent flex items-center justify-center text-sm font-bold shrink-0">1</span>
          <h2 className="text-lg font-semibold text-t-accent">建立 LINE Official Account</h2>
        </div>
        <ol className="text-sm text-slate-300 space-y-3 list-decimal pl-5 leading-relaxed">
          <li>
            前往{' '}
            <a href="https://manager.line.biz/" target="_blank" rel="noopener noreferrer" className="text-t-accent underline">
              LINE Official Account Manager
            </a>{' '}
            → 點擊「建立帳號」
          </li>
          <li>填寫帳號名稱（品牌名稱）、選擇類別</li>
          <li>設定大頭貼（建議 640×640 px）和狀態消息</li>
        </ol>
        <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-500">
          💡 如果已有官方帳號可跳過此步驟
        </div>
      </section>

      {/* Step 2 */}
      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-t-accent-bg text-t-accent flex items-center justify-center text-sm font-bold shrink-0">2</span>
          <h2 className="text-lg font-semibold text-t-accent">啟用 Messaging API</h2>
        </div>
        <ol className="text-sm text-slate-300 space-y-3 list-decimal pl-5 leading-relaxed">
          <li>
            前往{' '}
            <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className="text-t-accent underline">
              LINE Developers Console
            </a>{' '}
            → 登入同一個 LINE 帳號
          </li>
          <li>建立一個 <strong>Provider</strong>（供應商），名稱填您的品牌名</li>
          <li>在 Provider 裡點「Create a Messaging API channel」</li>
          <li>若已有官方帳號，系統會自動連結；否則會新建一個</li>
        </ol>
      </section>

      {/* Step 3 */}
      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-t-accent-bg text-t-accent flex items-center justify-center text-sm font-bold shrink-0">3</span>
          <h2 className="text-lg font-semibold text-t-accent">取得金鑰</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          在 LINE Developers Console → 您的 Channel 裡，找到以下資訊：
        </p>
        <div className="bg-slate-900 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-lg">🔑</span>
            <div>
              <p className="text-sm font-medium text-white/80">Channel Access Token</p>
              <p className="text-xs text-slate-500 mt-0.5">Messaging API 分頁 → 最下面「Channel access token」→ 點「Issue」產生</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔐</span>
            <div>
              <p className="text-sm font-medium text-white/80">Channel Secret</p>
              <p className="text-xs text-slate-500 mt-0.5">Basic settings 分頁 → 「Channel secret」</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🆔</span>
            <div>
              <p className="text-sm font-medium text-white/80">Channel ID</p>
              <p className="text-xs text-slate-500 mt-0.5">Basic settings 分頁 → 「Channel ID」（一串數字）</p>
            </div>
          </div>
        </div>
        <div className="bg-cyan-900/20 border border-cyan-700/30 rounded-lg p-3 text-sm text-t-accent">
          📝 取得後，切換到「環境設定」分頁，將這些值填入對應的欄位。系統會以 AES-256 加密儲存。
        </div>
      </section>

      {/* Step 4 */}
      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-sm font-bold shrink-0">4</span>
          <h2 className="text-lg font-semibold text-amber-400">設定 Webhook URL（重要！）</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          回到 LINE Developers Console → 您的 Channel → <strong>Messaging API</strong> 分頁，找到「Webhook URL」：
        </p>
        <div className="space-y-3">
          <CopyBlock label="官方帳號（用戶互動 / 自動回覆 / 關注追蹤）" value={`${baseUrl}/api/line/webhook/official`} id="wh-official" />
          <CopyBlock label="Insight 帳號（管理員通知 / 問卷推播）" value={`${baseUrl}/api/line/webhook`} id="wh-insight" />
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-400 space-y-2">
          <p>📌 <strong className="text-slate-300">設定步驟</strong></p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>貼上對應的 Webhook URL</li>
            <li>勾選「Use webhook」</li>
            <li>點「Verify」→ 顯示 <code className="bg-slate-700 px-1 rounded text-green-300">Success</code> 即成功</li>
          </ol>
        </div>
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 text-sm text-amber-300 space-y-2">
          <p>⚠️ 若只有 <strong>一個</strong> Messaging API Channel：通常只填 <strong>Official</strong> 金鑰，且 Webhook 只設 <code className="bg-black/30 px-1 rounded">/api/line/webhook/official</code> 即可。</p>
          <p className="text-amber-200/90">
            重點：<strong>每一個 Channel 只能填一個 Webhook</strong>。事件只會送到該 URL，不會同時送兩邊；改成我們的網址後，同一 Channel 上<strong>舊的第三方服務就不會再收到事件</strong>（除非改用第二個 Channel）。
          </p>
        </div>
      </section>

      {/* Step 5 */}
      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-sm font-bold shrink-0">5</span>
          <h2 className="text-lg font-semibold text-amber-400">關閉自動回應（重要！）</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          前往{' '}
          <a href="https://manager.line.biz/" target="_blank" rel="noopener noreferrer" className="text-t-accent underline">
            LINE Official Account Manager
          </a>{' '}
          → 設定 → 回應設定：
        </p>
        <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
          <li><strong className="text-slate-300">回應模式</strong>：選擇 <code className="bg-slate-700 px-1 rounded text-t-accent">Bot</code></li>
          <li><strong className="text-slate-300">自動回應訊息</strong>：<code className="bg-slate-700 px-1 rounded text-red-300">停用</code></li>
          <li><strong className="text-slate-300">Webhook</strong>：<code className="bg-slate-700 px-1 rounded text-green-300">啟用</code></li>
        </ul>
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 text-sm text-red-300">
          ❌ 不關閉「自動回應訊息」的話，LINE 內建回覆會跟系統的 API 回覆互相衝突
        </div>
      </section>

      {/* Step 6 */}
      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-green-500/20 text-green-300 flex items-center justify-center text-sm font-bold shrink-0">6</span>
          <h2 className="text-lg font-semibold text-green-400">回來填入金鑰 & 測試</h2>
        </div>
        <ol className="text-sm text-slate-300 space-y-3 list-decimal pl-5 leading-relaxed">
          <li>切換到「環境設定」分頁</li>
          <li>填入 <strong>Channel Access Token</strong>、<strong>Channel Secret</strong>、<strong>Channel ID</strong></li>
          <li>點「🔍 測試連線」確認顯示 ✅</li>
          <li>用手機加入您的 LINE 官方帳號好友，測試看看有沒有收到歡迎訊息</li>
        </ol>
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 text-sm text-green-300">
          🎉 完成！系統現在可以透過您的 LINE 帳號發送問卷通知、填答提醒、週報等訊息。
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-300">❓ 常見問題</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-white/80">Q：需要付費嗎？</p>
            <p className="text-sm text-slate-400 mt-1">A：LINE 官方帳號免費方案每月可發 200 則推播訊息，一般使用足夠。超過可升級輕量方案。</p>
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Q：需要建幾個 Channel？</p>
            <p className="text-sm text-slate-400 mt-1">A：基本只需 1 個（官方帳號）。如果想分開管理「用戶互動」和「管理員通知」才需要建 2 個。</p>
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Q：Verify 失敗怎麼辦？</p>
            <p className="text-sm text-slate-400 mt-1">A：確認 Webhook URL 貼對了、系統有在運行中。Channel Secret 如果填錯，簽名驗證會失敗。</p>
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Q：可以用現有的 LINE 官方帳號嗎？</p>
            <p className="text-sm text-slate-400 mt-1">A：可以！只要在 LINE Developers Console 把它連結到 Messaging API 即可。但要注意 Webhook URL 只能設一個，如果其他服務也在用要先確認。</p>
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Q：Token 貼到你們後台，LINE Developers 就自動完成了嗎？</p>
            <p className="text-sm text-slate-400 mt-1">
              A：<strong>不會。</strong>後台只儲存金鑰供我們伺服器呼叫 LINE API 與驗簽。您仍須在 <strong>同一個 Channel</strong> 的 Messaging API 頁面手動貼上 Webhook、開啟 Use webhook，並看到 Verify 成功。
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Q：Rich Menu 只能預設一個？官方跟後台都要怎麼辦？</p>
            <p className="text-sm text-slate-400 mt-1">
              A：對<strong>同一個 Bot（同一個 Channel）</strong>，全體使用者的預設 Rich Menu 同一時間只有一個。若需要「給顧客的選單」和「給管理員的選單」並存，請使用<strong>兩個</strong> Messaging API Channel（Official + Insight），在 Rich Menu 頁用分頁分別管理。詳見 <code className="text-slate-500">docs/line-official-vs-insight.md</code>。
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
