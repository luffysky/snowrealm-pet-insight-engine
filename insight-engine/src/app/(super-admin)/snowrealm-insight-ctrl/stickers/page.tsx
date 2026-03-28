'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Upload, Trash2, Eye, EyeOff, Plus, Loader2, Package, Image as ImageIcon, ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react'

interface StickerPack {
  id: string
  name: string
  description: string | null
  cover_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  sticker_count: string
  columns_per_row: number
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
  const [orderChanged, setOrderChanged] = useState<Record<string, boolean>>({})
  const [savingOrder, setSavingOrder] = useState<string | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [dragPackId, setDragPackId] = useState<string | null>(null)
  const [addingImages, setAddingImages] = useState<string | null>(null)
  const [deletingSticker, setDeletingSticker] = useState<string | null>(null)
  const [columnsEditing, setColumnsEditing] = useState<Record<string, number>>({})

  // Upload form
  const [uploading, setUploading] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadMsg, setUploadMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const addImgRef = useRef<HTMLInputElement>(null)

  const loadPacks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/stickers')
      const data = await res.json() as { packs: StickerPack[] }
      setPacks(data.packs ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadPacks() }, [])

  const loadPackStickers = useCallback(async (packId: string) => {
    setLoadingStickers(packId)
    try {
      const res = await fetch(`/api/super-admin/stickers/${packId}`)
      const data = await res.json() as { stickers: Sticker[]; columnsPerRow: number }
      setPackStickers(prev => ({ ...prev, [packId]: data.stickers ?? [] }))
      setColumnsEditing(prev => ({ ...prev, [packId]: data.columnsPerRow ?? 5 }))
    } finally { setLoadingStickers(null) }
  }, [])

  const toggleExpand = async (packId: string) => {
    if (expandedPack === packId) {
      setExpandedPack(null)
    } else {
      setExpandedPack(packId)
      if (!packStickers[packId]) await loadPackStickers(packId)
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
    if (!uploadName.trim()) return
    setUploading(true)
    setUploadMsg(null)
    try {
      const fd = new FormData()
      fd.append('name', uploadName.trim())
      fd.append('description', uploadDesc.trim())
      if (uploadFile) fd.append('file', uploadFile)
      const res = await fetch('/api/super-admin/stickers', { method: 'POST', body: fd })
      const data = await res.json() as { ok?: boolean; count?: number; error?: string }
      if (data.ok) {
        setUploadMsg({ type: 'ok', text: uploadFile ? `✅ 上傳成功！共 ${data.count} 張貼圖` : '✅ 貼圖包已建立' })
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

  // ─── 個別圖片上傳 ───
  const handleAddImages = async (packId: string, files: FileList | null) => {
    if (!files?.length) return
    setAddingImages(packId)
    try {
      const fd = new FormData()
      Array.from(files).forEach(f => fd.append('files', f))
      const res = await fetch(`/api/super-admin/stickers/${packId}/stickers`, { method: 'POST', body: fd })
      const data = await res.json() as { ok?: boolean; count?: number; error?: string }
      if (data.ok) {
        await loadPackStickers(packId)
        setPacks(prev => prev.map(p => p.id === packId ? { ...p, sticker_count: String(parseInt(p.sticker_count) + (data.count ?? 0)) } : p))
      }
    } finally {
      setAddingImages(null)
      if (addImgRef.current) addImgRef.current.value = ''
    }
  }

  // ─── 刪除單張貼圖 ───
  const handleDeleteSticker = async (packId: string, stickerId: string) => {
    if (!confirm('確定刪除這張貼圖？')) return
    setDeletingSticker(stickerId)
    try {
      await fetch(`/api/super-admin/stickers/${packId}/stickers/${stickerId}`, { method: 'DELETE' })
      setPackStickers(prev => ({
        ...prev,
        [packId]: (prev[packId] ?? []).filter(s => s.id !== stickerId)
      }))
      setPacks(prev => prev.map(p => p.id === packId ? { ...p, sticker_count: String(Math.max(0, parseInt(p.sticker_count) - 1)) } : p))
    } finally { setDeletingSticker(null) }
  }

  // ─── 拖曳排序 ───
  const handleDragStart = (packId: string, idx: number) => {
    setDragPackId(packId)
    setDragIdx(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOverIdx(idx)
  }

  const handleDrop = (packId: string, dropIdx: number) => {
    if (dragIdx === null || dragIdx === dropIdx || dragPackId !== packId) {
      setDragIdx(null); setDragOverIdx(null); setDragPackId(null)
      return
    }
    const stickers = [...(packStickers[packId] ?? [])]
    const [moved] = stickers.splice(dragIdx, 1)
    stickers.splice(dropIdx, 0, moved)
    setPackStickers(prev => ({ ...prev, [packId]: stickers }))
    setOrderChanged(prev => ({ ...prev, [packId]: true }))
    setDragIdx(null); setDragOverIdx(null); setDragPackId(null)
  }

  // ─── 儲存排序 ───
  const saveOrder = async (packId: string) => {
    setSavingOrder(packId)
    try {
      const stickers = packStickers[packId] ?? []
      await fetch(`/api/super-admin/stickers/${packId}/stickers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: stickers.map((s, i) => ({ id: s.id, sort_order: i })) }),
      })
      setOrderChanged(prev => ({ ...prev, [packId]: false }))
    } finally { setSavingOrder(null) }
  }

  // ─── 更新每行列數 ───
  const saveColumns = async (packId: string) => {
    const cols = columnsEditing[packId] ?? 5
    await fetch(`/api/super-admin/stickers/${packId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnsPerRow: cols }),
    })
    setPacks(prev => prev.map(p => p.id === packId ? { ...p, columns_per_row: cols } : p))
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center">
          <Package className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">貼圖管理</h1>
          <p className="text-sm text-slate-400">建立貼圖包・上傳圖片・調整排序與格式</p>
        </div>
      </div>

      {/* Upload form */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-amber-400" />
          建立新貼圖包
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
            <label className="text-xs text-slate-400 mb-1.5 block">
              zip 壓縮包 <span className="text-slate-600">（選填，也可建立後再逐張上傳）</span>
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
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
                  <button type="button" onClick={e => { e.stopPropagation(); setUploadFile(null); if (fileRef.current) fileRef.current.value = '' }}
                    className="ml-1 text-slate-500 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Upload className="w-6 h-6 text-slate-600" />
                  <p className="text-sm text-slate-500">點擊選擇 .zip 檔案（選填）</p>
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
            disabled={uploading || !uploadName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-semibold rounded-xl text-sm transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {uploading ? '建立中...' : '建立貼圖包'}
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
            <p>還沒有貼圖包，建立第一個吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {packs.map(pack => (
              <div key={pack.id} className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
                {/* Pack header */}
                <div className="flex items-center gap-4 p-4">
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
                    <button onClick={() => void toggleExpand(pack.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                      {expandedPack === pack.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => void toggleActive(pack)}
                      className={`p-2 rounded-xl transition-colors ${pack.is_active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}>
                      {pack.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => void deletePack(pack)}
                      className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded management area */}
                {expandedPack === pack.id && (
                  <div className="border-t border-slate-700/50 bg-slate-950/40">
                    {/* Settings bar */}
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 whitespace-nowrap">每行幾格</label>
                        <input
                          type="number"
                          min={2} max={12}
                          value={columnsEditing[pack.id] ?? pack.columns_per_row ?? 5}
                          onChange={e => setColumnsEditing(prev => ({ ...prev, [pack.id]: parseInt(e.target.value) || 5 }))}
                          onBlur={() => void saveColumns(pack.id)}
                          className="w-14 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white text-center outline-none focus:border-amber-500/50"
                        />
                      </div>

                      {/* Add images */}
                      <input
                        ref={addImgRef}
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        className="hidden"
                        onChange={e => void handleAddImages(pack.id, e.target.files)}
                      />
                      <button
                        onClick={() => addImgRef.current?.click()}
                        disabled={addingImages === pack.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
                      >
                        {addingImages === pack.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        新增圖片
                      </button>

                      {orderChanged[pack.id] && (
                        <button
                          onClick={() => void saveOrder(pack.id)}
                          disabled={savingOrder === pack.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
                        >
                          {savingOrder === pack.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          儲存排序
                        </button>
                      )}
                    </div>

                    {/* Sticker grid */}
                    <div className="p-4">
                      {loadingStickers === pack.id ? (
                        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-slate-500 animate-spin" /></div>
                      ) : (packStickers[pack.id] ?? []).length === 0 ? (
                        <div className="text-center py-8 text-slate-600 text-sm">還沒有貼圖，點「新增圖片」上傳</div>
                      ) : (
                        <div
                          className="grid gap-2"
                          style={{ gridTemplateColumns: `repeat(${columnsEditing[pack.id] ?? pack.columns_per_row ?? 5}, minmax(0, 1fr))` }}
                        >
                          {(packStickers[pack.id] ?? []).map((s, i) => (
                            <div
                              key={s.id}
                              draggable
                              onDragStart={() => handleDragStart(pack.id, i)}
                              onDragOver={e => handleDragOver(e, i)}
                              onDrop={() => handleDrop(pack.id, i)}
                              onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); setDragPackId(null) }}
                              className={`group relative aspect-square rounded-xl overflow-hidden bg-slate-800 border transition-all cursor-grab active:cursor-grabbing ${
                                dragOverIdx === i && dragPackId === pack.id
                                  ? 'border-amber-400 scale-105'
                                  : 'border-slate-700/50 hover:border-amber-500/40'
                              }`}
                            >
                              <img src={s.url} alt={s.filename ?? ''} className="w-full h-full object-contain p-1" />
                              {/* Drag handle */}
                              <div className="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <GripVertical className="w-3 h-3 text-white/50" />
                              </div>
                              {/* Delete button */}
                              <button
                                onClick={() => void handleDeleteSticker(pack.id, s.id)}
                                disabled={deletingSticker === s.id}
                                className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-all"
                              >
                                {deletingSticker === s.id
                                  ? <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />
                                  : <X className="w-2.5 h-2.5 text-white" />
                                }
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
