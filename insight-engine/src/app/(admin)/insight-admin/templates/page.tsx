'use client'

import { useEffect, useState, useCallback } from 'react'

interface Template {
  id: string
  name: string
  type: 'text' | 'flex'
  content: string
  flex_json: Record<string, unknown> | null
  category: string
  is_active: boolean
  created_at: string
}

const CATEGORIES = ['general', 'survey', 'waitlist', 'announcement', 'promotion']

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Template>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')

  const [confirmAction, setConfirmAction] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  const [newTpl, setNewTpl] = useState({
    name: '',
    type: 'text' as 'text' | 'flex',
    content: '',
    category: 'general',
  })

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/templates')
    if (res.ok) setTemplates(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const filtered = filterCategory
    ? templates.filter((t) => t.category === filterCategory)
    : templates

  function handleAdd() {
    if (!newTpl.name || !newTpl.content) return
    setConfirmAction({
      title: '新增訊息模板',
      message: `確認新增「${newTpl.name}」？`,
      onConfirm: async () => {
        const res = await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTpl),
        })
        if (res.ok) {
          setShowAddForm(false)
          setNewTpl({ name: '', type: 'text', content: '', category: 'general' })
          fetchTemplates()
        }
        setConfirmAction(null)
      },
    })
  }

  function handleToggle(tpl: Template) {
    setConfirmAction({
      title: tpl.is_active ? '停用模板' : '啟用模板',
      message: `確認${tpl.is_active ? '停用' : '啟用'}「${tpl.name}」？`,
      onConfirm: async () => {
        await fetch('/api/admin/templates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: tpl.id, is_active: !tpl.is_active }),
        })
        fetchTemplates()
        setConfirmAction(null)
      },
    })
  }

  function handleDelete(tpl: Template) {
    setConfirmAction({
      title: '刪除模板',
      message: `確認刪除「${tpl.name}」？此操作無法復原。`,
      onConfirm: async () => {
        await fetch(`/api/admin/templates?id=${tpl.id}`, { method: 'DELETE' })
        fetchTemplates()
        setConfirmAction(null)
      },
    })
  }

  function startEdit(tpl: Template) {
    setEditingId(tpl.id)
    setEditForm({ name: tpl.name, content: tpl.content, category: tpl.category })
  }

  function handleSaveEdit(tpl: Template) {
    setConfirmAction({
      title: '儲存修改',
      message: `確認儲存「${editForm.name ?? tpl.name}」的修改？`,
      onConfirm: async () => {
        await fetch('/api/admin/templates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: tpl.id, ...editForm }),
        })
        setEditingId(null)
        fetchTemplates()
        setConfirmAction(null)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">訊息模板</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-t-btn text-white rounded hover:bg-t-btn-hover text-sm"
        >
          {showAddForm ? '取消' : '+ 新增模板'}
        </button>
      </div>

      {/* 新增表單 */}
      {showAddForm && (
        <div className="bg-slate-800/80 rounded-lg p-4 space-y-3 border border-slate-700">
          <h3 className="text-white font-medium">新增訊息模板</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              placeholder="模板名稱"
              value={newTpl.name}
              onChange={(e) => setNewTpl({ ...newTpl, name: e.target.value })}
              className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
            />
            <select
              value={newTpl.type}
              onChange={(e) => setNewTpl({ ...newTpl, type: e.target.value as 'text' | 'flex' })}
              className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
            >
              <option value="text">純文字</option>
              <option value="flex">Flex Message</option>
            </select>
            <select
              value={newTpl.category}
              onChange={(e) => setNewTpl({ ...newTpl, category: e.target.value })}
              className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <textarea
            placeholder={newTpl.type === 'text' ? '訊息內容...' : 'Flex Message JSON（contents 部分）'}
            value={newTpl.content}
            onChange={(e) => setNewTpl({ ...newTpl, content: e.target.value })}
            className="w-full bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm h-24"
          />
          {/* 預覽 */}
          {newTpl.content && newTpl.type === 'text' && (
            <div className="bg-slate-900 rounded p-3">
              <p className="text-xs text-slate-400 mb-1">預覽</p>
              <p className="text-white text-sm whitespace-pre-wrap">{newTpl.content}</p>
            </div>
          )}
          <button
            onClick={handleAdd}
            disabled={!newTpl.name || !newTpl.content}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
          >
            確認新增
          </button>
        </div>
      )}

      {/* 分類過濾 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory('')}
          className={`px-3 py-1 rounded text-xs ${!filterCategory ? 'bg-t-btn text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          全部
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCategory(c)}
            className={`px-3 py-1 rounded text-xs ${filterCategory === c ? 'bg-t-btn text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 模板列表 */}
      {loading ? (
        <p className="text-slate-400">載入中…</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-400">尚無模板</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className={`bg-slate-800/80 rounded-lg p-4 border ${
                tpl.is_active ? 'border-slate-700' : 'border-slate-700/50 opacity-60'
              }`}
            >
              {editingId === tpl.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={editForm.name ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
                    />
                    <select
                      value={editForm.category ?? tpl.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={editForm.content ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="w-full bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm h-24"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(tpl)} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700">儲存</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-600 text-white rounded text-sm hover:bg-slate-500">取消</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${tpl.is_active ? 'bg-green-400' : 'bg-slate-500'}`} />
                      <h3 className="text-white font-medium">{tpl.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400 mb-2">
                      <span className="bg-slate-700 px-2 py-0.5 rounded">{tpl.type}</span>
                      <span className="bg-slate-700 px-2 py-0.5 rounded">{tpl.category}</span>
                    </div>
                    <p className="text-slate-400 text-xs whitespace-pre-wrap line-clamp-3">{tpl.content}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggle(tpl)}
                      className={`px-3 py-1.5 rounded text-xs font-medium ${
                        tpl.is_active
                          ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                          : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                      }`}
                    >
                      {tpl.is_active ? '停用' : '啟用'}
                    </button>
                    <button onClick={() => startEdit(tpl)} className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600">編輯</button>
                    <button onClick={() => handleDelete(tpl)} className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded text-xs hover:bg-red-600/30">刪除</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 二次確認 Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 rounded-lg p-6 max-w-sm w-full mx-4 border border-slate-700">
            <h3 className="text-white font-bold text-lg mb-2">{confirmAction.title}</h3>
            <p className="text-slate-300 text-sm mb-4">{confirmAction.message}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 bg-slate-600 text-white rounded text-sm hover:bg-slate-500">取消</button>
              <button onClick={confirmAction.onConfirm} className="px-4 py-2 bg-t-btn text-white rounded text-sm hover:bg-t-btn-hover">確認</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
