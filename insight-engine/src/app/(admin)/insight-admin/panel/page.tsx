'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SystemInfo {
  tables: Record<string, number>
  todayResponses: number
  recentNotifications: { type: string; status: string; created_at: string }[]
  adminUsers: { id: string; username: string; displayName: string | null; role: string; createdAt: string; hasLine: boolean }[]
  dbSize: string
  env: {
    hasLineOfficial: boolean
    hasLineInsight: boolean
    hasLiff: boolean
    hasOpenAI: boolean
    hasDbUrl: boolean
    nodeEnv: string
    baseUrl: string
  }
  serverTime: string
}

interface PendingInvite {
  id: string
  email: string
  role: string
  token: string
  used: boolean
  expires_at: string
  created_at: string
}

const QUICK_LINK_DEFS = [
  { icon: '📊', label: 'Dashboard', path: '', desc: 'KPI 總覽與趨勢圖表' },
  { icon: '📝', label: '問卷管理', path: '/surveys', desc: '題目編輯與排序' },
  { icon: '📋', label: '填答列表', path: '/responses', desc: '查看所有填答資料' },
  { icon: '🏷️', label: '標籤規則', path: '/tag-rules', desc: 'CRM 自動標籤引擎' },
  { icon: '📢', label: 'LINE 推播', path: '/broadcast', desc: '發送 LINE 推播訊息' },
  { icon: '🔔', label: '通知規則', path: '/notification-rules', desc: '自動通知觸發條件' },
  { icon: '🎨', label: '主題設定', path: '/theme-settings', desc: '問卷風格與主題' },
  { icon: '🤖', label: 'AI 設定', path: '/ai-settings', desc: 'AI 問卷生成功能' },
  { icon: '🔗', label: 'UTM 管理', path: '/utm-links', desc: '行銷追蹤連結' },
  { icon: '📱', label: 'Rich Menu', path: '/rich-menu', desc: 'LINE 選單管理' },
  { icon: '🔗', label: 'Webhook', path: '/webhooks', desc: '外部服務串接' },
  { icon: '👥', label: '封測名單', path: '/waitlist', desc: 'Beta 使用者管理' },
]

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-green-400' : 'bg-red-400'}`}
    />
  )
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
  } catch {
    return iso
  }
}

