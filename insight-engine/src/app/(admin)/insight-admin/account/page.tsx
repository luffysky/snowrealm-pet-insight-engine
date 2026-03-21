'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AccountSettingsPage() {
  const router = useRouter()

  // 刪除帳號
  const [showDelete, setShowDelete] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleDeleteAccount = async () => {
    setDeleteError('')
    if (!deletePassword) { setDeleteError('請輸入密碼'); return }
    if (deleteConfirm !== '刪除我的帳號') { setDeleteError('請輸入「刪除我的帳號」確認'); return }

    setDeleteLoading(true)
    try {
      const res = await fetch('/api/admin/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword, confirmText: deleteConfirm }),
      })
      const data = await res.json()
      if (res.ok) {
        window.location.href = '/login'
      } else {
        setDeleteError(data.error || '刪除失敗')
      }
    } catch {
      setDeleteError('網路錯誤')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white">⚙️ 帳號設定</h1>

      {/* 修改密碼 */}
      <section className="bg-t-card-bg border border-t-card-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white/90">🔑 修改密碼</h2>
        <p className="text-sm text-white/40">
          如需修改密碼，請至 <a href="/forgot-password" className="text-t-accent hover:underline">忘記密碼頁面</a> 透過 Email 驗證碼重設。
        </p>
      </section>

      {/* 刪除帳號 */}
      <section className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-400">⚠️ 刪除帳號</h2>
        <p className="text-sm text-white/50">
          刪除帳號後，你的所有資料將被永久移除且無法恢復。問卷資料和回覆紀錄將保留在組織中。
        </p>

        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors cursor-pointer"
          >
            我要刪除帳號
          </button>
        ) : (
          <div className="space-y-3 border-t border-red-500/20 pt-4">
            <div>
              <label className="block text-xs text-red-300/70 mb-1">輸入密碼以確認身份</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-red-500/30 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-xs text-red-300/70 mb-1">
                輸入「<span className="text-red-400 font-medium">刪除我的帳號</span>」以確認
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="刪除我的帳號"
                className="w-full px-3 py-2 bg-slate-900 border border-red-500/30 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>
            {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                {deleteLoading ? '刪除中...' : '確認永久刪除帳號'}
              </button>
              <button
                onClick={() => { setShowDelete(false); setDeleteError(''); setDeletePassword(''); setDeleteConfirm('') }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
