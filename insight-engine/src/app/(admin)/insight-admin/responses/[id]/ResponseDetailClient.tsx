'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ResponseDetail } from '@/types'

export function ResponseDetailClient({ detail }: { detail: ResponseDetail }) {
  const router = useRouter()
  const [notes, setNotes] = useState(detail.notes ?? '')
  const [editingNotes, setEditingNotes] = useState(false)
  const [status, setStatus] = useState(detail.status)
  const [source, setSource] = useState(detail.utmSource ?? detail.source ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function patchField(body: Record<string, unknown>) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/responses/${detail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '儲存失敗')
        return false
      }
      return true
    } catch {
      alert('儲存失敗')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/responses/${detail.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push(window.location.pathname.replace(/\/responses\/.*$/, '/responses'))
      } else {
        const data = await res.json()
        alert(data.error || '刪除失敗')
      }
    } catch {
      alert('刪除失敗')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
        <div className="flex items-center gap-4">
          <Link href=".." className="text-sm text-cyan-400 hover:text-cyan-300">
            ← 返回列表
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155]">填答詳情</h1>
        </div>
        <div className="flex items-center gap-2">
          {confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleting ? '刪除中...' : '確認刪除'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-[#8a7ca8] hover:text-[#3d3155] text-sm cursor-pointer"
              >
                取消
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-colors cursor-pointer"
            >
              刪除此填答
            </button>
          )}
        </div>
      </div>

      {/* 基本資訊 */}
      <div className="lg-lavender-sharp lg-shimmer lg-lg relative overflow-hidden p-6 space-y-3">
        <h2 className="text-lg font-semibold text-[#3d3155]">基本資訊</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {/* 狀態 - editable */}
          <div>
            <p className="text-[#8a7ca8] mb-1">狀態</p>
            <select
              value={status}
              onChange={async (e) => {
                const v = e.target.value
                const ok = await patchField({ status: v })
                if (ok) setStatus(v)
              }}
              disabled={saving}
              className="bg-white/60 border border-[#b8a9e8]/30 rounded-lg px-2 py-1 text-[#3d3155] text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50 cursor-pointer [&>option]:bg-white [&>option]:text-[#3d3155]"
            >
              <option value="completed">已完成</option>
              <option value="in_progress">進行中</option>
            </select>
          </div>
          {/* 來源 - editable */}
          <div>
            <p className="text-[#8a7ca8] mb-1">來源</p>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              onBlur={async () => {
                const orig = detail.utmSource ?? detail.source ?? ''
                if (source !== orig) await patchField({ source })
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
              disabled={saving}
              placeholder="-"
              className="bg-white/60 border border-[#b8a9e8]/30 rounded-lg px-2 py-1 text-[#3d3155] text-sm w-full focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <p className="text-[#8a7ca8]">提交時間</p>
            <p className="text-[#3d3155]">
              {detail.submittedAt
                ? new Date(detail.submittedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-[#8a7ca8]">建立時間</p>
            <p className="text-[#3d3155]">
              {new Date(detail.createdAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
            </p>
          </div>
        </div>
      </div>

      {/* 備註 */}
      <div className="lg-lavender-sharp lg-shimmer lg-lg relative overflow-hidden p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#3d3155]">備註</h2>
          {!editingNotes && (
            <button
              onClick={() => setEditingNotes(true)}
              className="text-sm text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              編輯
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full bg-white/60 border border-[#b8a9e8]/30 rounded-xl px-4 py-3 text-[#3d3155] text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
              placeholder="在這裡寫備註..."
              autoFocus
            />
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs text-[#3d3155]/60 mr-auto">{notes.length}/500</span>
              <button
                onClick={() => { setNotes(detail.notes ?? ''); setEditingNotes(false) }}
                className="px-3 py-1 text-[#8a7ca8] hover:text-[#3d3155] text-sm cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  const ok = await patchField({ notes })
                  if (ok) setEditingNotes(false)
                }}
                disabled={saving}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        ) : (
          <p className={`text-sm ${notes ? 'text-slate-300' : 'text-[#3d3155]/60'}`}>
            {notes || '尚無備註'}
          </p>
        )}
      </div>

      {/* CRM 標籤 */}
      <div className="lg-lavender-sharp lg-shimmer lg-lg relative overflow-hidden p-6 space-y-3">
        <h2 className="text-lg font-semibold text-[#3d3155]">CRM 標籤</h2>
        <div className="flex flex-wrap gap-2">
          {detail.tags.length === 0 && (
            <p className="text-[#3d3155]/60 text-sm">尚無標籤</p>
          )}
          {detail.tags.map((tag, i) => (
            <span
              key={`${tag.key}-${tag.value}-${i}`}
              className="px-3 py-1 bg-[#b8a9e8]/10/60 text-[#3d3155] rounded-lg text-sm"
            >
              {tag.key}: <span className="text-cyan-300">{tag.value}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 點擊事件 */}
      {detail.clickEvents.length > 0 && (
        <div className="lg-lavender-sharp lg-shimmer lg-lg relative overflow-hidden p-6 space-y-3">
          <h2 className="text-lg font-semibold text-[#3d3155]">點擊事件</h2>
          <div className="flex flex-wrap gap-2">
            {detail.clickEvents.map((e, i) => (
              <span
                key={`${e.eventType}-${i}`}
                className={`px-3 py-1 rounded-lg text-sm ${
                  e.eventType === 'line_friend'
                    ? 'bg-green-500/20 text-green-400'
                    : e.eventType === 'instagram'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-[#b8a9e8]/10/60 text-slate-300'
                }`}
              >
                {e.eventType === 'line_friend' ? 'LINE 加好友' : e.eventType === 'instagram' ? 'IG 追蹤' : e.eventType}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 問答內容 */}
      <div className="lg-lavender-sharp lg-shimmer lg-lg relative overflow-hidden p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#3d3155]">問答內容</h2>
        {detail.answers.map((answer, idx) => (
          <div
            key={`${answer.questionKey}-${idx}`}
            className="border-b border-[#b8a9e8]/10 pb-3 last:border-0"
          >
            <p className="text-sm text-[#8a7ca8] mb-1">
              {answer.questionKey.toUpperCase()}. {answer.questionContent}
            </p>
            <p className="text-[#3d3155]">
              {Array.isArray(answer.value)
                ? answer.value.join('、')
                : answer.value || '-'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
