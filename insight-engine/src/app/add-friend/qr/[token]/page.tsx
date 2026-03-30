'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function QrAddFriendPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'invalid'>('loading')

  useEffect(() => {
    if (!params.token) return
    fetch('/api/admin/social/friend-qr', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.token }),
    })
      .then(r => r.json())
      .then((data: { userId?: string; error?: string }) => {
        if (data.userId) {
          setStatus('redirecting')
          router.replace(`/add-friend/${data.userId}`)
        } else {
          setStatus('invalid')
        }
      })
      .catch(() => setStatus('invalid'))
  }, [params.token, router])

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
      {status === 'loading' || status === 'redirecting' ? (
        <>
          <p className="text-4xl animate-pulse">🔍</p>
          <p className="text-white/50 text-sm">驗證 QR 碼中...</p>
        </>
      ) : (
        <>
          <p className="text-4xl">❌</p>
          <h1 className="text-xl font-bold text-white">QR 碼無效或已過期</h1>
          <p className="text-white/50 text-sm">請讓對方重新產生 QR 碼後再掃</p>
        </>
      )}
    </div>
  )
}
