'use client'

import { useEffect, useState, useCallback } from 'react'

interface NotificationRule {
  id: string
  name: string
  survey_id: string | null
  condition_type: 'tag_match' | 'completion'
  condition_config: {
    tag_key?: string
    tag_value?: string
    operator?: string
  }
  action_type: 'line_push_admin' | 'line_push_user'
  message_template: string
  is_active: boolean
  created_at: string
}

interface NotificationLog {
  id: string
  rule_id: string | null
  rule_name: string | null
  trigger_type: string
  recipient_type: string
  recipient_id: string
  response_id: string | null
  status: string
  error_message: string | null
  created_at: string
}

const CONDITION_TYPES = [
  { value: 'tag_match', label: '標籤比對' },
  { value: 'completion', label: '問卷完成' },
]

const ACTION_TYPES = [
  { value: 'line_push_admin', label: '推播給管理員' },
  { value: 'line_push_user', label: '推播給填寫者' },
]

const OPERATORS = [
  { value: 'eq', label: '等於' },
  { value: 'contains', label: '包含' },
  { value: 'any', label: '任一符合' },
]

export default function NotificationRulesPage() {
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [tab, setTab] = useState<'rules' | 'logs'>('rules')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<NotificationRule>>({})
  const [showAddForm, setShowAddForm] = useState(false)

  // 二次確認 Modal
  const [confirmAction, setConfirmAction] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  const fetchRules = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/notification-rules')
    if (res.ok) setRules(await res.json())
    setLoading(false)
  }, [])

  const fetchLogs = useCallback(async () => {
    const res = await fetch('/api/admin/notification-logs?pageSize=50')
    if (res.ok) {
      const data = await res.json()
      setLogs(data.data)
    }
  }, [])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  useEffect(() => {
    if (tab === 'logs') fetchLogs()
  }, [tab, fetchLogs])

  // ---- 新增 ----
  const [newRule, setNewRule] = useState({
    name: '',
    condition_type: 'tag_match',
    condition_config: { tag_key: '', tag_value: '', operator: 'eq' },
    action_type: 'line_push_admin',
    message_template: '',
  })

  function handleAddRule() {
    setConfirmAction({
      title: '新增通知規則',
      message: `確認新增「${newRule.name}」？`,
      onConfirm: async () => {
        const res = await fetch('/api/admin/notification-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRule),
        })
        if (res.ok) {
          setShowAddForm(false)
          setNewRule({
            name: '',
            condition_type: 'tag_match',
            condition_config: { tag_key: '', tag_value: '', operator: 'eq' },
            action_type: 'line_push_admin',
            message_template: '',
          })
          fetchRules()
        }
        setConfirmAction(null)
      },
    })
  }

  // ---- 切換啟停 ----
  function handleToggleActive(rule: NotificationRule) {
    setConfirmAction({
      title: rule.is_active ? '停用規則' : '啟用規則',
      message: `確認${rule.is_active ? '停用' : '啟用'}「${rule.name}」？`,
      onConfirm: async () => {
        await fetch('/api/admin/notification-rules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: rule.id, is_active: !rule.is_active }),
        })
        fetchRules()
        setConfirmAction(null)
      },
    })
  }

  // ---- 刪除 ----
  function handleDelete(rule: NotificationRule) {
    setConfirmAction({
      title: '刪除通知規則',
      message: `確認刪除「${rule.name}」？此操作無法復原。`,
      onConfirm: async () => {
        await fetch(`/api/admin/notification-rules?id=${rule.id}`, { method: 'DELETE' })
        fetchRules()
        setConfirmAction(null)
      },
    })
  }

  // ---- 編輯 ----
  function startEdit(rule: NotificationRule) {
    setEditingId(rule.id)
    setEditForm({
      name: rule.name,
      condition_type: rule.condition_type,
      condition_config: { ...rule.condition_config },
      action_type: rule.action_type,
      message_template: rule.message_template,
    })
  }

  function handleSaveEdit(rule: NotificationRule) {
    setConfirmAction({
      title: '儲存修改',
      message: `確認儲存「${editForm.name ?? rule.name}」的修改？`,
      onConfirm: async () => {
        await fetch('/api/admin/notification-rules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: rule.id, ...editForm }),
        })
        setEditingId(null)
        fetchRules()
        setConfirmAction(null)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">通知規則</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('rules')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              tab === 'rules' ? 'bg-t-btn text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            規則管理
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              tab === 'logs' ? 'bg-t-btn text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            發送記錄
          </button>
        </div>
      </div>

      {tab === 'rules' && (
        <>
          {/* 新增按鈕 */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-t-btn text-white rounded hover:bg-t-btn-hover text-sm"
          >
            {showAddForm ? '取消新增' : '+ 新增規則'}
          </button>

          {/* 新增表單 */}
          {showAddForm && (
            <div className="bg-slate-800/80 rounded-lg p-4 space-y-3 border border-slate-700">
              <h3 className="text-white font-medium">新增通知規則</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  placeholder="規則名稱"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
                />
                <select
                  value={newRule.condition_type}
                  onChange={(e) => setNewRule({ ...newRule, condition_type: e.target.value })}
                  className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
                >
                  {CONDITION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {newRule.condition_type === 'tag_match' && (
                  <>
                    <input
                      placeholder="tag_key（如 emotion_level）"
                      value={newRule.condition_config.tag_key}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          condition_config: { ...newRule.condition_config, tag_key: e.target.value },
                        })
                      }
                      className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
                    />
                    <input
                      placeholder="tag_value（如 high）"
                      value={newRule.condition_config.tag_value}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          condition_config: { ...newRule.condition_config, tag_value: e.target.value },
                        })
                      }
                      className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
                    />
                    <select
                      value={newRule.condition_config.operator}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          condition_config: { ...newRule.condition_config, operator: e.target.value },
                        })
                      }
                      className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
                    >
                      {OPERATORS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </>
                )}
                <select
                  value={newRule.action_type}
                  onChange={(e) => setNewRule({ ...newRule, action_type: e.target.value })}
                  className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
                >
                  {ACTION_TYPES.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="訊息模板：支援 {{response_id}}, {{survey_slug}}, {{tag_value}}"
                value={newRule.message_template}
                onChange={(e) => setNewRule({ ...newRule, message_template: e.target.value })}
                className="w-full bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm h-20"
              />
              <button
                onClick={handleAddRule}
                disabled={!newRule.name}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
              >
                確認新增
              </button>
            </div>
          )}

          {/* 規則列表 */}
          {loading ? (
            <p className="text-slate-400">載入中…</p>
          ) : rules.length === 0 ? (
            <p className="text-slate-400">尚無通知規則</p>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`bg-slate-800/80 rounded-lg p-4 border ${
                    rule.is_active ? 'border-slate-700' : 'border-slate-700/50 opacity-60'
                  }`}
                >
                  {editingId === rule.id ? (
                    /* 編輯模式 */
                    <div className="space-y-3">
                      <input
                        value={editForm.name ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm w-full"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                          value={editForm.condition_type ?? rule.condition_type}
                          onChange={(e) => setEditForm({ ...editForm, condition_type: e.target.value as NotificationRule['condition_type'] })}
                          className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
                        >
                          {CONDITION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        {(editForm.condition_type ?? rule.condition_type) === 'tag_match' && (
                          <>
                            <input
                              placeholder="tag_key"
                              value={editForm.condition_config?.tag_key ?? ''}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  condition_config: { ...editForm.condition_config, tag_key: e.target.value },
                                })
                              }
                              className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
                            />
                            <input
                              placeholder="tag_value"
                              value={editForm.condition_config?.tag_value ?? ''}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  condition_config: { ...editForm.condition_config, tag_value: e.target.value },
                                })
                              }
                              className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
                            />
                          </>
                        )}
                        <select
                          value={editForm.action_type ?? rule.action_type}
                          onChange={(e) => setEditForm({ ...editForm, action_type: e.target.value as NotificationRule['action_type'] })}
                          className="bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm"
                        >
                          {ACTION_TYPES.map((a) => (
                            <option key={a.value} value={a.value}>{a.label}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={editForm.message_template ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, message_template: e.target.value })}
                        className="w-full bg-slate-900 text-white px-3 py-2 rounded border border-slate-600 text-sm h-20"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveEdit(rule)} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700">儲存</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-600 text-white rounded text-sm hover:bg-slate-500">取消</button>
                      </div>
                    </div>
                  ) : (
                    /* 顯示模式 */
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${rule.is_active ? 'bg-green-400' : 'bg-slate-500'}`} />
                          <h3 className="text-white font-medium">{rule.name}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-400 mb-2">
                          <span className="bg-slate-700 px-2 py-0.5 rounded">
                            {CONDITION_TYPES.find((t) => t.value === rule.condition_type)?.label}
                          </span>
                          {rule.condition_type === 'tag_match' && rule.condition_config.tag_key && (
                            <span className="bg-slate-700 px-2 py-0.5 rounded">
                              {rule.condition_config.tag_key} = {rule.condition_config.tag_value}
                            </span>
                          )}
                          <span className="bg-slate-700 px-2 py-0.5 rounded">
                            {ACTION_TYPES.find((a) => a.value === rule.action_type)?.label}
                          </span>
                        </div>
                        {rule.message_template && (
                          <p className="text-slate-400 text-xs truncate">{rule.message_template}</p>
                        )}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggleActive(rule)}
                          className={`px-3 py-1.5 rounded text-xs font-medium ${
                            rule.is_active
                              ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                              : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                          }`}
                        >
                          {rule.is_active ? '停用' : '啟用'}
                        </button>
                        <button
                          onClick={() => startEdit(rule)}
                          className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(rule)}
                          className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded text-xs hover:bg-red-600/30"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'logs' && (
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-slate-400">尚無發送記錄</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-2 px-3">時間</th>
                    <th className="py-2 px-3">觸發類型</th>
                    <th className="py-2 px-3">規則</th>
                    <th className="py-2 px-3">接收者</th>
                    <th className="py-2 px-3">狀態</th>
                    <th className="py-2 px-3">錯誤</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-t-card-border text-slate-300">
                      <td className="py-2 px-3 whitespace-nowrap text-xs">
                        {new Date(log.created_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
                      </td>
                      <td className="py-2 px-3">
                        <span className="bg-slate-700 px-2 py-0.5 rounded text-xs">
                          {log.trigger_type === 'rule' ? '規則觸發' : log.trigger_type === 'weekly_report' ? '週報' : '手動'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs">{log.rule_name ?? '-'}</td>
                      <td className="py-2 px-3 text-xs">
                        <span className="text-slate-400">{log.recipient_type === 'admin' ? '管理員' : '使用者'}</span>
                        <span className="ml-1 text-slate-500">{log.recipient_id.slice(0, 10)}…</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-xs font-medium ${log.status === 'sent' ? 'text-green-400' : 'text-red-400'}`}>
                          {log.status === 'sent' ? '已送' : '失敗'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-red-400 max-w-[200px] truncate">
                        {log.error_message ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 二次確認 Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 rounded-lg p-6 max-w-sm w-full mx-4 border border-slate-700">
            <h3 className="text-white font-bold text-lg mb-2">{confirmAction.title}</h3>
            <p className="text-slate-300 text-sm mb-4">{confirmAction.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-slate-600 text-white rounded text-sm hover:bg-slate-500"
              >
                取消
              </button>
              <button
                onClick={confirmAction.onConfirm}
                className="px-4 py-2 bg-t-btn text-white rounded text-sm hover:bg-t-btn-hover"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
