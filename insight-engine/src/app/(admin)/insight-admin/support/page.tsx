'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ───

interface Ticket {
  id: string
  channel: string
  lineDisplayName: string | null
  email: string | null
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  category: string | null
  subject: string | null
  assignedTo: string | null
  firstResponseAt: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  lastMessage: string | null
  lastMessageAt: string | null
  messageCount: number
}

interface Message {
  id: string
  senderType: 'customer' | 'admin' | 'system'
  senderId: string | null
  senderName: string | null
  content: string
  contentType: string
  createdAt: string
}

interface Template {
  id: string
  title: string
  content: string
  category: string | null
}

interface TicketListResponse {
  data: Ticket[]
  total: number
  stats: { open: number; inProgress: number; resolved: number; closed: number }
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed'
type TicketStatus = Ticket['status']
type TicketPriority = Ticket['priority']

// ─── Constants ───

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: '開放',
  in_progress: '進行中',
  resolved: '已解決',
  closed: '已關閉',
}

const STATUS_DOT_COLORS: Record<TicketStatus, string> = {
  open: 'bg-red-500',
  in_progress: 'bg-yellow-500',
  resolved: 'bg-emerald-500',
  closed: 'bg-slate-500',
}

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: '低',
  normal: '一般',
  high: '高',
  urgent: '緊急',
}

const PRIORITY_BADGE_COLORS: Record<TicketPriority, string> = {
  low: 'bg-slate-600 text-slate-300',
  normal: 'bg-blue-900/50 text-blue-300',
  high: 'bg-orange-900/50 text-orange-300',
  urgent: 'bg-red-900/50 text-red-300',
}

const CATEGORY_OPTIONS = [
  { value: 'bug', label: '錯誤回報' },
  { value: 'feature', label: '功能建議' },
  { value: 'question', label: '問題諮詢' },
  { value: 'complaint', label: '客訴' },
  { value: 'other', label: '其他' },
]

const CHANNEL_ICONS: Record<string, string> = {
  line: '💬',
  web: '🌐',
  email: '📧',
}

const PAGE_SIZE = 20

