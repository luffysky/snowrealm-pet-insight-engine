'use client'

import { useEffect, useState, useCallback } from 'react'
import { EmojiPicker } from '@/components/admin/EmojiPicker'
import { AiGeneratePanel } from '@/components/admin/AiGeneratePanel'
import { AiBasicGeneratePanel, type GeneratedMeta } from '@/components/admin/AiBasicGeneratePanel'
import { AiSurveyChat } from '@/components/admin/AiSurveyChat'
import { getOptionEmoji } from '@/lib/optionEmoji'

// ===== Types =====

interface SurveyRow {
  id: string
  title: string
  slug: string
  status: string
  subtitle: string
  cover_title: string
  cover_subtitle: string
  cover_image_url: string | null
  start_button_text: string
  done_title: string
  done_subtitle: string
  variant_group: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  branch_config: BranchConfig | BranchRule[] | string | null
  done_config?: Record<string, unknown> | null
  result_config?: ResultConfig | null
  is_primary: boolean
  is_public_explore?: boolean
  access_password?: string | null
  tenant_id: string
}

interface ResultType {
  key: string
  name: string
  emoji: string
  description: string
  traits?: string[]
}

interface ResultConfig {
  scoringRules: Record<string, Record<string, string>>
  resultTypes: ResultType[]
  tieBreaker?: string
}

interface QuestionRow {
  id: string
  survey_id: string
  key: string
  type: string
  content: string
  options: { label: string; value: string; emoji?: string }[]
  order_index: number
  is_required: boolean
  max_selections: number | null
  route: string | null
  emoji: string | null
  narrative: string | null
  allow_other_text: boolean | null
}

interface BranchRule {
  id: string
  branchKey: string
  routes: Record<string, string[]>
}

type BranchConfig = BranchRule[] | { branchKey: string; routes: Record<string, string[]> }

/** 問卷 status → 後台顯示（對外可見性） */
function surveyVisibilityLabel(status: string): string {
  if (status === 'published') return '公開'
  if (status === 'draft') return '不公開'
  if (status === 'archived') return '已封存'
  return status
}

// ===== Main Component =====

export default function SurveysAdminPage() {
  const [surveys, setSurveys] = useState<SurveyRow[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyRow | null>(null)
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showAiChat, setShowAiChat] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  // Load surveys
  const loadSurveys = useCallback(async () => {
    const res = await fetch('/api/admin/surveys')
    const data = (await res.json()) as SurveyRow[]
    setSurveys(data)
    return data
  }, [])

  useEffect(() => {
    loadSurveys()
      .then((data) => {
        if (data.length > 0) setSelectedSurvey(data[0])
      })
      .catch(() => setError('無法載入問卷列表'))
      .finally(() => setLoading(false))
  }, [loadSurveys])

  // Load questions when survey selected
  const loadQuestions = useCallback(async (surveyId: string) => {
    const res = await fetch(`/api/admin/surveys/${surveyId}/questions`)
    const data = (await res.json()) as QuestionRow[]
    setQuestions(data)
  }, [])

  useEffect(() => {
    if (selectedSurvey) loadQuestions(selectedSurvey.id)
  }, [selectedSurvey, loadQuestions])

  if (loading) return <p className="text-[#6b5fa8]">載入中...</p>
  if (error) return <p className="text-red-400">{error}</p>

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155]/90">問卷管理</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setShowAiChat((v) => !v); setShowCreate(false) }}
            className="px-4 py-2 bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg text-sm transition-all cursor-pointer"
          >
            ✨ AI 對話建立
          </button>
          <button
            type="button"
            onClick={() => { setShowCreate(true); setShowAiChat(false); setCreateError('') }}
            className="px-4 py-2 bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90 text-white rounded-lg text-sm transition-colors cursor-pointer"
          >
            ＋ 新增問卷
          </button>
        </div>
      </div>

      {/* Create survey form */}
      {showCreate && (
        <div className="bg-white/50 border border-[#b8a9e8]/20 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#3d3155]/90">建立新問卷</h2>
          <p className="text-xs text-[#8a7ca8] leading-relaxed">
            建立後狀態為 <span className="text-emerald-400/90">published</span>，公開連結{' '}
            <code className="text-slate-300">/{'{租戶}'}/{'{slug}'}</code> 即可填寫。若暫不要上線，請在問卷設定改為{' '}
            <span className="text-amber-700">draft</span>。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#8a7ca8] mb-1">問卷標題</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="例：2025 寵物生活調查"
                className="w-full px-3 py-2 bg-white/60 border border-[#b8a9e8]/30 rounded-lg text-[#3d3155] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[#8a7ca8] mb-1">Slug（網址路徑）</label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="例：pet-life-2025"
                className="w-full px-3 py-2 bg-white/60 border border-[#b8a9e8]/30 rounded-lg text-[#3d3155] text-sm"
              />
            </div>
          </div>
          {createError && <p className="text-red-400 text-sm">{createError}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={creating}
              onClick={async () => {
                if (!newTitle.trim() || !newSlug.trim()) {
                  setCreateError('標題和 slug 為必填')
                  return
                }
                setCreating(true)
                setCreateError('')
                try {
                  const res = await fetch('/api/admin/surveys', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: newTitle.trim(), slug: newSlug.trim() }),
                  })
                  if (!res.ok) {
                    const data = await res.json()
                    setCreateError(data.error || '建立失敗')
                    return
                  }
                  const created = (await res.json()) as SurveyRow
                  const updated = await loadSurveys()
                  const found = updated.find((s) => s.id === created.id)
                  setSelectedSurvey(found ?? created)
                  setShowCreate(false)
                  setNewTitle('')
                  setNewSlug('')
                } catch {
                  setCreateError('建立失敗')
                } finally {
                  setCreating(false)
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90 disabled:opacity-50 text-white rounded-lg text-sm transition-colors cursor-pointer"
            >
              {creating ? '建立中...' : '建立'}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setCreateError('') }}
              className="px-4 py-2 bg-[#b8a9e8]/10 hover:bg-[#b8a9e8]/15 text-slate-300 rounded-lg text-sm transition-colors cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* AI 對話建立 */}
      {showAiChat && (
        <AiSurveyChat
          onCancel={() => setShowAiChat(false)}
          onDone={async (surveyId) => {
            setShowAiChat(false)
            const updated = await loadSurveys()
            const found = updated.find((s) => s.id === surveyId)
            if (found) setSelectedSurvey(found)
          }}
        />
      )}

      {/* Survey selector - drag to reorder */}
      {surveys.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          {surveys.map((s, i) => (
            <button
              key={s.id}
              type="button"
              draggable
              onClick={() => setSelectedSurvey(s)}
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i) }}
              onDragLeave={() => setDragOverIdx(null)}
              onDrop={async () => {
                if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return }
                const reordered = [...surveys]
                const [moved] = reordered.splice(dragIdx, 1)
                reordered.splice(i, 0, moved)
                setSurveys(reordered)
                setDragIdx(null)
                setDragOverIdx(null)
                await fetch('/api/admin/surveys', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'reorder', orderedIds: reordered.map(x => x.id) }),
                })
              }}
              onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
              className={`px-4 py-2 rounded-lg text-sm transition-all cursor-grab active:cursor-grabbing flex items-center gap-1.5 ${
                dragOverIdx === i && dragIdx !== i
                  ? 'ring-2 ring-t-accent/60 scale-105'
                  : ''
              } ${
                selectedSurvey?.id === s.id
                  ? 'bg-[#b8a9e8]/20 text-t-accent border border-[#b8a9e8]/25'
                  : 'bg-white/50 text-[#8a7ca8] border border-[#b8a9e8]/20 hover:text-[#3d3155]'
              } ${dragIdx === i ? 'opacity-40' : ''}`}
            >
              <span className="text-[#6b5fa8] mr-1 text-xs select-none">⠿</span>
              {s.cover_image_url && (
                <img src={s.cover_image_url} alt="" className="w-5 h-5 rounded object-cover shrink-0 opacity-80" />
              )}
              {s.is_primary && <span className="text-amber-700" title="主問卷">⭐</span>}
              {s.title}
            </button>
          ))}
          {surveys.length > 1 && (
            <span className="text-xs text-[#6b5fa8] select-none">拖曳排序</span>
          )}
        </div>
      )}

      {/* 設為主問卷 */}
      {selectedSurvey && !selectedSurvey.is_primary && (
        <button
          type="button"
          onClick={async () => {
            const res = await fetch('/api/admin/surveys', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'set-primary', surveyId: selectedSurvey.id }),
            })
            if (res.ok) {
              const updated = await loadSurveys()
              const found = updated.find((s) => s.id === selectedSurvey.id)
              if (found) setSelectedSurvey(found)
            }
          }}
          className="px-4 py-2 bg-yellow-600/20 border border-yellow-500/30 text-yellow-300 text-sm rounded-lg hover:bg-yellow-600/30 transition-colors cursor-pointer"
        >
          ⭐ 設為主問卷（首頁封面）
        </button>
      )}
      {selectedSurvey?.is_primary && (
        <p className="text-xs text-amber-700">⭐ 此問卷為主問卷，首頁封面將顯示此問卷內容</p>
      )}

      {selectedSurvey && (
        <>
          <SurveyEditor survey={selectedSurvey} questions={questions} onUpdate={setSelectedSurvey}
            onReloadQuestions={() => loadQuestions(selectedSurvey.id)} 
            onDeleted={async () => {
              const latest = await loadSurveys();
              if (latest.length > 0) setSelectedSurvey(latest[0]);
              else setSelectedSurvey(null);
            }} 
          />
          <QuestionList
            surveyId={selectedSurvey.id}
            questions={questions}
            onReload={() => loadQuestions(selectedSurvey.id)}
          />
        </>
      )}
    </div>
  )
}

// ===== SurveyEditor =====

