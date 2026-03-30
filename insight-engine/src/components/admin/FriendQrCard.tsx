'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import QRCode from 'qrcode'
import { RefreshCw, Copy, Download, Check } from 'lucide-react'

interface Props {
  /** 目前登入的用戶 ID（用於邀請連結） */
  userId: string
}

export default function FriendQrCard({ userId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [token, setToken] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const inviteLink = token ? `${baseUrl}/add-friend/qr/${token}` : ''
  const directLink = `${baseUrl}/add-friend/${userId}`

  const drawQr = useCallback(async (url: string) => {
    if (!canvasRef.current || !url) return
    await QRCode.toCanvas(canvasRef.current, url, {
      width: 200,
      margin: 2,
      color: { dark: '#1e1b4b', light: '#f5f3ff' },
    })
  }, [])

  const loadToken = useCallback(async () => {
    const res = await fetch('/api/admin/social/friend-qr')
    const data = await res.json() as { token?: string; createdAt?: string }
    if (data.token) {
      setToken(data.token)
      setCreatedAt(data.createdAt ?? null)
      await drawQr(`${baseUrl}/add-friend/qr/${data.token}`)
    }
    setLoading(false)
  }, [baseUrl, drawQr])

  useEffect(() => { loadToken() }, [loadToken])

  const refreshToken = async () => {
    setRefreshing(true)
    const res = await fetch('/api/admin/social/friend-qr', { method: 'POST' })
    const data = await res.json() as { token?: string; createdAt?: string }
    if (data.token) {
      setToken(data.token)
      setCreatedAt(data.createdAt ?? null)
      await drawQr(`${baseUrl}/add-friend/qr/${data.token}`)
    }
    setRefreshing(false)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink || directLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQr = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = 'snowrealm-qr.png'
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="space-y-3">
      {/* QR 碼 */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative bg-[#f5f3ff] rounded-2xl p-3 shadow-inner">
          {loading && (
            <div className="w-[200px] h-[200px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <canvas ref={canvasRef} className={loading ? 'hidden' : 'block rounded-xl'} />
        </div>

        {createdAt && (
          <p className="text-[10px] text-white/30">
            產生於 {new Date(createdAt).toLocaleDateString('zh-TW')}（30 天有效）
          </p>
        )}
      </div>

      {/* 操作按鈕 */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={refreshToken}
          disabled={refreshing}
          title="刷新 QR 碼（舊碼仍 30 天有效）"
          className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-white/50 hover:text-white/80 transition-colors disabled:opacity-40 text-[10px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </button>
        <button
          onClick={copyLink}
          className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-white/50 hover:text-white/80 transition-colors text-[10px]"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? '已複製' : '複製連結'}
        </button>
        <button
          onClick={downloadQr}
          disabled={loading}
          className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-white/50 hover:text-white/80 transition-colors disabled:opacity-40 text-[10px]"
        >
          <Download className="w-3.5 h-3.5" />
          下載
        </button>
      </div>

      {/* 直接連結 */}
      <div className="bg-white/[0.04] border border-white/8 rounded-xl px-3 py-2">
        <p className="text-[9px] text-white/30 mb-1">個人加好友連結</p>
        <p className="text-[10px] text-white/50 break-all leading-relaxed">{directLink}</p>
      </div>
    </div>
  )
}