// ─── Helpers ───

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return '剛剛'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} 分鐘前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小時前`
  const days = Math.floor(hours / 24)
  if (days === 1) return '昨天'
  if (days < 30) return `${days} 天前`
  return new Date(dateStr).toLocaleDateString('zh-TW')
}

function truncate(text: string | null, maxLen: number): string {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

// ─── Main Component ───

export default function SupportCenterPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0, closed: 0 })
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const [templates, setTemplates] = useState<Template[]>([])
  const [showTemplates, setShowTemplates] = useState(false)

  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // ─── Fetch Tickets ───

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/admin/support?${params}`)
      const json = (await res.json()) as TicketListResponse
      setTickets(json.data ?? [])
      setTotal(json.total ?? 0)
      setStats(json.stats ?? { open: 0, inProgress: 0, resolved: 0, closed: 0 })
    } catch (err) {
      console.error('載入工單失敗', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  // ─── Fetch Single Ticket + Messages ───

  const fetchTicketDetail = useCallback(async (ticketId: string) => {
    setMessagesLoading(true)
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`)
      const json = await res.json()
      setSelectedTicket(json.ticket ?? null)
      setMessages(json.messages ?? [])
    } catch (err) {
      console.error('載入工單詳情失敗', err)
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedTicketId) fetchTicketDetail(selectedTicketId)
  }, [selectedTicketId, fetchTicketDetail])

  // ─── Auto-scroll Messages ───

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Fetch Templates ───

  useEffect(() => {
    fetch('/api/admin/support/templates')
      .then(r => r.json())
      .then((data: Template[]) => setTemplates(data ?? []))
      .catch(() => {})
  }, [])

  // ─── Handlers ───

  function handleSelectTicket(ticket: Ticket) {
    setSelectedTicketId(ticket.id)
    setReplyText('')
    setShowTemplates(false)
    setMobileShowDetail(true)
  }

  async function handleSendReply() {
    if (!replyText.trim() || !selectedTicketId || sending) return
    setSending(true)
    try {
      await fetch(`/api/admin/support/${selectedTicketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() }),
      })
      setReplyText('')
      await fetchTicketDetail(selectedTicketId)
      await fetchTickets()
    } catch (err) {
      console.error('傳送回覆失敗', err)
    } finally {
      setSending(false)
    }
  }

  async function handleUpdateTicket(field: string, value: string) {
    if (!selectedTicketId) return
    try {
      await fetch(`/api/admin/support/${selectedTicketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      await fetchTicketDetail(selectedTicketId)
      await fetchTickets()
    } catch (err) {
      console.error('更新工單失敗', err)
    }
  }

  function handleApplyTemplate(template: Template) {
    setReplyText(template.content)
    setShowTemplates(false)
  }

  async function handleResolve() {
    await handleUpdateTicket('status', 'resolved')
  }

  async function handleClose() {
    await handleUpdateTicket('status', 'closed')
  }

  // ─── Filter Tabs ───

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'open', label: '開放' },
    { key: 'in_progress', label: '進行中' },
    { key: 'resolved', label: '已解決' },
    { key: 'closed', label: '已關閉' },
  ]

  // ─── Render ───

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      {/* Mobile Header */}
      {mobileShowDetail && selectedTicket && (
        <div className="lg:hidden flex items-center gap-2 p-3 bg-t-card-bg border-b border-t-card-border">
          <button
            onClick={() => setMobileShowDetail(false)}
            className="text-slate-400 hover:text-white cursor-pointer px-2 py-1"
          >
            ← 返回
          </button>
          <span className="text-white text-sm font-medium truncate">
            {selectedTicket.subject ?? '（無主旨）'}
          </span>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* ─── Left Panel: Ticket List ─── */}
        <div
          className={`w-full lg:w-[350px] lg:min-w-[350px] flex-shrink-0 border-r border-t-card-border bg-t-card-bg flex flex-col ${
            mobileShowDetail ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <TicketListHeader onNewTicket={() => setShowNewTicketModal(true)} />

          <FilterTabs
            tabs={filterTabs}
            activeKey={statusFilter}
            onChange={(key) => { setStatusFilter(key); setPage(1) }}
          />

          <StatsBar stats={stats} />

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-slate-400 text-sm text-center py-8 animate-pulse">載入中…</p>
            ) : tickets.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">沒有工單</p>
            ) : (
              tickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  isSelected={ticket.id === selectedTicketId}
                  onClick={() => handleSelectTicket(ticket)}
                />
              ))
            )}
          </div>

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-t-card-border text-xs text-slate-400">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="cursor-pointer disabled:opacity-30"
              >
                ← 上一頁
              </button>
              <span>{page} / {Math.ceil(total / PAGE_SIZE)}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * PAGE_SIZE >= total}
                className="cursor-pointer disabled:opacity-30"
              >
                下一頁 →
              </button>
            </div>
          )}
        </div>

        {/* ─── Right Panel: Conversation ─── */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-[#0f1117] ${
            !mobileShowDetail ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {!selectedTicket ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center space-y-2">
                <p className="text-4xl">📬</p>
                <p>選擇一個工單查看對話</p>
              </div>
            </div>
          ) : messagesLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-400 animate-pulse">載入中…</p>
            </div>
          ) : (
            <>
              <ConversationHeader
                ticket={selectedTicket}
                onUpdateStatus={(v) => handleUpdateTicket('status', v)}
                onUpdatePriority={(v) => handleUpdateTicket('priority', v)}
                onUpdateCategory={(v) => handleUpdateTicket('category', v)}
              />

              <CustomerInfoBar ticket={selectedTicket} />

              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              <ReplyArea
                replyText={replyText}
                onReplyChange={setReplyText}
                onSend={handleSendReply}
                sending={sending}
                templates={templates}
                showTemplates={showTemplates}
                onToggleTemplates={() => setShowTemplates(v => !v)}
                onApplyTemplate={handleApplyTemplate}
                onResolve={handleResolve}
                onClose={handleClose}
                ticketStatus={selectedTicket.status}
              />
            </>
          )}
        </div>
      </div>

      {/* ─── New Ticket Modal ─── */}
      {showNewTicketModal && (
        <NewTicketModal
          onClose={() => setShowNewTicketModal(false)}
          onCreated={() => { setShowNewTicketModal(false); fetchTickets() }}
        />
      )}
    </div>
  )
}

// ─── Sub-Components ───

function TicketListHeader({ onNewTicket }: { onNewTicket: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-t-card-border">
      <h1 className="text-lg font-bold text-white">📬 客服中心</h1>
      <button
        onClick={onNewTicket}
        className="bg-t-btn hover:brightness-110 text-white text-sm px-3 py-1.5 rounded-lg cursor-pointer transition"
      >
        + 新增工單
      </button>
    </div>
  )
}

