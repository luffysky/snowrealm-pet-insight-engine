'use client'

import { useEffect, useState, useCallback } from 'react'

// ===== Types =====

interface SurveyRow {
  id: string
  title: string
  slug: string
  status: string
  subtitle: string
  cover_title: string
  cover_subtitle: string
  start_button_text: string
  done_title: string
  done_subtitle: string
  variant_group: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  branch_config: BranchConfig | string | null
}

interface QuestionRow {
  id: string
  survey_id: string
  key: string
  type: string
  content: string
  options: { label: string; value: string }[]
  order_index: number
  is_required: boolean
  max_selections: number | null
  route: string | null
}

interface BranchConfig {
  branchKey: string
  routes: Record<string, string[]>
}

// ===== Main Component =====

export default function SurveysAdminPage() {
  const [surveys, setSurveys] = useState<SurveyRow[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyRow | null>(null)
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

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

  if (loading) return <p className="text-white/50">載入中...</p>
  if (error) return <p className="text-red-400">{error}</p>

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white/90">問卷管理</h1>
        <button
          type="button"
          onClick={() => { setShowCreate(true); setCreateError('') }}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition-colors cursor-pointer"
        >
          ＋ 新增問卷
        </button>
      </div>

      {/* Create survey form */}
      {showCreate && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white/90">建立新問卷</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">問卷標題</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="例：2025 寵物生活調查"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Slug（網址路徑）</label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="例：pet-life-2025"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
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
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-sm transition-colors cursor-pointer"
            >
              {creating ? '建立中...' : '建立'}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setCreateError('') }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Survey selector - always show */}
      {surveys.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {surveys.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSurvey(s)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                selectedSurvey?.id === s.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      {selectedSurvey && (
        <>
          <SurveyEditor survey={selectedSurvey} questions={questions} onUpdate={setSelectedSurvey} />
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
}: {
  survey: SurveyRow
  questions: QuestionRow[]
  onUpdate: (s: SurveyRow) => void
}) {
  const [activeTab, setActiveTab] = useState<'basic' | 'branching'>('basic')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(survey)
  const [saving, setSaving] = useState(false)
  const [branchSaving, setBranchSaving] = useState(false)
  const [branchError, setBranchError] = useState('')
  const [branchSuccess, setBranchSuccess] = useState('')
  const [branchQuestionKey, setBranchQuestionKey] = useState('')
  const [answerRoutes, setAnswerRoutes] = useState<Record<string, 'A' | 'B' | 'C'>>({})
  const [branchDirty, setBranchDirty] = useState(false)

  useEffect(() => {
    setForm(survey)
  }, [survey])

  useEffect(() => {
    const candidates = questions.filter((q) => q.type !== 'text' && q.options.length > 0)
    const surveyConfig = normalizeBranchConfig(survey.branch_config)
    const fallbackKey = candidates[0]?.key ?? ''
    const nextBranchKey = surveyConfig?.branchKey ?? fallbackKey

    const selectedQuestion = candidates.find((q) => q.key === nextBranchKey)
    const optionValues = selectedQuestion?.options.map((opt) => opt.value) ?? []

    const nextAnswerRoutes: Record<string, 'A' | 'B' | 'C'> = {}
    for (const value of optionValues) {
      const optionLabel = selectedQuestion?.options.find((opt) => opt.value === value)?.label ?? ''
      const route = getRouteByAnswerValue(surveyConfig, value, optionLabel)
      nextAnswerRoutes[value] = route
    }

    setBranchQuestionKey(nextBranchKey)
    setAnswerRoutes(nextAnswerRoutes)
    setBranchDirty(false)
    setBranchSuccess('')
  }, [survey.branch_config, questions])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/admin/surveys/${survey.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
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
      }),
    })
    if (res.ok) {
      const updated = (await res.json()) as SurveyRow
      onUpdate(updated)
      setEditing(false)
    }
    setSaving(false)
  }

  const branchableQuestions = questions.filter((q) => q.type !== 'text' && q.options.length > 0)
  const selectedBranchQuestion = branchableQuestions.find((q) => q.key === branchQuestionKey) ?? null

  const handleBranchQuestionChange = (nextKey: string) => {
    setBranchQuestionKey(nextKey)
    setBranchError('')
    setBranchDirty(true)

    const nextQuestion = branchableQuestions.find((q) => q.key === nextKey)
    if (!nextQuestion) {
      setAnswerRoutes({})
      return
    }

    const currentConfig: BranchConfig | null = {
      branchKey: branchQuestionKey,
      routes: {
        A: Object.entries(answerRoutes)
          .filter(([, route]) => route === 'A')
          .map(([value]) => value),
        B: Object.entries(answerRoutes)
          .filter(([, route]) => route === 'B')
          .map(([value]) => value),
        C: Object.entries(answerRoutes)
          .filter(([, route]) => route === 'C')
          .map(([value]) => value),
      },
    }

    const nextMap: Record<string, 'A' | 'B' | 'C'> = {}
    for (const option of nextQuestion.options) {
      nextMap[option.value] = getRouteByAnswerValue(currentConfig, option.value, option.label)
    }
    setAnswerRoutes(nextMap)
  }

  const handleSaveBranching = async () => {
    if (!branchQuestionKey) {
      setBranchError('請先選擇分流題目')
      return
    }
    if (!selectedBranchQuestion || selectedBranchQuestion.options.length === 0) {
      setBranchError('分流題目必須有選項')
      return
    }
    if (!confirm(`確定要將分流設定儲存為「${branchQuestionKey}」嗎？\n這會影響前台問卷的分流邏輯。`)) {
      return
    }

    const routes: Record<string, string[]> = { A: [], B: [], C: [] }
    for (const option of selectedBranchQuestion.options) {
      const route = answerRoutes[option.value] ?? 'A'
      routes[route].push(option.value)
    }

    setBranchSaving(true)
    setBranchError('')

    try {
      const res = await fetch(`/api/admin/surveys/${survey.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_config: {
            branchKey: branchQuestionKey,
            routes,
          },
        }),
      })

      if (!res.ok) {
        setBranchError('儲存分流設定失敗')
        return
      }

      const updated = (await res.json()) as SurveyRow
      onUpdate(updated)
      setBranchDirty(false)
      setBranchSuccess('分流設定已儲存')
      setTimeout(() => setBranchSuccess(''), 3000)
    } catch {
      setBranchError('儲存分流設定失敗')
    } finally {
      setBranchSaving(false)
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
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/80">問卷設定</h2>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              survey.status === 'published'
                ? 'bg-emerald-500/20 text-emerald-400'
                : survey.status === 'draft'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-slate-500/20 text-slate-400'
            }`}
          >
            {survey.status}
          </span>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              編輯
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setEditing(false); setForm(survey) }}
                className="text-sm text-slate-400 hover:text-white cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-40 cursor-pointer"
              >
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
            activeTab === 'basic'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
          }`}
        >
          基本設定
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('branching')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
            activeTab === 'branching'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
          }`}
        >
          分流設定
        </button>
      </div>

      {activeTab === 'basic' && editing && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <label className="text-sm text-white/50 sm:w-20">狀態</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white/80"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </div>
          {fields.map((f) => (
            <div key={f.key} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
              <label className="text-sm text-white/50 sm:w-20 sm:pt-1.5 shrink-0">{f.label}</label>
              {f.multiline ? (
                <textarea
                  value={form[f.key] as string}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  rows={3}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white/80 resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={form[f.key] as string}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white/80"
                />
              )}
            </div>
          ))}

          {/* A/B Variant Group */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <label className="text-sm text-white/50 sm:w-20 sm:pt-1.5 shrink-0">A/B 群組</label>
            <input
              type="text"
              value={form.variant_group ?? ''}
              onChange={(e) => setForm({ ...form, variant_group: e.target.value })}
              placeholder="留空表示不參與 A/B"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white/80"
            />
          </div>

          {/* 排程 */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <label className="text-sm text-white/50 sm:w-20 sm:pt-1.5 shrink-0">排程開始</label>
            <input
              type="datetime-local"
              value={form.scheduled_start?.slice(0, 16) ?? ''}
              onChange={(e) => setForm({ ...form, scheduled_start: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white/80"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <label className="text-sm text-white/50 sm:w-20 sm:pt-1.5 shrink-0">排程結束</label>
            <input
              type="datetime-local"
              value={form.scheduled_end?.slice(0, 16) ?? ''}
              onChange={(e) => setForm({ ...form, scheduled_end: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white/80"
            />
          </div>
        </div>
      )}

      {activeTab === 'basic' && !editing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {fields.map((f) => (
            <div key={f.key}>
              <span className="text-white/40">{f.label}：</span>
              <span className="text-white/70">{String(survey[f.key]).slice(0, 60)}{String(survey[f.key]).length > 60 ? '...' : ''}</span>
            </div>
          ))}
          <div>
            <span className="text-white/40">A/B 群組：</span>
            <span className="text-white/70">{survey.variant_group ?? '—'}</span>
          </div>
          <div>
            <span className="text-white/40">排程開始：</span>
            <span className="text-white/70">{survey.scheduled_start ? new Date(survey.scheduled_start).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : '—'}</span>
          </div>
          <div>
            <span className="text-white/40">排程結束：</span>
            <span className="text-white/70">{survey.scheduled_end ? new Date(survey.scheduled_end).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : '—'}</span>
          </div>
        </div>
      )}

      {activeTab === 'branching' && (
        <div className="space-y-4">
          {(() => {
            const saved = normalizeBranchConfig(survey.branch_config)
            if (saved) {
              const bCount = saved.routes?.B?.length ?? 0
              const cCount = saved.routes?.C?.length ?? 0
              return (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm">
                  <p className="text-white/60 mb-1">目前已儲存的分流設定：</p>
                  <p className="text-white/80">
                    分流題：<span className="text-cyan-300 font-mono">{saved.branchKey}</span>
                    {' · '}
                    原始問卷 (A)：{saved.routes?.A?.length ?? 0} 個選項
                    {bCount > 0 && <>{' · '}<span className="text-yellow-400">分流 B：{bCount} 個選項</span></>}
                    {cCount > 0 && <>{' · '}<span className="text-orange-400">分流 C：{cCount} 個選項</span></>}
                  </p>
                </div>
              )
            }
            return <p className="text-sm text-yellow-400/80">⚠️ 尚未設定分流規則</p>
          })()}

          <p className="text-sm text-white/60">
            設定同一套問卷中，分流題目各答案要走哪個分流。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2 sm:items-center">
            <label className="text-sm text-white/50">分流題目</label>
            <select
              value={branchQuestionKey}
              onChange={(e) => handleBranchQuestionChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white/80"
            >
              {branchableQuestions.length === 0 && <option value="">無可用題目</option>}
              {branchableQuestions.map((q) => (
                <option key={q.id} value={q.key}>
                  {q.key} - {q.content.slice(0, 50)}
                </option>
              ))}
            </select>
          </div>

          {selectedBranchQuestion && (
            <div className="space-y-2">
              <p className="text-sm text-white/70">答案分流對應</p>
              <div className="space-y-2">
                {selectedBranchQuestion.options.map((option) => (
                  <div
                    key={option.value}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-2 sm:items-center bg-slate-800/50 border border-slate-700 rounded-lg p-3"
                  >
                    <div className="text-sm text-white/80">{option.label}</div>
                    <select
                      value={answerRoutes[option.value] ?? 'A'}
                      onChange={(e) => {
                        const route = e.target.value as 'A' | 'B' | 'C'
                        setAnswerRoutes((prev) => ({ ...prev, [option.value]: route }))
                        setBranchDirty(true)
                      }}
                      className="bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-white/80"
                    >
                      <option value="A">原始問卷 (A)</option>
                      <option value="B">分流 B</option>
                      <option value="C">分流 C</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {branchError && (
            <p className="text-sm text-red-400">{branchError}</p>
          )}
          {branchSuccess && (
            <p className="text-sm text-emerald-400">{branchSuccess}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveBranching}
              disabled={branchSaving || branchableQuestions.length === 0 || !branchDirty}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-sm transition-colors cursor-pointer"
            >
              {branchSaving ? '儲存中...' : '儲存分流設定'}
            </button>
            {!branchDirty && <span className="text-xs text-white/30">尚未修改</span>}
            {branchDirty && <span className="text-xs text-yellow-400">有未儲存的變更</span>}
          </div>
        </div>
      )}
    </div>
  )
}

function normalizeBranchConfig(raw: BranchConfig | string | null | undefined): BranchConfig | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as BranchConfig
      if (parsed?.branchKey && parsed?.routes) return parsed
      return null
    } catch {
      return null
    }
  }
  if (raw.branchKey && raw.routes) return raw
  return null
}

function getRouteByAnswerValue(
  config: BranchConfig | null | undefined,
  answerValue: string,
  answerLabel?: string
): 'A' | 'B' | 'C' {
  const inB = config?.routes?.B?.includes(answerValue) || (answerLabel ? config?.routes?.B?.includes(answerLabel) : false)
  const inC = config?.routes?.C?.includes(answerValue) || (answerLabel ? config?.routes?.C?.includes(answerLabel) : false)

  if (inB) return 'B'
  if (inC) return 'C'
  return 'A'
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/80">
          題目列表（{questions.length} 題）
        </h2>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="px-4 py-2 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-sm rounded-lg hover:bg-cyan-500/30 transition-colors cursor-pointer"
        >
          + 新增題目
        </button>
      </div>

      {adding && (
        <QuestionForm
          surveyId={surveyId}
          nextOrder={questions.length}
          onSaved={() => { setAdding(false); onReload() }}
          onCancel={() => setAdding(false)}
        />
      )}

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-4"
          >
            {editingId === q.id ? (
              <QuestionEditForm
                question={q}
                onSaved={() => { setEditingId(null); onReload() }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30 font-mono">{q.key}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        q.type === 'single'
                          ? 'bg-blue-500/20 text-blue-400'
                          : q.type === 'multiple'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {q.type}
                    </span>
                    {q.is_required && (
                      <span className="text-xs text-red-400/60">必填</span>
                    )}
                    {q.max_selections && (
                      <span className="text-xs text-white/30">
                        最多 {q.max_selections} 個
                      </span>
                    )}
                    {(q.route === 'B' || q.route === 'C') && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                        q.route === 'B' ? 'bg-yellow-500/20 text-yellow-400'
                        : q.route === 'C' ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        分流 {q.route}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/80">{q.content}</p>
                  {q.options.length > 0 && (
                    <p className="text-xs text-white/40">
                      選項：{q.options.map((o) => o.label).join('、')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(i)}
                    disabled={i === 0}
                    className="text-white/30 hover:text-white disabled:opacity-20 text-sm cursor-pointer p-1"
                    title="上移"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(i)}
                    disabled={i === questions.length - 1}
                    className="text-white/30 hover:text-white disabled:opacity-20 text-sm cursor-pointer p-1"
                    title="下移"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(q.id)}
                    className="text-cyan-400/60 hover:text-cyan-300 text-sm cursor-pointer p-1"
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
        <p className="text-xs text-yellow-400/60 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
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
  onSaved,
  onCancel,
}: {
  surveyId: string
  nextOrder: number
  onSaved: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    key: `q${nextOrder + 1}`,
    type: 'single' as string,
    content: '',
    options: [{ label: '', value: '' }],
    is_required: true,
    max_selections: null as number | null,
    route: 'all' as string,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.content.trim()) return
    setSaving(true)

    const options = form.type === 'text' ? [] : form.options.filter((o) => o.label.trim())

    await fetch(`/api/admin/surveys/${surveyId}/questions`, {
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
      }),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="bg-slate-800/60 border border-cyan-500/20 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-medium text-cyan-300">新增題目</h3>
      <QuestionFormFields form={form} onChange={setForm} />
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !form.content.trim()}
          className="px-4 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-lg text-sm disabled:opacity-40 cursor-pointer"
        >
          {saving ? '儲存中...' : '新增'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-slate-400 text-sm cursor-pointer"
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
  onSaved,
  onCancel,
}: {
  question: QuestionRow
  onSaved: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    key: question.key,
    type: question.type,
    content: question.content,
    options: question.options.length > 0 ? question.options : [{ label: '', value: '' }],
    is_required: question.is_required,
    max_selections: question.max_selections,
    route: question.route ?? 'all',
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
      }),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="space-y-3">
      <QuestionFormFields form={form} onChange={setForm} />
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-lg text-sm disabled:opacity-40 cursor-pointer"
        >
          {saving ? '儲存中...' : '儲存'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-slate-400 text-sm cursor-pointer"
        >
          取消
        </button>
      </div>
    </div>
  )
}

// ===== Shared Form Fields =====

interface FormState {
  key: string
  type: string
  content: string
  options: { label: string; value: string }[]
  is_required: boolean
  max_selections: number | null
  route: string
}

function QuestionFormFields({
  form,
  onChange,
}: {
  form: FormState
  onChange: (f: FormState) => void
}) {
  const addOption = () => {
    onChange({ ...form, options: [...form.options, { label: '', value: '' }] })
  }

  const removeOption = (index: number) => {
    onChange({ ...form, options: form.options.filter((_, i) => i !== index) })
  }

  const updateOption = (index: number, label: string) => {
    const options = [...form.options]
    options[index] = { label, value: label }
    onChange({ ...form, options })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr] gap-2 sm:items-center">
        <label className="text-xs text-white/40">Key</label>
        <input
          type="text"
          value={form.key}
          onChange={(e) => onChange({ ...form, key: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white/80 w-32"
        />

        <label className="text-xs text-white/40">類型</label>
        <select
          value={form.type}
          onChange={(e) => onChange({ ...form, type: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white/80 w-32"
        >
          <option value="single">single</option>
          <option value="multiple">multiple</option>
          <option value="text">text</option>
        </select>

        <label className="text-xs text-white/40">題目</label>
        <input
          type="text"
          value={form.content}
          onChange={(e) => onChange({ ...form, content: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white/80"
        />

        <label className="text-xs text-white/40">必填</label>
        <input
          type="checkbox"
          checked={form.is_required}
          onChange={(e) => onChange({ ...form, is_required: e.target.checked })}
          className="w-4 h-4"
        />

        <label className="text-xs text-white/40">路線</label>
        <select
          value={form.route}
          onChange={(e) => onChange({ ...form, route: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white/80 w-32"
        >
          <option value="all">所有人 (all)</option>
          <option value="A">原始問卷 (A)</option>
          <option value="B">B 路線</option>
          <option value="C">C 路線</option>
        </select>

        {form.type === 'multiple' && (
          <>
            <label className="text-xs text-white/40">最多選</label>
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
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white/80 w-20"
              min={1}
            />
          </>
        )}
      </div>

      {form.type !== 'text' && (
        <div className="space-y-2">
          <label className="text-xs text-white/40">選項</label>
          {form.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={opt.label}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`選項 ${i + 1}`}
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white/80"
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
            className="text-xs text-cyan-400/60 hover:text-cyan-300 cursor-pointer"
          >
            + 新增選項
          </button>
        </div>
      )}
    </div>
  )
}
