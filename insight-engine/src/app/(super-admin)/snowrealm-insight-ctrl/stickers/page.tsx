'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, Eye, EyeOff, Plus, Loader2, Package, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react'

interface StickerPack {
  id: string
  name: string
  description: string | null
  cover_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  sticker_count: string
}

interface Sticker {
  id: string
  url: string
  filename: string | null
  sort_order: number
}

export default function StickersPage() {
  const [packs, setPacks] = useState<StickerPack[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPack, setExpandedPack] = useState<string | null>(null)
  const [packStickers, setPackStickers] = useState<Record<string, Sticker[]>>({})
  const [loadingStickers, setLoadingStickers] = useState<string | null>(null)

  // Upload form
  const [uploading, setUploading] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadMsg, setUploadMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadPacks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/stickers')
      const data = await res.json() as { packs: StickerPack[] }
      setPacks(data.packs ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadPacks() }, [])

  const loadPackStickers = async (packId: string) => {
    if (packStickers[packId]) return
    setLoadingStickers(packId)
    try {
      const res = await fetch(`/api/super-admin/stickers/${packId}`)
      const data = await res.json() as { stickers: Sticker[] }
      setPackStickers(prev => ({ ...prev, [packId]: data.stickers ?? [] }))
    } finally { setLoadingStickers(null) }
  }

  const toggleExpand = async (packId: string) => {
    if (expandedPack === packId) {
      setExpandedPack(null)
    } else {
      setExpandedPack(packId)
      await loadPackStickers(packId)
    }
  }

  const toggleActive = async (pack: StickerPack) => {
    await fetch(`/api/super-admin/stickers/${pack.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !pack.is_active }),
    })
    setPacks(prev => prev.map(p => p.id === pack.id ? { ...p, is_active: !p.is_active } : p))
  }

  const deletePack = async (pack: StickerPack) => {
    if (!confirm(`確定刪除「${pack.name}」？所有貼圖會一起刪除。`)) return
    await fetch(`/api/super-admin/stickers/${pack.id}`, { method: 'DELETE' })
    setPacks(prev => prev.filter(p => p.id !== pack.id))
    if (expandedPack === pack.id) setExpandedPack(null)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadName.trim() || !uploadFile) return
    setUploading(true)
    setUploadMsg(null)
    try {
      const fd = new FormData()
      fd.append('name', uploadName.trim())
      fd.append('description', uploadDesc.trim())
      fd.append('file', uploadFile)
      const res = await fetch('/api/super-admin/stickers', { method: 'POST', body: fd })
      const data = await res.json() as { ok?: boolean; count?: number; error?: string }
      if (data.ok) {
        setUploadMsg({ type: 'ok', text: `✅ 上傳成功！共 ${data.count} 張貼圖` })
        setUploadName('')
        setUploadDesc('')
        setUploadFile(null)
        if (fileRef.current) fileRef.current.value = ''
        await loadPacks()
      } else {
        setUploadMsg({ type: 'err', text: data.error ?? '上傳失敗' })
      }
    } catch {
      setUploadMsg({ type: 'err', text: '網路錯誤，請重試' })
    } finally { setUploading(false) }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center">
          <Package className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">貼圖管理</h1>
          <p className="text-sm text-slate-400">上傳 zip 壓縮包 → 自動拆解成貼圖組，前台私訊可直接使用</p>
        </div>
      </div>

      {/* Upload form */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-amber-400" />
          上傳新貼圖包
        </h2>
        <form onSubmit={e => void handleUpload(e)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">貼圖包名稱 *</label>
              <input
                value={uploadName}
                onChange={e => setUploadName(e.target.value)}
                placeholder="例：雪境日常"
                required
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">說明（選填）</label>
              <input
                value={uploadDesc}
                onChange={e => setUploadDesc(e.target.value)}
                placeholder="貼圖包的說明..."
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">zip 壓縮包 * <span className="text-slate-600">（最大 50MB，圖片建議 240×240 以上）</span></label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                uploadFile ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-700 hover:border-slate-600'
              }`}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
              />
              {uploadFile ? (
                <div className="flex items-center justify-center gap-2">
                  <Package className="w-5 h-5 text-amber-400" />
                  <span className="text-sm text-amber-300 font-medium">{uploadFile.name}</span>
                  <span className="text-xs text-slate-500">({(uploadFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Upload className="w-8 h-8 text-slate-600" />
                  <p className="text-sm text-slate-500">點擊選擇 .zip 檔案</p>
                  <p className="text-xs text-slate-600">ZIP 內直接放圖片（PNG/JPG/GIF/WebP），會依檔名順序排列</p>
                </div>
              )}
            </div>
          </div>

          {uploadMsg && (
            <p className={`text-sm ${uploadMsg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
              {uploadMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={uploading || !uploadName.trim() || !uploadFile}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-semibold rounded-xl text-sm transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {uploading ? '上傳中...' : '建立貼圖包'}
          </button>
        </form>
      </div>

      {/* Pack list */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">
          所有貼圖包 <span className="text-slate-500 font-normal text-sm">({packs.length})</span>
        </h2>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-slate-500 animate-spin" /></div>
        ) : packs.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>還沒有貼圖包，上傳第一個吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {packs.map(pack => (
              <div key={pack.id} className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
                {/* Pack header */}
                <div className="flex items-center gap-4 p-4">
                  {/* Cover */}
                  <div className="w-14 h-14 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                    {pack.cover_url
                      ? <img src={pack.cover_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-slate-600" /></div>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{pack.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${pack.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                        {pack.is_active ? '上架中' : '已下架'}
                      </span>
                      <span className="text-xs text-slate-500">{pack.sticker_count} 張</span>
                    </div>
                    {pack.description && <p className="text-sm text-slate-500 mt-0.5 truncate">{pack.description}</p>}
                    <p className="text-xs text-slate-600 mt-0.5">{new Date(pack.created_at).toLocaleDateString('zh-TW')}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => void toggleExpand(pack.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="預覽貼圖"
                    >
                      {expandedPack === pack.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => void toggleActive(pack)}
                      className={`p-2 rounded-xl transition-colors ${pack.is_active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                      title={pack.is_active ? '下架' : '上架'}
                    >
                      {pack.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => void deletePack(pack)}
                      className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="刪除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sticker preview grid */}
                {expandedPack === pack.id && (
                  <div className="border-t border-slate-700/50 p-4 bg-slate-950/40">
                    {loadingStickers === pack.id ? (
                      <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-slate-500 animate-spin" /></div>
                    ) : (
                      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                        {(packStickers[pack.id] ?? []).map(s => (
                          <div key={s.id} className="aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700/50 hover:border-amber-500/40 transition-colors">
                            <img src={s.url} alt={s.filename ?? ''} className="w-full h-full object-contain p-1" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