function FilterTabs({
  tabs,
  activeKey,
  onChange,
}: {
  tabs: { key: StatusFilter; label: string }[]
  activeKey: StatusFilter
  onChange: (key: StatusFilter) => void
}) {
  return (
    <div className="flex gap-1 px-3 py-2 border-b border-t-card-border overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-3 py-1 rounded-full text-xs whitespace-nowrap cursor-pointer transition ${
            activeKey === tab.key
              ? 'bg-t-accent text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function StatsBar({ stats }: { stats: { open: number; inProgress: number; resolved: number } }) {
  return (
    <div className="flex gap-3 px-4 py-2 border-b border-t-card-border text-xs text-slate-400">
      <span>開放 <strong className="text-red-400">{stats.open}</strong></span>
      <span>進行中 <strong className="text-yellow-400">{stats.inProgress}</strong></span>
      <span>已解決 <strong className="text-emerald-400">{stats.resolved}</strong></span>
    </div>
  )
}

function TicketCard({
  ticket,
  isSelected,
  onClick,
}: {
  ticket: Ticket
  isSelected: boolean
  onClick: () => void
}) {
  const showPriority = ticket.priority === 'high' || ticket.priority === 'urgent'

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 border-b border-t-card-border cursor-pointer transition hover:bg-white/5 ${
        isSelected ? 'bg-white/10 border-l-2 border-l-t-accent' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${STATUS_DOT_COLORS[ticket.status]}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {truncate(ticket.subject, 20) || '（無主旨）'}
            </span>
            {showPriority && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_BADGE_COLORS[ticket.priority]}`}>
                {PRIORITY_LABELS[ticket.priority]}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {truncate(ticket.lastMessage, 30) || '尚無訊息'}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
            <span>{CHANNEL_ICONS[ticket.channel] ?? '📩'}</span>
            <span>{ticket.lineDisplayName ?? ticket.email ?? '匿名'}</span>
            <span className="ml-auto">{relativeTime(ticket.lastMessageAt ?? ticket.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConversationHeader({
  ticket,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateCategory,
}: {
  ticket: Ticket
  onUpdateStatus: (v: string) => void
  onUpdatePriority: (v: string) => void
  onUpdateCategory: (v: string) => void
}) {
  return (
    <div className="px-4 py-3 border-b border-t-card-border bg-t-card-bg">
      <h2 className="text-base font-semibold text-white mb-2 truncate">
        {ticket.subject ?? '（無主旨）'}
      </h2>
      <div className="flex flex-wrap gap-2">
        <HeaderDropdown
          label="狀態"
          value={ticket.status}
          options={Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          onChange={onUpdateStatus}
        />
        <HeaderDropdown
          label="優先級"
          value={ticket.priority}
          options={Object.entries(PRIORITY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          onChange={onUpdatePriority}
        />
        <HeaderDropdown
          label="分類"
          value={ticket.category ?? ''}
          options={[{ value: '', label: '未分類' }, ...CATEGORY_OPTIONS]}
          onChange={onUpdateCategory}
        />
      </div>
    </div>
  )
}

function HeaderDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center gap-1 text-xs text-slate-400">
      {label}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-white/5 border border-t-card-border text-white text-xs rounded px-2 py-1 cursor-pointer outline-none focus:border-t-accent"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-[#1a1d2e]">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function CustomerInfoBar({ ticket }: { ticket: Ticket }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-t-card-border text-xs text-slate-400 bg-white/[0.02]">
      <span>{CHANNEL_ICONS[ticket.channel] ?? '📩'}</span>
      <span className="text-white/80">{ticket.lineDisplayName ?? ticket.email ?? '匿名用戶'}</span>
      {ticket.email && <span className="text-slate-500">{ticket.email}</span>}
      <span className="ml-auto text-[10px]">
        {ticket.messageCount} 則訊息 · 建立於 {relativeTime(ticket.createdAt)}
      </span>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  if (message.senderType === 'system') {
    return (
      <div className="text-center">
        <span className="text-[11px] text-slate-500 bg-white/5 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  const isAdmin = message.senderType === 'admin'

  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isAdmin ? 'order-1' : ''}`}>
        <div className={`flex items-center gap-2 mb-0.5 ${isAdmin ? 'justify-end' : ''}`}>
          <span className="text-[11px] text-slate-500">
            {message.senderName ?? (isAdmin ? '客服' : '顧客')}
          </span>
          <span className="text-[10px] text-slate-600">{relativeTime(message.createdAt)}</span>
        </div>
        <div
          className={`px-3 py-2 rounded-xl text-sm whitespace-pre-wrap break-words ${
            isAdmin
              ? 'bg-t-accent/20 text-white rounded-br-sm'
              : 'bg-white/10 text-white/90 rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  )
}

function ReplyArea({
  replyText,
  onReplyChange,
  onSend,
  sending,
  templates,
  showTemplates,
  onToggleTemplates,
  onApplyTemplate,
  onResolve,
  onClose,
  ticketStatus,
}: {
  replyText: string
  onReplyChange: (v: string) => void
  onSend: () => void
  sending: boolean
  templates: Template[]
  showTemplates: boolean
  onToggleTemplates: () => void
  onApplyTemplate: (t: Template) => void
  onResolve: () => void
  onClose: () => void
  ticketStatus: TicketStatus
}) {
  const isClosed = ticketStatus === 'closed'

  return (
    <div className="border-t border-t-card-border bg-t-card-bg p-3 space-y-2 relative">
      {showTemplates && templates.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 bg-[#1a1d2e] border border-t-card-border rounded-t-lg max-h-48 overflow-y-auto shadow-xl">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => onApplyTemplate(t)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 cursor-pointer transition"
            >
              <span className="text-white">{t.title}</span>
              <span className="text-xs text-slate-500 ml-2">{truncate(t.content, 30)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onToggleTemplates}
          className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 cursor-pointer transition"
          title="快速回覆模板"
        >
          📋 模板
        </button>
        {ticketStatus !== 'resolved' && ticketStatus !== 'closed' && (
          <button
            onClick={onResolve}
            className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded bg-emerald-900/20 cursor-pointer transition"
          >
            ✓ 標記已解決
          </button>
        )}
        {ticketStatus !== 'closed' && (
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 cursor-pointer transition"
          >
            關閉工單
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          value={replyText}
          onChange={e => onReplyChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSend() }}
          placeholder={isClosed ? '工單已關閉' : '輸入回覆… (Ctrl+Enter 送出)'}
          disabled={isClosed}
          rows={2}
          className="flex-1 bg-white/5 border border-t-card-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 resize-none outline-none focus:border-t-accent disabled:opacity-40"
        />
        <button
          onClick={onSend}
          disabled={!replyText.trim() || sending || isClosed}
          className="self-end bg-t-btn hover:brightness-110 text-white text-sm px-4 py-2 rounded-lg cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? '…' : '送出'}
        </button>
      </div>
    </div>
  )
}

// ─── New Ticket Modal ───

function NewTicketModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('question')
  const [priority, setPriority] = useState<TicketPriority>('normal')
  const [channel, setChannel] = useState('web')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!subject.trim() || !initialMessage.trim()) {
      setError('請填寫主旨和訊息內容')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          priority,
          channel,
          email: contactEmail.trim() || null,
          lineDisplayName: contactName.trim() || null,
          initialMessage: initialMessage.trim(),
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? '建立失敗')
      }
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立工單失敗')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#1a1d2e] border border-t-card-border rounded-2xl w-full max-w-lg mx-4 p-6 space-y-4 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-white">新增工單</h2>

        <ModalField label="主旨">
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full bg-white/5 border border-t-card-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-t-accent"
            placeholder="簡述問題"
          />
        </ModalField>

        <div className="grid grid-cols-2 gap-3">
          <ModalField label="分類">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-t-card-border rounded-lg px-3 py-2 text-sm text-white cursor-pointer outline-none focus:border-t-accent"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-[#1a1d2e]">{opt.label}</option>
              ))}
            </select>
          </ModalField>

          <ModalField label="優先級">
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as TicketPriority)}
              className="w-full bg-white/5 border border-t-card-border rounded-lg px-3 py-2 text-sm text-white cursor-pointer outline-none focus:border-t-accent"
            >
              {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                <option key={v} value={v} className="bg-[#1a1d2e]">{l}</option>
              ))}
            </select>
          </ModalField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ModalField label="來源">
            <select
              value={channel}
              onChange={e => setChannel(e.target.value)}
              className="w-full bg-white/5 border border-t-card-border rounded-lg px-3 py-2 text-sm text-white cursor-pointer outline-none focus:border-t-accent"
            >
              <option value="web" className="bg-[#1a1d2e]">🌐 網頁</option>
              <option value="line" className="bg-[#1a1d2e]">💬 LINE</option>
              <option value="email" className="bg-[#1a1d2e]">📧 Email</option>
            </select>
          </ModalField>

          <ModalField label="聯絡人名稱">
            <input
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              className="w-full bg-white/5 border border-t-card-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-t-accent"
              placeholder="選填"
            />
          </ModalField>
        </div>

        <ModalField label="Email">
          <input
            value={contactEmail}
            onChange={e => setContactEmail(e.target.value)}
            type="email"
            className="w-full bg-white/5 border border-t-card-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-t-accent"
            placeholder="選填"
          />
        </ModalField>

        <ModalField label="訊息內容">
          <textarea
            value={initialMessage}
            onChange={e => setInitialMessage(e.target.value)}
            rows={3}
            className="w-full bg-white/5 border border-t-card-border rounded-lg px-3 py-2 text-sm text-white resize-none outline-none focus:border-t-accent"
            placeholder="描述問題或需求…"
          />
        </ModalField>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-white px-4 py-2 cursor-pointer transition"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-t-btn hover:brightness-110 text-white text-sm px-4 py-2 rounded-lg cursor-pointer transition disabled:opacity-50"
          >
            {submitting ? '建立中…' : '建立工單'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  )
}