function SurveyEditor({
  survey,
  questions,
  onUpdate,
  onReloadQuestions,
  onDeleted,
}: {
  survey: SurveyRow & { og_title?: string; og_description?: string; og_image_url?: string }
  questions: QuestionRow[]
  onUpdate: (s: SurveyRow) => void
  onReloadQuestions: () => void
  onDeleted: () => void
}) {
  const [activeTab, setActiveTab] = useState<'basic' | 'branching' | 'og' | 'result'>('basic')
  const [editing, setEditing] = useState(false)
  const [showAiGen, setShowAiGen] = useState(false)
  const [form, setForm] = useState(survey)
  const [saving, setSaving] = useState(false)
  const [ogUploading, setOgUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)

  useEffect(() => { setForm(survey) }, [survey])

  const publicSurveyUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${survey.tenant_id}/${survey.slug}`
      : ''

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'survey-cover')
      const up = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = (await up.json()) as { url?: string; error?: string }
      if (!up.ok || !data.url) {
        alert(data.error || '上傳失敗')
        return
      }
      setForm((prev) => ({ ...prev, cover_image_url: data.url ?? null } as typeof prev))
    } catch {
      alert('上傳失敗')
    } finally {
      setCoverUploading(false)
      e.target.value = ''
    }
  }

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOgUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'survey-og')
      const up = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = (await up.json()) as { url?: string; error?: string }
      if (!up.ok || !data.url) {
        alert(data.error || '上傳失敗')
        return
      }
      const patchRes = await fetch(`/api/admin/surveys/${survey.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          og_image_url: data.url,
        }),
      })
      if (!patchRes.ok) {
        setForm((prev) => ({ ...prev, og_image_url: data.url }))
        alert('圖片已上傳，但寫入問卷失敗，請按「儲存」再試')
        return
      }
      const updated = (await patchRes.json()) as SurveyRow & {
        og_title?: string
        og_description?: string
        og_image_url?: string
      }
      onUpdate(updated)
      setForm(updated)
      alert('OG 圖片已更新並儲存')
    } catch {
      alert('上傳失敗')
    } finally {
      setOgUploading(false)
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/admin/surveys/${survey.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        slug: form.slug,
        subtitle: form.subtitle,
        status: form.status,
        cover_title: form.cover_title,
        cover_subtitle: form.cover_subtitle,
        start_button_text: form.start_button_text,
        done_title: form.done_title,
        done_subtitle: form.done_subtitle,
        variant_group: form.variant_group || null,
        scheduled_start: form.scheduled_start || null,
        scheduled_end: form.scheduled_end || null,
        og_title: form.og_title || null,
        og_description: form.og_description || null,
        og_image_url: form.og_image_url || null,
        cover_image_url: form.cover_image_url || null,
        access_password: form.access_password || null,
        done_config: form.done_config ?? null,
        is_public_explore: form.is_public_explore ?? false,
      }),
    })
    if (res.ok) {
      const updated = (await res.json()) as SurveyRow
      onUpdate(updated)
      setEditing(false)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('⚠️ 確定要刪除這份問卷嗎？\n\n這將會連帶刪除所有題目、填寫記錄與分析資料，動作無法復原！')) {
      return
    }
    const res = await fetch(`/api/admin/surveys/${survey.id}`, { method: 'DELETE' })
    if (res.ok) {
      alert('刪除成功')
      onDeleted()
    } else {
      alert('刪除失敗')
    }
  }

  const fields: { key: keyof SurveyRow; label: string; multiline?: boolean }[] = [
    { key: 'title', label: '問卷標題' },
    { key: 'subtitle', label: '副標題' },
    { key: 'cover_title', label: '封面標題' },
    { key: 'cover_subtitle', label: '封面描述', multiline: true },
    { key: 'start_button_text', label: '開始按鈕文字' },
    { key: 'done_title', label: '完成標題' },
    { key: 'done_subtitle', label: '完成描述', multiline: true },
  ]

  return (
    <div className="bg-white/40 backdrop-blur-sm border border-[#b8a9e8]/25 rounded-[20px] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#3d3155]">問卷設定</h2>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              survey.status === 'published'
                ? 'bg-emerald-500/20 text-emerald-400'
                : survey.status === 'draft'
                  ? 'bg-yellow-500/20 text-amber-700'
                  : 'bg-[#b5a8d0]/20 text-[#8a7ca8]'
            }`}
            title={`資料庫狀態：${survey.status}`}
          >
            {surveyVisibilityLabel(survey.status)}
          </span>
          {activeTab !== 'branching' && !editing && (
            <button type="button" onClick={() => setEditing(true)}
              className="text-sm text-t-accent hover:text-t-accent cursor-pointer">編輯</button>
          )}
          {activeTab !== 'branching' && editing && (
            <div className="flex gap-2">
              <button type="button" onClick={() => { setEditing(false); setForm(survey) }}
                className="text-sm text-[#8a7ca8] hover:text-[#3d3155] cursor-pointer">取消</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="text-sm text-t-accent hover:text-t-accent disabled:opacity-40 cursor-pointer">
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top-level tabs */}
      <div className="flex gap-2 border-b border-[#b8a9e8]/25 pb-3">
        <button type="button" onClick={() => setActiveTab('basic')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
            activeTab === 'basic'
              ? 'bg-[#b8a9e8]/20 text-t-accent border border-[#b8a9e8]/25'
              : 'bg-white/50 text-[#8a7ca8] border border-[#b8a9e8]/20 hover:text-[#3d3155]'
          }`}>設定</button>
        <button type="button" onClick={() => setActiveTab('og')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
            activeTab === 'og'
              ? 'bg-[#b8a9e8]/20 text-t-accent border border-[#b8a9e8]/25'
              : 'bg-white/50 text-[#8a7ca8] border border-[#b8a9e8]/20 hover:text-[#3d3155]'
          }`}>OG / SEO</button>
        <button type="button" onClick={() => setActiveTab('branching')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
            activeTab === 'branching'
              ? 'bg-[#b8a9e8]/20 text-t-accent border border-[#b8a9e8]/25'
              : 'bg-white/50 text-[#8a7ca8] border border-[#b8a9e8]/20 hover:text-[#3d3155]'
          }`}>分流邏輯</button>
        <button type="button" onClick={() => setActiveTab('result')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
            activeTab === 'result'
              ? 'bg-[#b8a9e8]/20 text-t-accent border border-[#b8a9e8]/25'
              : 'bg-white/50 text-[#8a7ca8] border border-[#b8a9e8]/20 hover:text-[#3d3155]'
          }`}>結果設定</button>
      </div>

      {/* Basic settings - editing */}
      {activeTab === 'basic' && editing && (
        <div className="space-y-3">
          <div className="flex justify-end mb-2">
            <button type="button" onClick={() => setShowAiGen(true)} className="px-3 py-1.5 bg-cyan-900/40 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/60 transition-colors rounded text-sm cursor-pointer">
              ✨ 讓 AI 幫我想文案
            </button>
          </div>
          {showAiGen && (
            <AiBasicGeneratePanel 
              onCancel={() => setShowAiGen(false)} 
              onDone={(meta: GeneratedMeta) => {
                setForm(prev => ({
                  ...prev,
                  title: meta.title || prev.title,
                  subtitle: meta.subtitle || prev.subtitle,
                  cover_title: meta.coverTitle || prev.cover_title,
                  cover_subtitle: meta.coverSubtitle || prev.cover_subtitle,
                  done_title: meta.doneTitle || prev.done_title,
                  done_subtitle: meta.doneSubtitle || prev.done_subtitle,
                  start_button_text: meta.startButtonText || prev.start_button_text,
                  og_title: meta.ogTitle || prev.og_title,
                  og_description: meta.ogDescription || prev.og_description
                }))
                setShowAiGen(false)
              }} 
            />
          )}
          <div className="rounded-xl border border-[#b8a9e8]/25 bg-white/35 backdrop-blur-sm p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-[#3d3155]/90">對外可見性</p>
              <p className="text-xs text-[#3d3155]0 mt-1">
                每份問卷獨立設定。選「不公開」時，公開網址（格式 <span className="font-mono text-[#8a7ca8]">/租戶代碼/slug</span>
                ）會回傳 404。
              </p>
            </div>
            <div className="space-y-2">
              {(
                [
                  { value: 'published' as const, title: '公開', desc: '任何人可用問卷連結填寫（status = published）' },
                  { value: 'draft' as const, title: '不公開', desc: '僅後台管理，對外連結無法開啟（status = draft）' },
                  { value: 'archived' as const, title: '已封存', desc: '已下架，不建議再分享（status = archived）' },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.status === opt.value
                      ? 'border-cyan-500/50 bg-cyan-950/25'
                      : 'border-[#b8a9e8]/20 hover:border-[#b8a9e8]/30 bg-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="survey-visibility"
                    className="mt-1 accent-cyan-500"
                    checked={form.status === opt.value}
                    onChange={() => setForm({ ...form, status: opt.value })}
                  />
                  <div>
                    <span className="text-sm text-[#3d3155]/90 font-medium">{opt.title}</span>
                    <p className="text-xs text-[#3d3155]0 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <label className="text-sm text-[#3d3155]/50 sm:w-20">Slug</label>
            <input type="text" value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              className="flex-1 bg-white/50 border border-[#b8a9e8]/20 rounded-lg px-3 py-1.5 text-sm text-[#3d3155] font-mono" />
          </div>
          {fields.map((f) => (
            <div key={f.key} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
              <label className="text-sm text-[#3d3155]/50 sm:w-20 sm:pt-1.5 shrink-0">{f.label}</label>
              {f.multiline ? (
                <textarea value={form[f.key] as string} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  rows={3} className="flex-1 bg-white/50 border border-[#b8a9e8]/20 rounded-lg px-3 py-1.5 text-sm text-[#3d3155] resize-none" />
              ) : (
                <input type="text" value={form[f.key] as string} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="flex-1 bg-white/50 border border-[#b8a9e8]/20 rounded-lg px-3 py-1.5 text-sm text-[#3d3155]" />
              )}
            </div>
          ))}
          {/* 封面圖片上傳 */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <label className="text-sm text-[#3d3155]/50 sm:w-20 sm:pt-1.5 shrink-0">封面圖片</label>
            <div className="flex-1 space-y-2">
              {form.cover_image_url && (
                <div className="relative w-full max-w-xs">
                  <img
                    src={form.cover_image_url}
                    alt="封面圖片預覽"
                    className="w-full max-h-40 object-cover rounded-lg border border-[#b8a9e8]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, cover_image_url: null } as typeof prev))}
                    className="absolute top-1 right-1 bg-white/55 backdrop-blur-sm text-[#3d3155] hover:text-[#3d3155] rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer"
                  >✕</button>
                </div>
              )}
              <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                coverUploading ? 'opacity-50 cursor-not-allowed' : 'border-[#b8a9e8]/30 text-[#8a7ca8] hover:text-[#3d3155] hover:border-[#b8a9e8]/35'
              }`}>
                <input type="file" accept="image/*" className="hidden" disabled={coverUploading} onChange={handleCoverImageUpload} />
                {coverUploading ? '上傳中...' : '📷 上傳封面圖片'}
              </label>
              <p className="text-xs text-[#3d3155]0">建議尺寸 1200×630，支援 JPG / PNG / WebP</p>
            </div>
          </div>
          {/* 存取密碼 */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <label className="text-sm text-[#3d3155]/50 sm:w-20 sm:pt-1.5 shrink-0">存取密碼</label>
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={form.access_password ?? ''}
                onChange={(e) => setForm({ ...form, access_password: e.target.value })}
                placeholder="留空表示公開，填入則需輸入密碼才能開啟問卷"
                className="w-full bg-white/50 border border-[#b8a9e8]/20 rounded-lg px-3 py-1.5 text-sm text-[#3d3155]"
              />
              <p className="text-xs text-[#3d3155]0">設定後，填答者開啟問卷時需輸入此密碼</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <label className="text-sm text-[#3d3155]/50 sm:w-20 sm:pt-1.5 shrink-0">A/B 群組</label>
            <input type="text" value={form.variant_group ?? ''} onChange={(e) => setForm({ ...form, variant_group: e.target.value })}
              placeholder="留空表示不參與 A/B" className="flex-1 bg-white/50 border border-[#b8a9e8]/20 rounded-lg px-3 py-1.5 text-sm text-[#3d3155]" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <label className="text-sm text-[#3d3155]/50 sm:w-20 sm:pt-1.5 shrink-0">排程開始</label>
            <input type="datetime-local" value={form.scheduled_start?.slice(0, 16) ?? ''}
              onChange={(e) => setForm({ ...form, scheduled_start: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="flex-1 bg-white/50 border border-[#b8a9e8]/20 rounded-lg px-3 py-1.5 text-sm text-[#3d3155]" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <label className="text-sm text-[#3d3155]/50 sm:w-20 sm:pt-1.5 shrink-0">排程結束</label>
            <input type="datetime-local" value={form.scheduled_end?.slice(0, 16) ?? ''}
              onChange={(e) => setForm({ ...form, scheduled_end: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="flex-1 bg-white/50 border border-[#b8a9e8]/20 rounded-lg px-3 py-1.5 text-sm text-[#3d3155]" />
          </div>
          {/* 完成頁設定 */}
          <div className="pt-4 mt-2 border-t border-[#b8a9e8]/20 space-y-3">
            <p className="text-sm font-medium text-[#3d3155]/70">完成頁設定</p>
            {(() => {
              const dc = (form.done_config ?? {}) as Record<string, unknown>
              const wf = (dc.waitlistFields as Record<string, boolean> | undefined) ?? {}
              const update = (patch: Record<string, unknown>) =>
                setForm({ ...form, done_config: { ...dc, ...patch } })
              return (
                <div className="space-y-2 pl-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-cyan-500"
                      checked={!!dc.showWaitlist}
                      onChange={(e) => update({ showWaitlist: e.target.checked })} />
                    <span className="text-sm text-[#3d3155]/70">顯示封測/報名表單</span>
                  </label>
                  {!!dc.showWaitlist && (
                    <div className="pl-6 space-y-1.5">
                      {(['nickname', 'email', 'lineId'] as const).map((field) => (
                        <label key={field} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-3.5 h-3.5 accent-cyan-500"
                            checked={!!wf[field]}
                            onChange={(e) => update({ waitlistFields: { ...wf, [field]: e.target.checked } })} />
                          <span className="text-xs text-[#8a7ca8]">
                            {field === 'nickname' ? '暱稱欄位' : field === 'email' ? 'Email 欄位' : 'LINE ID / IG 欄位'}
                          </span>
                        </label>
                      ))}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#6b5fa8] w-20 shrink-0">按鈕文字</span>
                        <input type="text"
                          value={(dc.waitlistButtonText as string) ?? ''}
                          onChange={(e) => update({ waitlistButtonText: e.target.value })}
                          placeholder="預設：立即加入候補"
                          className="flex-1 bg-white/50 border border-[#b8a9e8]/20 rounded px-2 py-1 text-xs text-[#3d3155]" />
                      </div>
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-cyan-500"
                      checked={!!dc.showStoryCard}
                      onChange={(e) => update({ showStoryCard: e.target.checked })} />
                    <span className="text-sm text-[#3d3155]/70">顯示故事卡片</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-cyan-500"
                      checked={!!dc.showDownloadAnswers}
                      onChange={(e) => update({ showDownloadAnswers: e.target.checked })} />
                    <span className="text-sm text-[#3d3155]/70">顯示下載回答按鈕</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6b5fa8] w-20 shrink-0">自訂 CTA 文字</span>
                    <input type="text"
                      value={(dc.customCtaText as string) ?? ''}
                      onChange={(e) => update({ customCtaText: e.target.value })}
                      placeholder="選填"
                      className="flex-1 bg-white/50 border border-[#b8a9e8]/20 rounded px-2 py-1 text-xs text-[#3d3155]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6b5fa8] w-20 shrink-0">自訂 CTA 連結</span>
                    <input type="text"
                      value={(dc.customCtaUrl as string) ?? ''}
                      onChange={(e) => update({ customCtaUrl: e.target.value })}
                      placeholder="選填"
                      className="flex-1 bg-white/50 border border-[#b8a9e8]/20 rounded px-2 py-1 text-xs text-[#3d3155]" />
                  </div>
                </div>
              )
            })()}
          </div>

          {/* 探索頁公開設定 */}
          <div className="pt-3 mt-1 border-t border-[#b8a9e8]/20">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-cyan-500"
                checked={!!form.is_public_explore}
                onChange={(e) => setForm({ ...form, is_public_explore: e.target.checked })} />
              <span className="text-sm text-[#3d3155]/70">☐ 公開到探索頁（讓所有人瀏覽此問卷）</span>
            </label>
          </div>

          <div className="pt-4 mt-4 border-t border-[#b8a9e8]/20 flex justify-end">
             <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 rounded-lg text-sm border border-red-500/20 transition-colors cursor-pointer">
               🗑️ 刪除這份問卷
             </button>
          </div>
        </div>
      )}

      {/* Basic settings - read-only */}
      {activeTab === 'basic' && !editing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="col-span-1 sm:col-span-2 flex flex-wrap items-baseline gap-2">
            <span className="text-[#6b5fa8]">對外可見性：</span>
            <span
              className={
                survey.status === 'published'
                  ? 'text-emerald-400 font-medium'
                  : survey.status === 'draft'
                    ? 'text-amber-400 font-medium'
                    : 'text-[#8a7ca8] font-medium'
              }
            >
              {surveyVisibilityLabel(survey.status)}
            </span>
            <span className="text-[10px] text-slate-600 font-mono">({survey.status})</span>
          </div>
          <div><span className="text-[#6b5fa8]">Slug：</span><span className="text-[#3d3155] font-mono">{survey.slug}</span></div>
          {fields.map((f) => (
            <div key={f.key}>
              <span className="text-[#6b5fa8]">{f.label}：</span>
              <span className="text-[#3d3155]">{String(survey[f.key] ?? '').slice(0, 60)}{String(survey[f.key] ?? '').length > 60 ? '...' : ''}</span>
            </div>
          ))}
          <div><span className="text-[#6b5fa8]">A/B 群組：</span><span className="text-[#3d3155]">{survey.variant_group ?? '—'}</span></div>
          <div><span className="text-[#6b5fa8]">排程開始：</span><span className="text-[#3d3155]">{survey.scheduled_start ? new Date(survey.scheduled_start).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : '—'}</span></div>
          <div><span className="text-[#6b5fa8]">排程結束：</span><span className="text-[#3d3155]">{survey.scheduled_end ? new Date(survey.scheduled_end).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : '—'}</span></div>
          <div className="col-span-1 sm:col-span-2 mt-2">
            <span className="text-[#6b5fa8] block mb-1">問卷專屬連結：</span>
            {survey.status !== 'published' && (
              <p className="text-xs text-amber-700 mb-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
                目前為 <strong className="font-semibold">{surveyVisibilityLabel(survey.status)}</strong>（{survey.status}），公開網址會顯示
                404。請至「編輯」→「對外可見性」改為<strong className="font-semibold">公開</strong>後再分享。
              </p>
            )}
            <div className="flex items-center gap-2">
              <a
                href={`/${survey.tenant_id}/${survey.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`break-all font-mono hover:underline ${
                  survey.status === 'published' ? 'text-t-accent' : 'text-[#3d3155]0 pointer-events-none'
                }`}
                aria-disabled={survey.status !== 'published'}
                onClick={(e) => {
                  if (survey.status !== 'published') e.preventDefault()
                }}
              >
                {typeof window !== 'undefined' ? window.location.origin : ''}/{survey.tenant_id}/{survey.slug}
              </a>
              <button
                onClick={() => {
                  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${survey.tenant_id}/${survey.slug}`;
                  navigator.clipboard.writeText(url);
                  alert(survey.status === 'published' ? '🔗 已複製連結' : '已複製網址（若為草稿，對外仍為 404，請先發布）');
                }}
                className="px-2 py-1 bg-white/50 hover:bg-[#b8a9e8]/10 text-slate-300 rounded text-xs shrink-0 cursor-pointer"
              >
                複製
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OG Settings - editing */}
      {activeTab === 'og' && editing && (
        <div className="space-y-3">
          <p className="text-xs text-amber-700 mb-2">
            ⚠️ 若留空，則會自動採用網站預設的 Meta 標籤。公開問卷頁會輸出 Open Graph / Twitter Card（伺服端
            <code className="mx-0.5 text-slate-300">generateMetadata</code>）。
          </p>
          <p className="text-[11px] text-[#3d3155]0 leading-relaxed">
            正式環境請確認 <code className="text-[#8a7ca8]">NEXT_PUBLIC_BASE_URL</code> 與實際網域一致，分享預覽與 canonical
            網址才會正確。圖片建議可公開存取的 HTTPS 網址（上傳至 R2 後會自動符合）。
          </p>
          {publicSurveyUrl && survey.status === 'published' && (
            <a
              href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(publicSurveyUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
            >
              用 Facebook 分享除錯工具檢查此問卷頁
            </a>
          )}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <label className="text-sm text-[#3d3155]/50 sm:w-24 sm:pt-1.5 shrink-0">OG 標題</label>
            <input type="text" value={form.og_title ?? ''} onChange={(e) => setForm({ ...form, og_title: e.target.value })}
              placeholder="分享時的標題..." className="flex-1 bg-white/50 border border-[#b8a9e8]/20 rounded-lg px-3 py-1.5 text-sm text-[#3d3155]" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <label className="text-sm text-[#3d3155]/50 sm:w-24 sm:pt-1.5 shrink-0">OG 描述</label>
            <textarea value={form.og_description ?? ''} onChange={(e) => setForm({ ...form, og_description: e.target.value })}
              rows={3} placeholder="分享時的描述文字..." className="flex-1 bg-white/50 border border-[#b8a9e8]/20 rounded-lg px-3 py-1.5 text-sm text-[#3d3155] resize-none" />
          </div>
          <div className="flex flex-col gap-2 sm:gap-3">
            <label className="text-sm text-[#3d3155]/50 sm:w-24 shrink-0">OG 圖片</label>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3 py-1.5 rounded-lg bg-[#b8a9e8]/10 hover:bg-[#b8a9e8]/15 text-[#3d3155] text-xs cursor-pointer border border-[#b8a9e8]/30">
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" className="hidden" onChange={handleOgImageUpload} disabled={ogUploading} />
                  {ogUploading ? '上傳中…' : '📤 上傳圖片'}
                </label>
                <span className="text-[10px] text-[#3d3155]0">走 /api/admin/upload（R2），資料夾 survey-og</span>
              </div>
              <input type="text" value={form.og_image_url ?? ''} onChange={(e) => setForm({ ...form, og_image_url: e.target.value })}
                placeholder="或貼上圖片 HTTPS 網址…" className="w-full bg-white/50 border border-[#b8a9e8]/20 rounded-lg px-3 py-1.5 text-sm text-[#3d3155]" />
            </div>
          </div>
        </div>
      )}

      {/* OG Settings - read-only */}
      {activeTab === 'og' && !editing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {publicSurveyUrl && survey.status === 'published' && (
            <div className="col-span-1 sm:col-span-2">
              <a
                href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(publicSurveyUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
              >
                Facebook 分享除錯工具（檢查此問卷頁 OG 是否被抓到）
              </a>
            </div>
          )}
          <div className="col-span-1 sm:col-span-2">
            <span className="text-[#6b5fa8] block mb-1">OG 標題：</span>
            <span className="text-[#3d3155]">{survey.og_title || <span className="text-[#8a7ca8] italic">未設定（將使用網站預設）</span>}</span>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <span className="text-[#6b5fa8] block mb-1">OG 描述：</span>
            <span className="text-[#3d3155]">{survey.og_description || <span className="text-[#8a7ca8] italic">未設定（將使用網站預設）</span>}</span>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <span className="text-[#6b5fa8] block mb-1">OG 圖片 URL：</span>
            {survey.og_image_url ? (
               <a href={survey.og_image_url} target="_blank" rel="noreferrer" className="text-t-accent hover:underline break-all">
                 {survey.og_image_url}
               </a>
            ) : (
               <span className="text-[#8a7ca8] italic">未設定（將使用網站預設）</span>
            )}
            {survey.og_image_url && (
              <div className="mt-2 rounded overflow-hidden max-w-sm border border-[#b8a9e8]/20">
                <img src={survey.og_image_url} alt="OG Preview" className="w-full h-auto" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Branching tab */}
      {activeTab === 'branching' && (
        <BranchingPanel survey={survey} questions={questions} onUpdate={onUpdate} onReloadQuestions={onReloadQuestions} />
      )}

      {/* Result config tab */}
      {activeTab === 'result' && (
        <ResultConfigPanel
          survey={survey}
          questions={questions}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}

// ===== Branching Panel (sub-tabs: 主題目 / 分流B / 分流C / ...) =====

const ROUTE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  main: { bg: 'bg-[#b8a9e8]/20', text: 'text-t-accent', border: 'border-[#b8a9e8]/25' },
  B: { bg: 'bg-yellow-500/20', text: 'text-amber-700', border: 'border-yellow-500/30' },
  C: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  D: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  E: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
}

function BranchingPanel({
  survey,
  questions,
  onUpdate,
  onReloadQuestions,
}: {
  survey: SurveyRow
  questions: QuestionRow[]
  onUpdate: (s: SurveyRow) => void
  onReloadQuestions: () => void
}) {
  // Derive existing branch routes from questions
  const existingBranchRoutes = Array.from(
    new Set(questions.filter((q) => q.route && q.route !== 'all' && q.route !== 'A').map((q) => q.route!))
  ).sort()

  const [branchNames, setBranchNames] = useState<Record<string, string>>(() => {
    const names: Record<string, string> = {}
    for (const r of existingBranchRoutes) names[r] = `分流 ${r}`
    return names
  })
  const [activeSubTab, setActiveSubTab] = useState<'main' | string>('main')
  const [branchSaving, setBranchSaving] = useState(false)
  const [branchError, setBranchError] = useState('')
  const [branchSuccess, setBranchSuccess] = useState('')
  const [routeChanges, setRouteChanges] = useState<Record<string, string>>({})

  // Branch rules state — 多規則陣列
  const savedRules = normalizeBranchRules(survey.branch_config)
  const [rules, setRules] = useState<BranchRule[]>(savedRules)
  const [branchDirty, setBranchDirty] = useState(false)
  const [editingName, setEditingName] = useState<string | null>(null)

  // Questions grouped by route
  const mainQuestions = questions.filter((q) => q.route === 'all' || q.route === 'A' || !q.route)
  const branchQuestions = (route: string) => questions.filter((q) => q.route === route)
  const branchableQuestions = questions.filter((q) => q.type !== 'text' && (q.route === 'all' || !q.route || q.route === 'A') && q.options.length > 0)

  const [customRoutes, setCustomRoutes] = useState<string[]>([])

  // All route keys used in the system
  const allRoutes = Array.from(new Set([...existingBranchRoutes, ...customRoutes]))

  const handleAddRoute = (route: string) => {
    const r = route.trim().toUpperCase()
    if (r && r !== 'ALL' && r !== 'A' && !allRoutes.includes(r)) {
      setCustomRoutes((prev) => [...prev, r])
      setBranchNames((prev) => ({ ...prev, [r]: `分流 ${r}` }))
    }
  }

  const handleQuestionRouteChange = async (questionId: string, newRoute: string) => {
    setRouteChanges((prev) => ({ ...prev, [questionId]: newRoute }))
    await fetch(`/api/admin/questions/${questionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ route: newRoute }),
    })
    onReloadQuestions()
  }

  // 新增一條空規則
  const handleAddRule = () => {
    setRules(prev => [...prev, { id: crypto.randomUUID(), branchKey: '', routes: {} }])
    setBranchDirty(true)
  }

  // 刪除某條規則
  const handleRemoveRule = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId))
    setBranchDirty(true)
  }

  // 更新某條規則的 branchKey
  const handleRuleBranchKeyChange = (ruleId: string, key: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, branchKey: key, routes: {} } : r))
    setBranchDirty(true)
  }

  // 更新某條規則中某個選項的對應路線
  const handleRuleAnswerRoute = (ruleId: string, optionValue: string, route: string) => {
    setRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r
      // 先從所有路線移除此 optionValue
      const newRoutes: Record<string, string[]> = {}
      for (const [k, vals] of Object.entries(r.routes)) {
        newRoutes[k] = (vals as string[]).filter(v => v !== optionValue)
      }
      // 加入目標路線
      if (route !== 'A') {
        if (!newRoutes[route]) newRoutes[route] = []
        newRoutes[route].push(optionValue)
      }
      // 保留 A 路線
      if (!newRoutes['A']) newRoutes['A'] = []
      return { ...r, routes: newRoutes }
    }))
    setBranchDirty(true)
  }

  // 取得某規則中某選項目前對應的路線
  const getOptionRoute = (rule: BranchRule, optionValue: string): string => {
    for (const [route, values] of Object.entries(rule.routes)) {
      if ((values as string[]).includes(optionValue)) return route
    }
    return 'A'
  }

  const handleSaveBranchConfig = async () => {
    // 驗證每條規則都要有 branchKey
    for (const rule of rules) {
      if (!rule.branchKey) { setBranchError('每條規則都需要選擇分流題目'); return }
    }
    if (!confirm(`確定要儲存分流設定嗎？\n共 ${rules.length} 條規則\n這會影響前台問卷的分流邏輯。`)) return

    // 確保每條規則的 routes 都有正確的選項 mapping
    const finalRules = rules.map(rule => {
      const q = branchableQuestions.find(q => q.key === rule.branchKey)
      if (!q) return rule
      const routes: Record<string, string[]> = { A: [] }
      for (const r of allRoutes) routes[r] = []
      for (const opt of q.options) {
        const targetRoute = getOptionRoute(rule, opt.value)
        if (!routes[targetRoute]) routes[targetRoute] = []
        routes[targetRoute].push(opt.value)
      }
      return { ...rule, routes }
    })

    setBranchSaving(true); setBranchError('')
    try {
      const res = await fetch(`/api/admin/surveys/${survey.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch_config: finalRules }),
      })
      if (!res.ok) { setBranchError('儲存失敗'); return }
      const updated = (await res.json()) as SurveyRow
      onUpdate(updated)
      setBranchDirty(false)
      setBranchSuccess('分流設定已儲存')
      setTimeout(() => setBranchSuccess(''), 3000)
    } catch { setBranchError('儲存失敗') }
    finally { setBranchSaving(false) }
  }

  const getColor = (route: string) => ROUTE_COLORS[route] ?? ROUTE_COLORS.main

  return (
    <div className="space-y-4">
      {/* Sub-tabs: 主題目, 分流B, 分流C, ... */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setActiveSubTab('main')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
            activeSubTab === 'main'
              ? `${ROUTE_COLORS.main.bg} ${ROUTE_COLORS.main.text} border ${ROUTE_COLORS.main.border}`
              : 'bg-white/50 text-[#8a7ca8] border border-[#b8a9e8]/20 hover:text-[#3d3155]'
          }`}>
          主題目（{mainQuestions.length} 題）
        </button>
        {allRoutes.map((route) => {
          const color = getColor(route)
          const count = branchQuestions(route).length
          const isActive = activeSubTab === route
          return (
            <div key={route} className="flex items-center gap-0">
              {editingName === route ? (
                <input type="text" autoFocus
                  value={branchNames[route] ?? `分流 ${route}`}
                  onChange={(e) => setBranchNames((prev) => ({ ...prev, [route]: e.target.value }))}
                  onBlur={() => setEditingName(null)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setEditingName(null) }}
                  className="bg-white/50 border border-[#b8a9e8]/30 rounded-lg px-2 py-1 text-sm text-[#3d3155] w-28" />
              ) : (
                <button type="button" onClick={() => setActiveSubTab(route)}
                  onDoubleClick={() => setEditingName(route)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                    isActive ? `${color.bg} ${color.text} border ${color.border}` : 'bg-white/50 text-[#8a7ca8] border border-[#b8a9e8]/20 hover:text-[#3d3155]'
                  }`}
                  title="雙擊可改名">
                  {branchNames[route] ?? `分流 ${route}`}（{count} 題）
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* ===== 主題目 sub-tab ===== */}
      {activeSubTab === 'main' && (
        <div className="space-y-4">
          {/* 多規則卡片 */}
          <div className="bg-white/30 backdrop-blur-sm border border-[#b8a9e8]/20 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#3d3155]/70">分流規則設定</h3>
              <button type="button" onClick={handleAddRule}
                className="px-3 py-1.5 bg-[#b8a9e8]/20 text-t-accent border border-[#b8a9e8]/25 rounded-lg text-xs transition-colors cursor-pointer hover:opacity-80">
                ＋ 新增規則
              </button>
            </div>

            {rules.length === 0 && (
              <p className="text-xs text-[#8a7ca8] text-center py-4">
                尚無分流規則。按下「＋ 新增規則」來設定跳題邏輯。
              </p>
            )}

            {rules.map((rule, idx) => {
              const ruleQuestion = branchableQuestions.find(q => q.key === rule.branchKey) ?? null
              return (
                <div key={rule.id} className="bg-white/35 backdrop-blur-sm border border-[#b8a9e8]/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6b5fa8] font-mono">規則 #{idx + 1}</span>
                    <button type="button" onClick={() => handleRemoveRule(rule.id)}
                      className="text-xs text-red-400/60 hover:text-red-300 cursor-pointer">移除</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr] gap-2 sm:items-center">
                    <label className="text-xs text-[#6b5fa8]">分流題</label>
                    <select value={rule.branchKey}
                      onChange={(e) => handleRuleBranchKeyChange(rule.id, e.target.value)}
                      className="bg-white/50 border border-[#b8a9e8]/20 rounded-lg px-3 py-2 text-sm text-[#3d3155]">
                      <option value="">—— 請選擇 ——</option>
                      {branchableQuestions.map((q) => (
                        <option key={q.id} value={q.key}>{q.key} — {q.content.slice(0, 50)}</option>
                      ))}
                    </select>
                  </div>

                  {ruleQuestion && (
                    <div className="space-y-2">
                      <p className="text-xs text-[#6b5fa8]">各答案對應分流：</p>
                      {ruleQuestion.options.map((option) => (
                        <div key={option.value}
                          className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-2 sm:items-center bg-white/30 backdrop-blur-sm border border-[#b8a9e8]/20 rounded-lg p-2.5">
                          <span className="text-sm text-[#3d3155]">{option.label}</span>
                          <select value={getOptionRoute(rule, option.value)}
                            onChange={(e) => handleRuleAnswerRoute(rule.id, option.value, e.target.value)}
                            className="bg-white/50 border border-[#b8a9e8]/30 rounded px-2 py-1.5 text-sm text-[#3d3155]">
                            <option value="A">原始問卷</option>
                            {allRoutes.map((r) => (
                              <option key={r} value={r}>{branchNames[r] ?? `分流 ${r}`}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {branchError && <p className="text-sm text-red-400">{branchError}</p>}
            {branchSuccess && <p className="text-sm text-emerald-400">{branchSuccess}</p>}

            <div className="flex items-center gap-3">
              <button type="button" onClick={handleSaveBranchConfig}
                disabled={branchSaving || !branchDirty}
                className="px-4 py-2 bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90 disabled:opacity-50 text-white rounded-lg text-sm transition-colors cursor-pointer">
                {branchSaving ? '儲存中...' : '儲存分流規則'}
              </button>
              {branchDirty ? <span className="text-xs text-amber-700">有未儲存的變更</span>
                : <span className="text-xs text-[#8a7ca8]">尚未修改</span>}
            </div>
          </div>

          {/* Main questions list */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[#8a7ca8]">主題目 + 共用題（route: all / A）</h3>
            {mainQuestions.map((q) => (
              <BranchQuestionCard key={q.id} question={q} allRoutes={allRoutes} branchNames={branchNames}
                pendingRoute={routeChanges[q.id]} onRouteChange={handleQuestionRouteChange} onAddRoute={handleAddRoute} />
            ))}
          </div>
        </div>
      )}

      {/* ===== Branch sub-tabs ===== */}
      {allRoutes.includes(activeSubTab) && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium" style={{ color: getColor(activeSubTab).text.replace('text-', '') }}>
            <span className={getColor(activeSubTab).text}>
              {branchNames[activeSubTab] ?? `分流 ${activeSubTab}`}
            </span>
            <span className="text-[#6b5fa8] ml-2">（{branchQuestions(activeSubTab).length} 題）</span>
          </h3>
          <p className="text-xs text-[#6b5fa8]">這些題目只會出現在此分流。可透過下拉將題目移到其他分流或主題目。</p>
          {branchQuestions(activeSubTab).length === 0 ? (
            <p className="text-sm text-[#3d3155]/30 py-4 text-center">此分流尚無題目</p>
          ) : (
            branchQuestions(activeSubTab).map((q) => (
              <BranchQuestionCard key={q.id} question={q} allRoutes={allRoutes} branchNames={branchNames}
                pendingRoute={routeChanges[q.id]} onRouteChange={handleQuestionRouteChange} onAddRoute={handleAddRoute} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function BranchQuestionCard({
  question,
  allRoutes,
  branchNames,
  pendingRoute,
  onRouteChange,
  onAddRoute,
}: {
  question: QuestionRow
  allRoutes: string[]
  branchNames: Record<string, string>
  pendingRoute?: string
  onRouteChange: (id: string, route: string) => void
  onAddRoute: (route: string) => void
}) {
  const currentRoute = pendingRoute ?? question.route ?? 'all'
  const [showNewInput, setShowNewInput] = useState(false)
  const [newRouteName, setNewRouteName] = useState('')

  const confirmNewRoute = () => {
    const r = newRouteName.trim().toUpperCase()
    if (!r) return
    onAddRoute(r)
    onRouteChange(question.id, r)
    setShowNewInput(false)
    setNewRouteName('')
  }

  return (
    <div className="bg-white/40 backdrop-blur-sm border border-[#b8a9e8]/25 rounded-xl p-3 flex items-start justify-between gap-3">
      <div className="flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8a7ca8] font-mono">{question.key}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            question.type === 'single' ? 'bg-blue-500/20 text-blue-400'
            : question.type === 'multiple' ? 'bg-purple-500/20 text-purple-400'
            : question.type === 'rating' ? 'bg-amber-500/20 text-amber-400'
            : question.type === 'scale' ? 'bg-teal-500/20 text-teal-400'
            : question.type === 'date' ? 'bg-cyan-500/20 text-cyan-400'
            : question.type === 'file_upload' ? 'bg-rose-500/20 text-rose-400'
            : 'bg-emerald-500/20 text-emerald-400'
          }`}>{question.type}</span>
          {question.is_required && <span className="text-xs text-red-400/60">必填</span>}
        </div>
        <p className="text-sm text-[#3d3155]">{question.content}</p>
        {question.options.length > 0 && (
          <p className="text-xs text-[#6b5fa8]">選項：{question.options.map((o) => o.label).join('、')}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <select value={currentRoute}
          onChange={(e) => {
            if (e.target.value === '__add_new__') { setShowNewInput(true) }
            else { onRouteChange(question.id, e.target.value) }
          }}
          className="bg-white/50 border border-[#b8a9e8]/30 rounded px-2 py-1 text-xs text-[#3d3155] w-28">
          <option value="all">共用</option>
          <option value="A">原始 (A)</option>
          {allRoutes.map((r) => (
            <option key={r} value={r}>{branchNames[r] ?? `分流 ${r}`}</option>
          ))}
          <option value="__add_new__">+ 新增路線</option>
        </select>
        {showNewInput && (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newRouteName}
              onChange={(e) => setNewRouteName(e.target.value.toUpperCase())}
              placeholder="如 D"
              maxLength={10}
              autoFocus
              className="bg-white/50 border border-[#b8a9e8]/30 rounded px-2 py-1 text-xs text-[#3d3155] w-16"
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmNewRoute()
                if (e.key === 'Escape') { setShowNewInput(false); setNewRouteName('') }
              }}
            />
            <button type="button" onClick={confirmNewRoute} className="text-xs text-t-accent cursor-pointer">✓</button>
            <button type="button" onClick={() => { setShowNewInput(false); setNewRouteName('') }} className="text-xs text-[#3d3155]0 cursor-pointer">✕</button>
          </div>
        )}
      </div>
    </div>
  )
}

/** 正規化：將舊版單物件、新版陣列、或 JSON 字串統一轉為 BranchRule[] */
function normalizeBranchRules(raw: BranchConfig | BranchRule[] | string | null | undefined): BranchRule[] {
  if (!raw) return []
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw) } catch { return [] }
  }
  // 新版陣列
  if (Array.isArray(raw)) {
    return (raw as BranchRule[]).filter(r => r.branchKey && r.routes)
  }
  // 舊版單物件 { branchKey, routes }
  const obj = raw as { branchKey?: string; routes?: Record<string, string[]> }
  if (obj.branchKey && obj.routes) {
    return [{ id: '__legacy__', branchKey: obj.branchKey, routes: obj.routes }]
  }
  return []
}

// ===== ResultConfigPanel =====

const BLANK_TYPE: ResultType = { key: '', name: '', emoji: '🎯', description: '', traits: [] }

function ResultConfigPanel({
  survey,
  questions,
  onUpdate,
}: {
  survey: SurveyRow & { og_title?: string; og_description?: string; og_image_url?: string }
  questions: QuestionRow[]
  onUpdate: (s: SurveyRow) => void
}) {
  const existing = survey.result_config ?? { scoringRules: {}, resultTypes: [], tieBreaker: '' }
  const [resultTypes, setResultTypes] = useState<ResultType[]>(
    existing.resultTypes?.length > 0 ? existing.resultTypes : [{ ...BLANK_TYPE }]
  )
  const [scoringRules, setScoringRules] = useState<Record<string, Record<string, string>>>(
    existing.scoringRules ?? {}
  )
  const [tieBreaker, setTieBreaker] = useState(existing.tieBreaker ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const singleQuestions = questions.filter(q => q.type === 'single')

  const updateType = (idx: number, patch: Partial<ResultType>) => {
    setResultTypes(prev => prev.map((t, i) => i === idx ? { ...t, ...patch } : t))
  }

  const addType = () => setResultTypes(prev => [...prev, { ...BLANK_TYPE }])

  const removeType = (idx: number) => {
    const key = resultTypes[idx].key
    setResultTypes(prev => prev.filter((_, i) => i !== idx))
    // Clean up scoring rules that referenced this type
    setScoringRules(prev => {
      const next = { ...prev }
      for (const qKey of Object.keys(next)) {
        next[qKey] = Object.fromEntries(
          Object.entries(next[qKey]).filter(([, v]) => v !== key)
        )
      }
      return next
    })
  }

  const setRule = (qKey: string, optValue: string, typeKey: string) => {
    setScoringRules(prev => ({
      ...prev,
      [qKey]: { ...prev[qKey], [optValue]: typeKey },
    }))
  }

  const save = async () => {
    setSaving(true)
    const config: ResultConfig = {
      scoringRules,
      resultTypes: resultTypes.filter(t => t.key && t.name),
      tieBreaker: tieBreaker || undefined,
    }
    const res = await fetch(`/api/admin/surveys/${survey.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result_config: config }),
    })
    if (res.ok) {
      const updated = await res.json() as SurveyRow
      onUpdate(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#3d3155]">結果類型設定</p>
          <p className="text-xs text-[#6b5fa8] mt-0.5">設定人格測驗的結果類型與計分規則</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-1.5 bg-cyan-900/40 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/60 rounded-lg text-sm disabled:opacity-50 transition-colors cursor-pointer"
        >
          {saved ? '✅ 已儲存' : saving ? '儲存中...' : '儲存設定'}
        </button>
      </div>

      {/* Result types */}
      <div className="space-y-3">
        <p className="text-xs text-[#6b5fa8] uppercase tracking-wide">結果類型</p>
        {resultTypes.map((rt, idx) => (
          <div key={idx} className="bg-white/40 backdrop-blur-sm border border-[#b8a9e8]/20/60 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={rt.emoji}
                onChange={e => updateType(idx, { emoji: e.target.value })}
                className="w-12 bg-white/60 border border-[#b8a9e8]/30 rounded-lg px-2 py-1.5 text-center text-sm text-[#3d3155]"
                placeholder="🎯"
              />
              <input
                value={rt.key}
                onChange={e => updateType(idx, { key: e.target.value })}
                className="w-32 bg-white/60 border border-[#b8a9e8]/30 rounded-lg px-2 py-1.5 text-sm text-[#3d3155] font-mono"
                placeholder="key (英文)"
              />
              <input
                value={rt.name}
                onChange={e => updateType(idx, { name: e.target.value })}
                className="flex-1 bg-white/60 border border-[#b8a9e8]/30 rounded-lg px-2 py-1.5 text-sm text-[#3d3155]"
                placeholder="結果名稱"
              />
              <button onClick={() => removeType(idx)} className="text-red-400/60 hover:text-red-400 text-xs cursor-pointer px-1">✕</button>
            </div>
            <textarea
              value={rt.description}
              onChange={e => updateType(idx, { description: e.target.value })}
              rows={2}
              className="w-full bg-white/60 border border-[#b8a9e8]/30 rounded-lg px-2 py-1.5 text-sm text-[#3d3155] resize-none"
              placeholder="結果描述文案..."
            />
            <input
              value={rt.traits?.join(', ') ?? ''}
              onChange={e => updateType(idx, { traits: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              className="w-full bg-white/60 border border-[#b8a9e8]/30 rounded-lg px-2 py-1.5 text-xs text-[#3d3155]"
              placeholder="特質標籤（逗號分隔，如：好奇心強, 行動派, 創意人）"
            />
          </div>
        ))}
        <button
          onClick={addType}
          className="w-full py-2 border border-dashed border-[#b8a9e8]/30 hover:border-cyan-500/50 rounded-xl text-sm text-[#8a7ca8] hover:text-cyan-400 transition-colors cursor-pointer"
        >
          + 新增結果類型
        </button>
      </div>

      {/* Scoring rules */}
      {resultTypes.some(t => t.key) && singleQuestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#6b5fa8] uppercase tracking-wide">計分規則</p>
            <p className="text-[10px] text-[#8a7ca8]">每個選項對應的結果類型</p>
          </div>
          {singleQuestions.map(q => (
            <div key={q.key} className="bg-white/30 backdrop-blur-sm border border-[#b8a9e8]/20/40 rounded-xl p-3 space-y-2">
              <p className="text-xs font-medium text-[#3d3155]">{q.key}: {q.content.slice(0, 40)}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {q.options.map(opt => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <span className="text-xs text-[#6b5fa8] truncate w-24 shrink-0">{opt.label}</span>
                    <select
                      value={scoringRules[q.key]?.[opt.value] ?? ''}
                      onChange={e => setRule(q.key, opt.value, e.target.value)}
                      className="flex-1 bg-white/60 border border-[#b8a9e8]/30 rounded-lg px-2 py-1 text-xs text-[#3d3155]"
                    >
                      <option value="">-- 未設定 --</option>
                      {resultTypes.filter(t => t.key).map(t => (
                        <option key={t.key} value={t.key}>{t.emoji} {t.name} ({t.key})</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tie breaker */}
      {resultTypes.some(t => t.key) && (
        <div className="flex items-center gap-3">
          <label className="text-xs text-[#6b5fa8] shrink-0">平手時預設</label>
          <select
            value={tieBreaker}
            onChange={e => setTieBreaker(e.target.value)}
            className="flex-1 bg-white/60 border border-[#b8a9e8]/30 rounded-lg px-2 py-1.5 text-sm text-[#3d3155]"
          >
            <option value="">-- 取第一個 --</option>
            {resultTypes.filter(t => t.key).map(t => (
              <option key={t.key} value={t.key}>{t.emoji} {t.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

// ===== QuestionList =====

function QuestionList({
  surveyId,
  questions,
  onReload,
}: {
  surveyId: string
  questions: QuestionRow[]
  onReload: () => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [aiMode, setAiMode] = useState(false)
  const [customRoutes, setCustomRoutes] = useState<string[]>([])
  const [qDragIdx, setQDragIdx] = useState<number | null>(null)
  const [qDragOverIdx, setQDragOverIdx] = useState<number | null>(null)

  const existingRoutes = Array.from(new Set([
    ...questions.map((q) => q.route).filter((r): r is string => !!r && r !== 'all'),
    ...customRoutes,
  ]))

  const handleAddRoute = (route: string) => {
    const r = route.trim().toUpperCase()
    if (r && r !== 'ALL' && !existingRoutes.includes(r)) {
      setCustomRoutes((prev) => [...prev, r])
    }
  }

  const handleRenameRoute = async (oldRoute: string, newRoute: string) => {
    const r = newRoute.trim().toUpperCase()
    if (!r || r === oldRoute || r === 'ALL') return

    // 批量更新所有使用此路線的題目
    const affected = questions.filter((q) => q.route === oldRoute)
    await Promise.all(
      affected.map((q) =>
        fetch(`/api/admin/questions/${q.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: q.key,
            type: q.type,
            content: q.content,
            options: q.options,
            is_required: q.is_required,
            max_selections: q.max_selections,
            route: r,
            emoji: q.emoji ?? null,
            narrative: q.narrative ?? null,
          }),
        })
      )
    )

    // 更新 branch_config 的 routes key
    const surveyRes = await fetch(`/api/admin/surveys/${surveyId}`)
    if (surveyRes.ok) {
      const survey = await surveyRes.json()
      if (survey.branch_config) {
        let bc = survey.branch_config
        if (Array.isArray(bc)) {
          bc = bc.map((rule: { branchKey: string; routes: Record<string, string[]>; id?: string }) => {
            if (!rule.routes[oldRoute]) return rule
            const { [oldRoute]: vals, ...rest } = rule.routes
            return { ...rule, routes: { ...rest, [r]: vals } }
          })
        } else if (bc.routes && bc.routes[oldRoute]) {
          const { [oldRoute]: vals, ...rest } = bc.routes
          bc = { ...bc, routes: { ...rest, [r]: vals } }
        }
        await fetch(`/api/admin/surveys/${surveyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branch_config: bc }),
        })
      }
    }

    // 更新本地 customRoutes
    setCustomRoutes((prev) => prev.map((x) => (x === oldRoute ? r : x)))
    onReload()
  }

  const handleDelete = async (qid: string) => {
    if (!confirm('確定要刪除此題目？')) return
    await fetch(`/api/admin/questions/${qid}`, { method: 'DELETE' })
    onReload()
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const ids = questions.map((q) => q.id)
    ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
    await fetch(`/api/admin/surveys/${surveyId}/questions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: ids }),
    })
    onReload()
  }

  const handleMoveDown = async (index: number) => {
    if (index === questions.length - 1) return
    const ids = questions.map((q) => q.id)
    ;[ids[index], ids[index + 1]] = [ids[index + 1], ids[index]]
    await fetch(`/api/admin/surveys/${surveyId}/questions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: ids }),
    })
    onReload()
  }

  const handleDrop = async (dropIdx: number) => {
    if (qDragIdx === null || qDragIdx === dropIdx) {
      setQDragIdx(null)
      setQDragOverIdx(null)
      return
    }
    const reordered = [...questions]
    const [moved] = reordered.splice(qDragIdx, 1)
    reordered.splice(dropIdx, 0, moved)
    setQDragIdx(null)
    setQDragOverIdx(null)
    await fetch(`/api/admin/surveys/${surveyId}/questions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: reordered.map((x) => x.id) }),
    })
    onReload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#3d3155]">
          題目列表（{questions.length} 題）
        </h2>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="px-4 py-2 bg-[#b8a9e8]/20 border border-[#b8a9e8]/25 text-t-accent text-sm rounded-lg hover:bg-[#b8a9e8]/20 transition-colors cursor-pointer"
        >
          + 新增題目
        </button>
        <button
          type="button"
          onClick={() => setAiMode(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-blue-400/30 text-blue-300 text-sm rounded-lg hover:from-cyan-500/30 hover:to-blue-500/30 transition-colors cursor-pointer"
        >
          🤖 AI 出題
        </button>
      </div>

      {adding && (
        <QuestionForm
          surveyId={surveyId}
          nextOrder={questions.length}
          existingRoutes={existingRoutes}
          onAddRoute={handleAddRoute}
          onRenameRoute={handleRenameRoute}
          onSaved={() => { setAdding(false); onReload() }}
          onCancel={() => setAdding(false)}
        />
      )}

      {aiMode && (
        <AiGeneratePanel
          surveyId={surveyId}
          existingCount={questions.length}
          onDone={() => { setAiMode(false); onReload() }}
          onCancel={() => setAiMode(false)}
        />
      )}

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div
            key={q.id}
            draggable
            onDragStart={() => setQDragIdx(i)}
            onDragOver={(e) => { e.preventDefault(); setQDragOverIdx(i) }}
            onDragLeave={() => setQDragOverIdx(null)}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => { setQDragIdx(null); setQDragOverIdx(null) }}
            className={`bg-white/40 backdrop-blur-sm border border-[#b8a9e8]/25 rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all ${
              qDragIdx === i ? 'opacity-40' : ''
            } ${qDragOverIdx === i && qDragIdx !== i ? 'ring-2 ring-t-accent/60 border-t-accent/40' : ''}`}
          >
            {editingId === q.id ? (
              <QuestionEditForm
                question={q}
                existingRoutes={existingRoutes}
                onAddRoute={handleAddRoute}
                onRenameRoute={handleRenameRoute}
                onSaved={() => { setEditingId(null); onReload() }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8a7ca8] font-mono">{q.key}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        q.type === 'single'
                          ? 'bg-blue-500/20 text-blue-400'
                          : q.type === 'multiple'
                            ? 'bg-purple-500/20 text-purple-400'
                            : q.type === 'rating'
                              ? 'bg-amber-500/20 text-amber-400'
                              : q.type === 'scale'
                                ? 'bg-teal-500/20 text-teal-400'
                                : q.type === 'date'
                                  ? 'bg-cyan-500/20 text-cyan-400'
                                  : q.type === 'file_upload'
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {q.type}
                    </span>
                    {q.is_required && (
                      <span className="text-xs text-red-400/60">必填</span>
                    )}
                    {q.max_selections && (
                      <span className="text-xs text-[#8a7ca8]">
                        最多 {q.max_selections} 個
                      </span>
                    )}
                    {(q.route === 'B' || q.route === 'C') && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                        q.route === 'B' ? 'bg-yellow-500/20 text-amber-700'
                        : q.route === 'C' ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-[#b5a8d0]/20 text-[#8a7ca8]'
                      }`}>
                        分流 {q.route}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#3d3155]">{q.content}</p>
                  {q.options.length > 0 && (
                    <p className="text-xs text-[#6b5fa8]">
                      選項：{q.options.map((o) => o.label).join('、')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(i)}
                    disabled={i === 0}
                    className="text-[#8a7ca8] hover:text-[#3d3155] disabled:opacity-20 text-sm cursor-pointer p-1"
                    title="上移"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(i)}
                    disabled={i === questions.length - 1}
                    className="text-[#8a7ca8] hover:text-[#3d3155] disabled:opacity-20 text-sm cursor-pointer p-1"
                    title="下移"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(q.id)}
                    className="text-t-accent/60 hover:text-t-accent text-sm cursor-pointer p-1"
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(q.id)}
                    className="text-red-400/60 hover:text-red-300 text-sm cursor-pointer p-1"
                  >
                    刪除
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {questions.some((q) => ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10'].includes(q.key)) && (
        <p className="text-xs text-amber-700 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          ⚠️ q1-q10 的 key 與 CRM 標籤引擎綁定，修改 key 會影響自動標籤分析。建議只修改題目文字與選項，不要更改 key 值。
        </p>
      )}
    </div>
  )
}

// ===== QuestionForm (新增) =====

function QuestionForm({
  surveyId,
  nextOrder,
  existingRoutes,
  onAddRoute,
  onRenameRoute,
  onSaved,
  onCancel,
}: {
  surveyId: string
  nextOrder: number
  existingRoutes: string[]
  onAddRoute: (route: string) => void
  onRenameRoute: (oldRoute: string, newRoute: string) => Promise<void>
  onSaved: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    key: `q${nextOrder + 1}`,
    type: 'single' as string,
    content: '',
    options: [{ label: '', value: '' }] as { label: string; value: string; emoji?: string }[],
    is_required: true,
    max_selections: null as number | null,
    route: 'all' as string,
    emoji: '',
    narrative: '',
    allow_other_text: false,
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleSave = async () => {
    if (!form.content.trim()) return
    setSaving(true)
    setSaveError('')

    const options = form.type === 'text' ? [] : form.options.filter((o) => o.label.trim())

    const res = await fetch(`/api/admin/surveys/${surveyId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: form.key,
        type: form.type,
        content: form.content,
        options,
        order_index: nextOrder,
        is_required: form.is_required,
        max_selections: form.type === 'multiple' ? form.max_selections : null,
        route: form.route,
        emoji: form.emoji || null,
        narrative: form.narrative || null,
        allow_other_text: form.allow_other_text,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json() as { error?: string }
      setSaveError(err.error ?? '新增失敗')
      return
    }
    onSaved()
  }

  return (
    <div className="bg-white/40 backdrop-blur-sm border border-[#b8a9e8]/25 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-medium text-t-accent">新增題目</h3>
      <QuestionFormFields form={form} onChange={setForm} existingRoutes={existingRoutes} onAddRoute={onAddRoute} onRenameRoute={onRenameRoute} />
      {saveError && <p className="text-xs text-red-400">{saveError}</p>}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !form.content.trim()}
          className="px-4 py-1.5 bg-[#b8a9e8]/20 text-t-accent border border-[#b8a9e8]/25 rounded-lg text-sm disabled:opacity-40 cursor-pointer"
        >
          {saving ? '儲存中...' : '新增'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-[#8a7ca8] text-sm cursor-pointer"
        >
          取消
        </button>
      </div>
    </div>
  )
}

// ===== QuestionEditForm (編輯) =====

function QuestionEditForm({
  question,
  existingRoutes,
  onAddRoute,
  onRenameRoute,
  onSaved,
  onCancel,
}: {
  question: QuestionRow
  existingRoutes: string[]
  onAddRoute: (route: string) => void
  onRenameRoute: (oldRoute: string, newRoute: string) => Promise<void>
  onSaved: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    key: question.key,
    type: question.type,
    content: question.content,
    options: question.options.length > 0
      ? question.options.map(o => ({ ...o, emoji: o.emoji || getOptionEmoji(o.label) }))
      : [{ label: '', value: '' }] as { label: string; value: string; emoji?: string }[],
    is_required: question.is_required,
    max_selections: question.max_selections,
    route: question.route ?? 'all',
    emoji: question.emoji ?? '',
    narrative: question.narrative ?? '',
    allow_other_text: question.allow_other_text ?? false,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.content.trim()) return
    setSaving(true)

    const options = form.type === 'text' ? [] : form.options.filter((o) => o.label.trim())

    await fetch(`/api/admin/questions/${question.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: form.key,
        type: form.type,
        content: form.content,
        options,
        is_required: form.is_required,
        max_selections: form.type === 'multiple' ? form.max_selections : null,
        route: form.route,
        emoji: form.emoji || null,
        narrative: form.narrative || null,
        allow_other_text: form.allow_other_text,
      }),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="space-y-3">
      <QuestionFormFields form={form} onChange={setForm} existingRoutes={existingRoutes} onAddRoute={onAddRoute} onRenameRoute={onRenameRoute} />
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 bg-[#b8a9e8]/20 text-t-accent border border-[#b8a9e8]/25 rounded-lg text-sm disabled:opacity-40 cursor-pointer"
        >
          {saving ? '儲存中...' : '儲存'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-[#8a7ca8] text-sm cursor-pointer"
        >
          取消
        </button>
      </div>
    </div>
  )
}

// ===== RouteChip =====

function RouteChip({
  route,
  onRename,
}: {
  route: string
  onRename: (newName: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(route)

  const confirm = () => {
    const r = name.trim().toUpperCase()
    if (!r || r === route) { setEditing(false); return }
    onRename(r)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') { setName(route); setEditing(false) } }}
          autoFocus
          className="bg-[#b8a9e8]/10 border border-[#b8a9e8]/35 rounded px-2 py-0.5 text-xs text-[#3d3155] w-16"
        />
        <button type="button" onClick={confirm} className="text-xs text-t-accent cursor-pointer">確認</button>
        <button type="button" onClick={() => { setName(route); setEditing(false) }} className="text-xs text-[#6b5fa8] cursor-pointer">✕</button>
      </div>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#b8a9e8]/10 border border-[#b8a9e8]/30 text-xs text-[#8a7ca8]">
      {route} 路線
      <button
        type="button"
        onClick={() => setEditing(true)}
        title={`重新命名 ${route} 路線`}
        className="text-[#8a7ca8] hover:text-[#3d3155] cursor-pointer"
      >
        ✏️
      </button>
    </span>
  )
}

// ===== Shared Form Fields =====

interface FormState {
  key: string
  type: string
  content: string
  options: { label: string; value: string; emoji?: string }[]
  is_required: boolean
  max_selections: number | null
  route: string
  emoji: string
  narrative: string
  allow_other_text: boolean
}

function QuestionFormFields({
  form,
  onChange,
  existingRoutes = [],
  onAddRoute,
  onRenameRoute,
}: {
  form: FormState
  onChange: (f: FormState) => void
  existingRoutes?: string[]
  onAddRoute?: (route: string) => void
  onRenameRoute?: (oldRoute: string, newRoute: string) => Promise<void>
}) {
  const [showNewRouteInput, setShowNewRouteInput] = useState(false)
  const [newRouteName, setNewRouteName] = useState('')

  const confirmNewRoute = () => {
    const r = newRouteName.trim().toUpperCase()
    if (!r) return
    onAddRoute?.(r)
    onChange({ ...form, route: r })
    setShowNewRouteInput(false)
    setNewRouteName('')
  }

  const addOption = () => {
    onChange({ ...form, options: [...form.options, { label: '', value: '' }] })
  }

  const removeOption = (index: number) => {
    onChange({ ...form, options: form.options.filter((_, i) => i !== index) })
  }

  const updateOption = (index: number, label: string) => {
    const options = [...form.options]
    options[index] = { ...options[index], label, value: label }
    onChange({ ...form, options })
  }

  const updateOptionEmoji = (index: number, emoji: string | undefined) => {
    const options = [...form.options]
    options[index] = { ...options[index], emoji }
    onChange({ ...form, options })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr] gap-2 sm:items-center">
        <label className="text-xs text-[#6b5fa8]">Key</label>
        <input
          type="text"
          value={form.key}
          onChange={(e) => onChange({ ...form, key: e.target.value })}
          className="bg-white/50 border border-[#b8a9e8]/20 rounded px-2 py-1 text-sm text-[#3d3155] w-32"
        />

        <label className="text-xs text-[#6b5fa8]">類型</label>
        <select
          value={form.type}
          onChange={(e) => onChange({ ...form, type: e.target.value })}
          className="bg-white/50 border border-[#b8a9e8]/20 rounded px-2 py-1 text-sm text-[#3d3155] w-32"
        >
          <option value="single">single</option>
          <option value="multiple">multiple</option>
          <option value="text">text</option>
          <option value="rating">rating</option>
          <option value="scale">scale</option>
          <option value="date">date</option>
          <option value="file_upload">file_upload</option>
        </select>

        <label className="text-xs text-[#6b5fa8]">題目</label>
        <div className="flex items-center gap-2">
          <EmojiPicker
            value={form.emoji || undefined}
            onSelect={(emoji) => onChange({ ...form, emoji })}
            onClear={() => onChange({ ...form, emoji: '' })}
          />
          <input
            type="text"
            value={form.content}
            onChange={(e) => onChange({ ...form, content: e.target.value })}
            className="flex-1 bg-white/50 border border-[#b8a9e8]/20 rounded px-2 py-1 text-sm text-[#3d3155]"
          />
        </div>

        <label className="text-xs text-[#6b5fa8]">旁白</label>
        <input
          type="text"
          value={form.narrative}
          onChange={(e) => onChange({ ...form, narrative: e.target.value })}
          placeholder="選填：題目旁白文字"
          className="bg-white/50 border border-[#b8a9e8]/20 rounded px-2 py-1 text-sm text-[#3d3155]"
        />

        <label className="text-xs text-[#6b5fa8]">必填</label>
        <input
          type="checkbox"
          checked={form.is_required}
          onChange={(e) => onChange({ ...form, is_required: e.target.checked })}
          className="w-4 h-4"
        />

        {(form.type === 'single' || form.type === 'multiple') && (
          <>
            <label className="text-xs text-[#6b5fa8]">其他文字</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allow_other_text}
                onChange={(e) => onChange({ ...form, allow_other_text: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs text-[#8a7ca8]">允許「其他」選項填寫文字</span>
            </label>
          </>
        )}

        <label className="text-xs text-[#6b5fa8]">路線</label>
        <div className="flex items-center gap-2">
          <select
            value={form.route}
            onChange={(e) => {
              if (e.target.value === '__add_new__') {
                setShowNewRouteInput(true)
              } else {
                onChange({ ...form, route: e.target.value })
              }
            }}
            className="bg-white/50 border border-[#b8a9e8]/20 rounded px-2 py-1 text-sm text-[#3d3155] w-36"
          >
            <option value="all">所有人 (all)</option>
            {existingRoutes.map((r) => (
              <option key={r} value={r}>{r} 路線</option>
            ))}
            <option value="__add_new__">+ 新增路線</option>
          </select>
          {showNewRouteInput && (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newRouteName}
                onChange={(e) => setNewRouteName(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmNewRoute(); if (e.key === 'Escape') { setShowNewRouteInput(false); setNewRouteName('') } }}
                placeholder="如 D"
                autoFocus
                className="bg-[#b8a9e8]/10 border border-[#b8a9e8]/30 rounded px-2 py-1 text-sm text-[#3d3155] w-16"
              />
              <button type="button" onClick={confirmNewRoute} className="text-xs text-t-accent cursor-pointer">確認</button>
              <button type="button" onClick={() => { setShowNewRouteInput(false); setNewRouteName('') }} className="text-xs text-[#6b5fa8] cursor-pointer">✕</button>
            </div>
          )}
        </div>

        {existingRoutes.length > 0 && onRenameRoute && (
          <>
            <div />
            <div className="flex flex-wrap gap-1.5">
              {existingRoutes.map((r) => (
                <RouteChip
                  key={r}
                  route={r}
                  onRename={async (newName) => {
                    await onRenameRoute(r, newName)
                    if (form.route === r) onChange({ ...form, route: newName })
                  }}
                />
              ))}
            </div>
          </>
        )}

        {form.type === 'multiple' && (
          <>
            <label className="text-xs text-[#6b5fa8]">最多選</label>
            <input
              type="number"
              value={form.max_selections ?? ''}
              onChange={(e) =>
                onChange({
                  ...form,
                  max_selections: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
              placeholder="不限"
              className="bg-white/50 border border-[#b8a9e8]/20 rounded px-2 py-1 text-sm text-[#3d3155] w-20"
              min={1}
            />
          </>
        )}
      </div>

      {form.type !== 'text' && (
        <div className="space-y-2">
          <label className="text-xs text-[#6b5fa8]">選項</label>
          {form.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <EmojiPicker
                value={opt.emoji || undefined}
                onSelect={(emoji) => updateOptionEmoji(i, emoji)}
                onClear={() => updateOptionEmoji(i, undefined)}
              />
              <input
                type="text"
                value={opt.label}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`選項 ${i + 1}`}
                className="flex-1 bg-white/50 border border-[#b8a9e8]/20 rounded px-2 py-1 text-sm text-[#3d3155]"
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="text-red-400/60 hover:text-red-300 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="text-xs text-t-accent/60 hover:text-t-accent cursor-pointer"
          >
            + 新增選項
          </button>
        </div>
      )}
    </div>
  )
}
