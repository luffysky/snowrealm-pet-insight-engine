'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface RiskyAccount { user_id: string; nickname: string | null; display_name: string | null; risk_score: number; username: string }
interface WatchlistEntry { id: string; user_id: string; reason: string; added_by: string; created_at: string; nickname: string | null; display_name: string | null }
interface AutoBan { id: string; user_id: string; details: { reason?: string }; created_at: string; nickname: string | null; display_name: string | null }
interface DeviceAnomaly { fingerprint: string; user_count: number; user_ids: string[] }
interface IpAnomaly { ip_address: string; count: number; user_ids: string[] }

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800">
        <h2 className="font-semibold text-white/90 text-sm">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-center text-white/30 text-sm py-6">{text}</p>
}

export default function SecurityPage() {
  const [risky, setRisky] = useState<RiskyAccount[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([])
  const [autoBans, setAutoBans] = useState<AutoBan[]>([])
  const [devices, setDevices] = useState<DeviceAnomaly[]>([])
  const [ips, setIps] = useState<IpAnomaly[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/super-admin/security/risky-accounts').then(r => r.json()),
      fetch('/api/super-admin/security/watchlist').then(r => r.json()),
      fetch('/api/super-admin/security/auto-bans').then(r => r.json()),
      fetch('/api/super-admin/security/device-anomalies').then(r => r.json()),
      fetch('/api/super-admin/security/ip-anomalies').then(r => r.json()),
    ]).then(([r, w, b, d, ip]) => {
      setRisky(r.accounts ?? [])
      setWatchlist(w.entries ?? [])
      setAutoBans(b.bans ?? [])
      setDevices(d.anomalies ?? [])
      setIps(ip.anomalies ?? [])
    }).finally(() => setLoading(false))
  }, [])

  async function resolveWatchlist(id: string, action: 'resolve' | 'ban') {
    if (!confirm(`確定要${action === 'ban' ? '封鎖' : '移出觀察名單'}？`)) return
    await fetch('/api/super-admin/security/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    setWatchlist(prev => prev.filter(w => w.id !== id))
  }

  if (loading) return <p className="text-white/50 animate-pulse">載入安全資料...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">🛡️ 安全總覽</h1>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: '高風險帳號', value: risky.length, color: 'text-red-400' },
          { label: '觀察名單', value: watchlist.length, color: 'text-orange-400' },
          { label: '今日自動封鎖', value: autoBans.length, color: 'text-yellow-400' },
          { label: '裝置指紋異常', value: devices.length, color: 'text-purple-400' },
          { label: 'IP 異常', value: ips.length, color: 'text-pink-400' },
        ].map(k => (
          <div key={k.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-white/40 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* 風險帳號 */}
      <Card title="⚠️ 高風險帳號（risk_score > 50）">
        {risky.length === 0 ? <EmptyRow text="目前無高風險帳號" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-white/40 text-xs">
                <th className="text-left px-4 py-2">使用者</th>
                <th className="text-right px-4 py-2">風險分數</th>
                <th className="text-left px-4 py-2">操作</th>
              </tr></thead>
              <tbody>
                {risky.map(u => (
                  <tr key={u.user_id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                    <td className="px-4 py-2.5">
                      <span className="text-white/80">{u.nickname || u.display_name || u.username || '—'}</span>
                      <span className="text-white/30 text-xs ml-2 font-mono">{u.user_id.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-bold ${u.risk_score > 80 ? 'text-red-400' : 'text-orange-400'}`}>{u.risk_score}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/snowrealm-insight-ctrl/users/${u.user_id}`} className="text-xs text-cyan-400 hover:underline">查看詳情</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 觀察名單 */}
      <Card title="👀 觀察名單">
        {watchlist.length === 0 ? <EmptyRow text="觀察名單為空" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-white/40 text-xs">
                <th className="text-left px-4 py-2">使用者</th>
                <th className="text-left px-4 py-2">原因</th>
                <th className="text-left px-4 py-2">加入者</th>
                <th className="text-left px-4 py-2">時間</th>
                <th className="text-left px-4 py-2">操作</th>
              </tr></thead>
              <tbody>
                {watchlist.map(w => (
                  <tr key={w.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 text-white/80">{w.nickname || w.display_name || w.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-2.5 text-white/60 text-xs max-w-[200px] truncate">{w.reason}</td>
                    <td className="px-4 py-2.5 text-white/40 text-xs">{w.added_by}</td>
                    <td className="px-4 py-2.5 text-white/40 text-xs">{new Date(w.created_at).toLocaleDateString('zh-TW')}</td>
                    <td className="px-4 py-2.5 flex gap-2">
                      <button onClick={() => resolveWatchlist(w.id, 'resolve')} className="text-xs text-emerald-400 hover:underline">移出</button>
                      <button onClick={() => resolveWatchlist(w.id, 'ban')} className="text-xs text-red-400 hover:underline">封鎖</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 今日自動封鎖 */}
      <Card title="🚫 今日自動封鎖">
        {autoBans.length === 0 ? <EmptyRow text="今日無自動封鎖" /> : (
          <div className="divide-y divide-slate-800/50">
            {autoBans.map(b => (
              <div key={b.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-800/30">
                <span className="text-red-400 text-sm font-mono">{b.user_id.slice(0, 8)}</span>
                <span className="text-white/60 text-xs flex-1">{b.details?.reason ?? '自動偵測異常行為'}</span>
                <span className="text-white/30 text-xs">{new Date(b.created_at).toLocaleTimeString('zh-TW')}</span>
                <Link href={`/snowrealm-insight-ctrl/users/${b.user_id}`} className="text-xs text-cyan-400 hover:underline">查看</Link>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 裝置指紋異常 */}
      <Card title="📱 裝置指紋異常（同裝置多帳號）">
        {devices.length === 0 ? <EmptyRow text="無裝置指紋異常" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-white/40 text-xs">
                <th className="text-left px-4 py-2">指紋</th>
                <th className="text-right px-4 py-2">關聯帳號數</th>
              </tr></thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.fingerprint} className="border-b border-slate-800/50 last:border-0">
                    <td className="px-4 py-2.5 text-white/50 font-mono text-xs">{d.fingerprint.slice(0, 24)}…</td>
                    <td className="px-4 py-2.5 text-right text-orange-400 font-bold">{d.user_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* IP 異常 */}
      <Card title="🌐 IP 異常（24h 大量註冊）">
        {ips.length === 0 ? <EmptyRow text="無 IP 異常" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-white/40 text-xs">
                <th className="text-left px-4 py-2">IP</th>
                <th className="text-right px-4 py-2">註冊次數</th>
              </tr></thead>
              <tbody>
                {ips.map(ip => (
                  <tr key={ip.ip_address} className="border-b border-slate-800/50 last:border-0">
                    <td className="px-4 py-2.5 text-white/60 font-mono text-xs">{ip.ip_address}</td>
                    <td className="px-4 py-2.5 text-right text-red-400 font-bold">{ip.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