export default function AdminPanelPage() {
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const pathname = usePathname()
  // /insight-admin/{slug}/panel → extract slug → build prefix
  const segments = pathname.split('/')
  const slug = segments[2] ?? ''
  const adminPrefix = `/insight-admin/${slug}`
  const QUICK_LINKS = QUICK_LINK_DEFS.map(d => ({ ...d, href: d.path ? `${adminPrefix}${d.path}` : adminPrefix }))

  // 邀請機制
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('admin')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ url: string } | null>(null)
  const [inviteError, setInviteError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError('')
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) { setInviteError(data.error || '邀請失敗'); return }
      setInviteResult({ url: data.inviteUrl })
    } catch {
      setInviteError('邀請失敗')
    } finally {
      setInviting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    fetch('/api/admin/system', {
      headers: {
        'x-request-tenant-id': slug
      }
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setInfo(data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-white/50 animate-pulse">載入系統資訊中...</p>
  if (error) return <p className="text-red-400">錯誤：{error}</p>
  if (!info) return null

  const tableLabels: Record<string, string> = {
    surveys: '問卷',
    questions: '題目',
    responses: '填答',
    waitlist: '封測名單',
    lineUsers: 'LINE 用戶',
    tagRules: '標籤規則',
    notificationLogs: '通知紀錄',
    templates: '訊息模板',
    broadcasts: '推播紀錄',
  }

  const envLabels: { key: keyof SystemInfo['env']; label: string; isBoolean: boolean }[] = [
    { key: 'hasDbUrl', label: 'PostgreSQL', isBoolean: true },
    { key: 'hasLineOfficial', label: 'LINE Official', isBoolean: true },
    { key: 'hasLineInsight', label: 'LINE Insight', isBoolean: true },
    { key: 'hasLiff', label: 'LIFF', isBoolean: true },
    { key: 'hasOpenAI', label: 'OpenAI', isBoolean: true },
    { key: 'nodeEnv', label: '環境', isBoolean: false },
    { key: 'baseUrl', label: '網址', isBoolean: false },
  ]

  const notifTypeLabels: Record<string, string> = {
    survey_submitted: '📋 填答完成',
    waitlist_joined: '👥 加入封測',
    rule_admin: '🏷️ 標籤通知(管)',
    rule_user: '🏷️ 標籤通知(用)',
    weekly_report: '📊 週報',
    remind: '⏰ 提醒',
    broadcast: '📢 推播',
    follow_welcome: '👋 歡迎',
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">管理員面板</h1>
        <span className="text-xs text-white/30">
          伺服器時間：{formatTime(info.serverTime)}
        </span>
      </div>

      {/* 服務狀態 */}
      <section>
        <h2 className="text-lg font-semibold text-white/90 mb-3">🔧 服務狀態</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {envLabels.map((item) => (
            <div
              key={item.key}
              className="bg-t-card-bg border border-t-card-border rounded-xl p-3 flex items-center gap-3"
            >
              {item.isBoolean ? (
                <StatusDot ok={info.env[item.key] as boolean} />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
              )}
              <div>
                <p className="text-xs text-white/40">{item.label}</p>
                <p className="text-sm text-white/80">
                  {item.isBoolean
                    ? (info.env[item.key] ? '已連接' : '未設定')
                    : String(info.env[item.key])}
                </p>
              </div>
            </div>
          ))}
          <div className="bg-t-card-bg border border-t-card-border rounded-xl p-3 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
            <div>
              <p className="text-xs text-white/40">資料庫大小</p>
              <p className="text-sm text-white/80">{info.dbSize}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 管理人員 */}
      <section>
        <h2 className="text-lg font-semibold text-white/90 mb-3">👤 管理人員</h2>
        {/* Mobile: cards */}
        <div className="sm:hidden space-y-3">
          {(info.adminUsers ?? []).map((u) => (
            <div key={u.id} className="bg-t-card-bg border border-t-card-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80 font-medium">{u.displayName || u.username}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-t-accent-bg text-t-accent' : 'bg-slate-500/20 text-slate-400'}`}>
                  {u.role === 'admin' ? '管理員' : u.role}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 font-mono">{u.username}</span>
                {u.hasLine ? <span className="text-green-400">✓ LINE 已綁定</span> : <span className="text-white/30">LINE 未綁定</span>}
              </div>
              <p className="text-xs text-white/30">{formatTime(u.createdAt)}</p>
            </div>
          ))}
        </div>
        {/* Desktop: table */}
        <div className="hidden sm:block bg-t-card-bg border border-t-card-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-t-card-border text-white/40 text-xs">
                <th className="text-left px-4 py-2">名稱</th>
                <th className="text-left px-4 py-2">帳號</th>
                <th className="text-left px-4 py-2">角色</th>
                <th className="text-left px-4 py-2">LINE 綁定</th>
                <th className="text-left px-4 py-2">建立時間</th>
              </tr>
            </thead>
            <tbody>
              {(info.adminUsers ?? []).map((u) => (
                <tr key={u.id} className="border-b border-slate-800/50 last:border-0">
                  <td className="px-4 py-2.5 text-white/80 font-medium">{u.displayName || u.username}</td>
                  <td className="px-4 py-2.5 text-white/50 font-mono text-xs">{u.username}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-t-accent-bg text-t-accent' : 'bg-slate-500/20 text-slate-400'}`}>
                      {u.role === 'admin' ? '管理員' : u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {u.hasLine ? <span className="text-xs text-green-400">✓ 已綁定</span> : <span className="text-xs text-white/30">未綁定</span>}
                  </td>
                  <td className="px-4 py-2.5 text-white/40 text-xs">{formatTime(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 邀請成員 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white/90">✉️ 邀請成員</h2>
          <button
            onClick={() => { setShowInvite(!showInvite); setInviteResult(null); setInviteError('') }}
            className="px-3 py-1.5 bg-t-btn hover:bg-t-btn-hover text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            {showInvite ? '收起' : '+ 邀請成員'}
          </button>
        </div>
        {showInvite && (
          <div className="bg-t-card-bg border border-t-card-border rounded-xl p-5 space-y-4">
            {inviteResult ? (
              <div className="space-y-3">
                <p className="text-sm text-emerald-400 font-medium">✅ 邀請連結已產生</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteResult.url}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white/70 text-xs font-mono truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(inviteResult.url)}
                    className="px-3 py-2 bg-t-btn hover:bg-t-btn-hover text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
                  >
                    {copied ? '✓ 已複製' : '複製'}
                  </button>
                </div>
                <p className="text-xs text-white/30">此連結 7 天內有效，成員點擊後即可加入團隊。</p>
                <button
                  onClick={() => { setInviteResult(null); setInviteEmail('') }}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  邀請另一位成員
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-white/40 mb-1">被邀請者 Email</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="member@example.com"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-t-accent-border focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">角色</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-t-accent-border focus:outline-none cursor-pointer"
                    >
                      <option value="admin">管理員</option>
                      <option value="viewer">檢視者</option>
                    </select>
                  </div>
                </div>
                {inviteError && <p className="text-sm text-red-400">{inviteError}</p>}
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="px-4 py-2 bg-t-btn hover:bg-t-btn-hover disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  {inviting ? '邀請中...' : '發送邀請'}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 資料概覽 */}
      <section>
        <h2 className="text-lg font-semibold text-white/90 mb-3">📈 資料概覽</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(info.tables).map(([key, count]) => (
            <div
              key={key}
              className="bg-t-card-bg border border-t-card-border rounded-xl p-3 text-center"
            >
              <p className="text-2xl font-bold text-t-accent">{count.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">{tableLabels[key] ?? key}</p>
            </div>
          ))}
          <div className="bg-t-card-bg border border-t-accent-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {info.todayResponses.toLocaleString()}
            </p>
            <p className="text-xs text-white/40 mt-1">今日填答</p>
          </div>
        </div>
      </section>

      {/* 最近通知 */}
      {info.recentNotifications.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white/90 mb-3">🔔 最近通知紀錄</h2>
          {/* Mobile: cards */}
          <div className="sm:hidden space-y-2">
            {info.recentNotifications.map((n, i) => (
              <div key={i} className="bg-t-card-bg border border-t-card-border rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">{notifTypeLabels[n.type] ?? n.type}</p>
                  <p className="text-xs text-white/30 mt-0.5">{formatTime(n.created_at)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${n.status === 'sent' ? 'bg-green-500/20 text-green-400' : n.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {n.status === 'sent' ? '已送達' : n.status === 'failed' ? '失敗' : n.status}
                </span>
              </div>
            ))}
          </div>
          {/* Desktop: table */}
          <div className="hidden sm:block bg-t-card-bg border border-t-card-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-t-card-border text-white/40 text-xs">
                  <th className="text-left px-4 py-2">類型</th>
                  <th className="text-left px-4 py-2">狀態</th>
                  <th className="text-left px-4 py-2">時間</th>
                </tr>
              </thead>
              <tbody>
                {info.recentNotifications.map((n, i) => (
                  <tr key={i} className="border-b border-slate-800/50 last:border-0">
                    <td className="px-4 py-2 text-white/70">{notifTypeLabels[n.type] ?? n.type}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${n.status === 'sent' ? 'bg-green-500/20 text-green-400' : n.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {n.status === 'sent' ? '已送達' : n.status === 'failed' ? '失敗' : n.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-white/40 text-xs">{formatTime(n.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 快捷入口 */}
      <section>
        <h2 className="text-lg font-semibold text-white/90 mb-3">🚀 快捷入口</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-t-card-bg border border-t-card-border rounded-xl p-4 hover:border-t-accent-border hover:bg-slate-800/60 transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{link.icon}</span>
                <span className="text-sm font-medium text-white/80 group-hover:text-t-accent transition-colors">
                  {link.label}
                </span>
              </div>
              <p className="text-xs text-white/30">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
