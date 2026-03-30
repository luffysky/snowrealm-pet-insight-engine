'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type TabKey = 'profile' | 'activity' | 'surveys' | 'stories' | 'zcoin' | 'orders' | 'conversations' | 'files' | 'logins' | 'reports'

interface ZcoinWallet { balance: number; total_earned: number }

const TABS: { key: TabKey; label: string }[] = [
  { key: 'profile', label: '基本資料' },
  { key: 'activity', label: '活動時間線' },
  { key: 'surveys', label: '問卷記錄' },
  { key: 'stories', label: '故事留言' },
  { key: 'zcoin', label: 'Z 幣明細' },
  { key: 'orders', label: '金流記錄' },
  { key: 'conversations', label: 'AI 對話' },
  { key: 'files', label: '上傳檔案' },
  { key: 'logins', label: '登入歷史' },
  { key: 'reports', label: '檢舉記錄' },
]

interface UserDetail {
  id: string; username: string; display_name: string | null; email: string | null
  phone: string | null; role: string; created_at: string; auth_provider: string
  nickname: string | null; risk_score: number; on_watchlist: boolean
  banned_at: string | null; banned_reason: string | null
}

interface ActivityItem { id: string; action: string; category: string; details: Record<string, unknown>; ip_address: string | null; created_at: string }
interface SurveyRecord { id: string; survey_title: string; status: string; submitted_at: string | null }
interface ZcoinTx { id: string; type: string; amount: number; reason: string | null; created_at: string }
interface LoginRecord { id: string; ip_address: string | null; user_agent: string | null; created_at: string }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800"><h3 className="text-sm font-semibold text-white/80">{title}</h3></div>
      {children}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-center text-white/30 text-sm py-8">{text}</p>
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const [tab, setTab] = useState<TabKey>('profile')
  const [user, setUser] = useState<UserDetail | null>(null)
  const [data, setData] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [actioning, setActioning] = useState(false)
  const [zcoinAmount, setZcoinAmount] = useState('')
  const [zcoinReason, setZcoinReason] = useState('')
  const [zcoinWallet, setZcoinWallet] = useState<ZcoinWallet | null>(null)
  const [grantingZcoin, setGrantingZcoin] = useState(false)
  const [zcoinMsg, setZcoinMsg] = useState('')

  useEffect(() => {
    fetch(`/api/super-admin/users/${userId}/detail`)
      .then(r => r.json())
      .then(d => setUser(d.user ?? null))
      .finally(() => setLoading(false))
  }, [userId])

  const loadTab = useCallback(() => {
    if (tab === 'profile') return
    setTabLoading(true)
    const endpoints: Record<TabKey, string> = {
      profile: '',
      activity: `/api/super-admin/users/${userId}/activity`,
      surveys: `/api/super-admin/users/${userId}/surveys`,
      stories: `/api/super-admin/users/${userId}/stories`,
      zcoin: `/api/super-admin/users/${userId}/zcoin`,
      orders: `/api/super-admin/users/${userId}/orders`,
      conversations: `/api/super-admin/users/${userId}/conversations`,
      files: `/api/super-admin/users/${userId}/files`,
      logins: `/api/super-admin/users/${userId}/logins`,
      reports: `/api/super-admin/users/${userId}/reports`,
    }
    fetch(endpoints[tab])
      .then(r => r.json())
      .then(d => {
        if (tab === 'zcoin') {
          setData(d.transactions ?? [])
          setZcoinWallet(d.wallet ?? null)
        } else {
          setData(Object.values(d)[0] as unknown[] ?? [])
        }
      })
      .finally(() => setTabLoading(false))
  }, [tab, userId])

  useEffect(() => { loadTab() }, [loadTab])

  async function grantZcoin() {
    const amt = parseInt(zcoinAmount, 10)
    if (!amt || isNaN(amt)) return
    setGrantingZcoin(true)
    setZcoinMsg('')
    try {
      const res = await fetch(`/api/super-admin/users/${userId}/zcoin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, reason: zcoinReason || undefined }),
      })
      const d = await res.json() as { ok?: boolean; newBalance?: number; error?: string }
      if (d.ok) {
        setZcoinMsg(`✅ 已${amt > 0 ? '發放' : '扣除'} ${Math.abs(amt)} Z幣，餘額：${d.newBalance}`)
        setZcoinWallet(w => w ? { ...w, balance: d.newBalance ?? w.balance } : w)
        setZcoinAmount('')
        setZcoinReason('')
        loadTab() // reload transactions
      } else {
        setZcoinMsg(`❌ ${d.error ?? '操作失敗'}`)
      }
    } finally {
      setGrantingZcoin(false)
    }
  }

  async function action(type: 'ban' | 'warn' | 'force-logout') {
    const labels = { ban: '封鎖', warn: '警告', 'force-logout': '強制登出' }
    if (!confirm(`確定要${labels[type]}這位使用者？`)) return
    setActioning(true)
    try {
      const res = await fetch(`/api/super-admin/users/${userId}/${type}`, { method: 'POST' })
      if (res.ok) {
        if (type === 'ban') setUser(prev => prev ? { ...prev, banned_at: new Date().toISOString() } : prev)
        alert(`已執行「${labels[type]}」`)
      }
    } finally { setActioning(false) }
  }

  if (loading) return <p className="text-white/50 animate-pulse">載入使用者資料...</p>
  if (!user) return (
    <div className="text-center py-12">
      <p className="text-white/50">找不到此使用者</p>
      <Link href="/snowrealm-insight-ctrl/users" className="text-cyan-400 hover:underline text-sm mt-2 block">← 返回列表</Link>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* 頁首 */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/snowrealm-insight-ctrl/users" className="text-white/40 hover:text-white/70 text-sm">← 使用者列表</Link>
          <h1 className="text-2xl font-bold text-white mt-1">
            {user.nickname || user.display_name || user.username}
            {user.banned_at && <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">已封鎖</span>}
            {user.on_watchlist && <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">⚠️ 觀察中</span>}
          </h1>
          <p className="text-white/40 text-sm font-mono">{userId}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {!user.banned_at && (
            <button disabled={actioning} onClick={() => action('warn')} className="text-sm px-3 py-1.5 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg transition-all disabled:opacity-50">⚠️ 警告</button>
          )}
          <button disabled={actioning} onClick={() => action('force-logout')} className="text-sm px-3 py-1.5 bg-slate-700 text-white/60 hover:bg-slate-600 rounded-lg transition-all disabled:opacity-50">強制登出</button>
          {!user.banned_at ? (
            <button disabled={actioning} onClick={() => action('ban')} className="text-sm px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all disabled:opacity-50">🚫 封鎖</button>
          ) : (
            <button disabled={actioning} className="text-sm px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-all disabled:opacity-50">解封</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t.key ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 內容 */}
      {tab === 'profile' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Section title="帳號資訊">
            <div className="p-4 space-y-2 text-sm">
              {[
                ['暱稱', user.nickname],
                ['顯示名稱', user.display_name],
                ['帳號', user.username],
                ['Email', user.email],
                ['電話', user.phone],
                ['角色', user.role],
                ['登入方式', user.auth_provider],
                ['註冊時間', new Date(user.created_at).toLocaleString('zh-TW')],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between">
                  <span className="text-white/40">{k}</span>
                  <span className="text-white/80">{v ?? '—'}</span>
                </div>
              ))}
            </div>
          </Section>
          <Section title="安全資訊">
            <div className="p-4 space-y-2 text-sm">
              {[
                ['風險分數', <span key="rs" className={`font-bold ${user.risk_score > 80 ? 'text-red-400' : user.risk_score > 50 ? 'text-orange-400' : 'text-emerald-400'}`}>{user.risk_score}</span>],
                ['觀察名單', user.on_watchlist ? <span key="wl" className="text-orange-400">是</span> : <span key="wl2" className="text-white/30">否</span>],
                ['封鎖時間', user.banned_at ? new Date(user.banned_at).toLocaleString('zh-TW') : '—'],
                ['封鎖原因', user.banned_reason ?? '—'],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between">
                  <span className="text-white/40">{k}</span>
                  <span className="text-white/80">{v}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab !== 'profile' && (
        tabLoading ? (
          <p className="text-white/50 animate-pulse">載入資料...</p>
        ) : (
          <Section title={TABS.find(t => t.key === tab)?.label ?? ''}>
            {tab === 'zcoin' && (
              <div className="px-4 py-3 border-b border-slate-800 space-y-2">
                {zcoinWallet && (
                  <p className="text-sm text-white/60">當前餘額：<span className="text-yellow-400 font-bold">{zcoinWallet.balance}</span> Z幣（累計獲得 {zcoinWallet.total_earned}）</p>
                )}
                <div className="flex gap-2 flex-wrap items-center">
                  <input value={zcoinAmount} onChange={e => setZcoinAmount(e.target.value)}
                    placeholder="金額（正=發放 負=扣除）" type="number"
                    className="w-44 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50" />
                  <input value={zcoinReason} onChange={e => setZcoinReason(e.target.value)}
                    placeholder="備註（可選）"
                    className="flex-1 min-w-32 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50" />
                  <button onClick={grantZcoin} disabled={grantingZcoin || !zcoinAmount}
                    className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg text-sm transition-all disabled:opacity-50 shrink-0">
                    {grantingZcoin ? '處理中...' : '執行'}
                  </button>
                </div>
                {zcoinMsg && <p className="text-sm text-white/60">{zcoinMsg}</p>}
              </div>
            )}
            {(data as unknown[]).length === 0 ? (
              <EmptyState text={tab === 'zcoin' ? '尚無交易記錄' : '無資料'} />
            ) : (
              <div className="divide-y divide-slate-800/50 max-h-[500px] overflow-y-auto">
                {(data as unknown[]).map((rawItem, i) => {
                  const item = rawItem as unknown as ActivityItem & SurveyRecord & ZcoinTx & LoginRecord
                  return (
                  <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-800/30">
                    {tab === 'activity' && (
                      <>
                        <span className="text-xs text-white/30 font-mono w-20 shrink-0 pt-0.5">
                          {new Date(item.created_at).toLocaleTimeString('zh-TW')}
                        </span>
                        <div className="flex-1">
                          <span className="text-sm text-white/80">{item.action}</span>
                          {item.ip_address && <span className="text-xs text-white/30 ml-2 font-mono">{item.ip_address}</span>}
                        </div>
                      </>
                    )}
                    {tab === 'surveys' && (
                      <div className="flex-1">
                        <p className="text-sm text-white/80">{item.survey_title}</p>
                        <p className="text-xs text-white/40">{item.status} · {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('zh-TW') : '未完成'}</p>
                      </div>
                    )}
                    {tab === 'zcoin' && (
                      <>
                        <div className="flex-1">
                          <span className="text-sm text-white/60">{item.reason ?? item.type}</span>
                        </div>
                        <span className={`text-sm font-bold ${Number(item.amount) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {Number(item.amount) > 0 ? '+' : ''}{item.amount}
                        </span>
                      </>
                    )}
                    {tab === 'logins' && (
                      <>
                        <div className="flex-1 text-xs">
                          <p className="text-white/60 font-mono">{item.ip_address ?? '—'}</p>
                          <p className="text-white/30 truncate max-w-xs">{item.user_agent ?? '—'}</p>
                        </div>
                        <span className="text-xs text-white/30 shrink-0">{new Date(item.created_at).toLocaleString('zh-TW')}</span>
                      </>
                    )}
                    {!['activity', 'surveys', 'zcoin', 'logins'].includes(tab) && (
                      <pre className="text-xs text-white/50 whitespace-pre-wrap">{JSON.stringify(rawItem, null, 2).slice(0, 300)}</pre>
                    )}
                  </div>
                  )
                })}
              </div>
            )}
          </Section>
        )
      )}
    </div>
  )
}
