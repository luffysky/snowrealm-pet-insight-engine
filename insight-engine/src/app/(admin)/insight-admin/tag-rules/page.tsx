'use client'

import { useEffect, useState, useCallback } from 'react'

interface TagRule {
  id: string
  survey_id: string
  question_key: string
  answer_value: string | null
  match_mode: string
  tag_key: string
  tag_value: string
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

type NewRule = {
  questionKey: string
  answerValue: string
  matchMode: string
  tagKey: string
  tagValue: string
  priority: number
}

const EMPTY_NEW: NewRule = { questionKey: '', answerValue: '', matchMode: 'exact', tagKey: '', tagValue: '', priority: 0 }
const MVP_SURVEY_ID = '00000000-0000-0000-0000-000000000001'

export default function TagRulesPage() {
  const [rules, setRules] = useState<TagRule[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [newRule, setNewRule] = useState<NewRule>({ ...EMPTY_NEW })
  const [showAdd, setShowAdd] = useState(false)

  // 二次確認
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'toggle' | 'save'
    ruleId: string
    label: string
    payload?: Partial<TagRule>
  } | null>(null)

  // 編輯模式
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<TagRule>>({})

  const [saving, setSaving] = useState(false)

  const fetchRules = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/tag-rules?surveyId=${MVP_SURVEY_ID}`)
    if (res.ok) setRules(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchRules() }, [fetchRules])

  // ---- 二次確認執行 ----
  async function executeConfirm() {
    if (!confirmAction) return
    setSaving(true)
    try {
      if (confirmAction.type === 'delete') {
        await fetch(`/api/admin/tag-rules?id=${confirmAction.ruleId}`, { method: 'DELETE' })
      } else if (confirmAction.type === 'toggle') {
        await fetch('/api/admin/tag-rules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: confirmAction.ruleId, isActive: confirmAction.payload?.is_active }),
        })
      } else if (confirmAction.type === 'save') {
        await fetch('/api/admin/tag-rules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: confirmAction.ruleId,
            questionKey: confirmAction.payload?.question_key,
            answerValue: confirmAction.payload?.answer_value,
            matchMode: confirmAction.payload?.match_mode,
            tagKey: confirmAction.payload?.tag_key,
            tagValue: confirmAction.payload?.tag_value,
            priority: confirmAction.payload?.priority,
          }),
        })
      }
      setConfirmAction(null)
      setEditId(null)
      setEditData({})
      await fetchRules()
    } finally {
      setSaving(false)
    }
  }

  // ---- 新增 ----
  async function handleAdd() {
    if (!newRule.questionKey || !newRule.tagKey || !newRule.tagValue) return
    setSaving(true)
    try {
      await fetch('/api/admin/tag-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: MVP_SURVEY_ID,
          questionKey: newRule.questionKey,
          answerValue: newRule.answerValue || undefined,
          matchMode: newRule.matchMode,
          tagKey: newRule.tagKey,
          tagValue: newRule.tagValue,
          priority: newRule.priority,
        }),
      })
      setNewRule({ ...EMPTY_NEW })
      setShowAdd(false)
      await fetchRules()
    } finally {
      setSaving(false)
    }
  }

  // ---- 分組 ----
  const grouped = rules.reduce<Record<string, TagRule[]>>((acc, r) => {
    if (filter && !r.question_key.includes(filter) && !r.tag_key.includes(filter)) return acc
    const group = r.question_key
    if (!acc[group]) acc[group] = []
    acc[group].push(r)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">標籤規則管理</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="搜尋 question_key 或 tag_key..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-1.5 text-sm w-full sm:w-64"
          />
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-t-btn hover:bg-t-btn-hover text-white px-4 py-1.5 rounded-lg text-sm font-medium"
          >
            {showAdd ? '收起' : '+ 新增規則'}
          </button>
        </div>
      </div>

      {/* 新增表單 */}
      {showAdd && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-slate-300">新增標籤規則</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Field label="題目 Key" value={newRule.questionKey} onChange={(v) => setNewRule({ ...newRule, questionKey: v })} placeholder="q1" />
            <Field label="答案值" value={newRule.answerValue} onChange={(v) => setNewRule({ ...newRule, answerValue: v })} placeholder="答案文字" />
            <div>
              <label className="text-xs text-slate-400 block mb-1">匹配模式</label>
              <select
                value={newRule.matchMode}
                onChange={(e) => setNewRule({ ...newRule, matchMode: e.target.value })}
                className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1.5 text-sm w-full"
              >
                <option value="exact">exact（完全匹配）</option>
                <option value="contains">contains（多選包含）</option>
                <option value="any">any（有答就匹配）</option>
              </select>
            </div>
            <Field label="標籤 Key" value={newRule.tagKey} onChange={(v) => setNewRule({ ...newRule, tagKey: v })} placeholder="pet_type" />
            <Field label="標籤 Value" value={newRule.tagValue} onChange={(v) => setNewRule({ ...newRule, tagValue: v })} placeholder="dog" />
            <div>
              <label className="text-xs text-slate-400 block mb-1">優先順序</label>
              <input
                type="number"
                value={newRule.priority}
                onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 0 })}
                className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1.5 text-sm w-full"
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !newRule.questionKey || !newRule.tagKey || !newRule.tagValue}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
          >
            {saving ? '儲存中...' : '新增'}
          </button>
        </div>
      )}

      {/* 二次確認 Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">確認操作</h3>
            <p className="text-slate-300 text-sm">{confirmAction.label}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="text-slate-400 hover:text-white px-4 py-2 rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={executeConfirm}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                  confirmAction.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-t-btn hover:bg-t-btn-hover'
                } disabled:opacity-40`}
              >
                {saving ? '執行中...' : '確認執行'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 規則列表 */}
      {loading ? (
        <p className="text-slate-500 text-center py-12">載入中...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-slate-500 text-center py-12">尚無規則</p>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([qKey, items]) => (
            <div key={qKey} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-x-auto">
              <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
                <h3 className="text-sm font-medium text-t-accent">{qKey}</h3>
              </div>
              <div className="divide-y divide-slate-700/40">
                {items.map((rule) => (
                  <div key={rule.id} className={`px-4 py-3 text-sm flex items-center gap-3 ${editId !== rule.id ? 'flex-wrap' : ''} ${!rule.is_active ? 'opacity-40' : ''}`}>
                    {editId === rule.id ? (
                      // 編輯模式
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-2">
                        <input value={editData.answer_value ?? ''} onChange={(e) => setEditData({ ...editData, answer_value: e.target.value })} className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-xs" placeholder="答案值" />
                        <select value={editData.match_mode ?? 'exact'} onChange={(e) => setEditData({ ...editData, match_mode: e.target.value })} className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-xs">
                          <option value="exact">exact</option>
                          <option value="contains">contains</option>
                          <option value="any">any</option>
                        </select>
                        <input value={editData.tag_key ?? ''} onChange={(e) => setEditData({ ...editData, tag_key: e.target.value })} className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-xs" placeholder="tag_key" />
                        <input value={editData.tag_value ?? ''} onChange={(e) => setEditData({ ...editData, tag_value: e.target.value })} className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-xs" placeholder="tag_value" />
                        <input type="number" value={editData.priority ?? 0} onChange={(e) => setEditData({ ...editData, priority: parseInt(e.target.value) || 0 })} className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-xs w-16" />
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setConfirmAction({
                                type: 'save',
                                ruleId: rule.id,
                                label: `確定要儲存對「${rule.question_key}」→「${editData.tag_key}=${editData.tag_value}」的修改嗎？`,
                                payload: { question_key: rule.question_key, ...editData },
                              })
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-xs"
                          >
                            儲存
                          </button>
                          <button
                            onClick={() => { setEditId(null); setEditData({}) }}
                            className="text-slate-400 hover:text-white px-2 py-1 rounded text-xs"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 顯示模式
                      <>
                        <span className="text-slate-400 w-36 shrink-0 truncate">{rule.answer_value ?? '(any)'}</span>
                        <span className="text-slate-500 w-16 shrink-0">{rule.match_mode}</span>
                        <span className="text-white font-mono">{rule.tag_key}</span>
                        <span className="text-slate-400">=</span>
                        <span className="text-emerald-400 font-mono">{rule.tag_value}</span>
                        {rule.priority > 0 && (
                          <span className="text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">P{rule.priority}</span>
                        )}
                        <div className="ml-auto flex gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditId(rule.id)
                              setEditData({
                                answer_value: rule.answer_value ?? '',
                                match_mode: rule.match_mode,
                                tag_key: rule.tag_key,
                                tag_value: rule.tag_value,
                                priority: rule.priority,
                              })
                            }}
                            className="text-slate-400 hover:text-t-accent px-1.5 py-0.5 text-xs"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => setConfirmAction({
                              type: 'toggle',
                              ruleId: rule.id,
                              label: `確定要${rule.is_active ? '停用' : '啟用'}「${rule.question_key} → ${rule.tag_key}=${rule.tag_value}」嗎？`,
                              payload: { is_active: !rule.is_active },
                            })}
                            className={`px-1.5 py-0.5 text-xs rounded ${
                              rule.is_active
                                ? 'text-amber-400 hover:text-amber-300'
                                : 'text-emerald-400 hover:text-emerald-300'
                            }`}
                          >
                            {rule.is_active ? '停用' : '啟用'}
                          </button>
                          <button
                            onClick={() => setConfirmAction({
                              type: 'delete',
                              ruleId: rule.id,
                              label: `確定要永久刪除「${rule.question_key} → ${rule.tag_key}=${rule.tag_value}」嗎？此操作無法復原。`,
                            })}
                            className="text-red-400 hover:text-red-300 px-1.5 py-0.5 text-xs"
                          >
                            刪除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
      )}

      <p className="text-xs text-slate-500 text-center">
        共 {rules.length} 條規則 · 問卷提交時自動依規則產生標籤
      </p>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="text-xs text-slate-400 block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1.5 text-sm w-full"
      />
    </div>
  )
}
