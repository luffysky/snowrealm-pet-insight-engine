'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PLATFORM_PARTNER_BADGE, PLATFORM_PARTNER_BADGE_CLS } from '@/lib/platformPartnerUi'

interface Profile {
  id: string
  username: string
  displayName: string | null
  email: string | null
  phone: string | null
  role: string
  createdAt: string
  platformPartner?: boolean
  loginProvider: 'password' | 'line' | 'google'
  tenant: { slug: string; name: string }
}

const PROVIDER_LABEL: Record<string, string> = {
  password: '帳號密碼',
  line: 'LINE',
  google: 'Google',
}

const PROVIDER_ICON: Record<string, string> = {
  password: '🔑',
  line: '💬',
  google: '🔵',
}

export default function AccountSettingsPage() {
  useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // 個人資料
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // 組織資料
  const [editOrgName, setEditOrgName] = useState('')
  const [savingOrg, setSavingOrg] = useState(false)
  const [orgMsg, setOrgMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [slugCopied, setSlugCopied] = useState(false)

  // 密碼
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  // 刪除帳號
  const [showDelete, setShowDelete] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/account')
      if (res.ok) {
        const data: Profile = await res.json()
        setProfile(data)
        setEditName(data.displayName || '')
        setEditEmail(data.email || '')
        setEditPhone(data.phone || '')
        setEditOrgName(data.tenant?.name || '')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const res = await fetch('/api/admin/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-profile',
          displayName: editName.trim() || undefined,
          email: editEmail.trim() || undefined,
          phone: editPhone.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setProfileMsg({ ok: true, text: '資料已更新' })
        fetchProfile()
      } else {
        setProfileMsg({ ok: false, text: data.error || '更新失敗' })
      }
    } catch {
      setProfileMsg({ ok: false, text: '網路錯誤' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveOrgName = async () => {
    setSavingOrg(true)
    setOrgMsg(null)
    try {
      const res = await fetch('/api/admin/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-tenant-name', name: editOrgName.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setOrgMsg({ ok: true, text: '組織名稱已更新' })
        fetchProfile()
      } else {
        setOrgMsg({ ok: false, text: data.error || '更新失敗' })
      }
    } catch {
      setOrgMsg({ ok: false, text: '網路錯誤' })
    } finally {
      setSavingOrg(false)
    }
  }

  const handleCopySlug = () => {
    if (!profile?.tenant.slug) return
    navigator.clipboard.writeText(profile.tenant.slug)
    setSlugCopied(true)
    setTimeout(() => setSlugCopied(false), 2000)
  }

  const handleChangePassword = async () => {
    setPwMsg(null)
    if (!currentPw || !newPw) { setPwMsg({ ok: false, text: '請填寫完整' }); return }
    if (newPw.length < 6) { setPwMsg({ ok: false, text: '新密碼至少 6 個字元' }); return }
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: '兩次密碼不一致' }); return }

    setSavingPw(true)
    try {
      const res = await fetch('/api/admin/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change-password', currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (res.ok) {
        setPwMsg({ ok: true, text: '密碼已更新' })
        setCurrentPw('')
        setNewPw('')
        setConfirmPw('')
      } else {
        setPwMsg({ ok: false, text: data.error || '修改失敗' })
      }
    } catch {
      setPwMsg({ ok: false, text: '網路錯誤' })
    } finally {
      setSavingPw(false)
    }
  }

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

  if (loading) return <p className="text-[#6b5fa8] animate-pulse">載入中...</p>
  if (!profile) return <p className="text-red-400">無法載入帳號資料</p>

  const inputCls = 'w-full px-3 py-2 bg-white/60 border border-[#b8a9e8]/30 rounded-lg text-[#3d3155] text-sm focus:border-[#b8a9e8]/60 focus:outline-none'
  const readonlyCls = 'w-full px-3 py-2 bg-white/30 border border-[#b8a9e8]/15 rounded-lg text-[#3d3155]/60 text-sm select-all'

  const isAdmin = ['admin', 'super_admin'].includes(profile.role)
  const profileChanged =
    editName.trim() !== (profile.displayName || '') ||
    editEmail.trim() !== (profile.email || '') ||
    editPhone.trim() !== (profile.phone || '')

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-[#3d3155]">⚙️ 帳號設定</h1>
        {profile.platformPartner && (
          <span
            className={PLATFORM_PARTNER_BADGE_CLS}
            title="由平台開通之禮遇帳號：本人操作不套用一般方案額度。"
          >
            {PLATFORM_PARTNER_BADGE}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/20 text-[#6b5fa8] border border-[#b8a9e8]/20">
          {PROVIDER_ICON[profile.loginProvider]} {PROVIDER_LABEL[profile.loginProvider]} 登入
        </span>
      </div>

      {profile.platformPartner && (
        <p className="text-xs text-amber-200/75 -mt-4 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          您的帳號為平台合作禮遇身份：使用平台 AI 與訂閱／用量顯示將以無上限計；此權限僅限您本人操作，同組織其他成員仍依租戶方案。
        </p>
      )}

      {/* 組織資訊 */}
      <section className="bg-white/40 backdrop-blur-sm border border-[#b8a9e8]/25 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#3d3155]/90">🏢 組織資訊</h2>

        <div>
          <label className="block text-xs text-[#3d3155]/60 mb-1">組織名稱</label>
          {isAdmin ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editOrgName}
                onChange={(e) => setEditOrgName(e.target.value)}
                maxLength={50}
                className={inputCls}
              />
              <button
                onClick={handleSaveOrgName}
                disabled={savingOrg || editOrgName.trim() === profile.tenant.name}
                className="px-4 py-2 bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90 disabled:bg-[#b8a9e8]/10 disabled:text-[#6b5fa8] text-white rounded-lg text-sm shrink-0 transition-colors cursor-pointer"
              >
                {savingOrg ? '...' : '儲存'}
              </button>
            </div>
          ) : (
            <p className={readonlyCls}>{profile.tenant.name}</p>
          )}
          {orgMsg && (
            <p className={`text-xs mt-1 ${orgMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{orgMsg.text}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-[#3d3155]/60 mb-1">組織識別碼（Slug）</label>
          <div className="flex gap-2">
            <p className={`${readonlyCls} flex-1 font-mono text-xs`}>{profile.tenant.slug}</p>
            <button
              onClick={handleCopySlug}
              className="px-3 py-2 bg-white/40 hover:bg-white/60 border border-[#b8a9e8]/20 text-[#6b5fa8] rounded-lg text-sm shrink-0 transition-colors cursor-pointer"
            >
              {slugCopied ? '✓ 已複製' : '複製'}
            </button>
          </div>
          <p className="text-xs text-[#3d3155]/40 mt-1">識別碼不可修改，用於問卷連結和系統設定中。</p>
        </div>
      </section>

      {/* 個人資料 */}
      <section className="bg-white/40 backdrop-blur-sm border border-[#b8a9e8]/25 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#3d3155]/90">👤 個人資料</h2>

        <div>
          <label className="block text-xs text-[#3d3155]/60 mb-1">顯示名稱</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            maxLength={50}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#3d3155]/60 mb-1">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="尚未設定"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs text-[#3d3155]/60 mb-1">手機號碼</label>
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="尚未設定"
              className={inputCls}
            />
          </div>
        </div>

        {profileMsg && (
          <p className={`text-xs ${profileMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{profileMsg.text}</p>
        )}

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile || !profileChanged}
          className="px-4 py-2 bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90 disabled:bg-[#b8a9e8]/10 disabled:text-[#6b5fa8] text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          {savingProfile ? '儲存中...' : '儲存個人資料'}
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#b8a9e8]/20">
          <div>
            <label className="block text-xs text-[#3d3155]/60 mb-1">帳號</label>
            <p className="text-sm text-[#3d3155]/70">{profile.username}</p>
          </div>
          <div>
            <label className="block text-xs text-[#3d3155]/60 mb-1">角色</label>
            <p className="text-sm text-[#3d3155]/70">{profile.role === 'super_admin' ? 'admin' : profile.role}</p>
          </div>
          <div>
            <label className="block text-xs text-[#3d3155]/60 mb-1">建立時間</label>
            <p className="text-sm text-[#3d3155]/70">
              {new Date(profile.createdAt).toLocaleDateString('zh-TW')}
            </p>
          </div>
        </div>
      </section>

      {/* 修改密碼 */}
      <section className="bg-white/40 backdrop-blur-sm border border-[#b8a9e8]/25 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#3d3155]/90">🔑 修改密碼</h2>

        {profile.loginProvider !== 'password' ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-white/30 rounded-lg border border-[#b8a9e8]/20">
            <span className="text-2xl">{PROVIDER_ICON[profile.loginProvider]}</span>
            <div>
              <p className="text-sm text-[#3d3155]/80">此帳號使用 {PROVIDER_LABEL[profile.loginProvider]} 登入</p>
              <p className="text-xs text-[#3d3155]/50 mt-0.5">第三方登入帳號不需要設定密碼</p>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs text-[#3d3155]/60 mb-1">目前密碼</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  autoComplete="current-password"
                  className={inputCls}
                />
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3d3155]/60 hover:text-slate-300 cursor-pointer text-sm">
                  {showCurrentPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#3d3155]/60 mb-1">新密碼（至少 6 個字元）</label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                  className={inputCls}
                />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3d3155]/60 hover:text-slate-300 cursor-pointer text-sm">
                  {showNewPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#3d3155]/60 mb-1">確認新密碼</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                className={inputCls}
              />
            </div>

            {pwMsg && (
              <p className={`text-sm ${pwMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{pwMsg.text}</p>
            )}

            <button
              onClick={handleChangePassword}
              disabled={savingPw || !currentPw || !newPw}
              className="px-4 py-2 bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] hover:opacity-90 disabled:bg-[#b8a9e8]/10 disabled:text-[#6b5fa8] text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              {savingPw ? '修改中...' : '確認修改密碼'}
            </button>
          </>
        )}
      </section>

      {/* 刪除帳號 */}
      <section className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-400">⚠️ 刪除帳號</h2>
        <p className="text-sm text-[#3d3155]/50">
          帳號刪除後將保留 30 天備份。期間內可聯繫管理員恢復帳號。
          超過 30 天後資料將被永久移除。問卷資料和回覆紀錄將保留在組織中。
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
              <label className="block text-xs text-red-300/70 mb-1">步驟 1：輸入密碼以確認身份</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-3 py-2 bg-white/60 border border-red-500/30 rounded-lg text-[#3d3155] text-sm focus:border-red-500 focus:outline-none"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-xs text-red-300/70 mb-1">
                步驟 2：輸入「<span className="text-red-400 font-medium">刪除我的帳號</span>」以確認
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="刪除我的帳號"
                className="w-full px-3 py-2 bg-white/60 border border-red-500/30 rounded-lg text-[#3d3155] text-sm focus:border-red-500 focus:outline-none placeholder:text-[#b5a8d0]"
              />
            </div>
            {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                {deleteLoading ? '處理中...' : '確認刪除帳號（30 天內可恢復）'}
              </button>
              <button
                onClick={() => { setShowDelete(false); setDeleteError(''); setDeletePassword(''); setDeleteConfirm('') }}
                className="px-4 py-2 bg-[#b8a9e8]/15 hover:bg-[#b8a9e8]/25 text-[#6b5fa8] border border-[#b8a9e8]/25 rounded-lg text-sm transition-colors cursor-pointer"
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
