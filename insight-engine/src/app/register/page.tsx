'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Step = 'form' | 'verify'

// ─── Terms Agreement Modal ────────────────────────────────────────────────────

interface TermsModalProps {
  onAgree: () => void
  onClose: () => void
}

function TermsModal({ onAgree, onClose }: TermsModalProps) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [checked, setChecked] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const reachedBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    if (reachedBottom) setScrolledToBottom(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white/95 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: 'var(--font-zen-maru), var(--font-noto-tc), sans-serif' }}
      >
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-3 border-b border-[#b8a9e8]/20">
          <div className="w-10 h-1 bg-[#b8a9e8]/30 rounded-full mx-auto mb-4 sm:hidden" />
          <h2 className="text-base font-bold text-[#3d3155] text-center">📋 服務條款與隱私政策</h2>
          <p className="text-xs text-[#8a7ca8] text-center mt-1">請閱讀以下條款，滑到底部後勾選同意</p>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-5 py-4 text-[13px] text-[#4a3b6b] leading-relaxed space-y-4"
        >
          <section>
            <h3 className="font-bold text-[#3d3155] mb-1">📌 使用者條款（摘要）</h3>
            <p>歡迎使用 SnowRealm Insight Engine。使用本服務即代表您同意以下條款。如不同意，請勿註冊或使用本服務。</p>
            <ul className="list-disc pl-4 mt-2 space-y-1 text-[#5a4b7b]">
              <li>本服務供合法用途使用，不得用於任何違法行為</li>
              <li>您對帳號安全負責，請勿將帳號分享給第三方</li>
              <li>您上傳或建立的內容由您自行負責</li>
              <li>我們保留在違反條款時暫停帳號的權利</li>
              <li>本服務內容可能隨時更新，恕不另行通知</li>
              <li>免費方案可能設有使用量限制</li>
              <li>完整條款請參閱：<a href="/terms" target="_blank" rel="noopener noreferrer" className="underline text-[#7c5cbf]">使用者條款全文</a></li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-[#3d3155] mb-1">🔒 隱私權政策（摘要）</h3>
            <p>我們重視您的個人資料，並依據以下原則處理：</p>
            <ul className="list-disc pl-4 mt-2 space-y-1 text-[#5a4b7b]">
              <li>我們收集您的 Email、手機、顯示名稱以提供服務</li>
              <li>您的資料不會被出售給第三方</li>
              <li>我們使用 Cookie 和類似技術提升使用體驗</li>
              <li>您可隨時申請刪除帳號與相關資料</li>
              <li>我們採用業界標準的加密措施保護您的資料</li>
              <li>完整政策請參閱：<a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-[#7c5cbf]">隱私權政策全文</a></li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-[#3d3155] mb-1">🍪 Cookie 政策（摘要）</h3>
            <p>本服務使用 Cookie 進行以下目的：</p>
            <ul className="list-disc pl-4 mt-2 space-y-1 text-[#5a4b7b]">
              <li><strong>必要性 Cookie</strong>：維持登入狀態與安全性</li>
              <li><strong>功能性 Cookie</strong>：記憶您的偏好設定</li>
              <li><strong>分析性 Cookie</strong>：了解服務使用情況（匿名）</li>
              <li>您可在瀏覽器設定中管理 Cookie</li>
              <li>完整政策請參閱：<a href="/cookies" target="_blank" rel="noopener noreferrer" className="underline text-[#7c5cbf]">Cookie 政策全文</a></li>
            </ul>
          </section>

          <section className="bg-[#f3eeff] rounded-2xl px-4 py-3">
            <p className="text-[12px] text-[#8a7ca8]">
              您的個人資料受中華民國個人資料保護法保護。如有任何疑問，請聯繫我們的客服團隊。
              使用本服務表示您已年滿 13 歲，或已取得監護人同意。
            </p>
          </section>

          {/* Spacer to ensure users actually scroll */}
          <div className="h-2" />
        </div>

        {/* Agree section */}
        <div className="shrink-0 px-5 py-4 border-t border-[#b8a9e8]/20 bg-white/80">
          {!scrolledToBottom && (
            <p className="text-[11px] text-[#b8a9e8] text-center mb-3 animate-pulse">
              ↓ 請繼續向下捲動閱讀完整條款
            </p>
          )}
          <label className={`flex items-start gap-3 cursor-pointer mb-4 transition-opacity ${scrolledToBottom ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#b8a9e8]"
            />
            <span className="text-[13px] text-[#4a3b6b] leading-snug">
              我已閱讀並同意 SnowRealm 的{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline text-[#7c5cbf]">使用者條款</a>、
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-[#7c5cbf]">隱私權政策</a>{' '}
              及{' '}
              <a href="/cookies" target="_blank" rel="noopener noreferrer" className="underline text-[#7c5cbf]">Cookie 政策</a>
            </span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-[#b8a9e8]/30 text-[#8a7ca8] text-sm font-medium hover:bg-[#b8a9e8]/10 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => { if (checked) onAgree() }}
              disabled={!checked}
              className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] text-white text-sm font-semibold shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.01]"
            >
              同意並繼續 →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function useInAppBrowser() {
  const [isInApp, setIsInApp] = useState(false)
  useEffect(() => {
    const ua = navigator.userAgent
    setIsInApp(/Instagram|FBAN|FBAV|FB_IAB|MicroMessenger|Line\//.test(ua))
  }, [])
  return isInApp
}

function InAppBrowserBanner() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }
  return (
    <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
      <p className="font-medium mb-1">⚠️ 請在瀏覽器中開啟此頁面</p>
      <p className="text-xs text-amber-200/70 mb-2">在 Instagram / Facebook 內建瀏覽器中登入或註冊可能無法正常儲存，建議複製連結後用 Safari 或 Chrome 開啟。</p>
      <button onClick={copy} className="px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 rounded-lg text-xs font-medium transition-colors cursor-pointer">
        {copied ? '✓ 已複製連結' : '複製連結'}
      </button>
    </div>
  )
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const referralCode = searchParams.get('ref')
  const redirectTo = searchParams.get('redirect')
  const mobileCallback = searchParams.get('mobile_callback')
  const isInApp = useInAppBrowser()

  const [step, setStep] = useState<Step>('form')
  const [termsModalOpen, setTermsModalOpen] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+886')
  const [displayName, setDisplayName] = useState('')
  const [orgName, setOrgName] = useState(inviteToken ? '受邀加入團隊' : '')
  const [slug, setSlug] = useState(inviteToken ? 'invite-slug' : '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [code, setCode] = useState('')
  const [codeId, setCodeId] = useState('')
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // 倒數計時
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Gate: require terms agreement before running an action
  const requireTerms = (action: () => void) => {
    if (termsAgreed) {
      action()
    } else {
      setPendingAction(() => action)
      setTermsModalOpen(true)
    }
  }

  const handleTermsAgree = () => {
    setTermsAgreed(true)
    setTermsModalOpen(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  // ── Step 1: 發送驗證碼 ──
  const handleSendCode = useCallback(async () => {
    setError('')
    if ((!email && !phone) || !displayName || !password || !confirmPassword) {
      setError('請填寫完整資料')
      return
    }
    if (!inviteToken) {
      if (!orgName || !slug) {
        setError('請填寫完整資料')
        return
      }
      if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug)) {
        setError('後台網址只允許小寫英文、數字、連字號，3～30 字元')
        return
      }
    }
    if (!email && !phone) {
      setError('請至少填寫 Email 或手機號碼')
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('請輸入有效的 Email')
      return
    }
    if (password.length < 6) {
      setError('密碼至少 6 個字元')
      return
    }
    if (password !== confirmPassword) {
      setError('兩次密碼不一致')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || undefined, phone: phone ? `${countryCode}${phone.replace(/^0+/, '')}` : undefined, purpose: 'register' }),
      })
      const data = await res.json()
      if (res.ok) {
        setCodeId(data.codeId)
        setStep('verify')
        setCooldown(60)
      } else {
        setError(data.error || '驗證碼寄送失敗')
      }
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }, [email, phone, displayName, orgName, slug, password, confirmPassword])

  // ── Step 2: 重新發送 ──
  const handleResend = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || undefined, phone: phone ? `${countryCode}${phone.replace(/^0+/, '')}` : undefined, purpose: 'register' }),
      })
      const data = await res.json()
      if (res.ok) {
        setCodeId(data.codeId)
        setCooldown(60)
        setCode('')
      } else {
        setError(data.error || '驗證碼寄送失敗')
      }
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }, [email, phone])

  // ── Step 2: 驗證 + 註冊 ──
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (code.length !== 6) {
      setError('請輸入 6 位數驗證碼')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || undefined, phone: phone ? `${countryCode}${phone.replace(/^0+/, '')}` : undefined, password, displayName, orgName: inviteToken ? undefined : orgName, slug: inviteToken ? undefined : slug, codeId, code, invite: inviteToken || undefined, referralCode: referralCode || undefined, mobile_callback: mobileCallback || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        // Mobile app callback
        if (mobileCallback && data.token) {
          window.location.href = `${mobileCallback}?token=${encodeURIComponent(data.token)}`
          return
        }
        // 標記新用戶，讓雪凜自動彈出導覽
        try { sessionStorage.setItem('yukirin_new_user', '1') } catch {}
        window.location.href = redirectTo || `/insight-admin/${data.slug || slug}`
        return
      } else {
        setError(data.error || '註冊失敗')
        setErrorCode(data.code || '')
      }
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-white/50 border border-[#b8a9e8]/30 text-[#3d3155] rounded-[14px] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b8a9e8]/30 focus:border-[#b8a9e8] placeholder:text-[#b5a8d0] backdrop-blur-sm'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(150deg, #f3eeff 0%, #ffeef5 35%, #eef5ff 65%, #fff5ee 100%)', fontFamily: 'var(--font-zen-maru), var(--font-noto-tc), sans-serif' }}>
      <div className="w-full max-w-sm">
        {isInApp && <InAppBrowserBanner />}
        <div className="lg-lavender-sharp lg-xl relative p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-black text-[#3d3155]">✨ SnowRealm Insight</h1>
            <p className="text-sm text-slate-400 mt-2">
              {inviteToken ? '您已獲邀請，請註冊密碼或快速登入以加入後台' : '免費建立你的問卷系統'}
            </p>
          </div>

          {/* ── 步驟指示 ── */}
          <div className="flex items-center gap-2 justify-center text-xs">
            <span className={`px-2.5 py-1 rounded-full ${step === 'form' ? 'bg-[#b8a9e8] text-white' : 'bg-[#b8a9e8]/15 text-[#b5a8d0]'}`}>
              1. 填寫資料
            </span>
            <span className="text-slate-600">→</span>
            <span className={`px-2.5 py-1 rounded-full ${step === 'verify' ? 'bg-[#b8a9e8] text-white' : 'bg-[#b8a9e8]/15 text-[#b5a8d0]'}`}>
              2. 驗證 Email
            </span>
          </div>

          {step === 'form' ? (
            /* ══════════ Step 1: 表單 ══════════ */
            <div className="space-y-4">
              {/* 推薦碼提示 */}
              {referralCode && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-300/80">
                  🎉 由好友邀請註冊，你將獲得 <strong>30 天免費試用</strong>！
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" className={inputCls} autoComplete="email" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">手機號碼 <span className="text-slate-600">（或填 Email，擇一即可）</span></label>
                <div className="flex gap-1">
                  <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 w-[100px]">
                    <option value="+886">🇹🇼 +886</option>
                    <option value="+86">🇨🇳 +86</option>
                    <option value="+81">🇯🇵 +81</option>
                    <option value="+82">🇰🇷 +82</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+852">🇭🇰 +852</option>
                    <option value="+65">🇸🇬 +65</option>
                    <option value="+60">🇲🇾 +60</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+66">🇹🇭 +66</option>
                    <option value="+63">🇵🇭 +63</option>
                    <option value="+84">🇻🇳 +84</option>
                  </select>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="912345678" className={`${inputCls} flex-1`} autoComplete="tel" />
                </div>
              </div>
              {!inviteToken && (
                <>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">組織 / 品牌名稱</label>
                    <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)}
                      placeholder="例如：我的品牌、我的公司" className={inputCls} required />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">後台網址</label>
                    <div className="flex items-center gap-0">
                      <span className="text-xs text-[#8a7ca8] bg-[#b8a9e8]/10 border border-r-0 border-[#b8a9e8]/25 rounded-l-[14px] px-3 py-2.5 whitespace-nowrap">/insight-admin/</span>
                      <input type="text" value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30))}
                        placeholder="my-brand" className={`${inputCls} rounded-l-none`} required />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">小寫英文、數字、連字號，3～30 字元</p>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm text-slate-400 mb-1">顯示名稱</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="你的名字" className={inputCls} required />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">密碼</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="至少 6 個字元"
                    className={`${inputCls} pr-11`} autoComplete="new-password" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors" tabIndex={-1}>
                    {showPassword ? <EyeOff /> : <EyeOn />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">確認密碼</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} placeholder="再輸入一次密碼"
                    className={`${inputCls} pr-11`} autoComplete="new-password" required />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors" tabIndex={-1}>
                    {showConfirm ? <EyeOff /> : <EyeOn />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-400/30 bg-red-50/50 px-4 py-3 text-sm text-red-500 text-center space-y-2">
                  <p>{error}</p>
                  {(errorCode === 'EMAIL_EXISTS' || errorCode === 'PHONE_EXISTS') && inviteToken && (
                    <a
                      href={`/login?invite=${inviteToken}`}
                      className="inline-block mt-1 px-4 py-2 bg-[#b8a9e8] hover:bg-[#a090d8] text-white rounded-full text-xs font-medium transition-colors"
                    >
                      前往登入以接受邀請 →
                    </a>
                  )}
                </div>
              )}

              <button onClick={() => requireTerms(handleSendCode)} disabled={loading}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] text-white font-semibold shadow-[0_8px_24px_rgba(184,169,232,0.4)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? '寄送中...' : '寄送驗證碼'}
              </button>
            </div>
          ) : (
            /* ══════════ Step 2: 輸入驗證碼 ══════════ */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-slate-300">
                  驗證碼已寄送至 <span className="text-cyan-400 font-medium">{phone || email}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">驗證碼 10 分鐘內有效</p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">6 位數驗證碼</label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" maxLength={6} inputMode="numeric" autoFocus
                  className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`} required />
              </div>

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}

              <button type="submit" disabled={loading || code.length !== 6}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#b8a9e8] to-[#f5b8b5] text-white font-semibold shadow-[0_8px_24px_rgba(184,169,232,0.4)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? '註冊中...' : '完成註冊'}
              </button>

              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={() => { setStep('form'); setError('') }}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer">
                  ← 返回修改
                </button>
                <button type="button" onClick={handleResend} disabled={cooldown > 0 || loading}
                  className="text-cyan-400 hover:text-cyan-300 disabled:text-slate-600 disabled:cursor-not-allowed cursor-pointer">
                  {cooldown > 0 ? `重新寄送 (${cooldown}s)` : '重新寄送驗證碼'}
                </button>
              </div>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#b8a9e8]/20" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white/50 px-3 text-[#b5a8d0]">或</span></div>
          </div>

          <button
            onClick={() => {
              const p = new URLSearchParams()
              if (inviteToken) p.set('invite', inviteToken)
              if (mobileCallback) p.set('mobile_callback', mobileCallback)
              if (redirectTo) p.set('redirect', redirectTo)
              requireTerms(() => { window.location.href = `/api/auth/google${p.toString() ? `?${p}` : ''}` })
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg transition-colors cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            使用 Google 快速註冊
          </button>

          <button
            onClick={() => {
              const p = new URLSearchParams()
              if (inviteToken) p.set('invite', inviteToken)
              if (mobileCallback) p.set('mobile_callback', mobileCallback)
              if (redirectTo) p.set('redirect', redirectTo)
              requireTerms(() => { window.location.href = `/api/auth/line${p.toString() ? `?${p}` : ''}` })
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#06C755] hover:bg-[#05b54e] text-white font-medium rounded-lg transition-colors cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 5.82 2 10.5c0 4.21 3.74 7.74 8.79 8.4.34.07.8.22.92.51.11.26.07.66.04.93l-.15.87c-.04.25-.2.97.85.53s5.6-3.3 7.64-5.64C21.97 14.22 22 12.5 22 10.5 22 5.82 17.52 2 12 2z"/></svg>
            使用 LINE 快速註冊
          </button>

          <p className="text-xs text-slate-500 text-center">
            已有帳號？<a href={`/login${inviteToken ? `?invite=${inviteToken}` : ''}`} className="text-cyan-400 hover:underline">前往登入綁定</a>
          </p>

          <p className="text-xs text-slate-600 text-center leading-relaxed">
            點擊「寄送驗證碼」或第三方登入，即會出現服務條款確認彈窗，
            同意後方可完成註冊。
          </p>
        </div>
      </div>

      {termsModalOpen && (
        <TermsModal
          onAgree={handleTermsAgree}
          onClose={() => { setTermsModalOpen(false); setPendingAction(null) }}
        />
      )}
    </div>
  )
}

/* ── SVG icons ── */
function EyeOn() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}
function EyeOff() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">載入中...</p>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
